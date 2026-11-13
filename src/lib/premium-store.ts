import "server-only";
import { and, count, desc, eq, gte, max, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { customerPremiumPasses, premiumApplications, premiumPrepPlans } from "@/db/premium-schema";
import { requestPayments } from "@/db/payment-schema";
import { requestEvents, serviceRequests } from "@/db/workspace-schema";
import { PREMIUM_AI_DAILY_LIMIT, PREMIUM_DAYS, PREMIUM_PRICE, PREMIUM_SERVICE, type ApplicationStatus, type PrepPlan } from "@/lib/premium";

type Db = ReturnType<typeof getDb>;
type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export class PremiumError extends Error {
  constructor(public code: string, message: string) { super(message); this.name = "PremiumError"; }
}

export type PremiumStatus = { active: boolean; endsAt: string | null; isTest: boolean; daysLeft: number };
export async function getPremiumStatus(customerId: number, db: Db | Tx = getDb()): Promise<PremiumStatus> {
  const [row] = await db.select({ endsAt: max(customerPremiumPasses.endsAt) }).from(customerPremiumPasses).where(eq(customerPremiumPasses.customerId, customerId));
  const endsAt = row?.endsAt ? new Date(row.endsAt) : null;
  const active = Boolean(endsAt && endsAt.getTime() > Date.now());
  let isTest = false;
  if (active) {
    const [latest] = await db.select({ environment: customerPremiumPasses.environment }).from(customerPremiumPasses).where(eq(customerPremiumPasses.customerId, customerId)).orderBy(desc(customerPremiumPasses.endsAt)).limit(1);
    isTest = latest?.environment === "sandbox";
  }
  return { active, endsAt: endsAt?.toISOString() ?? null, isTest, daysLeft: active && endsAt ? Math.max(1, Math.ceil((endsAt.getTime() - Date.now()) / 86400000)) : 0 };
}
export async function requirePremium(customerId: number) {
  const status = await getPremiumStatus(customerId);
  if (!status.active) throw new PremiumError("PREMIUM_REQUIRED", "Cette fonctionnalité est réservée aux membres Premium. Activez votre pass pour y accéder.");
  return status;
}

/** One open pass request at a time: it carries the 2 000 FCFA GeniusPay payment. */
export async function ensurePassRequest(customer: { id: number; name: string }): Promise<number> {
  return getDb().transaction(async (tx) => {
    const open = await tx.select({ id: serviceRequests.id }).from(serviceRequests)
      .where(and(eq(serviceRequests.customerId, customer.id), eq(serviceRequests.service, PREMIUM_SERVICE), eq(serviceRequests.status, "in_progress")))
      .orderBy(desc(serviceRequests.createdAt)).limit(1).for("update");
    if (open[0]) return open[0].id;
    const [request] = await tx.insert(serviceRequests).values({
      customerId: customer.id, title: `Pass Premium · ${PREMIUM_DAYS} jours`, service: PREMIUM_SERVICE, status: "in_progress", quotedAmount: PREMIUM_PRICE,
      brief: `Accès Premium CARRIOVA pendant ${PREMIUM_DAYS} jours : recherche d’offres ciblée, préparation des candidatures et plan de préparation personnalisé.`,
    }).returning({ id: serviceRequests.id });
    await tx.insert(requestEvents).values([
      { requestId: request.id, type: "pass_requested", actorName: customer.name, body: "Pass Premium demandé.", status: "received" },
      { requestId: request.id, type: "in_progress", actorName: "CARRIOVA", body: `Règlement de ${PREMIUM_PRICE} FCFA attendu pour activer ${PREMIUM_DAYS} jours de Premium.`, status: "in_progress" },
    ]);
    return request.id;
  });
}

/** Called inside the payment transaction once a payment is confirmed. Idempotent per request. */
export async function activatePremiumPass(tx: Tx, requestId: number, environment: "live" | "sandbox", now: Date) {
  const [request] = await tx.select({ id: serviceRequests.id, customerId: serviceRequests.customerId, service: serviceRequests.service, quotedAmount: serviceRequests.quotedAmount })
    .from(serviceRequests).where(eq(serviceRequests.id, requestId)).for("update");
  if (!request || request.service !== PREMIUM_SERVICE) return;
  const [paid] = await tx.select({ total: sql<number>`coalesce(sum(${requestPayments.amount}), 0)::int` }).from(requestPayments)
    .where(and(eq(requestPayments.requestId, requestId), eq(requestPayments.status, "completed"), eq(requestPayments.environment, environment)));
  if ((paid?.total ?? 0) < (request.quotedAmount ?? PREMIUM_PRICE)) return;
  const [existing] = await tx.select({ id: customerPremiumPasses.id }).from(customerPremiumPasses).where(eq(customerPremiumPasses.requestId, requestId));
  if (existing) return;
  const [current] = await tx.select({ endsAt: max(customerPremiumPasses.endsAt) }).from(customerPremiumPasses).where(eq(customerPremiumPasses.customerId, request.customerId));
  // Renewing early adds 30 days after the current end, never loses remaining days.
  const startsAt = current?.endsAt && new Date(current.endsAt) > now ? new Date(current.endsAt) : now;
  const endsAt = new Date(startsAt.getTime() + PREMIUM_DAYS * 86400000);
  await tx.insert(customerPremiumPasses).values({ customerId: request.customerId, requestId, environment, startsAt, endsAt });
  await tx.update(serviceRequests).set({ status: "completed", updatedAt: now }).where(eq(serviceRequests.id, requestId));
  await tx.insert(requestEvents).values({ requestId, type: "status_changed", actorName: "CARRIOVA", status: "completed", createdAt: now,
    body: `Premium activé jusqu’au ${endsAt.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}.` });
}

/* ---------- Applications ---------- */
export async function listApplications(customerId: number) {
  return getDb().select().from(premiumApplications).where(eq(premiumApplications.customerId, customerId)).orderBy(desc(premiumApplications.updatedAt)).limit(200);
}
export async function getApplication(customerId: number, id: number) {
  const [row] = await getDb().select().from(premiumApplications).where(and(eq(premiumApplications.id, id), eq(premiumApplications.customerId, customerId)));
  return row ?? null;
}
export async function applicationStats(customerId: number) {
  const rows = await getDb().select({ status: premiumApplications.status, total: count() }).from(premiumApplications).where(eq(premiumApplications.customerId, customerId)).groupBy(premiumApplications.status);
  return Object.fromEntries(rows.map((row) => [row.status, Number(row.total)])) as Partial<Record<ApplicationStatus, number>>;
}
export async function aiRunsToday(customerId: number) {
  const [row] = await getDb().select({ total: count() }).from(premiumApplications)
    .where(and(eq(premiumApplications.customerId, customerId), gte(premiumApplications.kitGeneratedAt, sql`now() - interval '24 hours'`)));
  const [plan] = await getDb().select({ total: count() }).from(premiumPrepPlans)
    .where(and(eq(premiumPrepPlans.customerId, customerId), gte(premiumPrepPlans.generatedAt, sql`now() - interval '24 hours'`)));
  return Number(row?.total ?? 0) + Number(plan?.total ?? 0);
}
export async function assertAiQuota(customerId: number) {
  if (await aiRunsToday(customerId) >= PREMIUM_AI_DAILY_LIMIT) throw new PremiumError("AI_QUOTA", `Vous avez utilisé vos ${PREMIUM_AI_DAILY_LIMIT} générations IA des dernières 24 heures. Réessayez demain.`);
}
export async function getPrepPlan(customerId: number): Promise<{ plan: PrepPlan; generatedAt: string } | null> {
  const [row] = await getDb().select().from(premiumPrepPlans).where(eq(premiumPrepPlans.customerId, customerId));
  return row ? { plan: row.plan, generatedAt: row.generatedAt.toISOString() } : null;
}
