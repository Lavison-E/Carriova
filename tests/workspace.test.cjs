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
  const qualification = loadTypeScript("src/lib/qualification.ts", { "@/lib/countries": loadTypeScript("src/lib/countries.ts") });
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
  const notifications = [];
  const actions = loadTypeScript("src/lib/workspace-actions.ts", { ...common,
    "@/lib/workspace-files": files,
    "@/lib/workspace-mail": { scheduleWorkspaceNotifications: (scope) => notifications.push(scope) },
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
  const uploadDelivery = async (id, extra = {}) => {
    const current = await queries.getTeamRequest(id);
    return actions.uploadRequestFile(initial, upload(id, { context: "team", kind: "delivery", version: String(current.version), ...extra }));
  };
  const teamUpdate = async (extra) => {
    const current = await detail();
    return actions.updateServiceRequest(initial, form({ requestId: String(requestId), version: String(current.version), status: current.status,
      quoteAmountXOF: current.quotedAmount === null ? "" : String(current.quotedAmount), dueAt: current.dueAt ?? "", ...extra }));
  };

  async function approveWorkingVersion(id) {
    let current = await queries.getTeamRequest(id);
    assert.equal((await actions.uploadRequestFile(initial, upload(id, { context: "team", kind: "review", version: String(current.version), file: new File([pdf], "version-travail.pdf") }))).ok, true);
    current = await queries.getTeamRequest(id);
    assert.equal((await actions.publishRequestReview(initial, form({ requestId: String(id), version: String(current.version) }))).ok, true);
    current = await queries.getTeamRequest(id);
    assert.equal((await actions.customerRequestAction(initial, form({ requestId: String(id), version: String(current.version), action: "approve_review" }))).ok, true);
  }

  await t.test("additive migration requires existing schemas and remains repeatable", async () => {
    await assert.rejects(pg.exec(migration), /customer_users/);
    await pg.exec(CORE_LEADS_SQL);
    await pg.exec(readFileSync(resolve(__dirname, "../migrations/20261018_staff.sql"), "utf8"));
    await pg.exec(readFileSync(resolve(__dirname, "../migrations/20261018_customer.sql"), "utf8"));
    await pg.exec(readFileSync(resolve(__dirname, "../migrations/20261022_career_profile.sql"), "utf8"));
    await pg.exec(migration);
    await pg.exec(migration);
    await pg.exec(readFileSync(resolve(__dirname, "../migrations/20261018_notifications.sql"), "utf8"));
    await pg.exec(readFileSync(resolve(__dirname, "../migrations/20261022_workflow.sql"), "utf8"));
    await pg.exec(readFileSync(resolve(__dirname, "../migrations/20261022_workflow.sql"), "utf8"));
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
    await assert.rejects(actions.publishRequestDelivery(initial, form({ requestId: "1", version: "0", context: "customer" })), /Redirect:\/admin\/connexion/);
    await assert.rejects(actions.removeDraftDelivery(initial, form({ requestId: "1", fileId: "1", version: "0", context: "customer" })), /Redirect:\/admin\/connexion/);
    assert.equal(accesses, before, "a logged-in customer still cannot access the publication action");
  });

  await t.test("request creation derives ownership from the session and commits its timeline atomically", async () => {
    const result = await actions.createServiceRequest(initial, form({ title: "Améliorer mon CV", service: "improve_cv", brief: "Je souhaite valoriser mon expérience professionnelle.", customerId: "2", status: "completed", quoteAmountXOF: "0" }));
    assert.equal(result.ok, true, result.message);
    requestId = result.requestId;
    assert.ok(Number.isSafeInteger(requestId));
    const persisted = (await pg.query("SELECT customer_id,status,quoted_amount FROM service_requests WHERE id=$1", [requestId])).rows[0];
    assert.deepEqual(persisted, { customer_id: 1, status: "received", quoted_amount: null });
    staffEnabled = true;
    assert.equal((await queries.getTeamRequest(requestId)).customerWhatsApp, null);
    await pg.query("UPDATE customer_users SET whatsapp='+2250700000000' WHERE id=1");
    assert.equal((await queries.getTeamRequest(requestId)).customerWhatsApp, "+2250700000000");
    staffEnabled = false;
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
    assert.equal((await teamUpdate({ status: "in_progress", quoteAmountXOF: "7000" })).ok, false);
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
    const unpublished = await detail();
    const noFile = await actions.publishRequestDelivery(initial, form({ requestId: String(requestId), version: String(unpublished.version) }));
    assert.equal(noFile.ok, false);
    assert.match(noFile.message, /valider la réalisation/);
    assert.equal((await detail()).version, unpublished.version);
  });

  await t.test("delivery files stay hidden until delivery, revisions require a new file and the client closes the request", async () => {
    await approveWorkingVersion(requestId);
    assert.equal((await actions.uploadRequestFile(initial, upload(requestId, { kind: "delivery" }))).ok, false);
    const beforeUpload = await detail();
    assert.equal((await uploadDelivery(requestId, { file: new File([pdf], "cv-final.pdf") })).ok, true);
    assert.equal((await detail()).version, beforeUpload.version + 1);
    const staleUpload = await uploadDelivery(requestId, { version: String(beforeUpload.version) });
    assert.equal(staleUpload.ok, false); assert.match(staleUpload.message, /modifiée/);
    assert.equal((await detail()).files.filter((file) => file.kind === "delivery").length, 1);
    const unseenUpload = await actions.publishRequestDelivery(initial, form({ requestId: String(requestId), version: String(beforeUpload.version) }));
    assert.equal(unseenUpload.ok, false); assert.match(unseenUpload.message, /modifiée/);
    deliveryFileId = (await detail()).files.find((file) => file.kind === "delivery").id;
    assert.equal((await queries.getCustomerRequest(requestId)).files.some((file) => file.id === deliveryFileId), false);
    assert.equal(await files.getWorkspaceFile(deliveryFileId), null);
    assert.ok(await files.getWorkspaceFile(deliveryFileId, "team"));
    assert.equal((await staffRoute.GET(new Request(`https://example.test/admin/fichiers/${deliveryFileId}`), { params: Promise.resolve({ id: String(deliveryFileId) }) })).status, 200);
    const dueAt = "2026-12-31T12:00:00.000Z";
    assert.equal((await teamUpdate({ dueAt })).ok, true);
    const prepared = await detail();
    const publishData = { requestId: String(requestId), version: String(prepared.version), note: "Voici les documents préparés pour vous.", quoteAmountXOF: "999999", dueAt: "forged" };
    const tooLong = await actions.publishRequestDelivery(initial, form({ ...publishData, note: "x".repeat(5001) }));
    assert.equal(tooLong.ok, false); assert.ok(tooLong.fieldErrors.note);
    const publishResults = await Promise.all([
      actions.publishRequestDelivery(initial, form(publishData)),
      actions.publishRequestDelivery(initial, form(publishData)),
    ]);
    assert.equal(publishResults.filter((result) => result.ok).length, 1);
    assert.ok(await files.getWorkspaceFile(deliveryFileId));
    let current = await detail();
    assert.equal(current.status, "delivered");
    assert.equal(current.version, prepared.version + 1);
    assert.equal(current.quotedAmount, prepared.quotedAmount);
    assert.equal(current.dueAt, dueAt);
    assert.equal(current.events.filter((event) => event.type === "delivered").length, 1);
    assert.equal(current.messages.filter((message) => message.body === publishData.note).length, 1);
    assert.ok(notifications.some((scope) => scope.requestId === requestId));
    assert.equal((await actions.publishRequestDelivery(initial, form({ requestId: String(requestId), version: String(current.version) }))).ok, false);
    assert.equal((await actions.customerRequestAction(initial, form({ requestId: String(requestId), version: String(current.version), action: "request_revision" }))).ok, false);
    assert.equal((await actions.customerRequestAction(initial, form({ requestId: String(requestId), version: String(current.version), action: "request_revision", note: "Merci de corriger mon expérience récente." }))).ok, true);
    assert.equal((await teamUpdate({ status: "delivered" })).ok, false);
    const revision = await detail();
    const revisionData = { requestId: String(requestId), version: String(revision.version) };
    const publishedRemoval = await actions.removeDraftDelivery(initial, form({ ...revisionData, fileId: String(deliveryFileId) }));
    assert.equal(publishedRemoval.ok, false);
    assert.match(publishedRemoval.message, /déjà été publié/);
    assert.ok(await files.getWorkspaceFile(deliveryFileId));
    assert.equal((await detail()).version, revision.version);
    assert.equal((await actions.publishRequestDelivery(initial, form(revisionData))).ok, false);
    assert.equal((await uploadDelivery(requestId, { file: new File([pdf], "cv-revise.pdf") })).ok, true);
    assert.equal((await actions.publishRequestDelivery(initial, form({ ...revisionData, version: String(prepared.version) }))).ok, false);
    assert.equal((await teamUpdate({ status: "in_progress" })).ok, true);
    await approveWorkingVersion(requestId);
    // The general team update uses the same validation as the dedicated publication action.
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

  await t.test("failed delivery notes roll back publication, event and notification scheduling", async () => {
    const created = await actions.createServiceRequest(initial, form({ title: "Livraison atomique", service: "first_cv", brief: "Une demande pour vérifier la publication." }));
    const id = created.requestId;
    await pg.query("UPDATE service_requests SET status='finalized',quoted_amount=7000 WHERE id=$1", [id]);
    assert.equal((await uploadDelivery(id)).ok, true);
    await pg.exec("ALTER TABLE request_messages ADD CONSTRAINT test_reject_delivery_note CHECK (body <> 'Rollback delivery') NOT VALID");
    const before = notifications.length;
    const prepared = await queries.getTeamRequest(id);
    try {
      const result = await actions.publishRequestDelivery(initial, form({ requestId: String(id), version: String(prepared.version), note: "Rollback delivery" }));
      assert.equal(result.ok, false);
      const current = await queries.getTeamRequest(id);
      assert.equal(current.status, "finalized");
      assert.equal(current.version, prepared.version);
      assert.equal(current.events.filter((event) => event.type === "delivered").length, 0);
      assert.equal(current.messages.length, 0);
      assert.equal(notifications.length, before);
    } finally { await pg.exec("ALTER TABLE request_messages DROP CONSTRAINT test_reject_delivery_note"); }
  });

  await t.test("removing a draft deletes only that unpublished file and invalidates stale publication versions", async () => {
    const created = await actions.createServiceRequest(initial, form({ title: "Corriger un brouillon", service: "first_cv", brief: "Une demande pour vérifier le retrait des brouillons." }));
    const id = created.requestId;
    await pg.query("UPDATE service_requests SET status='finalized',quoted_amount=7000 WHERE id=$1", [id]);
    assert.equal((await uploadDelivery(id, { file: new File([pdf], "draft-error.pdf") })).ok, true);
    assert.equal((await uploadDelivery(id, { file: new File([pdf], "draft-correct.pdf") })).ok, true);
    const prepared = await queries.getTeamRequest(id);
    const wrongFile = prepared.files.find((file) => file.filename === "draft-error.pdf");
    const fields = { requestId: String(id), fileId: String(wrongFile.id), version: String(prepared.version) };
    assert.equal((await actions.removeDraftDelivery(initial, form({ ...fields, version: String(prepared.version + 1) }))).ok, false);
    assert.equal((await actions.removeDraftDelivery(initial, form({ ...fields, fileId: String(briefFileId) }))).ok, false);
    assert.equal((await queries.getTeamRequest(id)).files.length, 2);
    const removed = await actions.removeDraftDelivery(initial, form(fields));
    assert.equal(removed.ok, true, removed.message);
    assert.equal(await files.getWorkspaceFile(wrongFile.id, "team"), null);
    const remaining = await queries.getTeamRequest(id);
    assert.equal(remaining.files.length, 1);
    assert.equal(remaining.files[0].filename, "draft-correct.pdf");
    assert.equal(remaining.version, prepared.version + 1);
    assert.equal(remaining.quotedAmount, 7000);
    assert.equal(remaining.status, "finalized");
    const stale = await actions.publishRequestDelivery(initial, form({ requestId: String(id), version: String(prepared.version) }));
    assert.equal(stale.ok, false); assert.match(stale.message, /modifiée/);
    assert.equal((await actions.publishRequestDelivery(initial, form({ requestId: String(id), version: String(remaining.version) }))).ok, true);
  });

  await t.test("concurrent quotas are separate for initial documents and delivery files", async () => {
    const created = await actions.createServiceRequest(initial, form({ title: "Documents limités", service: "first_cv", brief: "Une demande pour vérifier les pièces jointes." }));
    const results = await Promise.all(Array.from({ length: 14 }, () => actions.uploadRequestFile(initial, upload(created.requestId))));
    assert.equal(results.filter((result) => result.ok).length, 12);
    assert.equal((await queries.getCustomerRequest(created.requestId)).files.length, 12);
    await pg.query("UPDATE service_requests SET status='finalized',quoted_amount=0 WHERE id=$1", [created.requestId]);
    for (let round = 0; round < workspace.WORKSPACE_MAX_FILES; round++) {
      const current = await queries.getTeamRequest(created.requestId);
      const attempts = await Promise.all(Array.from({ length: 2 }, () => actions.uploadRequestFile(initial, upload(created.requestId, { context: "team", kind: "delivery", version: String(current.version) }))));
      assert.equal(attempts.filter((result) => result.ok).length, 1, "stale concurrent uploads cannot alter reviewed drafts");
    }
    const full = await uploadDelivery(created.requestId);
    assert.equal(full.ok, false); assert.match(full.message, /12 fichiers de ce type/);
    assert.equal((await queries.getTeamRequest(created.requestId)).files.length, 24);
    assert.equal((await queries.getCustomerRequest(created.requestId)).files.length, 12, "prepared deliveries stay private");
    const prepared = await queries.getTeamRequest(created.requestId);
    assert.equal(prepared.version, 12);
    assert.equal((await actions.publishRequestDelivery(initial, form({ requestId: String(created.requestId), version: String(prepared.version) }))).ok, true);
    assert.equal((await queries.getCustomerRequest(created.requestId)).files.length, 24);
  });

  await t.test("dedicated publication enqueues delivery and optional note through real transactional outbox triggers", async () => {
    await pg.exec(readFileSync(resolve(__dirname, "../migrations/20261018_notifications.sql"), "utf8"));
    await pg.exec(readFileSync(resolve(__dirname, "../migrations/20261022_workflow.sql"), "utf8"));
    const created = await actions.createServiceRequest(initial, form({ title: "Vérification des notifications", service: "first_cv", brief: "Cette demande vérifie les notifications après publication." }));
    const id = created.requestId;
    await pg.query("UPDATE service_requests SET status='finalized',quoted_amount=0 WHERE id=$1", [id]);
    assert.equal((await uploadDelivery(id)).ok, true);
    const prepared = await queries.getTeamRequest(id);
    const privateNote = "Note privée uniquement consultable dans le dossier authentifié.";
    assert.equal((await actions.publishRequestDelivery(initial, form({ requestId: String(id), version: String(prepared.version), note: privateNote }))).ok, true);
    const jobs = (await pg.query("SELECT kind,audience,status,event_id,message_id,payload FROM workspace_notifications WHERE request_id=$1 AND kind IN ('delivered','message') ORDER BY id", [id])).rows;
    assert.deepEqual(jobs.map(({kind,audience,status}) => ({kind,audience,status})), [
      {kind:"delivered",audience:"customer",status:"pending"},
      {kind:"message",audience:"customer",status:"pending"},
    ]);
    const delivered = await queries.getTeamRequest(id);
    assert.equal(jobs[0].event_id, delivered.events.find((event) => event.type === "delivered").id);
    assert.equal(jobs[1].message_id, delivered.messages.find((message) => message.body === privateNote).id);
    assert.equal(JSON.stringify(jobs).includes(privateNote), false);
    assert.ok(jobs.every((job) => job.payload === null));
  });

  await t.test("five-stage workflow requires price approval and a separate client review before final delivery", async () => {
    const created = await actions.createServiceRequest(initial, form({ title: "Parcours complet", service: "first_cv", brief: "Créer mon premier CV avec validation de chaque étape." }));
    assert.equal(created.ok, true, created.message); const id = created.requestId;
    const current = () => queries.getTeamRequest(id);
    const fields = async extra => ({ requestId: String(id), version: String((await current()).version), ...extra });
    const proposal = async extra => actions.sendRequestProposal(initial, form(await fields({ quoteAmountXOF: "12000", dueAt: "", note: "Proposition initiale", ...extra })));
    const decision = async (action, note = "") => actions.customerRequestAction(initial, form(await fields({ action, note })));
    const update = async status => {
      const row = await current();
      return actions.updateServiceRequest(initial, form(await fields({ status, quoteAmountXOF: String(row.quotedAmount ?? ""), dueAt: "", note: "" })));
    };
    const uploadReview = async () => actions.uploadRequestFile(initial, upload(id, await fields({ context: "team", kind: "review", file: new File([pdf], "review-private.pdf") })));
    const publishReview = async () => actions.publishRequestReview(initial, form(await fields({ note: "Vérifiez cette version de travail." })));

    staffEnabled = false;
    const before = accesses;
    for (const action of [actions.sendRequestProposal, actions.publishRequestReview, actions.removeDraftReview]) {
      await assert.rejects(action(initial, form({ requestId: String(id), version: "0", quoteAmountXOF: "12000", fileId: "1" })), /Redirect:\/admin\/connexion/);
    }
    assert.equal(accesses, before); staffEnabled = true;
    assert.equal((await update("in_progress")).ok, false);
    assert.equal((await publishReview()).ok, false);
    assert.equal((await proposal({ quoteAmountXOF: "" })).ok, false);
    assert.equal((await proposal()).ok, true, "explicit proposal can be sent directly from received");
    assert.equal((await current()).status, "quoted");
    assert.equal((await update("in_progress")).ok, false, "staff cannot accept the price for the customer");
    assert.equal((await decision("reject_quote")).ok, false, "rejection requires a useful explanation");
    assert.equal((await decision("reject_quote", "Je souhaite ajuster le périmètre et le prix.")).ok, true);
    assert.equal((await current()).status, "reviewing");
    assert.equal((await decision("accept_quote")).ok, false, "old price cannot be accepted after rejection");
    assert.equal((await proposal({ quoteAmountXOF: "10000" })).ok, true);
    assert.equal((await decision("accept_quote")).ok, true);
    assert.equal((await current()).status, "in_progress");
    assert.equal((await proposal({ quoteAmountXOF: "13000" })).ok, false, "accepted price is immutable");
    assert.equal((await update("finalized")).ok, false);
    assert.equal((await update("delivered")).ok, false);
    assert.equal((await decision("approve_review")).ok, false);
    assert.equal((await publishReview()).ok, false, "review file is required");
    assert.equal((await actions.uploadRequestFile(initial, upload(id, { kind: "review" }))).ok, false, "customer cannot impersonate review uploader");
    assert.equal((await uploadReview()).ok, true);
    const review = (await current()).files.find(file => file.kind === "review");
    assert.equal(await files.getWorkspaceFile(review.id), null);
    assert.equal((await queries.getCustomerFiles()).some(file => file.id === review.id), false);
    assert.ok(await files.getWorkspaceFile(review.id, "team"));
    await assert.rejects(db.insert(workspaceSchema.requestFiles).values({ requestId: id, filename: "forged.pdf", mimeType: "application/pdf", size: pdf.length, kind: "review", content: pdf, uploadedByType: "customer", uploadedById: 1, uploadedByName: "Customer" }), error => error.cause?.constraint === "request_files_staff_prepared_check");

    // An outbox failure must roll back the business event, status and visibility.
    await pg.exec("ALTER TABLE workspace_notifications ADD CONSTRAINT test_reject_review_notification CHECK(kind <> 'awaiting_validation') NOT VALID");
    const beforeReview = await current();
    try {
      assert.equal((await publishReview()).ok, false);
      assert.equal((await current()).status, "in_progress");
      assert.equal((await current()).version, beforeReview.version);
      assert.equal(await files.getWorkspaceFile(review.id), null);
      assert.equal((await current()).events.some(event => event.type === "awaiting_validation"), false);
    } finally { await pg.exec("ALTER TABLE workspace_notifications DROP CONSTRAINT test_reject_review_notification"); }
    const submitted = await fields({});
    const results = await Promise.all([actions.publishRequestReview(initial, form(submitted)), actions.publishRequestReview(initial, form(submitted))]);
    assert.equal(results.filter(result => result.ok).length, 1);
    assert.equal((await current()).status, "awaiting_validation");
    assert.ok(await files.getWorkspaceFile(review.id));
    assert.ok((await queries.getCustomerFiles()).some(file => file.id === review.id));
    assert.equal((await queries.getCustomerWorkspace()).stats.awaitingResponse >= 1, true);
    assert.equal((await update("finalized")).ok, false, "only the customer validates the work");
    assert.equal((await decision("complete")).ok, false, "intermediate review cannot close the request");
    activeCustomer = customers[1];
    assert.equal((await decision("approve_review")).ok, false);
    assert.equal(await files.getWorkspaceFile(review.id), null);
    activeCustomer = customers[0];
    assert.equal((await decision("request_revision", "Merci de préciser ma formation.")).ok, true);
    assert.equal((await current()).status, "revision_requested");
    assert.equal((await actions.removeDraftReview(initial, form(await fields({ fileId: String(review.id) })))).ok, false, "published review is immutable");
    assert.ok(await files.getWorkspaceFile(review.id), "published versions remain accessible during revisions");
    assert.equal((await publishReview()).ok, false, "revision must first resume work");
    assert.equal((await update("in_progress")).ok, true);
    assert.equal((await publishReview()).ok, false, "old working file cannot satisfy a new revision");
    assert.equal((await uploadReview()).ok, true);
    const draft = (await current()).files.filter(file => file.kind === "review").at(-1);
    const oldVersion = (await current()).version;
    assert.equal((await actions.removeDraftReview(initial, form(await fields({ fileId: String(draft.id), version: String(oldVersion + 1) })))).ok, false);
    assert.equal((await actions.removeDraftReview(initial, form(await fields({ fileId: String(draft.id) })))).ok, true);
    assert.equal((await current()).version, oldVersion + 1);
    assert.equal(await files.getWorkspaceFile(draft.id, "team"), null);
    assert.equal((await uploadReview()).ok, true);
    assert.equal((await publishReview()).ok, true);
    assert.equal((await decision("approve_review")).ok, true);
    assert.equal((await current()).status, "finalized");
    assert.equal((await actions.publishRequestDelivery(initial, form(await fields({})))).ok, false, "review file is not a final deliverable");
    assert.equal((await uploadDelivery(id)).ok, true);
    const finalFile = (await current()).files.find(file => file.kind === "delivery");
    assert.equal(await files.getWorkspaceFile(finalFile.id), null, "review publication never exposes final drafts");
    assert.equal((await actions.publishRequestDelivery(initial, form(await fields({})))).ok, true);
    assert.equal((await current()).status, "delivered");
    assert.ok(await files.getWorkspaceFile(finalFile.id));
    assert.equal((await decision("complete")).ok, true);
    const completed = await current();
    assert.equal(completed.status, "completed"); assert.equal(completed.quotedAmount, 10000);
    const jobs = (await pg.query("SELECT kind,audience,payload FROM workspace_notifications WHERE request_id=$1 AND kind IN ('quoted','quote_rejected','awaiting_validation','finalized','delivered') ORDER BY id", [id])).rows;
    assert.deepEqual(jobs.map(row => [row.kind, row.audience]), [["quoted", "customer"], ["quote_rejected", "team"], ["quoted", "customer"], ["awaiting_validation", "customer"], ["awaiting_validation", "customer"], ["finalized", "team"], ["delivered", "customer"]]);
    assert.ok(jobs.every(row => row.payload === null));
    await pg.exec(readFileSync(resolve(__dirname, "../migrations/20261022_workflow.sql"), "utf8"));
    assert.equal((await current()).status, "completed", "reapplying migration preserves historical terminal states");
    assert.ok(await files.getWorkspaceFile(finalFile.id));
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
