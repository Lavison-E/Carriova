const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { createRequire } = require("node:module");
const { resolve } = require("node:path");
const test = require("node:test");
const ts = require("typescript");
const { drizzle } = require("drizzle-orm/node-postgres");

function load(file, mocks = {}) {
  const filename = resolve(__dirname, "..", file);
  const source = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const nativeRequire = createRequire(filename);
  const localRequire = (name) => Object.hasOwn(mocks, name) ? mocks[name] : nativeRequire(name);
  const loaded = { exports: {} };
  new Function("require", "module", "exports", source)(localRequire, loaded, loaded.exports);
  return loaded.exports;
}
const schema = load("src/db/schema.ts");
const customerSchema = load("src/db/customer-schema.ts", { "./schema": schema });
const crmSchema = load("src/db/crm-schema.ts", { "./schema": schema });
const qualification = load("src/lib/qualification.ts", { "@/lib/countries": load("src/lib/countries.ts") });
const crm = load("src/lib/crm.ts");
const initial = { ok: false, message: "" };
class UnauthorizedError extends Error {}
const staff = { id: 3, name: "Conseiller", email: "staff@example.com", role: "advisor" };
function data(overrides = {}) {
  const fd = new FormData();
  for (const [key, value] of Object.entries({
    fullName: "Awa Test", whatsapp: "+225 07 00 00 00 00", country: "CI",
    profile: "job_seeker", discoverySource: "whatsapp", need: "improve_cv", cvStatus: "outdated",
    timeline: "week", targetOffer: "", difficulty: "", budget: "7000_10000",
    paymentReadiness: "advisor", contactWhatsApp: "no", consentPrivacy: "on", ...overrides,
  })) fd.set(key, value);
  return fd;
}
function crmData(overrides = {}) {
  const fd = new FormData();
  for (const [key, value] of Object.entries({ leadId: "7", version: "0", status: "qualified", priority: "normal", followUpAt: "", note: "", ...overrides })) fd.set(key, value);
  return fd;
}
function database(respond) {
  const calls = [];
  const client = { async query(config, parameters = []) {
    const text = typeof config === "string" ? config : config.text;
    calls.push({ text, parameters });
    return { rows: await respond(text, parameters) };
  } };
  return { db: drizzle(client, { schema: { ...schema, ...crmSchema } }), calls };
}
function submission(respond) {
  const fixture = database(respond ?? ((sql, parameters) => {
    if (sql.startsWith('insert into "crm_submission_limits"')) return [[parameters[0]]];
    if (sql.startsWith('insert into "leads"')) return [[7]];
    return [];
  }));
  const cookieWrites = [];
  const action = load("src/lib/qualification-actions.ts", {
    "next/headers": { headers: async () => new Headers({ "x-real-ip": "192.0.2.1" }), cookies: async () => ({ set: (...args) => cookieWrites.push(args) }) },
    "@/db/customer-schema": customerSchema,
    "@/lib/customer-auth": { getCustomerSession: async () => null, CLAIM_COOKIE: "test-claim", customerTokenHash: (value) => createHash("sha256").update(value).digest("hex") },
    "@/lib/workspace-mail": { scheduleWorkspaceNotifications() {} },
    "@/lib/customer-claims": { attachLeadToCustomer: async () => { throw new Error("unexpected authenticated claim"); } },
    "@/db": { getDb: () => fixture.db }, "@/db/schema": schema,
    "@/db/crm-schema": crmSchema, "@/lib/qualification": qualification,
  });
  return { ...fixture, cookieWrites, action: action.submitQualification };
}
function mutations({ currentVersion = 0, failHistory = false, actor = async () => staff } = {}) {
  const fixture = database((sql) => {
    if (sql.startsWith('select "id" from "leads"')) return [[7]];
    if (sql.startsWith('select') && sql.includes('from "crm_lead_state"')) return [[7, "new", "normal", null, currentVersion, "2026-10-18T00:00:00.000Z"]];
    if (sql.startsWith('update "crm_lead_state"')) return [[7]];
    if (failHistory && sql.startsWith('insert into "crm_history"')) throw new Error("history unavailable");
    return [];
  });
  let reads = 0;
  const invalidations = [];
  const action = load("src/lib/crm-actions.ts", {
    "next/cache": { revalidatePath: (path) => invalidations.push(path) },
    "next/navigation": { redirect: (path) => { throw new Error(`Redirect:${path}`); } },
    "@/db": { getDb() { reads++; return fixture.db; } }, "@/db/schema": schema,
    "@/db/crm-schema": crmSchema, "@/lib/crm": crm,
    "@/lib/staff-auth": { requireStaff: actor, UnauthorizedError },
  });
  return { ...fixture, action: action.updateCrmLead, invalidations, reads: () => reads };
}

