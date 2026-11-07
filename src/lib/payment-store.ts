import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { and, desc, eq, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { paymentWebhookEvents, requestPayments } from "@/db/payment-schema";
import { requestEvents, serviceRequests } from "@/db/workspace-schema";
import { requireStaff } from "@/lib/staff-auth";
import type { CustomerIdentity } from "@/lib/customer-auth";
import { acceptedPaymentStatuses, paymentSchedule, type PaymentSummary, type PaymentState } from "@/lib/payment-policy";
import { createGeniusPayCheckout, fetchGeniusPayTransaction, getGeniusPayConfig, isProviderReference, PaymentError, requireGeniusPayConfig, safeCheckoutUrl, verifyGeniusPayWebhook, type GeniusPayConfig, type GeniusPayTransaction } from "@/lib/geniuspay";

type Db = ReturnType<typeof getDb>;
type Transaction = Parameters<Parameters<Db["transaction"]>[0]>[0];
type Payment = typeof requestPayments.$inferSelect;
type RequestRow = typeof serviceRequests.$inferSelect;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export function parsePaymentRequestId(value: unknown): number {
  const raw = typeof value === "number" ? String(value) : value;
  if (typeof raw !== "string" || !/^[1-9][0-9]{0,9}$/.test(raw) || Number(raw) > 2147483647) throw new PaymentError(400, "INVALID_REQUEST", "Demande invalide.");
  return Number(raw);
}
export async function paymentQuota(customerId: number): Promise<void> {
  const key = createHash("sha256").update(`payments:${customerId}`).digest("hex");
  const result = await getDb().execute(sql`INSERT INTO staff_login_attempts (key, attempts, reset_at)
    VALUES (${key}, 1, now() + interval '1 minute') ON CONFLICT (key) DO UPDATE SET
    attempts = CASE WHEN staff_login_attempts.reset_at <= now() THEN 1 ELSE staff_login_attempts.attempts + 1 END,
    reset_at = CASE WHEN staff_login_attempts.reset_at <= now() THEN now() + interval '1 minute' ELSE staff_login_attempts.reset_at END
    WHERE staff_login_attempts.reset_at <= now() OR staff_login_attempts.attempts < 30 RETURNING key`);
  if (!result.rows.length) throw new PaymentError(429, "RATE_LIMITED", "Trop de vérifications. Patientez une minute avant de réessayer.");
}
async function ownedRequest(db: Db | Transaction, requestId: number, customerId: number, lock = false): Promise<RequestRow> {
  const query = db.select().from(serviceRequests).where(and(eq(serviceRequests.id, requestId), eq(serviceRequests.customerId, customerId)));
  const [request] = await (lock ? query.for("update") : query);
  if (!request) throw new PaymentError(404, "NOT_FOUND", "Demande introuvable.");
  return request;
}
async function summaryFor(db: Db | Transaction, request: RequestRow, config: GeniusPayConfig | null): Promise<PaymentSummary> {
  const environment = config?.environment ?? "live";
  const payments = await db.select().from(requestPayments).where(and(eq(requestPayments.requestId, request.id), eq(requestPayments.environment, environment))).orderBy(desc(requestPayments.createdAt));
  const events = await db.select({ type: requestEvents.type }).from(requestEvents).where(eq(requestEvents.requestId, request.id));
  const accepted = acceptedPaymentStatuses.includes(request.status) && events.some(event => event.type === "in_progress");
  const paidAmount = payments.filter(payment => payment.status === "completed").reduce((total, payment) => total + payment.amount, 0);
  const needsReview = payments.some(payment => ["refunded", "review_required"].includes(payment.status)) || (request.quotedAmount !== null && paidAmount > request.quotedAmount);
  const deliveryReady = ["finalized", "delivered", "completed"].includes(request.status) || events.some(event => event.type === "delivered");
  const schedule = paymentSchedule(request.quotedAmount, paidAmount, deliveryReady);
  return {
    enabled: Boolean(config), environment: config?.environment ?? null, isTest: environment === "sandbox", accepted,
    quoteAmount: request.quotedAmount, paidAmount, ...schedule,
    ...(!accepted || needsReview ? { stage: null, dueAmount: 0, awaitingDelivery: false } : {}), needsReview,
    payments: payments.map(payment => ({ id: payment.id, amount: payment.amount, stage: payment.stage, status: payment.status, reference: payment.providerReference,
      checkoutUrl: ["pending", "processing"].includes(payment.status) ? safeCheckoutUrl(payment.checkoutUrl) : null,
      createdAt: payment.createdAt.toISOString(), paidAt: payment.paidAt?.toISOString() ?? null })),
  };
}
export async function getRequestPaymentSummary(requestId: number, customerId: number): Promise<PaymentSummary> {
  const db = getDb(); return summaryFor(db, await ownedRequest(db, requestId, customerId), getGeniusPayConfig());
}
function assertRemoteMatches(payment: Payment, remote: GeniusPayTransaction): void {
  const metadata = remote.metadata;
  if (remote.amount !== payment.amount || remote.currency !== "XOF" || remote.environment !== payment.environment ||
    (payment.providerReference !== null && remote.reference !== payment.providerReference) ||
    metadata.payment_id !== payment.id || metadata.order_id !== String(payment.requestId) || metadata.customer_id !== String(payment.customerId) ||
    metadata.quote_amount !== String(payment.quoteAmount) || metadata.stage !== payment.stage) {
    throw new PaymentError(409, "PAYMENT_MISMATCH", "La transaction ne correspond pas à la demande. L’équipe doit vérifier ce paiement.");
  }
}
export async function startRequestPayment(requestId: number, customer: CustomerIdentity): Promise<{ paymentId: string; checkoutUrl: string }> {
  const config = requireGeniusPayConfig();
  const reservation = await getDb().transaction(async tx => {
    const request = await ownedRequest(tx, requestId, customer.id, true);
    const summary = await summaryFor(tx, request, config);
    if (!summary.accepted || summary.needsReview || !summary.stage || summary.dueAmount < 200) throw new PaymentError(409, "PAYMENT_NOT_DUE", "Aucun paiement n’est disponible à cette étape. Acceptez d’abord la proposition et consultez le suivi.");
    const [existing] = await tx.select().from(requestPayments).where(and(eq(requestPayments.requestId, requestId), eq(requestPayments.environment, config.environment), eq(requestPayments.stage, summary.stage))).orderBy(desc(requestPayments.createdAt)).limit(1);
    if (existing && !["failed", "expired", "cancelled"].includes(existing.status)) {
      if (existing.quoteAmount !== request.quotedAmount || existing.amount !== summary.dueAmount) throw new PaymentError(409, "PAYMENT_MISMATCH", "La proposition a changé. Contactez l’équipe avant de payer.");
      const checkoutUrl = safeCheckoutUrl(existing.checkoutUrl);
      if (checkoutUrl && ["pending", "processing"].includes(existing.status)) return { existing: { paymentId: existing.id, checkoutUrl } };
      throw new PaymentError(409, "PAYMENT_PENDING", "Une initialisation est déjà en cours. Vérifiez le paiement dans quelques instants ; ne le recommencez pas.");
    }
    const [payment] = await tx.insert(requestPayments).values({ id: randomUUID(), requestId, customerId: customer.id, environment: config.environment, stage: summary.stage, amount: summary.dueAmount, quoteAmount: request.quotedAmount!, status: "creating" }).returning();
    return { payment };
  });
  if (reservation.existing) return reservation.existing;
  const payment = reservation.payment!;
  // No provider idempotency contract is published. Commit the reservation BEFORE
  // calling the API; after an uncertain outcome retain it for webhook reconciliation.
  const remote = await createGeniusPayCheckout(config, { id: payment.id, requestId, customerId: customer.id, customerName: customer.name, customerEmail: customer.email, amount: payment.amount, quoteAmount: payment.quoteAmount, stage: payment.stage });
  assertRemoteMatches(payment, remote);
  const checkoutUrl = safeCheckoutUrl(remote.checkout_url);
  if (!checkoutUrl || new URL(checkoutUrl).pathname !== `/checkout/${remote.reference}`) throw new PaymentError(502, "INVALID_CHECKOUT", "Le lien de paiement n’a pas pu être vérifié. Contactez l’équipe.");
  const expiresAt = remote.expires_at ? new Date(remote.expires_at) : null;
  await getDb().transaction(async tx => {
    await ownedRequest(tx, requestId, customer.id, true);
    const [current] = await tx.select().from(requestPayments).where(eq(requestPayments.id, payment.id)).for("update");
    assertRemoteMatches(current, remote);
    await tx.update(requestPayments).set({ providerReference: remote.reference, checkoutUrl, status: current.status === "creating" ? "pending" : current.status,
      expiresAt: expiresAt && Number.isFinite(expiresAt.getTime()) ? expiresAt : null, updatedAt: new Date() }).where(eq(requestPayments.id, payment.id));
  });
  return { paymentId: payment.id, checkoutUrl };
}
async function reconcilePayment(remote: GeniusPayTransaction, config: GeniusPayConfig, webhook?: { id: string; event: string; payloadHash: string }): Promise<void> {
  const id = remote.metadata.payment_id;
  if (typeof id !== "string" || !uuidPattern.test(id)) throw new PaymentError(409, "PAYMENT_MISMATCH", "Référence locale invalide.");
  await getDb().transaction(async tx => {
    // All mutations take request then payment locks in this order.
    const [hint] = await tx.select().from(requestPayments).where(eq(requestPayments.id, id));
    if (!hint) throw new PaymentError(404, "NOT_FOUND", "Paiement introuvable.");
    await ownedRequest(tx, hint.requestId, hint.customerId, true);
    const [payment] = await tx.select().from(requestPayments).where(eq(requestPayments.id, id)).for("update");
    assertRemoteMatches(payment, remote);
    if (remote.environment !== config.environment) throw new PaymentError(409, "PAYMENT_MISMATCH", "Environnement invalide.");
    if (webhook) {
      const [previous] = await tx.select().from(paymentWebhookEvents).where(eq(paymentWebhookEvents.id, webhook.id));
      if (previous) {
        if (previous.reference !== remote.reference || previous.environment !== remote.environment || previous.payloadHash !== webhook.payloadHash) throw new PaymentError(409, "WEBHOOK_CONFLICT", "Notification incohérente.");
      } else {
        await tx.insert(paymentWebhookEvents).values({ ...webhook, environment: remote.environment, reference: remote.reference });
      }
      // A retry can observe a newer provider state (e.g. pending -> completed).
      // Reconcile it again; state transitions below already prevent duplicate credit.
    }
    let status = remote.status as PaymentState;
    // A delayed failure or pending event cannot erase a completed payment.
    if (payment.status === "completed" && status !== "refunded") status = "completed";
    if (payment.status === "refunded" || payment.status === "review_required") status = payment.status;
    if (["failed", "expired", "cancelled"].includes(payment.status) && ["pending", "processing"].includes(status)) status = payment.status;
    if (status === "completed" && payment.status !== "completed") {
      const siblings = await tx.select().from(requestPayments).where(and(eq(requestPayments.requestId, payment.requestId), eq(requestPayments.environment, payment.environment), eq(requestPayments.stage, payment.stage)));
      if (siblings.some(sibling => sibling.id !== payment.id && ["creating", "pending", "processing", "completed", "refunded", "review_required"].includes(sibling.status))) {
        // A late success after a verified terminal failure requires manual review.
        // Keep every transaction; never credit the same instalment twice.
        status = "review_required";
      }
    }
    const now = new Date();
    await tx.update(requestPayments).set({ status, providerReference: remote.reference, paidAt: status === "completed" ? payment.paidAt ?? now : payment.paidAt, updatedAt: now }).where(eq(requestPayments.id, id));
    if (status !== payment.status && ["completed", "refunded", "review_required"].includes(status)) {
      const prefix = payment.environment === "sandbox" ? "TEST SANDBOX — aucun encaissement réel. " : "";
      await tx.insert(requestEvents).values({ requestId: payment.requestId, type: status === "completed" ? "payment_confirmed" : status === "refunded" ? "payment_refunded" : "payment_review_required", actorName: "GeniusPay",
        body: `${prefix}${status === "completed" ? "Paiement confirmé" : status === "refunded" ? "Remboursement confirmé" : "Transaction reçue à vérifier : plusieurs paiements pour la même échéance"} : ${payment.amount} FCFA — ${payment.stage === "deposit" ? "acompte" : payment.stage === "balance" ? "solde" : "intégralité"}. Référence ${remote.reference}.`, createdAt: now });
    }
  });
}
export async function verifyRequestPayments(requestId: number, customerId: number, paymentId?: unknown): Promise<PaymentSummary> {
  const config = requireGeniusPayConfig();
  await ownedRequest(getDb(), requestId, customerId);
  if (paymentId !== undefined && (typeof paymentId !== "string" || !uuidPattern.test(paymentId))) throw new PaymentError(400, "INVALID_PAYMENT", "Paiement invalide.");
  const payments = await getDb().select().from(requestPayments).where(and(eq(requestPayments.requestId, requestId), eq(requestPayments.customerId, customerId), eq(requestPayments.environment, config.environment), typeof paymentId === "string" ? eq(requestPayments.id, paymentId) : undefined)).orderBy(desc(requestPayments.createdAt)).limit(10);
  if (paymentId && payments.length === 0) throw new PaymentError(404, "NOT_FOUND", "Paiement introuvable.");
  // Return URLs carry only an opaque ID. Only this authenticated provider GET can credit it.
  for (const payment of payments) {
    if (payment.providerReference && ["pending", "processing", "creating"].includes(payment.status)) {
      const remote = await fetchGeniusPayTransaction(config, payment.providerReference);
      assertRemoteMatches(payment, remote);
      await reconcilePayment(remote, config);
    }
  }
  return getRequestPaymentSummary(requestId, customerId);
}
export async function processGeniusPayWebhook(raw: string, headers: Headers): Promise<void> {
  const config = requireGeniusPayConfig(); const webhook = verifyGeniusPayWebhook(raw, headers, config);
  if (webhook.event === "webhook.test") return;
  if (!["payment.initiated", "payment.success", "payment.failed", "payment.cancelled", "payment.refunded", "payment.expired"].includes(webhook.event)) return;
  const reference = webhook.data.reference;
  if (!isProviderReference(reference)) throw new PaymentError(400, "INVALID_WEBHOOK", "Référence invalide.");
  const remote = await fetchGeniusPayTransaction(config, reference);
  if (remote.reference !== reference || remote.amount !== webhook.data.amount || remote.currency !== webhook.data.currency) throw new PaymentError(409, "PAYMENT_MISMATCH", "Notification et transaction incohérentes.");
  await reconcilePayment(remote, config, { id: webhook.id, event: webhook.event, payloadHash: createHash("sha256").update(raw).digest("hex") });
}

export async function getTeamRequestPaymentSummary(requestId: number): Promise<PaymentSummary> {
  await requireStaff();
  const db = getDb(); const [request] = await db.select().from(serviceRequests).where(eq(serviceRequests.id, requestId));
  if (!request) throw new PaymentError(404, "NOT_FOUND", "Demande introuvable.");
  return summaryFor(db, request, getGeniusPayConfig());
}
