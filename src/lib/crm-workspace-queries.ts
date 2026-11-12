import "server-only";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { customerLeadClaims, customerUsers } from "@/db/customer-schema";
import { serviceRequests } from "@/db/workspace-schema";
import type { CrmLeadWorkspace } from "@/lib/crm";
import { normalizeQualificationPhone } from "@/lib/qualification";
import { requireStaff } from "@/lib/staff-auth";
import { isWorkspaceFilePublished } from "@/lib/workspace";
import { getTeamRequest } from "@/lib/workspace-queries";

/** Client space of a prospect: linked request, pending invitation and accounts sharing its WhatsApp number. */
export async function getCrmLeadWorkspace(leadId: number, leadWhatsApp: string | null): Promise<CrmLeadWorkspace> {
  await requireStaff();
  const db = getDb();
  const [linked] = await db.select({ id: serviceRequests.id }).from(serviceRequests).where(eq(serviceRequests.leadId, leadId)).limit(1);
  if (linked) {
    const request = await getTeamRequest(linked.id);
    if (request) return {
      request: {
        id: request.id, title: request.title, status: request.status, customerName: request.customerName,
        customerEmail: request.customerEmail, updatedAt: request.updatedAt, messages: request.messages,
        // Only what the client can already see: shared documents and published versions.
        files: request.files.filter((file) => isWorkspaceFilePublished(file, request.events)),
      },
      invitation: null, matchingAccounts: [],
    };
  }
  const [claim] = await db.select({ expiresAt: customerLeadClaims.expiresAt, claimedAt: customerLeadClaims.claimedAt })
    .from(customerLeadClaims).where(eq(customerLeadClaims.leadId, leadId)).limit(1);
  const phone = normalizeQualificationPhone(leadWhatsApp ?? "");
  const matchingAccounts = phone ? await db.select({ id: customerUsers.id, name: customerUsers.name, email: customerUsers.email })
    .from(customerUsers).where(and(eq(customerUsers.whatsapp, phone), eq(customerUsers.enabled, true))).limit(3) : [];
  return {
    request: null,
    invitation: claim && !claim.claimedAt ? { expiresAt: claim.expiresAt.toISOString(), active: claim.expiresAt.getTime() > Date.now() } : null,
    matchingAccounts,
  };
}
