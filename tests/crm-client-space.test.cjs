const commercial = require("./helpers/commercial-fixture.cjs");
const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { resolve } = require("node:path");
const { pathToFileURL } = require("node:url");
const test = require("node:test");
const { PGlite } = require("@electric-sql/pglite");
const { drizzle } = require("drizzle-orm/pglite");
const { CORE_LEADS_SQL, loadTypeScript, migrationClient } = require("./helpers/crm-fixture.cjs");

class UnauthorizedError extends Error {}
class CustomerUnauthorizedError extends Error {}
const initial = { ok: false, message: "" };
const hash = (value) => createHash("sha256").update(value).digest("hex");
function form(values) { const fd = new FormData(); for (const [key, value] of Object.entries(values)) fd.set(key, String(value)); return fd; }

// In-memory PostgreSQL only: never reads DATABASE_URL.
test("CRM client space: invitation, account linking and inline exchanges", async (t) => {
  const pg = new PGlite();
  await pg.waitReady;
  t.after(async () => { await pg.close(); });
  await pg.exec(CORE_LEADS_SQL);
  const { migrateCrm } = await import(pathToFileURL(resolve(__dirname, "../scripts/migrate-crm.mjs")).href);
  await migrateCrm(migrationClient(pg));

  const schema = loadTypeScript("src/db/schema.ts");
  const customerSchema = loadTypeScript("src/db/customer-schema.ts", { "./schema": schema });
  const crmSchema = loadTypeScript("src/db/crm-schema.ts", { "./schema": schema });
  const workspaceSchema = loadTypeScript("src/db/workspace-schema.ts", { "./schema": schema, "./customer-schema": customerSchema });
  const qualification = loadTypeScript("src/lib/qualification.ts", { ...commercial, "@/lib/countries": loadTypeScript("src/lib/countries.ts") });
  const workspace = loadTypeScript("src/lib/workspace.ts", { "@/lib/qualification": qualification });
  const db = drizzle(pg, { schema: { ...schema, ...customerSchema, ...crmSchema, ...workspaceSchema } });
  let staffEnabled = true;
  const notifications = [];
  const invalidations = [];
  const common = { ...commercial,
    "server-only": {}, "@/db": { getDb: () => db, databaseConfigured: true },
    "@/db/schema": schema, "@/db/customer-schema": customerSchema, "@/db/crm-schema": crmSchema, "@/db/workspace-schema": workspaceSchema,
    "@/lib/qualification": qualification, "@/lib/workspace": workspace,
    "@/lib/staff-auth": { UnauthorizedError, requireStaff: async () => { if (!staffEnabled) throw new UnauthorizedError(); return { id: 9, name: "Conseillère", email: "staff@example.test", role: "advisor" }; } },
    "@/lib/customer-auth": { CustomerUnauthorizedError, customerTokenHash: hash, requireCustomer: async () => { throw new CustomerUnauthorizedError(); } },
    "@/lib/workspace-mail": { scheduleWorkspaceNotifications: (scope) => notifications.push(scope) },
    "@/lib/env": { serverEnv: { NEXT_PUBLIC_SITE_URL: "https://www.carriovaci.com" } },
    "next/cache": { revalidatePath: (...args) => invalidations.push(args) },
    "next/navigation": { redirect: (path) => { throw new Error(`Redirect:${path}`); } },
  };
  const claims = loadTypeScript("src/lib/customer-claims.ts", common);
  const queries = loadTypeScript("src/lib/workspace-queries.ts", common);
  const spaceQueries = loadTypeScript("src/lib/crm-workspace-queries.ts", { ...common, "@/lib/workspace-queries": queries });
  const actions = loadTypeScript("src/lib/crm-workspace-actions.ts", { ...common, "@/lib/customer-claims": claims });
  const workspaceActions = loadTypeScript("src/lib/workspace-actions.ts", { ...common,
    "@/lib/workspace-files": loadTypeScript("src/lib/workspace-files.ts", common), "@/lib/offer-selection": { selectOffer: () => ({}) } });

  async function lead(name, whatsapp, withQualification = true) {
    const { rows } = await pg.query("INSERT INTO leads(first_name,email,whatsapp,type,source,interest,message) VALUES ($1,'',$2,'qualification',$3,'improve_cv','un cv pour un stage') RETURNING id", [name, whatsapp, withQualification ? "qualification_form" : "contact_page"]);
    const id = rows[0].id;
    if (withQualification) await pg.query("INSERT INTO lead_qualifications(lead_id,country,profile,discovery_source,need,cv_status,timeline,budget,payment_readiness,contact_whatsapp,consent_version,privacy_notice) VALUES ($1,'CI','student','friend','improve_cv','improve','today','7000_10000','not_asked',false,'2026-10-22','notice')", [id]);
    return id;
  }
  async function customer(name, email, whatsapp) {
    const { rows } = await pg.query("INSERT INTO customer_users(email,name,whatsapp,password_hash,consent_privacy,consent_version) VALUES ($1,$2,$3,'x',true,'2026-10-22') RETURNING id,email,name", [email, name, whatsapp]);
    return rows[0];
  }

  await t.test("a prospect without account gets a single-use invitation; a new link replaces the previous one", async () => {
    const id = await lead("Ange Stéphanie", "+2250787336079");
    let space = await spaceQueries.getCrmLeadWorkspace(id, "+2250787336079");
    assert.equal(space.request, null);
    assert.deepEqual(space.matchingAccounts, []);
    const first = await actions.createCrmLeadInvitation(initial, form({ leadId: id }));
    assert.equal(first.ok, true, first.message);
    const url = new URL(first.invitationUrl);
    assert.equal(url.origin + url.pathname, "https://www.carriovaci.com/compte/invitation");
    const token = url.searchParams.get("code");
    assert.match(token, /^[A-Za-z0-9_-]{43}$/);
    const stored = await pg.query("SELECT token_hash FROM customer_lead_claims WHERE lead_id=$1", [id]);
    assert.deepEqual(stored.rows, [{ token_hash: hash(token) }]);
    const second = await actions.createCrmLeadInvitation(initial, form({ leadId: id }));
    const secondToken = new URL(second.invitationUrl).searchParams.get("code");
    const replaced = await pg.query("SELECT token_hash FROM customer_lead_claims WHERE lead_id=$1", [id]);
    assert.deepEqual(replaced.rows, [{ token_hash: hash(secondToken) }]);
    space = await spaceQueries.getCrmLeadWorkspace(id, "+2250787336079");
    assert.equal(space.invitation.active, true);
    const history = await pg.query("SELECT action,actor_name FROM crm_history WHERE lead_id=$1", [id]);
    assert.equal(history.rows.filter((row) => row.action === "invitation_created").length, 2);

    // Signing up with the link attaches the dossier; the old link is useless.
    const awa = await customer("Ange", "ange@example.test", null);
    const requestId = await db.transaction((tx) => claims.claimPendingLead(tx, secondToken, awa));
    assert.ok(requestId);
    assert.equal(await db.transaction((tx) => claims.claimPendingLead(tx, token, awa)), undefined);
    space = await spaceQueries.getCrmLeadWorkspace(id, "+2250787336079");
    assert.equal(space.request.id, requestId);
    assert.equal(space.request.customerEmail, "ange@example.test");
    const refused = await actions.createCrmLeadInvitation(initial, form({ leadId: id }));
    assert.equal(refused.ok, false);
    assert.match(refused.message, /déjà rattaché/);
  });

  await t.test("linking requires an enabled account with the same WhatsApp number", async () => {
    const id = await lead("Koffi", "+225 07 11 22 33 44");
    const stranger = await customer("Autre", "autre@example.test", "+2250799999999");
    const owner = await customer("Koffi K.", "koffi@example.test", "+2250711223344");
    const space = await spaceQueries.getCrmLeadWorkspace(id, "+225 07 11 22 33 44");
    assert.deepEqual(space.matchingAccounts.map((account) => account.id), [owner.id]);
    const forged = await actions.linkCrmLeadToCustomer(initial, form({ leadId: id, customerId: stranger.id }));
    assert.equal(forged.ok, false);
    const { rows: none } = await pg.query("SELECT id FROM service_requests WHERE lead_id=$1", [id]);
    assert.equal(none.length, 0);
    const linked = await actions.linkCrmLeadToCustomer(initial, form({ leadId: id, customerId: owner.id }));
    assert.equal(linked.ok, true, linked.message);
    assert.deepEqual(notifications.at(-1), { requestId: linked.requestId });
    const again = await actions.linkCrmLeadToCustomer(initial, form({ leadId: id, customerId: owner.id }));
    assert.equal(again.ok, false);
    const history = await pg.query("SELECT note FROM crm_history WHERE lead_id=$1 AND action='linked_to_customer'", [id]);
    assert.match(history.rows[0].note, /koffi@example.test/);
  });

  await t.test("leads from other forms can also join a client space", async () => {
    const id = await lead("Contact", "+2250500000000", false);
    const owner = await customer("Contact", "contact@example.test", "+2250500000000");
    const linked = await actions.linkCrmLeadToCustomer(initial, form({ leadId: id, customerId: owner.id }));
    assert.equal(linked.ok, true, linked.message);
    const { rows } = await pg.query("SELECT service,brief FROM service_requests WHERE id=$1", [linked.requestId]);
    assert.equal(rows[0].service, "improve_cv");
    assert.match(rows[0].brief, /formulaire de contact/);
  });

  await t.test("staff messages and documents sent from the prospect file reach the client space", async () => {
    const id = await lead("Messages", "+2250600000000");
    const owner = await customer("Messages", "messages@example.test", "+2250600000000");
    const { requestId } = await actions.linkCrmLeadToCustomer(initial, form({ leadId: id, customerId: owner.id }));
    const sent = await workspaceActions.addRequestMessage(initial, form({ context: "team", requestId, body: "Bonjour, pouvez-vous envoyer votre CV ?" }));
    assert.equal(sent.ok, true, sent.message);
    assert.ok(invalidations.some(([path, type]) => path === "/admin/crm/[id]" && type === "page"));
    const pdf = new File([Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n")], "modele.pdf", { type: "application/pdf" });
    const fd = form({ context: "team", requestId, kind: "brief" }); fd.set("file", pdf);
    const uploaded = await workspaceActions.uploadRequestFile(initial, fd);
    assert.equal(uploaded.ok, true, uploaded.message);
    const space = await spaceQueries.getCrmLeadWorkspace(id, "+2250600000000");
    assert.equal(space.request.messages.at(-1).authorType, "staff");
    assert.deepEqual(space.request.files.map((file) => file.filename), ["modele.pdf"]);
    const detail = await queries.getTeamRequest(requestId);
    assert.equal(detail.leadId, id);
  });

  await t.test("every entry point requires a staff session", async () => {
    staffEnabled = false;
    await assert.rejects(spaceQueries.getCrmLeadWorkspace(1, null), UnauthorizedError);
    await assert.rejects(actions.createCrmLeadInvitation(initial, form({ leadId: 1 })), /Redirect:\/admin\/connexion/);
    await assert.rejects(actions.linkCrmLeadToCustomer(initial, form({ leadId: 1, customerId: 1 })), /Redirect:\/admin\/connexion/);
    staffEnabled = true;
  });
});
