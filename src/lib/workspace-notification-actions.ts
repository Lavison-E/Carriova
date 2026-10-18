"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionState } from "@/lib/actions";
import { requireStaff, UnauthorizedError } from "@/lib/staff-auth";
import { drainWorkspaceNotifications } from "@/lib/workspace-mail";

export async function retryWorkspaceNotifications(_previous: ActionState, _formData: FormData): Promise<ActionState> {
  try {
    await requireStaff();
    const result = await drainWorkspaceNotifications({ force: true, limit: 6 });
    revalidatePath("/admin/notifications");
    if (!result.configured) return { ok: false, message: "L’envoi transactionnel n’est pas configuré. Les notifications restent en attente." };
    if (!result.attempted) return { ok: true, message: "Aucune notification à relancer pour le moment. Un envoi déjà en cours reste protégé par son verrou." };
    return { ok: result.pending === 0, message: `${result.sent} notification(s) acceptée(s) par le service d’envoi ; ${result.pending} encore en attente. L’acceptation ne confirme pas la réception dans la boîte destinataire.` };
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect("/admin/connexion");
    return { ok: false, message: "La relance est temporairement indisponible. Les demandes et la file d’attente sont conservées." };
  }
}
