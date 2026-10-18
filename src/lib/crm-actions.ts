"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { leads } from "@/db/schema";
import { crmHistory, crmLeadState } from "@/db/crm-schema";
import type { ActionState } from "@/lib/actions";
import { crmPriorityOptions, crmStatusOptions, type CrmPriority, type CrmStatus } from "@/lib/crm";
import { requireStaff, UnauthorizedError, type StaffIdentity } from "@/lib/staff-auth";

class CrmConflictError extends Error {}
class CrmNotFoundError extends Error {}

export async function updateCrmLead(_prev: ActionState, formData: FormData): Promise<ActionState> {
  let actor: StaffIdentity;
  try {
    actor = await requireStaff();
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect("/admin/connexion");
    return { ok: false, message: "Le service est temporairement indisponible. Réessayez dans un instant." };
  }
  const text = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  const leadId = Number(text("leadId"));
  const version = Number(text("version"));
  const status = text("status");
  const priority = text("priority");
  const note = text("note");
  const rawFollowUpAt = text("followUpAt");
  const followUpAt = rawFollowUpAt ? new Date(rawFollowUpAt) : null;
  const fieldErrors: Record<string, string> = {};
  if (!/^[1-9]\d*$/.test(text("leadId")) || !Number.isSafeInteger(leadId)) fieldErrors.leadId = "Dossier invalide.";
  if (!/^\d+$/.test(text("version")) || !Number.isSafeInteger(version)) fieldErrors.version = "Rechargez le dossier avant de le modifier.";
  if (!crmStatusOptions.some((option) => option.value === status)) fieldErrors.status = "Choisissez un statut valide.";
  if (!crmPriorityOptions.some((option) => option.value === priority)) fieldErrors.priority = "Choisissez une priorité valide.";
  if (note.length > 4000) fieldErrors.note = "Limitez la note à 4 000 caractères.";
  if (followUpAt && (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(rawFollowUpAt) ||
    !Number.isFinite(followUpAt.getTime()) ||
    followUpAt.toISOString() !== (rawFollowUpAt.includes(".") ? rawFollowUpAt : rawFollowUpAt.replace("Z", ".000Z"))
  )) fieldErrors.followUpAt = "Indiquez une date de relance valide.";
  if (Object.keys(fieldErrors).length) return { ok: false, message: "Vérifiez les champs indiqués.", fieldErrors };

  try {
    await getDb().transaction(async (tx) => {
      const [lead] = await tx.select({ id: leads.id }).from(leads).where(eq(leads.id, leadId)).limit(1);
      if (!lead) throw new CrmNotFoundError();
      // Les prospects historiques apparaissent « Nouveau » avant leur première modification.
      await tx.insert(crmLeadState).values({ leadId }).onConflictDoNothing({ target: crmLeadState.leadId });
      const [current] = await tx.select().from(crmLeadState).where(eq(crmLeadState.leadId, leadId)).for("update");
      if (!current || current.version !== version) throw new CrmConflictError();
      const [updated] = await tx.update(crmLeadState).set({
        status: status as CrmStatus, priority: priority as CrmPriority,
        followUpAt, version: version + 1, updatedAt: new Date(),
      }).where(and(eq(crmLeadState.leadId, leadId), eq(crmLeadState.version, version)))
        .returning({ leadId: crmLeadState.leadId });
      if (!updated) throw new CrmConflictError();
      await tx.insert(crmHistory).values({
        leadId, action: note ? "updated_with_note" : "updated", actorId: actor.id,
        actorName: actor.name, note: note || null, previousStatus: current.status, status,
        changes: {
          status: { from: current.status, to: status },
          priority: { from: current.priority, to: priority },
          followUpAt: { from: current.followUpAt?.toISOString() ?? null, to: followUpAt?.toISOString() ?? null },
        },
      });
    });
  } catch (error) {
    if (error instanceof CrmConflictError) return { ok: false, message: "Ce dossier a été modifié par un autre conseiller. Rechargez la page avant d’enregistrer vos changements." };
    if (error instanceof CrmNotFoundError) return { ok: false, message: "Ce dossier n’existe plus." };
    return { ok: false, message: "Les modifications n’ont pas pu être enregistrées. Réessayez dans un instant." };
  }
  revalidatePath("/admin/crm");
  revalidatePath(`/admin/crm/${leadId}`);
  return { ok: true, message: "Le dossier a été mis à jour." };
}
