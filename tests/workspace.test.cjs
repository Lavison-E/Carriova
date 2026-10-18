const assert = require("node:assert/strict");
const { createHash } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const test = require("node:test");
const { PGlite } = require("@electric-sql/pglite");
const { drizzle } = require("drizzle-orm/pglite");
const { CORE_LEADS_SQL, loadTypeScript } = require("./helpers/crm-fixture.cjs");

const documents = require("./helpers/workspace-fixtures.cjs");
const initial = { ok: false, message: "" };
const pdf = Buffer.from("%PDF-1.4\n1 0 obj\n<< /Type /Catalog >>\nendobj\n%%EOF\n");
function form(values = {}) {
  const fd = new FormData();
  for (const [key, value] of Object.entries(values)) fd.set(key, value);
  return fd;
}
function upload(id, extra = {}) { return form({ requestId: String(id), kind: "brief", file: new File([pdf], "mon-cv.pdf", { type: "application/pdf" }), ...extra }); }
class CustomerUnauthorizedError extends Error {}
class UnauthorizedError extends Error {}

// Real PostgreSQL engine, entirely in memory; never reads DATABASE_URL.
test("private customer workspace PostgreSQL integration", async (t) => {
  const pg = new PGlite();
  await pg.waitReady;
  t.after(async () => { await pg.close(); });
  const migration = readFileSync(resolve(__dirname, "../migrations/20261018_workspace.sql"), "utf8");
  const schema = loadTypeScript("src/db/schema.ts");
  const customerSchema = loadTypeScript("src/db/customer-schema.ts", { "./schema": schema });
  const workspaceSchema = loadTypeScript("src/db/workspace-schema.ts", { "./schema": schema, "./customer-schema": customerSchema });
  const qualification = loadTypeScript("src/lib/qualification.ts");
  const workspace = loadTypeScript("src/lib/workspace.ts", { "@/lib/qualification": qualification });
  const db = drizzle(pg, { schema: { ...schema, ...customerSchema, ...workspaceSchema } });
  const customers = [
    { id: 1, email: "awa@example.test", name: "Awa" },
    { id: 2, email: "koffi@example.test", name: "Koffi" },
  ];
  let activeCustomer = customers[0];
  let staffEnabled = false;
  let accesses = 0;
  const common = {
    "server-only": {}, "@/db": { getDb() { accesses++; return db; } },
    "@/db/schema": schema, "@/db/customer-schema": customerSchema, "@/db/workspace-schema": workspaceSchema,
    "@/lib/workspace": workspace,
    "@/lib/customer-auth": { CustomerUnauthorizedError, requireCustomer: async () => {
      if (!activeCustomer) throw new CustomerUnauthorizedError(); return activeCustomer;
    } },
    "@/lib/staff-auth": { UnauthorizedError, requireStaff: async () => {
      if (!staffEnabled) throw new UnauthorizedError(); return { id: 17, name: "Conseiller", email: "staff@example.test", role: "advisor" };
    } },
  };
  const files = loadTypeScript("src/lib/workspace-files.ts", common);
  const invalidations = [];
  const actions = loadTypeScript("src/lib/workspace-actions.ts", { ...common,
    "@/lib/workspace-files": files,
    "@/lib/workspace-mail": { scheduleWorkspaceNotifications() {} },
    "next/cache": { revalidatePath: (path) => invalidations.push(path) },
    "next/navigation": { redirect: (path) => { throw new Error(`Redirect:${path}`); } },
  });
  const queries = loadTypeScript("src/lib/workspace-queries.ts", common);
  const customerRoute = loadTypeScript("src/app/api/espace/fichiers/[id]/route.ts", { ...common, "@/lib/workspace-files": files });
  const staffRoute = loadTypeScript("src/app/admin/fichiers/[id]/route.ts", { ...common, "@/lib/workspace-files": files });
  let requestId;
  let briefFileId;
  let deliveryFileId;
  const detail = () => queries.getTeamRequest(requestId);
  const teamUpdate = async (extra) => {
    const current = await detail();
    return actions.updateServiceRequest(initial, form({ requestId: String(requestId), version: String(current.version), status: current.status,
      quoteAmountXOF: current.quotedAmount === null ? "" : String(current.quotedAmount), dueAt: current.dueAt ?? "", ...extra }));
  };

  await t.test("additive migration requires existing schemas and remains repeatable", async () => {
    await assert.rejects(pg.exec(migration), /customer_users/);
    await pg.exec(CORE_LEADS_SQL);
    await pg.exec(readFileSync(resolve(__dirname, "../migrations/20261018_staff.sql"), "utf8"));
    await pg.exec(readFileSync(resolve(__dirname, "../migrations/20261018_customer.sql"), "utf8"));
    await pg.exec(migration);
    await pg.exec(migration);
    await pg.exec("INSERT INTO customer_users(id,email,name,password_hash,consent_privacy,consent_version) VALUES (1,'awa@example.test','Awa','test-only',true,'test'),(2,'koffi@example.test','Koffi','test-only',true,'test')");
    assert.equal((await pg.query("SELECT count(*)::integer AS total FROM customer_users")).rows[0].total, 2);
  });

  await t.test("every entry point requires authentication before database reads", async () => {
    activeCustomer = null;
    const before = accesses;
    await assert.rejects(queries.getCustomerWorkspace(), CustomerUnauthorizedError);
    await assert.rejects(queries.getCustomerRequest(1), CustomerUnauthorizedError);
    await assert.rejects(queries.getCustomerFiles(), CustomerUnauthorizedError);
    await assert.rejects(files.getWorkspaceFile(1), CustomerUnauthorizedError);
    await assert.rejects(queries.getTeamRequests(), UnauthorizedError);
    await assert.rejects(queries.getTeamRequest(1), UnauthorizedError);
    await assert.rejects(actions.createServiceRequest(initial, form()), /Redirect:\/compte\/connexion/);
    await assert.rejects(actions.uploadRequestFile(initial, upload(1, { context: "team" })), /Redirect:\/admin\/connexion/);
    const response = await customerRoute.GET(new Request("https://example.test/api/espace/fichiers/1"), { params: Promise.resolve({ id: "1" }) });
    assert.equal(response.status, 401);
    assert.equal(accesses, before);
    activeCustomer = customers[0];
  });

  await t.test("request creation derives ownership from the session and commits its timeline atomically", async () => {
    const result = await actions.createServiceRequest(initial, form({ title: "Améliorer mon CV", service: "improve_cv", brief: "Je souhaite valoriser mon expérience professionnelle.", customerId: "2", status: "completed", quoteAmountXOF: "0" }));
    assert.equal(result.ok, true, result.message);
    requestId = result.requestId;
    assert.ok(Number.isSafeInteger(requestId));
    const persisted = (await pg.query("SELECT customer_id,status,quoted_amount FROM service_requests WHERE id=$1", [requestId])).rows[0];
    assert.deepEqual(persisted, { customer_id: 1, status: "received", quoted_amount: null });
    const own = await queries.getCustomerRequest(requestId);
    assert.equal(own.events.length, 1);
    assert.equal(own.customerEmail, customers[0].email);
    assert.equal((await queries.getCustomerWorkspace()).stats.total, 1);
    assert.ok(invalidations.includes(`/espace/demandes/${requestId}`));
    await pg.exec("ALTER TABLE request_events ADD CONSTRAINT test_block_event CHECK (actor_name <> 'Rollback')");
    activeCustomer = { ...customers[0], name: "Rollback" };
    try {
      assert.equal((await actions.createServiceRequest(initial, form({ title: "Rollback request", service: "first_cv", brief: "This transaction must roll back." }))).ok, false);
      assert.equal((await pg.query("SELECT id FROM service_requests WHERE title='Rollback request'")).rows.length, 0);
    } finally { activeCustomer = customers[0]; await pg.exec("ALTER TABLE request_events DROP CONSTRAINT test_block_event"); }
  });

  await t.test("another customer cannot read, mutate, message or upload to the first customer's request", async () => {
    activeCustomer = customers[1];
    assert.equal(await queries.getCustomerRequest(requestId), null);
    assert.equal((await queries.getCustomerWorkspace()).requests.length, 0);
    assert.equal((await actions.addRequestMessage(initial, form({ requestId: String(requestId), body: "Unauthorized" }))).ok, false);
    assert.equal((await actions.uploadRequestFile(initial, upload(requestId))).ok, false);
    assert.equal((await actions.customerRequestAction(initial, form({ requestId: String(requestId), version: "0", action: "complete" }))).ok, false);
    assert.equal((await pg.query("SELECT id FROM request_messages")).rows.length, 0);
    assert.equal((await pg.query("SELECT id FROM request_files")).rows.length, 0);
    activeCustomer = customers[0];
  });

  await t.test("file validation checks content, cleans names and private downloads never disclose another account", async () => {
    assert.equal(files.safeWorkspaceFilename("../../mon-cv.pdf"), "mon-cv.pdf");
    assert.equal((await files.validateWorkspaceFile(new File([documents.docx], "cv.docx"))).mimeType, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    assert.equal((await files.validateWorkspaceFile(new File([documents.png], "photo.png"))).mimeType, "image/png");
    await assert.rejects(files.validateWorkspaceFile(new File([documents.macroDocx], "renamed.docx")), /contenu/);
    await assert.rejects(files.validateWorkspaceFile(new File(["<script>bad</script>"], "cv.pdf", { type: "application/pdf" })), /contenu/);
    await assert.rejects(files.validateWorkspaceFile(new File([pdf], "cv.exe")), /contenu/);
    await assert.rejects(files.validateWorkspaceFile(new File([Buffer.alloc(workspace.WORKSPACE_MAX_FILE_BYTES + 1)], "large.pdf")), /maximum/);
    await assert.rejects(files.validateWorkspaceFile(new File([Buffer.from("PK\x03\x04broken")], "bad.docx")), /contenu/);
    const result = await actions.uploadRequestFile(initial, upload(requestId, { file: new File([pdf], "../../mon-cv.pdf") }));
    assert.equal(result.ok, true, result.message);
    briefFileId = (await queries.getCustomerFiles())[0].id;
    const own = await files.getWorkspaceFile(briefFileId);
    assert.equal(own.filename, "mon-cv.pdf");
    assert.deepEqual(own.content, pdf);
    const response = await customerRoute.GET(new Request(`https://example.test/api/espace/fichiers/${briefFileId}?context=team`), { params: Promise.resolve({ id: String(briefFileId) }) });
    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-disposition"), /^attachment;/);
    assert.match(response.headers.get("cache-control"), /private, no-store/);
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), pdf);
    activeCustomer = customers[1];
    assert.equal(await files.getWorkspaceFile(briefFileId), null);
    assert.deepEqual(await queries.getCustomerFiles(), []);
    assert.equal((await customerRoute.GET(new Request(`https://example.test/api/espace/fichiers/${briefFileId}?context=team`), { params: Promise.resolve({ id: String(briefFileId) }) })).status, 404);
    activeCustomer = customers[0];
  });

  await t.test("a quote is explicit, acceptance belongs to the customer and stale edits cannot overwrite it", async () => {
    staffEnabled = true;
    assert.equal((await teamUpdate({ status: "quoted", quoteAmountXOF: "7000" })).ok, false);
    assert.equal((await teamUpdate({ status: "reviewing" })).ok, true);
    assert.equal((await teamUpdate({ status: "quoted" })).ok, false);
    assert.equal((await teamUpdate({ status: "quoted", quoteAmountXOF: "0", note: "Cette prestation vous est offerte." })).ok, true);
    assert.equal((await teamUpdate({ status: "in_progress", quoteAmountXOF: "0" })).ok, false);
    const current = await detail();
    const concurrent = await Promise.all([
      actions.updateServiceRequest(initial, form({ requestId: String(requestId), version: String(current.version), status: "quoted", quoteAmountXOF: "0", dueAt: "", note: "Échéance à confirmer" })),
      actions.customerRequestAction(initial, form({ requestId: String(requestId), version: String(current.version), action: "accept_quote" })),
    ]);
    assert.equal(concurrent.filter((result) => result.ok).length, 1);
    if ((await detail()).status === "quoted") {
      const latest = await detail();
      assert.equal((await actions.customerRequestAction(initial, form({ requestId: String(requestId), version: String(latest.version), action: "accept_quote" }))).ok, true);
    }
    assert.equal((await detail()).status, "in_progress");
    assert.equal((await teamUpdate({ quoteAmountXOF: "7000" })).ok, false);
    assert.equal((await teamUpdate({ status: "delivered" })).ok, false);
  });

  await t.test("delivery files stay hidden until delivery, revisions require a new file and the client closes the request", async () => {
    assert.equal((await actions.uploadRequestFile(initial, upload(requestId, { kind: "delivery" }))).ok, false);
    assert.equal((await actions.uploadRequestFile(initial, upload(requestId, { context: "team", kind: "delivery", file: new File([pdf], "cv-final.pdf") }))).ok, true);
    deliveryFileId = (await detail()).files.find((file) => file.kind === "delivery").id;
    assert.equal((await queries.getCustomerRequest(requestId)).files.some((file) => file.id === deliveryFileId), false);
    assert.equal(await files.getWorkspaceFile(deliveryFileId), null);
    assert.ok(await files.getWorkspaceFile(deliveryFileId, "team"));
    assert.equal((await staffRoute.GET(new Request(`https://example.test/admin/fichiers/${deliveryFileId}`), { params: Promise.resolve({ id: String(deliveryFileId) }) })).status, 200);
    assert.equal((await teamUpdate({ status: "delivered" })).ok, true);
    assert.ok(await files.getWorkspaceFile(deliveryFileId));
    let current = await detail();
    assert.equal((await actions.customerRequestAction(initial, form({ requestId: String(requestId), version: String(current.version), action: "request_revision" }))).ok, false);
    assert.equal((await actions.customerRequestAction(initial, form({ requestId: String(requestId), version: String(current.version), action: "request_revision", note: "Merci de corriger mon expérience récente." }))).ok, true);
    assert.equal((await teamUpdate({ status: "delivered" })).ok, false);
    assert.equal((await actions.uploadRequestFile(initial, upload(requestId, { context: "team", kind: "delivery", file: new File([pdf], "cv-revise.pdf") }))).ok, true);
    assert.equal((await teamUpdate({ status: "delivered" })).ok, true);
    current = await detail();
    assert.equal((await actions.customerRequestAction(initial, form({ requestId: String(requestId), version: String(current.version), action: "complete" }))).ok, true);
    assert.equal((await detail()).status, "completed");
    assert.equal((await actions.uploadRequestFile(initial, upload(requestId))).ok, false);
    assert.equal((await teamUpdate({ status: "in_progress" })).ok, false);
  });

  await t.test("a failed public event rolls back workflow status and its message", async () => {
    const created = await actions.createServiceRequest(initial, form({ title: "Transaction workflow", service: "cover_letter", brief: "Une lettre pour répondre à une offre." }));
    const id = created.requestId;
    await pg.exec("ALTER TABLE request_events ADD CONSTRAINT test_reject_review CHECK (type <> 'reviewing') NOT VALID");
    try {
      assert.equal((await actions.updateServiceRequest(initial, form({ requestId: String(id), version: "0", status: "reviewing", note: "Should roll back", quoteAmountXOF: "", dueAt: "" }))).ok, false);
      const current = await queries.getTeamRequest(id);
      assert.equal(current.status, "received");
      assert.equal(current.version, 0);
      assert.equal(current.messages.length, 0);
    } finally { await pg.exec("ALTER TABLE request_events DROP CONSTRAINT test_reject_review"); }
  });

  await t.test("concurrent file uploads never exceed the per-request maximum", async () => {
    const created = await actions.createServiceRequest(initial, form({ title: "Documents limités", service: "first_cv", brief: "Une demande pour vérifier les pièces jointes." }));
    const results = await Promise.all(Array.from({ length: 14 }, () => actions.uploadRequestFile(initial, upload(created.requestId))));
    assert.equal(results.filter((result) => result.ok).length, 12);
    assert.equal((await queries.getCustomerRequest(created.requestId)).files.length, 12);
  });

  await t.test("customer quotas apply atomically across requests, reset when expired and exempt staff", async () => {
    const created = await actions.createServiceRequest(initial, form({ title: "Plafonds du compte", service: "first_cv", brief: "Vérification des limites de stockage et d’échange." }));
    assert.equal(created.ok, true, created.message);
    const id = created.requestId;
    const key = (scope) => createHash("sha256").update(`workspace:${scope}:${customers[0].id}`).digest("hex");
    async function nearLimit(scope, count) {
      await pg.query("INSERT INTO staff_login_attempts(key,attempts,reset_at) VALUES($1,$2,now()+interval '1 day') ON CONFLICT(key) DO UPDATE SET attempts=excluded.attempts,reset_at=excluded.reset_at", [key(scope), count]);
    }
    await nearLimit("requests", 19);
    const before = (await pg.query("SELECT count(*)::integer AS total FROM service_requests")).rows[0].total;
    const createResults = await Promise.all(Array.from({ length: 2 }, (_, n) => actions.createServiceRequest(initial, form({ title: `Dernière demande ${n}`, service: "first_cv", brief: "Demande pour vérifier la limite atomique." }))));
    assert.equal(createResults.filter((result) => result.ok).length, 1);
    assert.match(createResults.find((result) => !result.ok).message, /20 nouvelles demandes/);
    assert.equal((await pg.query("SELECT count(*)::integer AS total FROM service_requests")).rows[0].total, before + 1);
    await nearLimit("messages", 59);
    assert.equal((await actions.addRequestMessage(initial, form({ requestId: String(id), body: "Dernier message autorisé" }))).ok, true);
    assert.equal((await actions.addRequestMessage(initial, form({ requestId: String(id), body: "Message au-delà du plafond" }))).ok, false);
    assert.equal((await actions.addRequestMessage(initial, form({ requestId: String(id), body: "Réponse de l’équipe", context: "team" }))).ok, true);
    await nearLimit("uploads", 23);
    const uploadResults = await Promise.all([actions.uploadRequestFile(initial, upload(id)), actions.uploadRequestFile(initial, upload(id))]);
    assert.equal(uploadResults.filter((result) => result.ok).length, 1);
    assert.match(uploadResults.find((result) => !result.ok).message, /24 fichiers/);
    assert.equal((await actions.uploadRequestFile(initial, upload(id, { context: "team" }))).ok, true);
    assert.equal((await queries.getTeamRequest(id)).files.length, 2);
    await pg.query("UPDATE staff_login_attempts SET reset_at=now()-interval '1 second' WHERE key=$1", [key("messages")]);
    assert.equal((await actions.addRequestMessage(initial, form({ requestId: String(id), body: "Nouvelle fenêtre" }))).ok, true);
    assert.equal((await pg.query("SELECT attempts FROM staff_login_attempts WHERE key=$1", [key("messages")])).rows[0].attempts, 1);
  });

  await t.test("team pagination, filters and global sort remain parameterized", async () => {
    await pg.exec("INSERT INTO service_requests(customer_id,title,service,brief,created_at,updated_at) SELECT 2,'Pagination ' || n,'first_cv','Description de test uniquement.',now()+n*interval '1 second',now()+n*interval '1 second' FROM generate_series(1,55) n");
    const first = await queries.getTeamRequests({ q: "Pagination", page: 1 });
    const second = await queries.getTeamRequests({ q: "Pagination", page: 2 });
    assert.equal(first.total, 55);
    assert.equal(first.requests.length, 50);
    assert.equal(second.requests.length, 5);
    assert.equal(new Set([...first.requests, ...second.requests].map((request) => request.id)).size, 55);
    assert.equal(first.requests[0].title, "Pagination 55");
    assert.equal((await queries.getTeamRequests({ q: "Pagination", sort: "oldest" })).requests[0].title, "Pagination 1");
    assert.equal((await queries.getTeamRequests({ q: "Pagination", status: "completed" })).total, 0);
    assert.equal((await queries.getTeamRequests({ q: "' OR true --" })).total, 0);
    assert.equal((await queries.getTeamRequests({ q: "%" })).total, 0);
    assert.equal((await queries.getCustomerWorkspace()).requests.some((request) => request.title.startsWith("Pagination")), false);
  });
});
