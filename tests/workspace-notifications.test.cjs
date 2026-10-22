const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const test = require("node:test");
const { PGlite } = require("@electric-sql/pglite");
const { drizzle } = require("drizzle-orm/pglite");
const { CORE_LEADS_SQL, loadTypeScript: load } = require("./helpers/crm-fixture.cjs");
class UnauthorizedError extends Error {}
class CustomerUnauthorizedError extends Error {}

// All provider calls are mocked. No credentials or real customer addresses are used.
test("transactional workspace email outbox", async (t) => {
  const pg = new PGlite(); await pg.waitReady; t.after(() => pg.close());
  await pg.exec(CORE_LEADS_SQL);
  for (const name of ["20261018_staff.sql", "20261018_customer.sql", "20261018_workspace.sql"]) await pg.exec(readFileSync(resolve(__dirname, "../migrations", name), "utf8"));
  await pg.exec("INSERT INTO customer_users(id,email,name,password_hash,consent_privacy,consent_version) VALUES(1,'old@example.test','Old private name','hash',true,'test')");
  const migration = readFileSync(resolve(__dirname, "../migrations/20261018_notifications.sql"), "utf8");
  const core = load("src/db/schema.ts");
  const customers = load("src/db/customer-schema.ts", { "./schema": core });
  const workspaceSchema = load("src/db/workspace-schema.ts", { "./schema": core, "./customer-schema": customers });
  const notificationSchema = load("src/db/notification-schema.ts", { "./customer-schema": customers, "./workspace-schema": workspaceSchema });
  const qualification = load("src/lib/qualification.ts", { "@/lib/countries": load("src/lib/countries.ts") });
  const workspace = load("src/lib/workspace.ts", { "@/lib/qualification": qualification });
  const db = drizzle(pg);
  let reads = 0;
  let staffEnabled = true;
  const scheduled = [];
  const env = { NEXT_PUBLIC_SITE_URL: "https://carriova.example.test", CONTACT_EMAIL: "team@example.test", SUPPORT_EMAIL: "support@example.test",
    email: { transactionalEnabled: true, transactionalFrom: "Carriova <noreply@example.test>", enabled: true, from: "legacy@example.test", baseUrl: "https://resend.example.test", apiKey: "test-only-key", notify: [] } };
  const renderer = await import("../src/lib/transactional-email.mjs");
  const common = { "@/lib/transactional-email.mjs": renderer, "server-only": {}, "@/db": { getDb() { reads++; return db; } }, "@/db/customer-schema": customers,
    "@/db/workspace-schema": workspaceSchema, "@/db/notification-schema": notificationSchema, "@/lib/env": { serverEnv: env },
    "next/server": { after: (callback) => scheduled.push(callback) },
    "@/lib/staff-auth": { UnauthorizedError, requireStaff: async () => { if (!staffEnabled) throw new UnauthorizedError(); return { id: 3, name: "Staff", role: "advisor" }; } },
  };
  const mail = load("src/lib/workspace-mail.ts", common);
  const retry = load("src/lib/workspace-notification-actions.ts", { ...common, "@/lib/workspace-mail": mail,
    "next/cache": { revalidatePath() {} }, "next/navigation": { redirect: (path) => { throw new Error(`Redirect:${path}`); } },
  });
  const outgoing = [];
  let mode = "ok";
  t.mock.method(globalThis, "fetch", async (url, init) => {
    outgoing.push({ url, payload: JSON.parse(init.body), key: init.headers["Idempotency-Key"], signal: init.signal });
    if (mode === "network") throw new Error("Private network diagnostic must never be persisted");
    if (mode === "reject") return new Response("Private provider diagnostic", { status: 503 });
    if (mode === "missing-id") return new Response("{}", { status: 200 });
    return Response.json({ id: `provider-${outgoing.length}` });
  });
  let requestId;
  async function event(type, body = "Private brief must stay in the workspace") {
    return (await pg.query("INSERT INTO request_events(request_id,type,actor_name,body,status) VALUES($1,$2,'Private actor',$3,$4) RETURNING id", [requestId, type, body, type === "created" ? "received" : type])).rows[0].id;
  }

  await t.test("migration is repeatable and welcomes only future accounts", async () => {
    await pg.exec(migration); await pg.exec(migration);
    await pg.exec(readFileSync(resolve(__dirname, "../migrations/20261022_workflow.sql"), "utf8"));
    assert.equal((await pg.query("SELECT count(*)::integer AS n FROM workspace_notifications")).rows[0].n, 0);
    await pg.exec("INSERT INTO customer_users(id,email,name,password_hash,consent_privacy,consent_version) VALUES(2,'new@example.test','New private name','hash',true,'test')");
    const rows = (await pg.query("SELECT kind,audience,customer_id FROM workspace_notifications")).rows;
    assert.deepEqual(rows, [{ kind: "welcome", audience: "customer", customer_id: 2 }]);
  });
  await t.test("business events and messages enqueue minimal jobs in the same transaction", async () => {
    requestId = (await pg.query("INSERT INTO service_requests(customer_id,title,service,brief) VALUES(1,'Private request title','first_cv','Private request content') RETURNING id")).rows[0].id;
    await event("created"); await event("quoted"); await event("delivered"); await event("revision_requested");
    await pg.query("INSERT INTO request_messages(request_id,author_type,author_id,author_name,body) VALUES($1,'customer',1,'Private name','Private message content'),($1,'staff',3,'Private name','Private staff response')", [requestId]);
    await event("file_added", "Private file name.pdf");
    assert.equal((await pg.query("SELECT count(*)::integer AS n FROM workspace_notifications")).rows[0].n, 8);
    assert.equal((await pg.query("SELECT count(*)::integer AS n FROM workspace_notifications WHERE payload IS NOT NULL")).rows[0].n, 0);
    const before = (await pg.query("SELECT count(*)::integer AS n FROM workspace_notifications")).rows[0].n;
    await pg.exec("BEGIN"); await event("completed"); await pg.exec("ROLLBACK");
    assert.equal((await pg.query("SELECT count(*)::integer AS n FROM workspace_notifications")).rows[0].n, before);
    assert.equal(outgoing.length, 0);
  });
  await t.test("accepted provider responses persist IDs, use authenticated links and omit private content", async () => {
    assert.equal((await mail.drainWorkspaceNotifications()).sent, 6);
    assert.equal((await mail.drainWorkspaceNotifications()).sent, 2);
    const countBefore = outgoing.length;
    assert.equal((await mail.drainWorkspaceNotifications()).attempted, 0);
    assert.equal(outgoing.length, countBefore);
    assert.equal(new Set(outgoing.map((item) => item.key)).size, 8);
    for (const call of outgoing) {
      assert.equal(call.url, "https://resend.example.test/emails");
      assert.equal(call.payload.from, env.email.transactionalFrom);
      assert.equal(call.payload.reply_to, env.SUPPORT_EMAIL);
      assert.match(call.payload.html, /<html/);
      assert.equal(call.payload.html.includes("<img"), false);
      assert.match(call.payload.text, /https:\/\/carriova\.example\.test\/(?:admin\/commandes|espace)/);
      assert.equal(JSON.stringify(call.payload).includes("Private"), false);
      assert.equal("attachments" in call.payload, false);
      assert.ok(call.signal instanceof AbortSignal);
      assert.match(call.key, /^workspace:(?:customer|event|message):/);
    }
    const dashboard = await mail.getWorkspaceNotificationDashboard();
    assert.equal(dashboard.counts.sent, 8);
    assert.ok(dashboard.recent.every((item) => item.providerId));
    assert.equal(dashboard.recent.some((item) => "payload" in item), false);
  });
  await t.test("provider failure stays pending and a retry keeps exactly the same key and payload", async () => {
    await event("cancelled"); mode = "reject";
    const failed = await mail.drainWorkspaceNotifications();
    assert.equal(failed.sent, 0); assert.equal(failed.pending, 1);
    const first = outgoing.at(-1);
    const pending = (await pg.query("SELECT * FROM workspace_notifications WHERE status='pending'")).rows[0];
    assert.equal(pending.last_error, "HTTP_503"); assert.equal(pending.provider_id, null);
    assert.equal(JSON.stringify(pending).includes("Private provider diagnostic"), false);
    assert.equal((await mail.drainWorkspaceNotifications()).attempted, 0, "Backoff defers automatic retries");
    env.email.transactionalFrom = "Changed <other@example.test>"; env.NEXT_PUBLIC_SITE_URL = "https://changed.example.test";
    mode = "ok";
    assert.equal((await mail.drainWorkspaceNotifications({ force: true })).sent, 1);
    assert.deepEqual(outgoing.at(-1).payload, first.payload);
    assert.equal(outgoing.at(-1).key, first.key);
  });
  await t.test("concurrent workers claim each notification only once", async () => {
    await event("completed"); const before = outgoing.length;
    const outcomes = await Promise.all([mail.drainWorkspaceNotifications(), mail.drainWorkspaceNotifications()]);
    assert.equal(outcomes.reduce((sum, item) => sum + item.sent, 0), 1);
    assert.equal(outgoing.length, before + 1);
  });
  await t.test("successful HTTP without a provider ID is not reported as sent and old ambiguous sends need review", async () => {
    await event("in_progress"); mode = "missing-id";
    assert.equal((await mail.drainWorkspaceNotifications()).sent, 0);
    let pending = (await pg.query("SELECT * FROM workspace_notifications WHERE status='pending'")).rows[0];
    assert.equal(pending.last_error, "INVALID_RESPONSE");
    await pg.query("UPDATE workspace_notifications SET first_attempt_at=now()-interval '25 hours',available_at=now()-interval '1 second' WHERE id=$1", [pending.id]);
    const before = outgoing.length;
    assert.equal((await mail.drainWorkspaceNotifications()).needsReview, 1);
    assert.equal(outgoing.length, before);
    pending = (await pg.query("SELECT * FROM workspace_notifications WHERE id=$1", [pending.id])).rows[0];
    assert.equal(pending.last_error, "PROVIDER_CHECK_REQUIRED");
    assert.equal((await mail.drainWorkspaceNotifications()).attempted, 0);
    mode = "ok"; assert.equal((await mail.drainWorkspaceNotifications({ force: true })).sent, 1);
  });
  await t.test("an expired lease is recovered, while configuration absence leaves jobs untouched", async () => {
    const id = await event("quoted");
    await pg.query("UPDATE workspace_notifications SET status='sending',locked_until=now()-interval '1 minute',lease_token='old' WHERE event_id=$1", [id]);
    env.email.transactionalEnabled = false;
    assert.equal((await mail.drainWorkspaceNotifications()).configured, false);
    assert.equal((await pg.query("SELECT attempts FROM workspace_notifications WHERE event_id=$1", [id])).rows[0].attempts, 0);
    env.email.transactionalEnabled = true;
    assert.equal((await mail.drainWorkspaceNotifications()).sent, 1);
  });
  await t.test("dashboard and retry action authenticate before database access", async () => {
    staffEnabled = false; const before = reads;
    await assert.rejects(mail.getWorkspaceNotificationDashboard(), UnauthorizedError);
    await assert.rejects(retry.retryWorkspaceNotifications({ ok: false, message: "" }, new FormData()), /Redirect:\/admin\/connexion/);
    assert.equal(reads, before); staffEnabled = true;
  });
  await t.test("mail failure after commit never changes the saved business result", async () => {
    const actions = load("src/lib/workspace-actions.ts", { ...common,
      "@/lib/workspace": workspace, "@/lib/workspace-mail": mail,
      "@/lib/customer-auth": { CustomerUnauthorizedError, requireCustomer: async () => ({ id: 2, name: "New customer" }) },
      "@/lib/workspace-files": { validateWorkspaceFile: async () => { throw new Error("unexpected upload"); }, WorkspaceFileValidationError: class extends Error {} },
      "next/cache": { revalidatePath() {} }, "next/navigation": { redirect: (path) => { throw new Error(`Redirect:${path}`); } },
    });
    const fd = new FormData(); fd.set("title", "New saved request"); fd.set("service", "first_cv"); fd.set("brief", "Private content must not leave the workspace");
    mode = "network"; const before = outgoing.length;
    const result = await actions.createServiceRequest({ ok: false, message: "" }, fd);
    assert.equal(result.ok, true); assert.ok(result.requestId);
    assert.equal(outgoing.length, before, "The provider is not called before the response callback");
    assert.equal(scheduled.length, 1); await scheduled.shift()();
    assert.equal((await pg.query("SELECT id FROM service_requests WHERE id=$1", [result.requestId])).rows.length, 1);
    const rows = (await pg.query("SELECT status,last_error FROM workspace_notifications WHERE request_id=$1", [result.requestId])).rows;
    assert.equal(rows.length, 2); assert.ok(rows.every((row) => row.status === "pending" && row.last_error === "NETWORK_ERROR"));
  });
  await t.test("publishing the final product queues real delivery triggers and provider failure preserves customer downloads", async () => {
    const deliveryCommon = { ...common,
      "@/lib/workspace": workspace,
      "@/lib/customer-auth": { CustomerUnauthorizedError, requireCustomer: async () => ({ id: 1, name: "Existing customer" }) },
    };
    const files = load("src/lib/workspace-files.ts", deliveryCommon);
    const actions = load("src/lib/workspace-actions.ts", { ...deliveryCommon,
      "@/lib/workspace-mail": mail, "@/lib/workspace-files": files,
      "next/cache": { revalidatePath() {} }, "next/navigation": { redirect: (path) => { throw new Error(`Redirect:${path}`); } },
    });
    const saved = (await pg.query("INSERT INTO service_requests(customer_id,title,service,brief,status,quoted_amount) VALUES(1,'Private delivery title','first_cv','Private brief','finalized',12000) RETURNING id,version")).rows[0];
    const content = Buffer.from("%PDF-1.4\nPrivate final product\n%%EOF\n");
    const [document] = await db.insert(workspaceSchema.requestFiles).values({
      requestId: saved.id, filename: "Private-final-product.pdf", mimeType: "application/pdf", size: content.length, content,
      kind: "delivery", uploadedByType: "staff", uploadedById: 3, uploadedByName: "Staff", createdAt: new Date(Date.now() - 1000),
    }).returning({ id: workspaceSchema.requestFiles.id });
    assert.equal(await files.getWorkspaceFile(document.id), null, "The prepared product is not downloadable before publication");
    const fd = new FormData(); fd.set("requestId", String(saved.id)); fd.set("version", String(saved.version)); fd.set("note", "Private final product note");
    const before = outgoing.length;
    assert.equal(scheduled.length, 0);
    const result = await actions.publishRequestDelivery({ ok: false, message: "" }, fd);
    assert.equal(result.ok, true);
    assert.equal(outgoing.length, before, "Publication commits before any provider call");
    assert.equal(scheduled.length, 1);
    const jobs = (await pg.query("SELECT kind,audience,customer_id,status,payload FROM workspace_notifications WHERE request_id=$1 ORDER BY kind", [saved.id])).rows;
    assert.deepEqual(jobs, [
      { kind: "delivered", audience: "customer", customer_id: 1, status: "pending", payload: null },
      { kind: "message", audience: "customer", customer_id: 1, status: "pending", payload: null },
    ], "The real SQL triggers enqueue delivery and its separate staff note for the request owner");
    assert.deepEqual(Buffer.from((await files.getWorkspaceFile(document.id)).content), content);
    assert.equal((await actions.publishRequestDelivery({ ok: false, message: "" }, fd)).ok, false, "A repeated publication cannot enqueue duplicate delivery mail");
    assert.equal((await pg.query("SELECT count(*)::integer AS n FROM workspace_notifications WHERE request_id=$1", [saved.id])).rows[0].n, 2);
    assert.equal(scheduled.length, 1);
    mode = "reject";
    await scheduled.shift()();
    assert.equal(outgoing.length, before + 2);
    for (const call of outgoing.slice(before)) {
      assert.deepEqual(call.payload.to, ["old@example.test"]);
      assert.ok(call.payload.text.includes(`${env.NEXT_PUBLIC_SITE_URL}/espace/demandes/${saved.id}`));
      assert.equal(JSON.stringify(call.payload).includes("Private"), false);
      assert.equal("attachments" in call.payload, false);
    }
    const pending = (await pg.query("SELECT kind,status,last_error FROM workspace_notifications WHERE request_id=$1 ORDER BY kind", [saved.id])).rows;
    assert.deepEqual(pending, [
      { kind: "delivered", status: "pending", last_error: "HTTP_503" },
      { kind: "message", status: "pending", last_error: "HTTP_503" },
    ]);
    assert.equal((await pg.query("SELECT status FROM service_requests WHERE id=$1", [saved.id])).rows[0].status, "delivered");
    assert.deepEqual(Buffer.from((await files.getWorkspaceFile(document.id)).content), content, "Provider failure leaves the published product downloadable by its owner");
  });
  await t.test("review, finalization and price adjustment notices use generic content and authenticated links", async () => {
    const id = (await pg.query("INSERT INTO service_requests(customer_id,title,service,brief) VALUES(1,'Private workflow title','first_cv','Private workflow brief') RETURNING id")).rows[0].id;
    for (const type of ["awaiting_validation", "finalized", "quote_rejected"]) {
      await pg.query("INSERT INTO request_events(request_id,type,actor_name,body,status) VALUES($1,$2,'Private actor','Private notes must never leave the account',$3)", [id, type, type === "quote_rejected" ? "reviewing" : type]);
    }
    const queued = (await pg.query("SELECT kind,audience,payload FROM workspace_notifications WHERE request_id=$1 ORDER BY id", [id])).rows;
    assert.deepEqual(queued.map(row => [row.kind, row.audience]), [["awaiting_validation", "customer"], ["finalized", "team"], ["quote_rejected", "team"]]);
    assert.ok(queued.every(row => row.payload === null));
    mode = "ok";
    const before = outgoing.length;
    const result = await mail.drainWorkspaceNotifications({ requestId: id });
    assert.equal(result.sent, 3);
    const sent = outgoing.slice(before);
    assert.deepEqual(sent[0].payload.to, ["old@example.test"]);
    assert.deepEqual(sent[1].payload.to, [env.CONTACT_EMAIL]);
    assert.deepEqual(sent[2].payload.to, [env.CONTACT_EMAIL]);
    assert.match(sent[0].payload.subject, /validation/);
    assert.match(sent[1].payload.subject, /validée par le client/);
    assert.match(sent[2].payload.subject, /Ajustement/);
    assert.ok(sent[0].payload.text.includes(`/espace/demandes/${id}`));
    assert.ok(sent[1].payload.text.includes(`/admin/commandes/${id}`));
    for (const call of sent) {
      assert.doesNotMatch(JSON.stringify(call.payload), /Private/);
      assert.equal("attachments" in call.payload, false);
      assert.match(call.payload.html, /<html/);
    }
  });

});
