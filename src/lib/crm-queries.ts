import "server-only";
import { and, count, desc, eq, gte, ilike, inArray, isNull, lt, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { crmHistory, crmLeadState, qualifications } from "@/db/crm-schema";
import { requireStaff } from "@/lib/staff-auth";
import { crmStatusOptions, type CrmDashboard, type CrmFilters, type CrmLeadDetail, type CrmLeadSummary, type CrmPriority, type CrmStatus } from "@/lib/crm";
import { normalizeQualificationPhone, qualificationOptions } from "@/lib/qualification";

const statusColumn = sql<CrmStatus>`coalesce(${crmLeadState.status}, 'new')`;
const columns = {
  id: leads.id, firstName: leads.firstName, lastName: leads.lastName, email: leads.email,
  whatsapp: leads.whatsapp, country: qualifications.country, need: qualifications.need,
  profile: qualifications.profile, budget: qualifications.budget, legacyInterest: leads.interest,
  status: statusColumn, priority: sql<CrmPriority>`coalesce(${crmLeadState.priority}, 'normal')`,
  followUpAt: crmLeadState.followUpAt, createdAt: leads.createdAt,
  updatedAt: crmLeadState.updatedAt, version: sql<number>`coalesce(${crmLeadState.version}, 0)`,
  source: leads.source, contactWhatsApp: qualifications.contactWhatsApp,
};
type SummaryRow = {
  id: number; firstName: string; lastName: string | null; email: string; whatsapp: string | null;
  country: string | null; need: string | null; profile: string | null; budget: string | null;
  legacyInterest: string | null; status: CrmStatus; priority: CrmPriority;
  followUpAt: Date | null; createdAt: Date; updatedAt: Date | null; version: number;
  source: string | null; contactWhatsApp: boolean | null;
};
function summary(row: SummaryRow): CrmLeadSummary {
  return {
    id: row.id, fullName: [row.firstName, row.lastName].filter(Boolean).join(" "),
    email: row.email || null, whatsapp: row.whatsapp, country: row.country,
    need: row.need ?? row.legacyInterest, profile: row.profile, budget: row.budget,
    status: row.status, priority: row.priority, followUpAt: row.followUpAt?.toISOString() ?? null,
    createdAt: row.createdAt.toISOString(), updatedAt: (row.updatedAt ?? row.createdAt).toISOString(),
    version: Number(row.version), source: row.source,
    canContactWhatsApp: row.contactWhatsApp === true && Boolean(normalizeQualificationPhone(row.whatsapp ?? "")),
  };
}
function literalLike(value: string) { return value.replace(/[\\%_]/g, "\\$&"); }

export async function getCrmDashboard(filters: CrmFilters = {}): Promise<CrmDashboard> {
  await requireStaff();
  const db = getDb();
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);
  const clauses: SQL[] = [];
  const q = typeof filters.q === "string" ? filters.q.trim().slice(0, 160) : "";
  if (q) {
    const pattern = `%${literalLike(q)}%`;
    const matchingStatuses = crmStatusOptions.filter((option) => option.label.toLocaleLowerCase("fr").includes(q.toLocaleLowerCase("fr"))).map((option) => option.value);
    const matchingNeeds = qualificationOptions.need.filter((option) => option.label.toLocaleLowerCase("fr").includes(q.toLocaleLowerCase("fr"))).map((option) => option.value);
    clauses.push(or(
      ilike(sql`concat_ws(' ', ${leads.firstName}, ${leads.lastName})`, pattern),
      ilike(leads.whatsapp, pattern), ilike(statusColumn, pattern),
      ilike(qualifications.need, pattern), ilike(leads.interest, pattern),
      matchingStatuses.length ? inArray(statusColumn, matchingStatuses) : undefined,
      matchingNeeds.length ? inArray(qualifications.need, matchingNeeds) : undefined,
    )!);
  }
  if (filters.status) clauses.push(eq(statusColumn, filters.status));
  if (filters.need) clauses.push(or(eq(qualifications.need, filters.need), and(isNull(qualifications.need), eq(leads.interest, filters.need)))!);
  if (filters.due === "overdue") clauses.push(lt(crmLeadState.followUpAt, now));
  if (filters.due === "today") clauses.push(and(gte(crmLeadState.followUpAt, today), lt(crmLeadState.followUpAt, tomorrow))!);
  if (filters.due === "upcoming") clauses.push(gte(crmLeadState.followUpAt, tomorrow));
  if (filters.due === "none") clauses.push(isNull(crmLeadState.followUpAt));
  const where = and(...clauses);
  const [totals, metrics] = await Promise.all([
    db.select({ total: count() }).from(leads)
      .leftJoin(qualifications, eq(qualifications.leadId, leads.id))
      .leftJoin(crmLeadState, eq(crmLeadState.leadId, leads.id)).where(where),
    db.select({
      total: count(),
      new: sql<number>`count(*) filter (where ${statusColumn} = 'new')`.mapWith(Number),
      qualified: sql<number>`count(*) filter (where ${statusColumn} = 'qualified')`.mapWith(Number),
      overdue: sql<number>`count(*) filter (where ${crmLeadState.followUpAt} < ${now})`.mapWith(Number),
    }).from(leads).leftJoin(crmLeadState, eq(crmLeadState.leadId, leads.id)),
  ]);
  const total = totals[0]?.total ?? 0;
  const pageSize = 50;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const requestedPage = Number(filters.page ?? 1);
  const page = Number.isSafeInteger(requestedPage) ? Math.max(1, Math.min(requestedPage, totalPages)) : 1;
  const rows = await db.select(columns).from(leads)
    .leftJoin(qualifications, eq(qualifications.leadId, leads.id))
    .leftJoin(crmLeadState, eq(crmLeadState.leadId, leads.id))
    .where(where).orderBy(desc(leads.createdAt), desc(leads.id)).limit(pageSize).offset((page - 1) * pageSize);
  return {
    leads: rows.map(summary), total, page, pageSize, totalPages,
    stats: metrics[0] ?? { total: 0, new: 0, qualified: 0, overdue: 0 },
  };
}

