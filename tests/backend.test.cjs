const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { createRequire } = require("node:module");
const { resolve } = require("node:path");
const test = require("node:test");
const ts = require("typescript");
const { drizzle } = require("drizzle-orm/node-postgres");
const { getTableName } = require("drizzle-orm");

// Exercise the actual TypeScript handlers without a running Next server or a real database.
function load(file, mocks = {}) {
  const filename = resolve(__dirname, "..", file);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const nativeRequire = createRequire(filename);
  const localRequire = (name) => Object.hasOwn(mocks, name) ? mocks[name] : nativeRequire(name);
  const loadedModule = { exports: {} };
  new Function("require", "module", "exports", source)(localRequire, loadedModule, loadedModule.exports);
  return loadedModule.exports;
}

const schema = load("src/db/schema.ts");
const security = load("src/lib/security.ts");
const editorial = load("src/lib/editorial.ts");
const nextResponse = { NextResponse: { json: (body, init) => Response.json(body, init) } };
const request = (body) => new Request("https://carriova.test/api/events", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
const dbUnavailable = {
  databaseConfigured: false,
  getDb() { throw new Error("Database must not be accessed"); },
};

function eventRoute(database) {
  return load("src/app/api/events/route.ts", {
    "next/server": nextResponse,
    "@/db": database,
    "@/db/schema": schema,
    "@/lib/security": security,
  });
}

function memoryDatabase({ failTable, existingEmails = [] } = {}) {
  let rows = existingEmails.map((email, index) => ({ table: "accounts", id: index + 1, email }));
  function scope(destination) {
    return {
      insert(table) {
        return {
          values(value) {
            let ignoreConflict = false;
            function write() {
              const name = getTableName(table);
              if (name === failTable) throw new Error("Simulated database failure");
              if (name === "accounts" && destination.some((row) => row.table === name && row.email === value.email)) {
                if (ignoreConflict) return [];
                throw new Error("Duplicate email");
              }
              const row = { ...value, table: name, id: destination.length + 1 };
              destination.push(row);
              return [{ id: row.id }];
            }
            const operation = {
              onConflictDoNothing() { ignoreConflict = true; return operation; },
              async returning() { return write(); },
              then(onResolve, onReject) { return Promise.resolve().then(write).then(onResolve, onReject); },
            };
            return operation;
          },
        };
      },
    };
  }
  return {
    get rows() { return rows; },
    insert: (table) => scope(rows).insert(table),
    async transaction(callback) {
      const pending = [...rows];
      const result = await callback(scope(pending));
      rows = pending;
      return result;
    },
  };
}

function actionHarness(database, configured = true) {
  const deferred = [];
  const deliveries = [];
  const actions = load("src/lib/actions.ts", {
    "next/headers": { headers: async () => new Headers() },
    "next/server": { after: (task) => deferred.push(task) },
    "@/db": { databaseConfigured: configured, getDb: () => database },
    "@/db/schema": schema,
    "@/lib/env": { serverEnv: { email: { enabled: false } } },
    "@/lib/integrations": { dispatchLeadEvent: async (event) => deliveries.push(event) },
    "@/lib/security": { ...security, rateLimit: () => ({ ok: true }) },
  });
  return { actions, deferred, deliveries };
}
function form(overrides = {}) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    firstName: "Awa", lastName: "Test", email: "awa@example.com", consentPrivacy: "on", ...overrides,
  })) data.set(key, value);
  return data;
}
const initialState = { ok: false, message: "" };

test("missing DATABASE_URL does not initialize PostgreSQL during module import", () => {
  let created = false;
  const database = load("src/db/index.ts", {
    "@/lib/env": { serverEnv: { DATABASE_URL: "", isProduction: false } },
    "./schema": schema,
    pg: { Pool: class { constructor() { created = true; } } },
  });
  assert.equal(database.databaseConfigured, false);
  assert.equal(created, false);
  assert.throws(() => database.getDb(), /DATABASE_URL/);
  assert.equal(created, false);
});

test("editorial content remains available without database configuration", async () => {
  const queries = load("src/lib/queries.ts", { "@/db": dbUnavailable, "@/db/schema": schema, "@/lib/editorial": editorial });
  for (const result of await Promise.all([
    queries.getPublishedJobs(), queries.getRelatedJobs("missing"),
    queries.getRelatedPosts("missing", "cv"), queries.getFaqs("home"),
    queries.getPricingOffers(), queries.getPublishedTestimonials(),
  ])) assert.deepEqual(result, []);
  assert.equal(await queries.getJobBySlug("missing"), null);
  assert.equal(await queries.getPostBySlug("missing"), null);
  const article = editorial.editorialPosts.find((post) => post.slug === "organiser-sa-recherche-emploi");
  assert.ok(article);
  assert.deepEqual(await queries.getPublishedPosts(), editorial.editorialPosts);
  assert.equal(await queries.getPostBySlug(article.slug), article);
  assert.deepEqual(await queries.getPublishedPosts("cv"), []);
  assert.deepEqual(await queries.getRelatedPosts(article.slug, article.cluster), []);
  assert.deepEqual(await queries.getJobFacets(), {
    locations: [], industries: [], contractTypes: [], experiences: [], workModes: [],
  });
});

