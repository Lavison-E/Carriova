const assert = require("node:assert/strict");
const { createHmac, randomUUID } = require("node:crypto");
const { readFileSync } = require("node:fs");
const { resolve } = require("node:path");
const test = require("node:test");
const { PGlite } = require("@electric-sql/pglite");
const { drizzle } = require("drizzle-orm/pglite");
const { CORE_LEADS_SQL, loadTypeScript } = require("./helpers/crm-fixture.cjs");
const genius = loadTypeScript("src/lib/geniuspay.ts", { "server-only": {} });
const policy = loadTypeScript("src/lib/payment-policy.ts");
const fakeEnv = { GENIUSPAY_ENVIRONMENT: "sandbox", GENIUSPAY_API_KEY: "pk_sandbox_test-only", GENIUSPAY_API_SECRET: "sk_sandbox_test-only", GENIUSPAY_WEBHOOK_SECRET: "whsec_test-only", NEXT_PUBLIC_SITE_URL: "https://carriova.example", VERCEL_ENV: "preview" };
const config = genius.getGeniusPayConfig(fakeEnv);
const expectCode = code => error => error instanceof genius.PaymentError && error.code === code;
function notification(remote, options = {}) {
  const event = options.event ?? "payment.success";
  const raw = JSON.stringify({ id: options.id ?? randomUUID(), event, data: { ...remote }, environment: options.environment ?? "sandbox" });
  const timestamp = String(options.timestamp ?? Math.floor(Date.now() / 1000));
  const headers = new Headers({ "Content-Type": "application/json", "X-Webhook-Timestamp": timestamp, "X-Webhook-Signature": createHmac("sha256", config.webhookSecret).update(`${timestamp}.${raw}`).digest("hex"), "X-Webhook-Event": event, "X-Webhook-Environment": options.environment ?? "sandbox" });
  return { raw, headers };
}
test("checkout configuration is off when missing, mixed, insecure or sandbox in production", () => {
  assert.ok(config);
  assert.equal(genius.getGeniusPayConfig({}), null);
  assert.equal(genius.getGeniusPayConfig({ ...fakeEnv, GENIUSPAY_WEBHOOK_SECRET: "" }), null);
  assert.equal(genius.getGeniusPayConfig({ ...fakeEnv, GENIUSPAY_API_SECRET: "sk_live_test-only" }), null);
  assert.equal(genius.getGeniusPayConfig({ ...fakeEnv, NEXT_PUBLIC_SITE_URL: "http://carriova.example" }), null);
  assert.equal(genius.getGeniusPayConfig({ ...fakeEnv, NEXT_PUBLIC_SITE_URL: "https://user:pass@carriova.example/path" }), null);
  assert.equal(genius.getGeniusPayConfig({ ...fakeEnv, VERCEL_ENV: "production" }), null);
  assert.ok(genius.getGeniusPayConfig({ ...fakeEnv, GENIUSPAY_ENVIRONMENT: "live", GENIUSPAY_API_KEY: "pk_live_test-only", GENIUSPAY_API_SECRET: "sk_live_test-only", VERCEL_ENV: "production" }));
  for (const url of ["https://evil.test/checkout/MTX-1", "https://geniuspay.ci.evil.test/checkout/MTX-1", "https://user:pass@geniuspay.ci/checkout/MTX-1", "http://geniuspay.ci/checkout/MTX-1", "javascript:alert(1)", "https://geniuspay.ci/account"]) assert.equal(genius.safeCheckoutUrl(url), null);
});
test("instalments use the accepted XOF total and require delivery readiness for the balance", () => {
  assert.deepEqual(policy.paymentSchedule(25000, 0, false), { stage: "full", dueAmount: 25000, remainingAmount: 25000, awaitingDelivery: false });
  assert.deepEqual(policy.paymentSchedule(25001, 0, false), { stage: "deposit", dueAmount: 12501, remainingAmount: 25001, awaitingDelivery: false });
  assert.deepEqual(policy.paymentSchedule(60000, 30000, false), { stage: null, dueAmount: 0, remainingAmount: 30000, awaitingDelivery: true });
  assert.equal(policy.paymentSchedule(60000, 30000, true).stage, "balance");
  for (const [quote, paid] of [[0, 0], [null, 0], [100, 101], [-1, 0], [1000, -1], [10.5, 0]]) assert.equal(policy.paymentSchedule(quote, paid, true).dueAmount, 0);
});
test("webhook HMAC covers raw bytes, timestamp, environment and event", () => {
  const signed = notification({ reference: "MTX-TEST", amount: 6000, currency: "XOF" });
  assert.equal(genius.verifyGeniusPayWebhook(signed.raw, signed.headers, config).event, "payment.success");
  assert.throws(() => genius.verifyGeniusPayWebhook(signed.raw + " ", signed.headers, config), expectCode("INVALID_SIGNATURE"));
  for (const seconds of [-301, 301]) { const stale = notification({}, { timestamp: Math.floor(Date.now() / 1000) + seconds }); assert.throws(() => genius.verifyGeniusPayWebhook(stale.raw, stale.headers, config), expectCode("INVALID_SIGNATURE")); }
  const invalid = new Headers(signed.headers); invalid.set("x-webhook-signature", "00");
  assert.throws(() => genius.verifyGeniusPayWebhook(signed.raw, invalid, config), expectCode("INVALID_SIGNATURE"));
  for (const [key, value] of [["x-webhook-environment", "live"], ["x-webhook-event", "payment.failed"]]) {
    const altered = new Headers(signed.headers); altered.set(key, value);
    assert.throws(() => genius.verifyGeniusPayWebhook(signed.raw, altered, config), expectCode("INVALID_WEBHOOK"));
  }
  const otherEnv = notification({}, { environment: "live" });
  assert.throws(() => genius.verifyGeniusPayWebhook(otherEnv.raw, otherEnv.headers, config), expectCode("INVALID_WEBHOOK"));
});

