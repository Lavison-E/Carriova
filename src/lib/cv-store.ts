import "server-only";
import { and, count, desc, eq, gt, gte, lte, sql } from "drizzle-orm";
import { getDb } from "@/db";
import { cvAiRuns, cvDocuments } from "@/db/cv-schema";
import { CV_LIMITS, parseCvCreateInput, parseCvUpdateInput, parseCvVersion, type CvDocument } from "@/lib/cv";

export class CvStoreError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) { super(message); this.name = "CvStoreError"; }
}
const missing = () => new CvStoreError(404, "NOT_FOUND", "Ce CV est introuvable.");
const conflict = () => new CvStoreError(409, "VERSION_CONFLICT", "Ce CV a été modifié ailleurs. Rechargez-le avant de continuer.");
const validId = (id: number) => Number.isInteger(id) && id > 0 && id <= 2147483647;
const owner = (id: number, customerId: number) => and(eq(cvDocuments.id, id), eq(cvDocuments.customerId, customerId));
function document(row: typeof cvDocuments.$inferSelect): CvDocument {
  return { id: row.id, title: row.title, content: row.content, templateId: row.templateId, accent: row.accent, version: row.version, updatedAt: row.updatedAt.toISOString() };
}
// Callers must derive customerId from requireCustomer(), never from request data.
export async function getCustomerCv(id: number, customerId: number): Promise<CvDocument | null> {
  if (!validId(id) || !validId(customerId)) return null;
  const [row] = await getDb().select().from(cvDocuments).where(owner(id, customerId)).limit(1);
  return row ? document(row) : null;
}
export async function listCustomerCvs(customerId: number): Promise<CvDocument[]> {
  if (!validId(customerId)) throw missing();
  const rows = await getDb().select().from(cvDocuments).where(eq(cvDocuments.customerId, customerId)).orderBy(desc(cvDocuments.updatedAt), desc(cvDocuments.id)).limit(CV_LIMITS.documents);
  return rows.map(document);
}
export async function createCustomerCv(customerId: number, input: unknown, defaults: { name?: string; email?: string } = {}): Promise<CvDocument> {
  if (!validId(customerId)) throw missing();
  const values = parseCvCreateInput(input, defaults);
  return getDb().transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(71422027, ${customerId})`);
    const [total] = await tx.select({ value: count() }).from(cvDocuments).where(eq(cvDocuments.customerId, customerId));
    if (total.value >= CV_LIMITS.documents) throw new CvStoreError(429, "DOCUMENT_LIMIT", "Vous pouvez conserver 20 CV. Supprimez un ancien CV pour en créer un autre.");
    const [row] = await tx.insert(cvDocuments).values({ ...values, customerId }).returning();
    return document(row);
  });
}
export async function updateCustomerCv(id: number, customerId: number, input: unknown): Promise<CvDocument> {
  if (!validId(id) || !validId(customerId)) throw missing();
  const { version, ...values } = parseCvUpdateInput(input);
  return getDb().transaction(async tx => {
    const [previous] = await tx.select().from(cvDocuments).where(owner(id, customerId)).for("update");
    if (!previous) throw missing();
    if (previous.version !== version) throw conflict();
    const [row] = await tx.update(cvDocuments).set({ ...values, version: version + 1, updatedAt: sql`now()` }).where(and(owner(id, customerId), eq(cvDocuments.version, version))).returning();
    if (!row) throw conflict();
    return document(row);
  });
}
export async function deleteCustomerCv(id: number, customerId: number, expectedVersion: number): Promise<void> {
  if (!validId(id) || !validId(customerId)) throw missing();
  const version = parseCvVersion(expectedVersion);
  await getDb().transaction(async tx => {
    const [row] = await tx.select().from(cvDocuments).where(owner(id, customerId)).for("update");
    if (!row) throw missing();
    if (row.version !== version) throw conflict();
    await tx.delete(cvDocuments).where(and(owner(id, customerId), eq(cvDocuments.version, version)));
  });
}
export async function reserveCvAiRun(customerId: number, documentId: number, expectedVersion: number, requestId: string, options: { globalDailyLimit?: number } = {}): Promise<{ runId: number }> {
  if (!validId(customerId) || !validId(documentId)) throw missing();
  const version = parseCvVersion(expectedVersion);
  if (typeof requestId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(requestId)) throw new CvStoreError(400, "INVALID_REQUEST_ID", "L’identifiant de la demande est invalide.");
  const globalDailyLimit = options.globalDailyLimit ?? 200;
  if (!Number.isInteger(globalDailyLimit) || globalDailyLimit < 1 || globalDailyLimit > 10000) throw new CvStoreError(503, "AI_CONFIGURATION", "L’aide à la rédaction est momentanément indisponible.");
  return getDb().transaction(async tx => {
    // A short global lock makes the per-customer and global rolling quotas atomic.
    // The external provider call is always performed after this transaction commits.
    await tx.execute(sql`select pg_advisory_xact_lock(71422026, 0)`);
    const [row] = await tx.select().from(cvDocuments).where(owner(documentId, customerId)).for("update");
    if (!row) throw missing();
    if (row.version !== version) throw conflict();
    const key = requestId.toLowerCase();
    const [duplicate] = await tx.select({ id: cvAiRuns.id }).from(cvAiRuns).where(and(eq(cvAiRuns.customerId, customerId), eq(cvAiRuns.requestId, key))).limit(1);
    if (duplicate) throw new CvStoreError(409, "REQUEST_REUSED", "Cette demande a déjà été utilisée. Lancez une nouvelle demande.");
    await tx.update(cvAiRuns).set({ status: "failed", finishedAt: sql`now()`, errorCode: "LEASE_EXPIRED" }).where(and(eq(cvAiRuns.customerId, customerId), eq(cvAiRuns.status, "running"), lte(cvAiRuns.leaseExpiresAt, sql`now()`)));
    const [active] = await tx.select({ id: cvAiRuns.id }).from(cvAiRuns).where(and(eq(cvAiRuns.customerId, customerId), eq(cvAiRuns.status, "running"), gt(cvAiRuns.leaseExpiresAt, sql`now()`))).limit(1);
    if (active) throw new CvStoreError(409, "AI_IN_PROGRESS", "Une rédaction est déjà en cours. Patientez avant de réessayer.");
    const recent = gte(cvAiRuns.createdAt, sql`now() - interval '24 hours'`);
    const [personal] = await tx.select({ value: count() }).from(cvAiRuns).where(and(eq(cvAiRuns.customerId, customerId), recent));
    if (personal.value >= 10) throw new CvStoreError(429, "AI_DAILY_LIMIT", "Vous avez atteint 10 demandes de rédaction sur 24 heures. Réessayez plus tard.");
    const [global] = await tx.select({ value: count() }).from(cvAiRuns).where(recent);
    if (global.value >= globalDailyLimit) throw new CvStoreError(429, "AI_GLOBAL_LIMIT", "La capacité de rédaction du jour est atteinte. Réessayez plus tard.");
    const [run] = await tx.insert(cvAiRuns).values({ customerId, documentId, documentVersion: version, requestId: key, status: "running", leaseExpiresAt: sql`now() + interval '90 seconds'` }).returning({ id: cvAiRuns.id });
    return { runId: run.id };
  });
}
export type CvAiRunResult = { status: "succeeded" | "failed"; model?: string; inputTokens?: number; outputTokens?: number; errorCode?: string };
export async function finishCvAiRun(runId: number, customerId: number, result: CvAiRunResult): Promise<boolean> {
  if (!validId(runId) || !validId(customerId)) return false;
  if (!["succeeded", "failed"].includes(result.status)) throw new Error("Invalid AI run status");
  const model = typeof result.model === "string" && /^[A-Za-z0-9._:/-]{1,160}$/.test(result.model) ? result.model : null;
  const errorCode = typeof result.errorCode === "string" && /^[A-Z0-9_]{1,80}$/.test(result.errorCode) ? result.errorCode : null;
  const tokens = (value: number | undefined) => Number.isInteger(value) && value! >= 0 && value! <= 2147483647 ? value! : null;
  const rows = await getDb().update(cvAiRuns).set({ status: result.status, finishedAt: sql`now()`, model, inputTokens: tokens(result.inputTokens), outputTokens: tokens(result.outputTokens), errorCode }).where(and(eq(cvAiRuns.id, runId), eq(cvAiRuns.customerId, customerId), eq(cvAiRuns.status, "running"))).returning({ id: cvAiRuns.id });
  return rows.length === 1;
}