test("qualification uses the three documented steps and validates every server-side choice", () => {
  assert.deepEqual(qualification.qualificationSteps.map((step) => step.title), ["Votre profil", "Votre besoin", "Votre demande"]);
  assert.equal(qualification.validateQualification(data()).ok, true);
  for (const key of Object.keys(qualification.qualificationOptions)) {
    const result = qualification.validateQualification(data({ [key]: "__proto__" }));
    assert.equal(result.ok, false);
    assert.ok(result.fieldErrors[key]);
  }
  const missingConsent = qualification.validateQualification(data({ consentPrivacy: "", consentMarketing: "on" }));
  assert.equal(missingConsent.ok, false);
  assert.ok(missingConsent.fieldErrors.consentPrivacy);
});

test("qualification preserves separate marketing and contact choices and normalizes Ivorian phone numbers", () => {
  const result = qualification.validateQualification(data({ whatsapp: "07 00 00 00 00", consentMarketing: "on", contactWhatsApp: "no" }));
  assert.equal(result.ok, true);
  assert.equal(result.data.whatsapp, "+2250700000000");
  assert.equal(result.data.contactWhatsApp, "no");
  assert.equal(result.data.consentMarketing, true);
  assert.equal(result.data.targetOffer, null);
  assert.equal(result.data.difficulty, null);
  assert.equal(qualification.validateQualification(data({ whatsapp: "call me 0700000000" })).ok, false);
});

test("qualification bounds inputs and cannot accept a forged checkbox or unknown object property", () => {
  for (const overrides of [{ fullName: "x".repeat(121) }, { message: "x".repeat(4001) }, { consentPrivacy: "false" }]) {
    assert.equal(qualification.validateQualification(data(overrides)).ok, false);
  }
  const payload = data();
  payload.set("fullName", new Blob(["Awa"]));
  assert.equal(qualification.validateQualification(payload).ok, false);
});

test("public qualification writes lead, answers, state, history and claim in one transaction without returning a record", async () => {
  const fixture = submission();
  const result = await fixture.action(initial, data({ role: "admin", status: "client", sourceForm: "/forged", consentMarketing: "on" }));
  assert.equal(result.ok, true);
  assert.deepEqual(Object.keys(result).sort(), ["message", "ok"]);
  const transaction = fixture.calls.slice(fixture.calls.findIndex((call) => call.text === "begin"));
  const sequence = transaction.map((call) => call.text);
  assert.equal(sequence[0], "begin");
  assert.ok(sequence[1].startsWith('insert into "leads"'));
  assert.ok(sequence[2].startsWith('insert into "lead_qualifications"'));
  assert.ok(sequence[3].startsWith('insert into "crm_lead_state"'));
  assert.ok(sequence[4].startsWith('insert into "crm_history"'));
  assert.ok(sequence[5].startsWith('insert into "customer_lead_claims"'));
  assert.equal(sequence[6], "commit");
  assert.equal(fixture.cookieWrites.length, 1);
  const token = fixture.cookieWrites[0][1];
  assert.match(token, /^[A-Za-z0-9_-]{43}$/);
  assert.ok(transaction[5].parameters.includes(createHash("sha256").update(token).digest("hex")));
  assert.equal(transaction[5].parameters.includes(token), false);
  assert.equal(fixture.cookieWrites[0][2].httpOnly, true);
  assert.ok(transaction[1].parameters.includes(""), "No email was requested: persist its documented absence");
  assert.ok(transaction[2].parameters.includes(false), "Refusal of WhatsApp contact must be stored");
  assert.ok(transaction[2].parameters.includes(qualification.QUALIFICATION_PRIVACY_NOTICE));
  assert.ok(transaction[2].parameters.includes("/qualification"));
  assert.equal(fixture.calls.some((call) => call.parameters.includes("/forged")), false);
});

test("qualification rollback is observable to the caller when any related record fails", async () => {
  const fixture = submission((sql, parameters) => {
    if (sql.startsWith('insert into "crm_submission_limits"')) return [[parameters[0]]];
    if (sql.startsWith('insert into "leads"')) return [[7]];
    if (sql.startsWith('insert into "lead_qualifications"')) throw new Error("unavailable");
    return [];
  });
  assert.equal((await fixture.action(initial, data())).ok, false);
  assert.equal(fixture.calls.at(-1).text, "rollback");
  assert.equal(fixture.calls.some((call) => call.text === "commit"), false);
});

