"use server";

import { randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { crmHistory } from "@/db/crm-schema";
import { customerLeadClaims, customerUsers } from "@/db/customer-schema";
import { serviceRequests } from "@/db/workspace-schema";
import type { ActionState } from "@/lib/actions";
import type { CrmInvitationState } from "@/lib/crm";
import { customerTokenHash } from "@/lib/customer-auth";
import { attachLeadToCustomer } from "@/lib/customer-claims";
import { serverEnv } from "@/lib/env";
import { normalizeQualificationPhone } from "@/lib/qualification";
import { requireStaff, UnauthorizedError, type StaffIdentity } from "@/lib/staff-auth";
import { scheduleWorkspaceNotifications } from "@/lib/workspace-mail";

const INVITATION_DAYS = 7;
class CrmSpaceError extends Error {}
const text = (fd: FormData, key: string) => typeof fd.get(key) === "string" ? (fd.get(key) as string).trim() : "";
function positiveId(fd: FormData, key: string) {
  const value = text(fd, key);
  const id = Number(value);
  return /^[1-9]\d*$/.test(value) && Number.isSafeInteger(id) ? id : null;
}
async function asStaff<T extends ActionState | CrmInvitationState>(work: (actor: StaffIdentity) => Promise<T>): Promise<T | ActionState> {
  let actor: StaffIdentity;
  try { actor = await requireStaff(); }
  catch (error) {
    if (error instanceof UnauthorizedError) redirect("/admin/connexion");
    return { ok: false, message: "Le service est temporairement indisponible. Réessayez dans un instant." };
  }
  try { return await work(actor); }
  catch (error) {
    if (error instanceof CrmSpaceError) return { ok: false, message: error.message };
    return { ok: false, message: "L’opération n’a pas pu être enregistrée. Réessayez dans un instant." };
  }
}

/** Single-use link: the prospect creates an account (or signs in) and the dossier joins their private space. */
export async function createCrmLeadInvitation(_prev: CrmInvitationState, fd: FormData): Promise<CrmInvitationState> {
  return asStaff(async (actor) => {
    const leadId = positiveId(fd, "leadId");
    if (!leadId) throw new CrmSpaceError("Dossier invalide.");
    const token = randomBytes(32).toString("base64url");
    const expiresAt = new Date(Date.now() + INVITATION_DAYS * 24 * 60 * 60 * 1000);
    await getDb().transaction(async (tx) => {
      const [lead] = await tx.select({ id: leads.id }).from(leads).where(eq(leads.id, leadId)).for("update");
      if (!lead) throw new CrmSpaceError("Ce dossier n’existe plus.");
      const [linked] = await tx.select({ id: serviceRequests.id }).from(serviceRequests).where(eq(serviceRequests.leadId, leadId)).limit(1);
      if (linked) throw new CrmSpaceError("Ce dossier est déjà rattaché à un espace client. Rechargez la page pour échanger avec le client.");
      // One active link per dossier: a new link disables the previous one.
      await tx.delete(customerLeadClaims).where(eq(customerLeadClaims.leadId, leadId));
      await tx.insert(customerLeadClaims).values({ tokenHash: customerTokenHash(token), leadId, expiresAt });
      await tx.insert(crmHistory).values({ leadId, action: "invitation_created", actorId: actor.id, actorName: actor.name, changes: { expiresAt: expiresAt.toISOString() } });
    });
    revalidatePath(`/admin/crm/${leadId}`);
    const url = new URL("/compte/invitation", serverEnv.NEXT_PUBLIC_SITE_URL);
    url.searchParams.set("code", token);
    return { ok: true, message: "Lien d’invitation créé. Copiez-le maintenant : il ne sera plus affiché après le rechargement de la page.", invitationUrl: url.href, expiresAt: expiresAt.toISOString() };
  }) as Promise<CrmInvitationState>;
}

/** Attaches the dossier to an existing account that registered the same WhatsApp number. */
export async function linkCrmLeadToCustomer(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return asStaff(async (actor) => {
    const leadId = positiveId(fd, "leadId");
    const customerId = positiveId(fd, "customerId");
    if (!leadId || !customerId) throw new CrmSpaceError("Choisissez un compte valide.");
    const requestId = await getDb().transaction(async (tx) => {
      const [lead] = await tx.select({ id: leads.id, whatsapp: leads.whatsapp }).from(leads).where(eq(leads.id, leadId)).for("update");
      if (!lead) throw new CrmSpaceError("Ce dossier n’existe plus.");
      const phone = normalizeQualificationPhone(lead.whatsapp ?? "");
      const [customer] = phone ? await tx.select({ id: customerUsers.id, name: customerUsers.name, email: customerUsers.email }).from(customerUsers)
        .where(and(eq(customerUsers.id, customerId), eq(customerUsers.whatsapp, phone), eq(customerUsers.enabled, true))).limit(1) : [];
      if (!customer) throw new CrmSpaceError("Ce compte ne correspond pas au numéro WhatsApp du prospect.");
      const id = await attachLeadToCustomer(tx, leadId, customer);
      if (!id) throw new CrmSpaceError("Ce dossier est déjà rattaché à un espace client. Rechargez la page.");
      await tx.delete(customerLeadClaims).where(eq(customerLeadClaims.leadId, leadId));
      await tx.insert(crmHistory).values({ leadId, action: "linked_to_customer", actorId: actor.id, actorName: actor.name, note: `Dossier rattaché au compte de ${customer.name} (${customer.email}).`, changes: { customerId: customer.id, requestId: id } });
      return id;
    });
    scheduleWorkspaceNotifications({ requestId });
    revalidatePath(`/admin/crm/${leadId}`);
    revalidatePath("/admin/commandes");
    return { ok: true, requestId, message: "Le dossier est rattaché à l’espace du client. Vous pouvez maintenant lui écrire et partager des documents." };
  });
}