test("GeniusPay checkout, verification and webhooks use a private PostgreSQL ledger", async t => {
  const pg = new PGlite(); await pg.waitReady; t.after(() => pg.close());
  await pg.exec(CORE_LEADS_SQL);
  for (const name of ["20261018_staff.sql", "20261107_team_management.sql", "20261018_crm.sql", "20261018_customer.sql", "20261018_workspace.sql", "20261018_notifications.sql", "20261022_workflow.sql", "20261102_commercial_offers.sql", "20261102_payments.sql"]) await pg.exec(readFileSync(resolve(__dirname, "../migrations", name), "utf8"));
  await pg.exec(readFileSync(resolve(__dirname, "../migrations/20261102_payments.sql"), "utf8"));
  await pg.exec("INSERT INTO customer_users(id,email,name,password_hash,consent_privacy,consent_version) VALUES (1,'awa@example.test','Awa','test-only',true,'test'),(2,'koffi@example.test','Koffi','test-only',true,'test')");
  const core = loadTypeScript("src/db/schema.ts");
  const customerSchema = loadTypeScript("src/db/customer-schema.ts", { "./schema": core });
  const workspace = loadTypeScript("src/db/workspace-schema.ts", { "./schema": core, "./customer-schema": customerSchema });
  const paymentSchema = loadTypeScript("src/db/payment-schema.ts", { "./customer-schema": customerSchema, "./workspace-schema": workspace });
  const db = drizzle(pg); let accesses = 0; let activeConfig = config;
  let customer = { id: 1, name: "Awa", email: "awa@example.test" }; let staff = null;
  class CustomerUnauthorizedError extends Error {} class UnauthorizedError extends Error {}
  const provider = { ...genius, getGeniusPayConfig: () => activeConfig, requireGeniusPayConfig: () => { if (!activeConfig) throw new genius.PaymentError(503, "PAYMENTS_DISABLED", "Disabled"); return activeConfig; } };
  const mocks = { "server-only": {}, "@/lib/premium-store": { activatePremiumPass: async () => {} }, "@/db": { getDb: () => { accesses++; return db; } }, "@/db/payment-schema": paymentSchema, "@/db/workspace-schema": workspace, "@/lib/payment-policy": policy, "@/lib/geniuspay": provider,
    "@/lib/customer-auth": { CustomerUnauthorizedError, requireCustomer: async () => { if (!customer) throw new CustomerUnauthorizedError(); return customer; } },
    "@/lib/staff-auth": { UnauthorizedError, requireStaff: async () => { if (!staff) throw new UnauthorizedError(); return staff; } } };
  const store = loadTypeScript("src/lib/payment-store.ts", mocks); mocks["@/lib/payment-store"] = store;
  const http = loadTypeScript("src/lib/payment-http.ts", mocks); mocks["@/lib/payment-http"] = http;
  const route = loadTypeScript("src/app/api/payments/geniuspay/route.ts", mocks);
  const verifyRoute = loadTypeScript("src/app/api/payments/geniuspay/verify/route.ts", mocks);
  const adminRoute = loadTypeScript("src/app/api/payments/geniuspay/admin/route.ts", mocks);
  const webhookRoute = loadTypeScript("src/app/api/payments/geniuspay/webhook/route.ts", mocks);
  const request = (body, origin = "https://carriova.example") => new Request("https://carriova.example/api/payments/geniuspay", { method: "POST", headers: { "Content-Type": "application/json", origin }, body: JSON.stringify(body) });
  const get = id => new Request(`https://carriova.example/api/payments/geniuspay?requestId=${id}`);
  let posts = 0; let reads = 0; let failAfterCreation = false; const remotePayments = new Map(); let claimedInitialStatus = "pending";
  const originalFetch = global.fetch; t.after(() => { global.fetch = originalFetch; });
  global.fetch = async (url, options) => {
    assert.ok(String(url).startsWith("https://geniuspay.ci/api/v1/merchant/payments"));
    assert.equal(options.redirect, "error"); assert.equal(options.cache, "no-store");
    assert.equal(options.headers["X-API-Key"], activeConfig.apiKey);
    if (options.method === "POST") {
      posts++; const body = JSON.parse(options.body); const reference = `MTX-TEST-${posts}`;
      assert.equal(body.currency, "XOF"); assert.equal(body.payment_method, undefined);
      assert.match(body.success_url, /^https:\/\/carriova\.example\/espace\/demandes\/\d+\?payment=/);
      const remote = { reference, amount: body.amount, currency: "XOF", environment: activeConfig.environment, status: claimedInitialStatus, metadata: body.metadata, checkout_url: `https://geniuspay.ci/checkout/${reference}` };
      remotePayments.set(reference, remote);
      await new Promise(resolve => setTimeout(resolve, 10));
      if (failAfterCreation) throw new Error("fake ambiguous timeout");
      return Response.json({ success: true, data: remote }, { status: 201 });
    }
    reads++; const reference = String(url).split("/").at(-1);
    return Response.json({ success: true, data: remotePayments.get(reference) });
  };
  async function newRequest(amount = 6000, status = "in_progress", owner = 1) {
    const result = await pg.query("INSERT INTO service_requests(customer_id,title,service,brief,status,quoted_amount) VALUES ($1,'Demande test','first_cv','Un besoin synthétique pour les tests',$2,$3) RETURNING id", [owner,status,amount]);
    const id = result.rows[0].id;
    if (policy.acceptedPaymentStatuses.includes(status)) await pg.query("INSERT INTO request_events(request_id,type,actor_name,body,status) VALUES ($1,'in_progress','Client test','Proposition acceptée','in_progress')",[id]);
    return id;
  }
  function remoteFor(id) { return [...remotePayments.values()].find(payment => payment.metadata.payment_id === id); }
  async function sendWebhook(remote, options) {
    const signed = notification(remote, options);
    const response = await webhookRoute.POST(new Request("https://carriova.example/api/payments/geniuspay/webhook", { method: "POST", headers: signed.headers, body: signed.raw }));
    return { response, signed };
  }
  await t.test("session and staff checks precede database access; foreign origins and unbounded JSON are rejected", async () => {
    const saved = customer; customer = null; const before = accesses;
    assert.equal((await route.GET(get(1))).status, 401);
    assert.equal((await route.POST(request({ requestId: 1 }))).status, 401);
    assert.equal((await verifyRoute.POST(request({ requestId: 1 }))).status, 401);
    assert.equal((await adminRoute.GET(get(1))).status, 401);
    assert.equal(accesses, before); customer = saved;
    assert.equal((await route.POST(request({ requestId: 1 }, "https://evil.test"))).status, 403);
    const missing = request({ requestId: 1 }); missing.headers.delete("origin"); assert.equal((await route.POST(missing)).status, 403);
    assert.equal((await route.POST(request({ requestId: 1, payload: "x".repeat(2100) }))).status, 413);
    assert.equal(posts, 0);
  });
  await t.test("ownership, acceptance, free and subminimum quotes cannot create a checkout", async () => {
    const foreign = await newRequest(6000, "in_progress", 2);
    assert.equal((await route.POST(request({ requestId: foreign }))).status, 404);
    assert.equal((await route.GET(get(foreign))).status, 404);
    assert.equal((await verifyRoute.POST(request({ requestId: foreign }))).status, 404);
    for (const [amount,status] of [[6000,"quoted"],[6000,"cancelled"],[0,"in_progress"],[199,"in_progress"],[null,"in_progress"]]) {
      assert.equal((await route.POST(request({ requestId: await newRequest(amount,status) }))).status, 409);
    }
    assert.equal(posts, 0);
  });
  let paidRequest;
  await t.test("amount is taken only from DB, repeat clicks reuse checkout and creation response never proves payment", async () => {
    paidRequest = await newRequest(); claimedInitialStatus = "completed";
    const result = await route.POST(request({ requestId: paidRequest, amount: 1, currency: "USD", customerId: 2 }));
    assert.equal(result.status, 200); const first = await result.json(); const before = posts;
    assert.equal(remoteFor(first.paymentId).amount, 6000);
    assert.equal((await store.getRequestPaymentSummary(paidRequest, 1)).paidAmount, 0);
    assert.deepEqual(await store.startRequestPayment(paidRequest, customer), first); assert.equal(posts, before);
    const verified = await verifyRoute.POST(request({ requestId: paidRequest, paymentId: first.paymentId, status: "completed" }));
    assert.equal(verified.status, 200); const summary = await verified.json();
    assert.equal(summary.paidAmount, 6000); assert.equal(summary.isTest, true); assert.equal(summary.dueAmount, 0);
    assert.equal((await route.POST(request({ requestId: paidRequest }))).status, 409);
    const event = (await pg.query("SELECT body FROM request_events WHERE request_id=$1 AND type='payment_confirmed'",[paidRequest])).rows[0];
    assert.match(event.body,/TEST SANDBOX/); claimedInitialStatus = "pending";
    assert.equal((await pg.query("SELECT status FROM service_requests WHERE id=$1",[paidRequest])).rows[0].status,"in_progress");
  });
  await t.test("concurrent checkout attempts reserve once and ambiguous provider failure does not retry", async () => {
    const id = await newRequest(); const before = posts;
    const results = await Promise.allSettled([store.startRequestPayment(id, customer), store.startRequestPayment(id, customer)]);
    assert.equal(posts, before + 1); assert.equal((await pg.query("SELECT count(*)::int AS n FROM request_payments WHERE request_id=$1",[id])).rows[0].n,1);
    assert.ok(results.some(result=>result.status === "fulfilled"));
    for (const result of results) if(result.status === "rejected") assert.equal(result.reason.code,"PAYMENT_PENDING");
    const uncertain = await newRequest(); failAfterCreation = true;
    await assert.rejects(store.startRequestPayment(uncertain, customer), expectCode("PROVIDER_UNAVAILABLE"));
    const after = posts; await assert.rejects(store.startRequestPayment(uncertain,customer), expectCode("PAYMENT_PENDING")); assert.equal(posts,after);
    failAfterCreation = false;
    const remote = [...remotePayments.values()].find(payment=>payment.metadata.order_id===String(uncertain)); remote.status="completed";
    assert.equal((await sendWebhook(remote)).response.status,200);
    assert.equal((await store.getRequestPaymentSummary(uncertain,1)).paidAmount,6000);
  });
  await t.test("signed webhooks fetch and cross-check amounts, currency, environment and metadata before credit", async () => {
    const id = await newRequest(); const checkout = await store.startRequestPayment(id,customer); const remote = remoteFor(checkout.paymentId);
    const original = structuredClone(remote); remote.status="completed";
    for (const mutate of [value=>{value.amount=1;},value=>{value.currency="USD";},value=>{value.environment="live";},value=>{value.metadata.customer_id="2";},value=>{value.metadata.order_id="999";},value=>{value.metadata.quote_amount="1";},value=>{value.metadata.stage="balance";}]) {
      Object.assign(remote,structuredClone(original),{status:"completed"}); mutate(remote);
      assert.notEqual((await sendWebhook(remote)).response.status,200);
      assert.equal((await store.getRequestPaymentSummary(id,1)).paidAmount,0);
    }
    Object.assign(remote,structuredClone(original),{status:"pending"});
    const earlySuccess = await sendWebhook({...remote,status:"completed"});
    assert.equal(earlySuccess.response.status,200); // Signed success payload alone is insufficient.
    assert.equal((await store.getRequestPaymentSummary(id,1)).paidAmount,0);
    const beforeReads=reads; const invalid = notification(remote); invalid.headers.set("x-webhook-signature","0".repeat(64));
    assert.equal((await webhookRoute.POST(new Request("https://carriova.example/api/payments/geniuspay/webhook",{method:"POST",headers:invalid.headers,body:invalid.raw}))).status,401); assert.equal(reads,beforeReads);
    remote.status="completed";
    // Retry the same event ID/body after the authenticated API catches up.
    const signed = earlySuccess.signed;
    for (let retry = 0; retry < 2; retry++) assert.equal((await webhookRoute.POST(new Request("https://carriova.example/api/payments/geniuspay/webhook",{method:"POST",headers:signed.headers,body:signed.raw}))).status,200);
    assert.equal((await store.getRequestPaymentSummary(id,1)).paidAmount,6000);
    assert.equal((await pg.query("SELECT count(*)::int AS n FROM request_events WHERE request_id=$1 AND type='payment_confirmed'",[id])).rows[0].n,1);
    remote.status="failed"; assert.equal((await sendWebhook(remote,{event:"payment.failed"})).response.status,200);
    assert.equal((await store.getRequestPaymentSummary(id,1)).paidAmount,6000);
    remote.status="refunded"; assert.equal((await sendWebhook(remote,{event:"payment.refunded"})).response.status,200);
    assert.equal((await store.getRequestPaymentSummary(id,1)).needsReview,true);
    await assert.rejects(store.startRequestPayment(id,customer),expectCode("PAYMENT_NOT_DUE"));
  });
  await t.test("an authenticated provider GET must match the exact local payment requested", async () => {
    const own = await newRequest(); const ownCheckout = await store.startRequestPayment(own,customer); const ownRemote = remoteFor(ownCheckout.paymentId);
    const foreign = await newRequest(6000,"in_progress",2); const foreignCheckout = await store.startRequestPayment(foreign,{id:2,name:"Koffi",email:"koffi@example.test"}); const foreignRemote = remoteFor(foreignCheckout.paymentId);
    foreignRemote.status="completed"; remotePayments.set(ownRemote.reference,foreignRemote);
    await assert.rejects(store.verifyRequestPayments(own,1,ownCheckout.paymentId),expectCode("PAYMENT_MISMATCH"));
    assert.equal((await store.getRequestPaymentSummary(foreign,2)).paidAmount,0);
    remotePayments.set(ownRemote.reference,ownRemote);
  });
  await t.test("large quotes collect a deposit, wait for finalization, then exact balance", async () => {
    const id=await newRequest(40001); const deposit=await store.startRequestPayment(id,customer); const remote=remoteFor(deposit.paymentId); assert.equal(remote.amount,20001);
    remote.status="completed"; await sendWebhook(remote); let summary=await store.getRequestPaymentSummary(id,1);
    assert.equal(summary.awaitingDelivery,true); assert.equal(summary.remainingAmount,20000);
    await assert.rejects(store.startRequestPayment(id,customer),expectCode("PAYMENT_NOT_DUE"));
    await pg.query("UPDATE service_requests SET status='finalized' WHERE id=$1",[id]);
    const balance=await store.startRequestPayment(id,customer); const remainder=remoteFor(balance.paymentId); assert.equal(remainder.amount,20000); assert.equal(remainder.metadata.stage,"balance");
    remainder.status="completed"; await sendWebhook(remainder); summary=await store.getRequestPaymentSummary(id,1); assert.equal(summary.paidAmount,40001); assert.equal(summary.remainingAmount,0);
  });
  await t.test("only verified terminal failures permit a retry; late successes are retained for review without double credit", async () => {
    const id=await newRequest(); const first=await store.startRequestPayment(id,customer); const one=remoteFor(first.paymentId); one.status="failed"; await sendWebhook(one,{event:"payment.failed"});
    const second=await store.startRequestPayment(id,customer); assert.notEqual(first.paymentId,second.paymentId);
    one.status="completed"; await sendWebhook(one); const summary=await store.getRequestPaymentSummary(id,1);
    assert.equal(summary.needsReview,true); assert.equal(summary.paidAmount,0); assert.ok(summary.payments.some(payment=>payment.status==="review_required"));
  });
  await t.test("live accounting ignores sandbox records and staff access is protected", async () => {
    activeConfig={...config,environment:"live",apiKey:"pk_live_test-only",apiSecret:"sk_live_test-only"};
    assert.equal((await store.getRequestPaymentSummary(paidRequest,1)).paidAmount,0);
    assert.equal((await adminRoute.GET(get(paidRequest))).status,401); staff={id:1,name:"Team"};
    assert.equal((await adminRoute.GET(get(paidRequest))).status,200); staff=null;
    activeConfig=null; const disabled=await store.getRequestPaymentSummary(paidRequest,1); assert.equal(disabled.enabled,false); assert.equal(disabled.isTest,false);
    await assert.rejects(store.startRequestPayment(paidRequest,customer),expectCode("PAYMENTS_DISABLED")); activeConfig=config;
  });
  await t.test("shared database rate limits stop excessive checks and unexpected errors do not leak", async () => {
    await pg.exec("DELETE FROM staff_login_attempts");
    for(let i=0;i<30;i++) await store.paymentQuota(1);
    await assert.rejects(store.paymentQuota(1),expectCode("RATE_LIMITED"));
    const response=http.paymentErrorResponse(new Error("postgresql://secret-password")); assert.equal(response.status,503); assert.doesNotMatch(await response.text(),/secret-password/);
  });
});
test("staff diagnostic names the blocking setting without exposing secrets", () => {
  assert.equal(genius.geniusPayConfigIssue(fakeEnv), null);
  assert.match(genius.geniusPayConfigIssue({ ...fakeEnv, GENIUSPAY_ENVIRONMENT: undefined }), /absente/);
  assert.match(genius.geniusPayConfigIssue({ ...fakeEnv, GENIUSPAY_ENVIRONMENT: "live\n" }), /espaces/);
  assert.match(genius.geniusPayConfigIssue({ ...fakeEnv, GENIUSPAY_ENVIRONMENT: "Live" }), /minuscules/);
  assert.match(genius.geniusPayConfigIssue({ ...fakeEnv, VERCEL_ENV: "production" }), /sandbox/);
  const live = { ...fakeEnv, GENIUSPAY_ENVIRONMENT: "live" };
  assert.match(genius.geniusPayConfigIssue(live), /pk_live_/);
  assert.match(genius.geniusPayConfigIssue({ ...live, GENIUSPAY_API_KEY: "pk_live_x" }), /sk_live_/);
  assert.match(genius.geniusPayConfigIssue({ ...fakeEnv, GENIUSPAY_WEBHOOK_SECRET: "abc" }), /whsec_/);
  assert.match(genius.geniusPayConfigIssue({ ...fakeEnv, NEXT_PUBLIC_SITE_URL: "https://www.carriovaci.com/fr" }), /NEXT_PUBLIC_SITE_URL/);
  for (const value of [fakeEnv.GENIUSPAY_API_KEY, fakeEnv.GENIUSPAY_API_SECRET, fakeEnv.GENIUSPAY_WEBHOOK_SECRET])
    assert.ok(!genius.geniusPayConfigIssue({ ...fakeEnv, GENIUSPAY_ENVIRONMENT: "live" }).includes(value));
});