test("published-only detail queries are parameterized and reject configured database failures", async () => {
  const calls = [];
  const database = drizzle({ async query(config, values) { calls.push({ sql: config.text, values }); return { rows: [] }; } }, { schema });
  const queries = load("src/lib/queries.ts", {
    "@/db": { databaseConfigured: true, getDb: () => database }, "@/db/schema": schema, "@/lib/editorial": editorial,
  });
  await queries.getJobBySlug("private-job");
  await queries.getPostBySlug("private-post");
  for (const call of calls) {
    assert.match(call.sql, /"is_published" = \$2/);
    assert.equal(call.values[1], true);
    assert.equal(call.values[2], 1);
  }
  const failing = load("src/lib/queries.ts", {
    "@/db": { databaseConfigured: true, getDb() { throw new Error("offline"); } }, "@/db/schema": schema, "@/lib/editorial": editorial,
  });
  await assert.rejects(failing.getPublishedJobs(), /offline/);
  await assert.rejects(failing.getPublishedPosts(), /offline/);
  await assert.rejects(failing.getPostBySlug("organiser-sa-recherche-emploi"), /offline/);
});

test("event endpoint rejects malformed JSON and wrong field types as client errors", async () => {
  const { POST } = eventRoute(dbUnavailable);
  for (const body of [null, [], 4, { eventName: 5 }, { eventName: "page_view", path: {} }, { eventName: "unknown" }]) {
    assert.equal((await POST(request(body))).status, 400);
  }
  const malformed = new Request("https://carriova.test/api/events", { method: "POST", body: "{" });
  assert.equal((await POST(malformed)).status, 400);
});

test("event metadata remains valid JSON and oversized metadata is rejected before writing", async () => {
  const database = memoryDatabase();
  const { POST } = eventRoute({ databaseConfigured: true, getDb: () => database });
  assert.equal((await POST(request({ eventName: "page_view", metadata: { note: "x".repeat(1001) } }))).status, 400);
  assert.equal(database.rows.length, 0);
  assert.equal((await POST(request({ eventName: "page_view", metadata: false }))).status, 200);
  assert.equal(JSON.parse(database.rows[0].metadata), false);
});

test("health and valid events report unavailable when PostgreSQL is not configured", async () => {
  assert.equal((await eventRoute(dbUnavailable).POST(request({ eventName: "page_view" }))).status, 503);
  const health = load("src/app/api/health/route.ts", {
    "@/db": dbUnavailable, "@/lib/env": { envStatus: () => "error" },
  });
  const response = await health.GET();
  assert.equal(response.status, 503);
  assert.equal(response.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await response.json(), { ok: false, database: "unconfigured", env: "error" });
});

test("coaching and account creation roll back their primary record if lead persistence fails", async () => {
  for (const [method, extras] of [["createAccount", {}], ["submitCoaching", { coachingType: "individuel" }]]) {
    const database = memoryDatabase({ failTable: "leads" });
    const { actions, deferred } = actionHarness(database);
    const result = await actions[method](initialState, form(extras));
    assert.equal(result.ok, false);
    assert.deepEqual(database.rows, []);
    assert.deepEqual(deferred, []);
  }
});

test("analytics failure does not invalidate a stored lead or prevent notifications", async (t) => {
  t.mock.method(console, "error", () => {});
  const database = memoryDatabase({ failTable: "analytics_events" });
  const { actions, deferred, deliveries } = actionHarness(database);
  const result = await actions.submitLead(initialState, form());
  assert.equal(result.ok, true);
  assert.equal(database.rows.length, 1);
  await Promise.all(deferred.map((task) => task()));
  assert.equal(database.rows.length, 1);
  assert.equal(deliveries.length, 1);
});

test("duplicate pre-registration neither creates a lead nor reveals account existence", async () => {
  const fresh = actionHarness(memoryDatabase());
  const existingDatabase = memoryDatabase({ existingEmails: ["awa@example.com"] });
  const existing = actionHarness(existingDatabase);
  assert.deepEqual(
    await fresh.actions.createAccount(initialState, form()),
    await existing.actions.createAccount(initialState, form()),
  );
  assert.equal(existingDatabase.rows.length, 1);
  assert.deepEqual(existing.deferred, []);
});

test("login never reads or exposes a registered name or account existence", async () => {
  const database = new Proxy({}, { get() { throw new Error("Login must not read account data"); } });
  const { actions } = actionHarness(database);
  const known = await actions.loginAccount(initialState, form({ email: "awa@example.com" }));
  const unknown = await actions.loginAccount(initialState, form({ email: "unknown@example.com" }));
  assert.deepEqual(known, unknown);
  assert.equal(known.ok, false);
  assert.doesNotMatch(known.message, /Awa|Bonjour/);
});

test("an oversized email is rejected instead of being silently truncated", async () => {
  const database = memoryDatabase();
  const { actions } = actionHarness(database);
  const result = await actions.submitLead(initialState, form({ email: "x".repeat(250) + "@example.com" }));
  assert.equal(result.ok, false);
  assert.ok(result.fieldErrors.email);
  assert.deepEqual(database.rows, []);
});


test("coaching rejects inherited object properties as invalid session types", async () => {
  const database = memoryDatabase();
  const { actions } = actionHarness(database);
  for (const coachingType of ["__proto__", "toString", "constructor"]) {
    const result = await actions.submitCoaching(initialState, form({ coachingType }));
    assert.equal(result.ok, false);
    assert.ok(result.fieldErrors.coachingType);
  }
  assert.deepEqual(database.rows, []);
});
