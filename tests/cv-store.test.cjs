const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const test = require("node:test");
const { PGlite } = require("@electric-sql/pglite");
const { drizzle } = require("drizzle-orm/pglite");
const { CORE_LEADS_SQL, loadTypeScript } = require("./helpers/crm-fixture.cjs");
const cv = loadTypeScript("src/lib/cv.ts");
class CustomerUnauthorizedError extends Error {}

const experience = (id = "exp-1") => ({ id, role: "", company: "", location: "", startDate: "", endDate: "", current: false, description: "" });
test("CV schema accepts empty drafts and rejects malformed or unbounded content", () => {
  const content = cv.createEmptyCv("Awa", "awa@example.test");
  content.experiences.push(experience());
  assert.deepEqual(cv.parseCvContent(content), content);
  for (const invalid of [
    { ...content, skills: Array(41).fill("test") },
    { ...content, summary: "a".repeat(3001) },
    { ...content, experiences: [experience(), experience()] },
    { ...content, experiences: [{ ...experience(), startDate: "2026-13" }] },
    { ...content, experiences: [{ ...experience(), current: "yes" }] },
    { ...content, basics: { ...content.basics, website: "javascript:alert(1)" } },
    { ...content, basics: { ...content.basics, website: "https://user:secret@example.test" } },
    { ...content, basics: { ...content.basics, email: "invalid" } },
    { ...content, projects: undefined },
  ]) assert.throws(() => cv.parseCvContent(invalid), cv.CvValidationError);
  assert.equal(cv.validateCvContent({}).ok, false);
  const stripped = cv.parseCvContent({ ...content, customerId: 123 });
  assert.equal(Object.hasOwn(stripped, "customerId"), false);
  assert.throws(() => cv.parseCvCreateInput({ templateId: "arbitrary" }), cv.CvValidationError);
  assert.throws(() => cv.parseCvUpdateInput({ title: "New title" }), cv.CvValidationError);
  assert.throws(() => cv.parseCvUpdateInput({ version: 0 }), cv.CvValidationError);
});