export async function getCrmLead(id: number): Promise<CrmLeadDetail | null> {
  await requireStaff();
  if (!Number.isSafeInteger(id) || id < 1) return null;
  const db = getDb();
  const [row] = await db.select({ ...columns, message: leads.message,
    consentPrivacy: leads.consentPrivacy, consentMarketing: leads.consentMarketing,
    qualification: qualifications,
  }).from(leads)
    .leftJoin(qualifications, eq(qualifications.leadId, leads.id))
    .leftJoin(crmLeadState, eq(crmLeadState.leadId, leads.id)).where(eq(leads.id, id)).limit(1);
  if (!row) return null;
  const history = await db.select({
    id: crmHistory.id, action: crmHistory.action, actorId: crmHistory.actorId,
    actorName: crmHistory.actorName, note: crmHistory.note, previousStatus: crmHistory.previousStatus,
    status: crmHistory.status, createdAt: crmHistory.createdAt, changes: crmHistory.changes,
  }).from(crmHistory).where(eq(crmHistory.leadId, id)).orderBy(desc(crmHistory.createdAt), desc(crmHistory.id));
  const qualification = row.qualification;
  return {
    ...summary(row), message: row.message, consentPrivacy: row.consentPrivacy,
    consentMarketing: row.consentMarketing,
    qualification: qualification ? {
      discoverySource: qualification.discoverySource, cvStatus: qualification.cvStatus,
      timeline: qualification.timeline, targetOffer: qualification.targetOffer,
      difficulty: qualification.difficulty, budget: qualification.budget,
      paymentReadiness: qualification.paymentReadiness,
      contactWhatsApp: qualification.contactWhatsApp ? "yes" : "no",
      consentVersion: qualification.consentVersion, submittedAt: qualification.submittedAt.toISOString(),
    } : null,
    history: history.map((item) => ({ ...item, createdAt: item.createdAt.toISOString() })),
  };
}