test("persistent submission limiting fails closed and keeps the raw client IP out of storage", async () => {
  const limited = submission(() => []);
  assert.equal((await limited.action(initial, data())).ok, false);
  assert.equal(limited.calls.length, 2);
  assert.match(limited.calls[0].text, /delete from "crm_submission_limits" where "crm_submission_limits"\."window_start" </);
  const age = Date.now() - Date.parse(limited.calls[0].parameters[0]);
  assert.ok(age >= 86400000 && age < 86410000);
  assert.match(limited.calls[1].text, /on conflict.*do update.*where/);
  assert.match(limited.calls[1].parameters[0], /^qualification:[a-f0-9]{64}$/);
  assert.equal(limited.calls.some((call) => call.parameters.includes("192.0.2.1")), false);
  const broken = submission(() => { throw new Error("database unavailable"); });
  assert.equal((await broken.action(initial, data())).ok, false);
  assert.equal(broken.calls.length, 1);
});

test("honeypot and invalid submissions never claim success or reach the database", async () => {
  const fixture = submission();
  assert.equal((await fixture.action(initial, data({ companyWebsite: "bot.test" }))).ok, false);
  assert.equal((await fixture.action(initial, data({ need: "admin" }))).ok, false);
  assert.deepEqual(fixture.calls, []);
});

test("every CRM read and write authenticates before database access", async () => {
  let reads = 0;
  const unauthorized = async () => { throw new UnauthorizedError("Unauthorized"); };
  const queries = load("src/lib/crm-queries.ts", {
    "server-only": {}, "@/db": { getDb() { reads++; throw new Error("unexpected read"); } },
    "@/db/schema": schema, "@/db/crm-schema": crmSchema,
    "@/lib/crm": crm, "@/lib/qualification": qualification,
    "@/lib/staff-auth": { requireStaff: unauthorized },
  });
  await assert.rejects(queries.getCrmDashboard(), /Unauthorized/);
  await assert.rejects(queries.getCrmLead(7), /Unauthorized/);
  assert.equal(reads, 0);
  const fixture = mutations({ actor: unauthorized });
  await assert.rejects(fixture.action(initial, crmData()), /Redirect:\/admin\/connexion/);
  assert.equal(fixture.reads(), 0);
});

test("CRM updates check versions, record actor identity, and append the note atomically", async () => {
  const fixture = mutations();
  assert.equal((await fixture.action(initial, crmData({ note: "Rappeler le candidat", followUpAt: "2026-10-20T09:00:00.000Z" }))).ok, true);
  const history = fixture.calls.find((call) => call.text.startsWith('insert into "crm_history"'));
  assert.ok(history.parameters.includes(staff.id));
  assert.ok(history.parameters.includes(staff.name));
  assert.ok(history.parameters.includes("Rappeler le candidat"));
  assert.ok(fixture.calls.some((call) => call.text.includes('for update')));
  const update = fixture.calls.find((call) => call.text.startsWith('update "crm_lead_state"'));
  assert.match(update.text, /where.*"version" =/);
  assert.equal(fixture.calls.at(-1).text, "commit");
  assert.deepEqual(fixture.invalidations, ["/admin/crm", "/admin/crm/7"]);
});

test("stale CRM versions and failed history writes roll back without reporting success", async () => {
  const stale = mutations({ currentVersion: 2 });
  assert.equal((await stale.action(initial, crmData())).ok, false);
  assert.equal(stale.calls.at(-1).text, "rollback");
  assert.equal(stale.calls.some((call) => call.text.startsWith('update "crm_lead_state"')), false);
  const broken = mutations({ failHistory: true });
  assert.equal((await broken.action(initial, crmData())).ok, false);
  assert.equal(broken.calls.at(-1).text, "rollback");
  assert.deepEqual(broken.invalidations, []);
});

test("CRM validates status, version, priority and genuine UTC calendar dates", async () => {
  for (const overrides of [{ status: "admin" }, { version: "" }, { priority: "urgent" }, { followUpAt: "2026-02-30T12:00:00.000Z" }, { followUpAt: "2026-10-20T09:00" }]) {
    const fixture = mutations();
    assert.equal((await fixture.action(initial, crmData(overrides))).ok, false);
    assert.equal(fixture.calls.length, 0);
  }
});

