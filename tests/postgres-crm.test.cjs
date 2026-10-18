const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const { pathToFileURL } = require("node:url");
const test = require("node:test");
const { PGlite } = require("@electric-sql/pglite");
const { drizzle } = require("drizzle-orm/pglite");
const { CORE_LEADS_SQL, loadTypeScript, migrationClient } = require("./helpers/crm-fixture.cjs");

const schema = loadTypeScript("src/db/schema.ts");
const customerSchema = loadTypeScript("src/db/customer-schema.ts", { "./schema": schema });
const crmSchema = loadTypeScript("src/db/crm-schema.ts", { "./schema": schema });
const qualification = loadTypeScript("src/lib/qualification.ts");
const crm = loadTypeScript("src/lib/crm.ts");
const initial = { ok: false, message: "" };
const staff = { id: 42, name: "Conseiller de test", email: "staff@example.test", role: "advisor" };
class UnauthorizedError extends Error {}
function form(overrides = {}) {
  const fd = new FormData();
  for (const [key, value] of Object.entries({
    fullName: "Qualification PostgreSQL", whatsapp: "+2250700000000", country: "cote_ivoire",
    profile: "job_seeker", discoverySource: "whatsapp", need: "improve_cv", cvStatus: "outdated",
    timeline: "week", targetOffer: "", difficulty: "", budget: "7000_10000",
    paymentReadiness: "advisor", contactWhatsApp: "no", consentPrivacy: "on", ...overrides,
  })) fd.set(key, value);
  return fd;
}
function updateForm(leadId, overrides = {}) {
  const fd = new FormData();
  for (const [key, value] of Object.entries({ leadId: String(leadId), version: "0", status: "qualified", priority: "high", followUpAt: "", note: "Note de test", ...overrides })) fd.set(key, value);
  return fd;
}