test("private CV CRUD and AI quota PostgreSQL integration", async t => {
  // All data is synthetic and kept in memory. No environment or provider is loaded.
  const pg = new PGlite(); await pg.waitReady; t.after(() => pg.close());
  const core = loadTypeScript("src/db/schema.ts");
  const customerSchema = loadTypeScript("src/db/customer-schema.ts", { "./schema": core });
  const schema = loadTypeScript("src/db/cv-schema.ts", { "./customer-schema": customerSchema });
  const db = drizzle(pg);
  let customer = { id: 1, email: "awa@example.test", name: "Awa" };
  let accesses = 0;
  const mocks = {
    "server-only": {}, "@/db": { getDb: () => { accesses++; return db; } }, "@/lib/cv": cv, "@/db/cv-schema": schema,
    "@/lib/customer-auth": { CustomerUnauthorizedError, requireCustomer: async () => { if (!customer) throw new CustomerUnauthorizedError(); return customer; } },
  };
  const store = loadTypeScript("src/lib/cv-store.ts", mocks); mocks["@/lib/cv-store"] = store;
  const http = loadTypeScript("src/lib/cv-http.ts", mocks); mocks["@/lib/cv-http"] = http;
  const collection = loadTypeScript("src/app/api/espace/cv/route.ts", mocks);
  const item = loadTypeScript("src/app/api/espace/cv/[id]/route.ts", mocks);
  const context = id => ({ params: Promise.resolve({ id: String(id) }) });
  const request = (method, body, origin = "https://carriova.example") => new Request("https://carriova.example/api/espace/cv", { method, headers: { "content-type": "application/json", origin }, body: JSON.stringify(body) });
  const expectCode = code => error => error instanceof store.CvStoreError && error.code === code;
  let document;

  await t.test("migration is additive and repeatable", async () => {
    await pg.exec(CORE_LEADS_SQL);
    await pg.exec(readFileSync(resolve(__dirname, "../migrations/20261018_customer.sql"), "utf8"));
    const migration = readFileSync(resolve(__dirname, "../migrations/20261018_cv.sql"), "utf8");
    await pg.exec(migration); await pg.exec(migration);
    await pg.exec("INSERT INTO customer_users(id,email,name,password_hash,consent_privacy,consent_version) VALUES (1,'awa@example.test','Awa','test-only',true,'test'),(2,'koffi@example.test','Koffi','test-only',true,'test')");
    assert.equal((await pg.query("SELECT count(*)::int AS total FROM customer_users")).rows[0].total, 2);
  });
  await t.test("all route methods require authentication before access, mutations reject foreign or missing origin", async () => {
    const previous = customer; customer = null; const before = accesses;
    const responses = await Promise.all([
      collection.GET(), collection.POST(request("POST", {})), item.GET(request("POST", {}), context(1)),
      item.PATCH(request("PATCH", { version: 0, title: "test" }), context(1)), item.DELETE(request("DELETE", { version: 0 }), context(1)),
    ]);
    responses.forEach(response => assert.equal(response.status, 401));
    assert.equal(accesses, before); customer = previous;
    assert.equal((await collection.POST(request("POST", {}, "https://evil.example"))).status, 403);
    const missingOrigin = request("POST", {}); missingOrigin.headers.delete("origin");
    assert.equal((await collection.POST(missingOrigin)).status, 403);
    assert.equal(accesses, before);
  });
  await t.test("private HTTP JSON is bounded even without Content-Length and never reveals database errors", async () => {
    const oversized = request("POST", { data: "a".repeat(131073) });
    assert.equal((await collection.POST(oversized)).status, 413);
    assert.equal((await collection.POST(new Request("https://carriova.example/api/espace/cv", { method: "POST", headers: { origin: "https://carriova.example" }, body: "bad" }))).status, 415);
    assert.equal((await collection.POST(new Request("https://carriova.example/api/espace/cv", { method: "POST", headers: { origin: "https://carriova.example", "content-type": "application/json" }, body: "[" }))).status, 400);
    const failure = http.cvErrorResponse(new Error("postgres://secret-database"));
    assert.equal(failure.status, 503); assert.doesNotMatch(await failure.text(), /secret-database/);
  });
  await t.test("defaults use authenticated account and ownership cannot be supplied by JSON", async () => {
    const response = await collection.POST(request("POST", { customerId: 2 }));
    assert.equal(response.status, 201); assert.match(response.headers.get("cache-control"), /no-store/);
    document = (await response.json()).document;
    assert.equal(document.content.basics.fullName, "Awa"); assert.equal(document.version, 0);
    assert.equal(document.content.basics.email, "awa@example.test");
    assert.equal((await store.listCustomerCvs(1)).length, 1); assert.equal((await store.listCustomerCvs(2)).length, 0);
    assert.equal(await store.getCustomerCv(document.id, 2), null);
    await assert.rejects(store.updateCustomerCv(document.id, 2, { version: 0, title: "stolen" }), expectCode("NOT_FOUND"));
    await assert.rejects(store.deleteCustomerCv(document.id, 2, 0), expectCode("NOT_FOUND"));
    customer = { id: 2, name: "Koffi", email: "koffi@example.test" };
    assert.equal((await item.GET(request("POST", {}), context(document.id))).status, 404);
    assert.equal((await item.PATCH(request("PATCH", { version: 0, title: "stolen" }), context(document.id))).status, 404);
    assert.equal((await item.DELETE(request("DELETE", { version: 0 }), context(document.id))).status, 404);
    customer = { id: 1, name: "Awa", email: "awa@example.test" };
  });
  await t.test("optimistic lock keeps one of two simultaneous edits and rejects stale deletion", async () => {
    const outcomes = await Promise.allSettled([
      store.updateCustomerCv(document.id, 1, { version: 0, title: "Premier" }),
      store.updateCustomerCv(document.id, 1, { version: 0, title: "Deuxième" }),
    ]);
    assert.equal(outcomes.filter(result => result.status === "fulfilled").length, 1);
    assert.equal(outcomes.find(result => result.status === "rejected").reason.code, "VERSION_CONFLICT");
    document = await store.getCustomerCv(document.id, 1); assert.equal(document.version, 1);
    await assert.rejects(store.deleteCustomerCv(document.id, 1, 0), expectCode("VERSION_CONFLICT"));
    assert.equal((await item.PATCH(request("PATCH", { version: 1, content: {} }), context(document.id))).status, 400);
  });
  await t.test("document cap is enforced atomically and independently per owner", async () => {
    for (let i = 0; i < 18; i++) await store.createCustomerCv(1, {});
    const outcomes = await Promise.allSettled([store.createCustomerCv(1, {}), store.createCustomerCv(1, {})]);
    assert.equal(outcomes.filter(result => result.status === "fulfilled").length, 1);
    assert.equal(outcomes.find(result => result.status === "rejected").reason.code, "DOCUMENT_LIMIT");
    assert.equal((await store.listCustomerCvs(1)).length, 20);
    assert.ok((await store.createCustomerCv(2, {})).id);
  });
  await t.test("AI reservations require owned current CV, enforce one in-flight request and never replay UUID", async () => {
    await assert.rejects(store.reserveCvAiRun(2, document.id, document.version, randomUUID()), expectCode("NOT_FOUND"));
    await assert.rejects(store.reserveCvAiRun(1, document.id, 0, randomUUID()), expectCode("VERSION_CONFLICT"));
    const requestId = randomUUID(); const { runId } = await store.reserveCvAiRun(1, document.id, document.version, requestId);
    await assert.rejects(store.reserveCvAiRun(1, document.id, document.version, requestId.toUpperCase()), expectCode("REQUEST_REUSED"));
    await assert.rejects(store.reserveCvAiRun(1, document.id, document.version, randomUUID()), expectCode("AI_IN_PROGRESS"));
    assert.equal(await store.finishCvAiRun(runId, 2, { status: "succeeded" }), false);
    assert.equal(await store.finishCvAiRun(runId, 1, { status: "failed", errorCode: "PROVIDER_TIMEOUT" }), true);
    assert.equal(await store.finishCvAiRun(runId, 1, { status: "succeeded" }), false);
    await assert.rejects(store.reserveCvAiRun(1, document.id, document.version, requestId), expectCode("REQUEST_REUSED"));
  });
  await t.test("expired leases permit another run and do not let late completion overwrite failure", async () => {
    const old = await store.reserveCvAiRun(1, document.id, document.version, randomUUID());
    await pg.query("UPDATE cv_ai_runs SET lease_expires_at = now() - interval '1 second' WHERE id=$1", [old.runId]);
    const next = await store.reserveCvAiRun(1, document.id, document.version, randomUUID());
    assert.equal(await store.finishCvAiRun(old.runId, 1, { status: "succeeded" }), false);
    assert.equal((await pg.query("SELECT status,error_code FROM cv_ai_runs WHERE id=$1", [old.runId])).rows[0].error_code, "LEASE_EXPIRED");
    await store.finishCvAiRun(next.runId, 1, { status: "succeeded", model: "test/model", inputTokens: 10, outputTokens: 20 });
  });
  await t.test("global and personal rolling quotas count failures and cannot be reset by deleting a CV", async () => {
    const second = (await store.listCustomerCvs(2))[0];
    await assert.rejects(store.reserveCvAiRun(2, second.id, 0, randomUUID(), { globalDailyLimit: 3 }), expectCode("AI_GLOBAL_LIMIT"));
    for (let i = 3; i < 10; i++) {
      const run = await store.reserveCvAiRun(1, document.id, document.version, randomUUID());
      await store.finishCvAiRun(run.runId, 1, { status: "failed", errorCode: "PROVIDER_ERROR" });
    }
    await assert.rejects(store.reserveCvAiRun(1, document.id, document.version, randomUUID()), expectCode("AI_DAILY_LIMIT"));
    await store.deleteCustomerCv(document.id, 1, document.version);
    assert.equal((await pg.query("SELECT count(*)::int AS total FROM cv_ai_runs WHERE customer_id=1 AND document_id IS NULL")).rows[0].total, 10);
    document = await store.createCustomerCv(1, {});
    await assert.rejects(store.reserveCvAiRun(1, document.id, 0, randomUUID()), expectCode("AI_DAILY_LIMIT"));
    await pg.query("UPDATE cv_ai_runs SET created_at = now() - interval '25 hours' WHERE customer_id=1");
    const fresh = await store.reserveCvAiRun(1, document.id, 0, randomUUID());
    assert.ok(fresh.runId);
    await store.finishCvAiRun(fresh.runId, 1, { status: "failed" });
    const columns = (await pg.query("SELECT column_name FROM information_schema.columns WHERE table_name='cv_ai_runs'")).rows.map(row => row.column_name);
    assert.ok(!columns.some(name => /prompt|content|response|summary/.test(name)));
  });
});