test("CRM dashboard returns legacy leads without inventing WhatsApp consent and retains parameterized filters", async () => {
  const fixture = database((sql) => {
    if (sql.includes("filter (where")) return [[1, 1, 0, 0]];
    if (sql.startsWith('select count(*)')) return [[1]];
    return [[7, "Awa", "Test", "", "+2250700000000", null, null, null, null, "cv", "new", "normal", null, "2026-10-18 00:00:00", null, 0, "website", null]];
  });
  const queries = load("src/lib/crm-queries.ts", {
    "server-only": {}, "@/db": { getDb: () => fixture.db }, "@/db/schema": schema,
    "@/db/crm-schema": crmSchema, "@/lib/crm": crm, "@/lib/qualification": qualification,
    "@/lib/staff-auth": { requireStaff: async () => staff },
  });
  const dashboard = await queries.getCrmDashboard({ q: "Awa%_", status: "new", due: "none", page: 500 });
  assert.equal(dashboard.leads[0].fullName, "Awa Test");
  assert.equal(dashboard.leads[0].canContactWhatsApp, false);
  assert.equal(dashboard.leads[0].email, null);
  assert.equal(dashboard.leads[0].createdAt, "2026-10-18T00:00:00.000Z");
  assert.equal(dashboard.page, 1);
  assert.equal(dashboard.pageSize, 50);
  assert.ok(fixture.calls.some((call) => call.text.includes('left join "crm_lead_state"')));
  assert.equal(fixture.calls.some((call) => call.text.includes("Awa%_")), false);
  assert.ok(fixture.calls.some((call) => call.parameters.includes("%Awa\\%\\_%")));
});


test("database failure during staff authentication returns no CRM data and performs no mutation", async () => {
  const fixture = mutations({ actor: async () => { throw new Error("database offline"); } });
  const result = await fixture.action(initial, crmData());
  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result).sort(), ["message", "ok"]);
  assert.equal(fixture.reads(), 0);
});


test("qualification accepts all ISO countries, rejects broad categories, and preserves historical labels", () => {
  const countries = qualification.qualificationOptions.country;
  assert.equal(countries.length, 249);
  assert.equal(new Set(countries.map(({ value }) => value)).size, 249);
  for (const { value, label } of countries) {
    assert.match(value, /^[A-Z]{2}$/);
    assert.ok(label.length > 2);
    const result = qualification.validateQualification(data({ country: value }));
    assert.equal(result.ok, true, value);
    assert.equal(result.data.country, value);
  }
  for (const invalid of ["", "XX", "EU", "ZZ", "fr", "France", "africa", "europe_america", "other", "cote_ivoire", "__proto__"]) {
    assert.ok(qualification.validateQualification(data({ country: invalid })).fieldErrors.country, invalid);
  }
  assert.equal(qualification.qualificationLabel("country", "CI"), "Côte d’Ivoire");
  assert.equal(qualification.qualificationLabel("country", "FR"), "France");
  assert.equal(qualification.qualificationLabel("country", "SN"), "Sénégal");
  assert.equal(qualification.qualificationLabel("country", "cote_ivoire"), "Côte d’Ivoire");
  assert.equal(qualification.qualificationLabel("country", "africa"), "Autre pays africain");
  assert.equal(qualification.qualificationLabel("country", "europe_america"), "Europe ou Amérique");
  assert.equal(qualification.qualificationLabel("country", "europe"), "Europe ou Amérique");
  assert.equal(qualification.qualificationLabel("country", "other"), "Autre");
  assert.equal(qualification.qualificationLabel("country", null), "Non renseigné");
  assert.equal(qualification.validateQualification(data({ country: "CI", whatsapp: "07 00 00 00 00" })).data.whatsapp, "+2250700000000");
  assert.equal(qualification.validateQualification(data({ country: "FR", whatsapp: "07 00 00 00 00" })).ok, false);
  assert.equal(qualification.validateQualification(data({ country: "FR", whatsapp: "+33 6 12 34 56 78" })).data.whatsapp, "+33612345678");
});

test("qualification need links accept only a single known catalogue need", () => {
  for (const { value } of qualification.qualificationOptions.need) assert.equal(qualification.getInitialQualificationNeed(value), value);
  for (const value of [undefined, null, "", "__proto__", "job", "<script>", ["first_cv"], ["first_cv", "interview"]]) {
    assert.equal(qualification.getInitialQualificationNeed(value), null);
  }
});