// All persistence in this suite belongs to this ephemeral PostgreSQL WASM instance.
// It never uses DATABASE_URL or opens a connection to a remote database.
test("PostgreSQL CRM integration", async (t) => {
  const pg = new PGlite();
  await pg.waitReady;
  t.after(async () => { await pg.close(); });
  const client = migrationClient(pg);
  const { migrateCrm } = await import(pathToFileURL(resolve(__dirname, "../scripts/migrate-crm.mjs")).href);
  const db = drizzle(pg, { schema: { ...schema, ...crmSchema } });
  let ip = "192.0.2.2";
  const common = {
    "server-only": {}, "@/db": { getDb: () => db }, "@/db/schema": schema,
    "@/db/crm-schema": crmSchema, "@/lib/qualification": qualification, "@/lib/crm": crm,
    "@/lib/staff-auth": { requireStaff: async () => staff, UnauthorizedError },
  };
  const cookieWrites = [];
  const { submitQualification } = loadTypeScript("src/lib/qualification-actions.ts", {
    ...common, "next/headers": { headers: async () => new Headers({ "x-real-ip": ip }), cookies: async () => ({ set: (...args) => cookieWrites.push(args) }) },
    "@/db/customer-schema": customerSchema,
    "@/lib/customer-auth": { getCustomerSession: async () => null, CLAIM_COOKIE: "test-claim", customerTokenHash: (value) => createHash("sha256").update(value).digest("hex") },
    "@/lib/workspace-mail": { scheduleWorkspaceNotifications() {} },
    "@/lib/customer-claims": { attachLeadToCustomer: async () => { throw new Error("unexpected authenticated claim"); } },
  });
  const invalidations = [];
  const { updateCrmLead } = loadTypeScript("src/lib/crm-actions.ts", {
    ...common, "next/cache": { revalidatePath: (path) => invalidations.push(path) },
    "next/navigation": { redirect: (path) => { throw new Error(`Unexpected redirect:${path}`); } },
  });
  const { getCrmDashboard, getCrmLead } = loadTypeScript("src/lib/crm-queries.ts", common);
  let qualifiedLeadId;
  let legacyId;

  await t.test("migration refuses an unrelated empty database and rolls back", async () => {
    await assert.rejects(migrateCrm(client));
    const { rows } = await pg.query("SELECT to_regclass('staff_users') AS staff, to_regclass('carriova_migrations') AS journal");
    assert.equal(rows[0].staff, null);
    assert.equal(rows[0].journal, null);
  });

  await t.test("migrations are repeatable, retain legacy prospects and preserve the original email constraint", async () => {
    await pg.exec(CORE_LEADS_SQL);
    const inserted = await pg.query("INSERT INTO leads(first_name,last_name,email,type,whatsapp,source) VALUES ('Ancien','Prospect','old@example.test','contact','+2250100000000','website') RETURNING id");
    legacyId = inserted.rows[0].id;
    assert.deepEqual(await migrateCrm(client), ["20261018_staff.sql", "20261018_crm.sql", "20261018_customer.sql", "20261018_workspace.sql", "20261018_staff_invites.sql", "20261018_notifications.sql"]);
    assert.deepEqual(await migrateCrm(client), []);
    await pg.exec(readFileSync(resolve(__dirname, "../migrations/20261018_crm.sql"), "utf8"));
    const { rows } = await pg.query("SELECT first_name,email FROM leads WHERE id=$1", [legacyId]);
    assert.deepEqual(rows, [{ first_name: "Ancien", email: "old@example.test" }]);
    const column = await pg.query("SELECT is_nullable FROM information_schema.columns WHERE table_name='leads' AND column_name='email'");
    assert.equal(column.rows[0].is_nullable, "NO");
    const retentionIndex = await pg.query("SELECT indexname FROM pg_indexes WHERE tablename='crm_submission_limits' AND indexname='crm_submission_limits_window_start_idx'");
    assert.equal(retentionIndex.rows.length, 1);
    const oldLead = await getCrmLead(legacyId);
    assert.equal(oldLead.status, "new");
    assert.equal(oldLead.version, 0);
    assert.equal(oldLead.qualification, null);
    assert.equal(oldLead.canContactWhatsApp, false);
  });

  await t.test("public submission commits all five records without fabricating email or contact consent", async () => {
    const result = await submitQualification(initial, form({ consentMarketing: "on" }));
    assert.equal(result.ok, true, result.message);
    assert.deepEqual(Object.keys(result).sort(), ["message", "ok"]);
    const { rows } = await pg.query("SELECT l.id,l.email,l.consent_marketing,q.contact_whatsapp,q.source_form,q.consent_version,s.status,h.action FROM leads l JOIN lead_qualifications q ON q.lead_id=l.id JOIN crm_lead_state s ON s.lead_id=l.id JOIN crm_history h ON h.lead_id=l.id WHERE l.first_name='Qualification PostgreSQL'");
    assert.equal(rows.length, 1);
    qualifiedLeadId = rows[0].id;
    assert.equal(rows[0].email, "");
    assert.equal(rows[0].consent_marketing, true);
    assert.equal(rows[0].contact_whatsapp, false);
    assert.equal(rows[0].source_form, "/qualification");
    assert.equal(rows[0].consent_version, qualification.QUALIFICATION_CONSENT_VERSION);
    assert.equal(rows[0].status, "new");
    assert.equal(rows[0].action, "qualification_submitted");
    const claim = await pg.query("SELECT token_hash,claimed_at,customer_id FROM customer_lead_claims WHERE lead_id=$1", [qualifiedLeadId]);
    assert.equal(claim.rows.length, 1);
    assert.equal(claim.rows[0].token_hash, createHash("sha256").update(cookieWrites.at(-1)[1]).digest("hex"));
    assert.equal(claim.rows[0].claimed_at, null);
    assert.equal(claim.rows[0].customer_id, null);
    const detail = await getCrmLead(qualifiedLeadId);
    assert.equal(detail.canContactWhatsApp, false);
    assert.equal(detail.qualification.contactWhatsApp, "no");
    assert.equal(detail.email, null);
    assert.ok(Number.isFinite(Date.parse(detail.createdAt)));
    assert.equal(detail.history.length, 1);
    assert.equal(detail.history[0].actorId, null);
  });

  await t.test("WhatsApp consent allows a manual contact link but never triggers external delivery", async (subtest) => {
    const outgoing = subtest.mock.method(globalThis, "fetch", async () => { throw new Error("Unexpected external delivery"); });
    const result = await submitQualification(initial, form({ fullName: "Manual WhatsApp consent", need: "first_cv", contactWhatsApp: "yes" }));
    assert.equal(result.ok, true, result.message);
    const found = await pg.query("SELECT id FROM leads WHERE first_name='Manual WhatsApp consent'");
    const detail = await getCrmLead(found.rows[0].id);
    assert.equal(detail.canContactWhatsApp, true);
    assert.equal(detail.consentMarketing, false);
    assert.equal(outgoing.mock.callCount(), 0);
  });

  await t.test("a database failure in qualification persistence rolls back the lead and related records", async () => {
    const before = await pg.query("SELECT count(*)::integer AS total FROM leads");
    await pg.exec("ALTER TABLE lead_qualifications ADD CONSTRAINT integration_reject_profile CHECK (profile <> 'entrepreneur')");
    try {
      const result = await submitQualification(initial, form({ fullName: "Rollback PostgreSQL", profile: "entrepreneur" }));
      assert.equal(result.ok, false);
      const after = await pg.query("SELECT count(*)::integer AS total FROM leads");
      assert.equal(after.rows[0].total, before.rows[0].total);
      assert.equal((await pg.query("SELECT id FROM leads WHERE first_name='Rollback PostgreSQL'")).rows.length, 0);
    } finally {
      await pg.exec("ALTER TABLE lead_qualifications DROP CONSTRAINT integration_reject_profile");
    }
  });

  await t.test("a failed opaque claim rolls back every qualification record and never sets a cookie", async () => {
    const before = (await pg.query("SELECT count(*)::integer AS total FROM leads")).rows[0].total;
    const cookiesBefore = cookieWrites.length;
    await pg.exec("ALTER TABLE customer_lead_claims ADD CONSTRAINT integration_reject_claim CHECK (token_hash='impossible') NOT VALID");
    try {
      assert.equal((await submitQualification(initial, form({ fullName: "Rejected claim" }))).ok, false);
      assert.equal((await pg.query("SELECT count(*)::integer AS total FROM leads")).rows[0].total, before);
      assert.equal(cookieWrites.length, cookiesBefore);
    } finally { await pg.exec("ALTER TABLE customer_lead_claims DROP CONSTRAINT integration_reject_claim"); }
  });

  await t.test("submission limiting purges windows older than 24 hours and retains recent counters", async () => {
    await pg.exec("INSERT INTO crm_submission_limits(key,window_start,count) VALUES ('expired-test',now()-interval '25 hours',4),('recent-test',now()-interval '12 hours',3),('active-test',now(),2)");
    const result = await submitQualification(initial, form({ fullName: "Retention PostgreSQL", need: "first_cv" }));
    assert.equal(result.ok, true, result.message);
    const { rows } = await pg.query("SELECT key,count FROM crm_submission_limits WHERE key IN ('expired-test','recent-test','active-test') ORDER BY key");
    assert.deepEqual(rows, [{ key: "active-test", count: 2 }, { key: "recent-test", count: 3 }]);
  });

  await t.test("persistent limiting caps a concurrent burst at eight committed submissions", async () => {
    ip = "192.0.2.88";
    const results = await Promise.all(Array.from({ length: 12 }, (_, index) => submitQualification(initial, form({ fullName: `Burst PostgreSQL ${index}` }))));
    assert.equal(results.filter((result) => result.ok).length, 8);
    assert.equal((await pg.query("SELECT count(*)::integer AS total FROM leads WHERE first_name LIKE 'Burst PostgreSQL %'")).rows[0].total, 8);
    assert.equal((await pg.query("SELECT count FROM crm_submission_limits WHERE count=8")).rows.length, 1);
    ip = "192.0.2.99";
  });

  await t.test("updates atomically retain history, and stale versions cannot overwrite newer decisions", async () => {
    const followUpAt = new Date(Date.now() + 86400000).toISOString();
    const result = await updateCrmLead(initial, updateForm(qualifiedLeadId, { followUpAt, note: "Premier échange prévu" }));
    assert.equal(result.ok, true, result.message);
    let detail = await getCrmLead(qualifiedLeadId);
    assert.equal(detail.version, 1);
    assert.equal(detail.status, "qualified");
    assert.equal(detail.priority, "high");
    assert.equal(detail.followUpAt, followUpAt);
    assert.equal(detail.history[0].actorId, staff.id);
    assert.equal(detail.history[0].note, "Premier échange prévu");
    assert.deepEqual(detail.history[0].changes.priority, { from: "normal", to: "high" });
    assert.equal((await updateCrmLead(initial, updateForm(qualifiedLeadId, { status: "lost" }))).ok, false);
    detail = await getCrmLead(qualifiedLeadId);
    assert.equal(detail.version, 1);
    assert.equal(detail.status, "qualified");
    assert.equal(detail.history.length, 2);
    assert.ok(invalidations.includes(`/admin/crm/${qualifiedLeadId}`));
  });

  await t.test("the audit log is immutable, and a failed audit insert cancels the state change", async () => {
    await assert.rejects(pg.query("UPDATE crm_history SET note='tampered' WHERE lead_id=$1", [qualifiedLeadId]), /immuable/);
    await assert.rejects(pg.query("DELETE FROM crm_history WHERE lead_id=$1", [qualifiedLeadId]), /immuable/);
    await assert.rejects(pg.exec("TRUNCATE crm_history"), /immuable/);
    await pg.exec("ALTER TABLE crm_history ADD CONSTRAINT integration_reject_note CHECK (note IS DISTINCT FROM 'Reject this note')");
    try {
      const result = await updateCrmLead(initial, updateForm(qualifiedLeadId, { version: "1", status: "lost", note: "Reject this note" }));
      assert.equal(result.ok, false);
      const detail = await getCrmLead(qualifiedLeadId);
      assert.equal(detail.version, 1);
      assert.equal(detail.status, "qualified");
      assert.equal(detail.history.length, 2);
    } finally {
      await pg.exec("ALTER TABLE crm_history DROP CONSTRAINT integration_reject_note");
    }
  });

  await t.test("CRM search, due filters and pagination execute against PostgreSQL data", async () => {
    await pg.exec("INSERT INTO leads(first_name,email,type,interest) SELECT 'Pagination ' || n,'','contact','cv' FROM generate_series(1,55) n");
    const first = await getCrmDashboard({ q: "Pagination", page: 1 });
    const second = await getCrmDashboard({ q: "Pagination", page: 2 });
    assert.equal(first.total, 55);
    assert.equal(first.leads.length, 50);
    assert.equal(second.leads.length, 5);
    assert.equal(first.totalPages, 2);
    assert.equal(new Set([...first.leads, ...second.leads].map((lead) => lead.id)).size, 55);
    assert.equal((await getCrmDashboard({ status: "qualified", need: "improve_cv" })).total, 1);
    assert.equal((await getCrmDashboard({ q: "Qualifié" })).total, 1);
    assert.equal((await getCrmDashboard({ q: "Améliorer" })).total, 9);
    assert.equal((await getCrmDashboard({ q: "' OR true --" })).total, 0);
    assert.equal((await getCrmDashboard({ q: "%" })).total, 0);
    const absent = await getCrmDashboard({ q: "Ancien", due: "none" });
    assert.equal(absent.total, 1);
    assert.equal(absent.leads[0].canContactWhatsApp, false);
    assert.equal((await getCrmDashboard({ q: "Qualification PostgreSQL", due: "upcoming" })).total, 1);
    const past = new Date(Date.now() - 3600000).toISOString();
    assert.equal((await updateCrmLead(initial, updateForm(qualifiedLeadId, { version: "1", followUpAt: past }))).ok, true);
    assert.equal((await getCrmDashboard({ q: "Qualification PostgreSQL", due: "overdue" })).total, 1);
    const today = new Date(); today.setUTCHours(12, 0, 0, 0);
    assert.equal((await updateCrmLead(initial, updateForm(qualifiedLeadId, { version: "2", followUpAt: today.toISOString() }))).ok, true);
    assert.equal((await getCrmDashboard({ q: "Qualification PostgreSQL", due: "today" })).total, 1);
  });
});
