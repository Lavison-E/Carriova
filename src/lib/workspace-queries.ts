import "server-only";

import { and, asc, count, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";
import { getDb } from "@/db";
import { customerUsers } from "@/db/customer-schema";
import { requestEvents, requestFiles, requestMessages, serviceRequests } from "@/db/workspace-schema";
import { requireCustomer } from "@/lib/customer-auth";
import { requireStaff } from "@/lib/staff-auth";
import { workspaceStatusOptions, type CustomerWorkspace, type TeamRequestFilters, type TeamRequests, type WorkspaceRequestDetail, type WorkspaceRequestSummary, type WorkspaceCustomerFile } from "@/lib/workspace";

const summaryColumns = {
  id: serviceRequests.id, title: serviceRequests.title, service: serviceRequests.service,
  status: serviceRequests.status, quotedAmount: serviceRequests.quotedAmount, dueAt: serviceRequests.dueAt,
  version: serviceRequests.version, customerName: customerUsers.name, customerEmail: customerUsers.email,
  createdAt: serviceRequests.createdAt, updatedAt: serviceRequests.updatedAt,
};
function summary(row: typeof serviceRequests.$inferSelect & { customerName: string; customerEmail: string }): WorkspaceRequestSummary;
function summary(row: Omit<WorkspaceRequestSummary, "createdAt" | "updatedAt" | "dueAt"> & { createdAt: Date; updatedAt: Date; dueAt: Date | null }): WorkspaceRequestSummary;
function summary(row: Omit<WorkspaceRequestSummary, "createdAt" | "updatedAt" | "dueAt"> & { createdAt: Date; updatedAt: Date; dueAt: Date | null }): WorkspaceRequestSummary {
  return { id: row.id, title: row.title, service: row.service, status: row.status, quotedAmount: row.quotedAmount,
    dueAt: row.dueAt?.toISOString() ?? null, version: row.version, customerName: row.customerName,
    customerEmail: row.customerEmail, createdAt: row.createdAt.toISOString(), updatedAt: row.updatedAt.toISOString() };
}

export async function getCustomerWorkspace(): Promise<CustomerWorkspace> {
  const customer = await requireCustomer();
  const rows = await getDb().select(summaryColumns).from(serviceRequests)
    .innerJoin(customerUsers, eq(customerUsers.id, serviceRequests.customerId))
    .where(eq(serviceRequests.customerId, customer.id)).orderBy(desc(serviceRequests.updatedAt), desc(serviceRequests.id));
  const requests = rows.map(summary);
  return { requests, stats: {
    total: requests.length,
    active: requests.filter((request) => !["completed", "cancelled"].includes(request.status)).length,
    awaitingResponse: requests.filter((request) => ["quoted", "delivered"].includes(request.status)).length,
    completed: requests.filter((request) => request.status === "completed").length,
  } };
}

export async function getTeamRequests(filters: TeamRequestFilters = {}): Promise<TeamRequests> {
  await requireStaff();
  const db = getDb();
  const conditions: SQL[] = [];
  if (workspaceStatusOptions.some((option) => option.value === filters.status)) {
    conditions.push(eq(serviceRequests.status, filters.status as typeof serviceRequests.$inferSelect.status));
  }
  const q = typeof filters.q === "string" ? filters.q.trim().slice(0, 160) : "";
  if (q) {
    const pattern = `%${q.replace(/[\\%_]/g, "\\$&")}%`;
    conditions.push(or(ilike(serviceRequests.title, pattern), ilike(customerUsers.name, pattern), ilike(customerUsers.email, pattern), ilike(serviceRequests.service, pattern))!);
  }
  const where = and(...conditions);
  const [totalRow] = await db.select({ total: count() }).from(serviceRequests)
    .innerJoin(customerUsers, eq(customerUsers.id, serviceRequests.customerId)).where(where);
  const total = totalRow.total;
  const pageSize = 50;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const requestedPage = Number(filters.page);
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? Math.min(requestedPage, totalPages) : 1;
  const order = filters.sort === "oldest" ? [asc(serviceRequests.createdAt), asc(serviceRequests.id)]
    : filters.sort === "due" ? [sql`${serviceRequests.dueAt} asc nulls last`, desc(serviceRequests.id)]
    : [desc(serviceRequests.updatedAt), desc(serviceRequests.id)];
  const rows = await db.select(summaryColumns).from(serviceRequests)
    .innerJoin(customerUsers, eq(customerUsers.id, serviceRequests.customerId)).where(where)
    .orderBy(...order).limit(pageSize).offset((page - 1) * pageSize);
  return { requests: rows.map(summary), total, page, pageSize, totalPages };
}

async function getRequest(id: number, customerId?: number): Promise<WorkspaceRequestDetail | null> {
  if (!Number.isSafeInteger(id) || id < 1) return null;
  const db = getDb();
  const where = customerId === undefined ? eq(serviceRequests.id, id) : and(eq(serviceRequests.id, id), eq(serviceRequests.customerId, customerId));
  const [row] = await db.select({ ...summaryColumns, brief: serviceRequests.brief }).from(serviceRequests)
    .innerJoin(customerUsers, eq(customerUsers.id, serviceRequests.customerId)).where(where).limit(1);
  if (!row) return null;
  // Customer delivery files become visible only after an explicit delivery event.
  const publishedFile = customerId === undefined ? undefined : or(eq(requestFiles.kind, "brief"), sql`exists (
    select 1 from ${requestEvents} where ${requestEvents.requestId} = ${requestFiles.requestId}
    and ${requestEvents.type} = 'delivered' and ${requestEvents.createdAt} >= ${requestFiles.createdAt}
  )`);
  const [messages, events, files] = await Promise.all([
    db.select({ id: requestMessages.id, authorType: requestMessages.authorType, authorName: requestMessages.authorName, body: requestMessages.body, createdAt: requestMessages.createdAt })
      .from(requestMessages).where(eq(requestMessages.requestId, id)).orderBy(asc(requestMessages.createdAt), asc(requestMessages.id)),
    db.select({ id: requestEvents.id, type: requestEvents.type, actorName: requestEvents.actorName, body: requestEvents.body, status: requestEvents.status, createdAt: requestEvents.createdAt })
      .from(requestEvents).where(eq(requestEvents.requestId, id)).orderBy(asc(requestEvents.createdAt), asc(requestEvents.id)),
    db.select({ id: requestFiles.id, filename: requestFiles.filename, mimeType: requestFiles.mimeType, size: requestFiles.size, kind: requestFiles.kind, uploadedByName: requestFiles.uploadedByName, createdAt: requestFiles.createdAt })
      .from(requestFiles).where(and(eq(requestFiles.requestId, id), publishedFile)).orderBy(asc(requestFiles.createdAt), asc(requestFiles.id)),
  ]);
  return { ...summary(row), brief: row.brief,
    messages: messages.map((message) => ({ ...message, createdAt: message.createdAt.toISOString() })),
    events: events.map((event) => ({ ...event, createdAt: event.createdAt.toISOString() })),
    files: files.map((file) => ({ ...file, createdAt: file.createdAt.toISOString() })),
  };
}
export async function getCustomerRequest(id: number): Promise<WorkspaceRequestDetail | null> {
  const customer = await requireCustomer();
  return getRequest(id, customer.id);
}
export async function getTeamRequest(id: number): Promise<WorkspaceRequestDetail | null> {
  await requireStaff();
  return getRequest(id);
}

export async function getCustomerFiles(): Promise<WorkspaceCustomerFile[]> {
  const customer = await requireCustomer();
  const files = await getDb().select({ id: requestFiles.id, requestId: requestFiles.requestId, requestTitle: serviceRequests.title,
    filename: requestFiles.filename, mimeType: requestFiles.mimeType, size: requestFiles.size, kind: requestFiles.kind,
    uploadedByName: requestFiles.uploadedByName, createdAt: requestFiles.createdAt })
    .from(requestFiles).innerJoin(serviceRequests, eq(serviceRequests.id, requestFiles.requestId))
    .where(and(eq(serviceRequests.customerId, customer.id), or(eq(requestFiles.kind, "brief"), sql`exists (
      select 1 from ${requestEvents} where ${requestEvents.requestId} = ${requestFiles.requestId}
      and ${requestEvents.type} = 'delivered' and ${requestEvents.createdAt} >= ${requestFiles.createdAt}
    )`))).orderBy(desc(requestFiles.createdAt), desc(requestFiles.id));
  return files.map((file) => ({ ...file, createdAt: file.createdAt.toISOString() }));
}
