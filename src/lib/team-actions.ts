"use server";

import { randomBytes } from "node:crypto";
import { and, asc, count, eq, gt, inArray, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getDb } from "@/db";
import { staffInvites } from "@/db/staff-invite-schema";
import { staffSessions, staffUsers } from "@/db/staff-schema";
import { teamAudit } from "@/db/team-schema";
import { serverEnv } from "@/lib/env";
import { requireStaff, STAFF_COOKIE, tokenHash, UnauthorizedError, type StaffIdentity } from "@/lib/staff-auth";
import { DUMMY_PASSWORD_HASH } from "@/lib/staff-password.mjs";
import { renderTransactionalEmail } from "@/lib/transactional-email.mjs";
import { teamRoleLabels, validateTeamInvitation, validateTeamMutation, type TeamActionState, type TeamRole } from "@/lib/team-management";

type Transaction = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
type StaffRow = typeof staffUsers.$inferSelect;
type Invitation = { token: string; user: StaffRow; actor: StaffRow };
type AdminContext = StaffIdentity & { sessionHash: string };
class TeamError extends Error {}

function unavailable(): TeamActionState {
  return { ok: false, message: "L’action n’a pas pu être enregistrée. Réessayez dans un instant." };
}
function failure(error: unknown): TeamActionState {
  if (error instanceof UnauthorizedError) return { ok: false, message: "Votre accès administrateur n’est plus valide. Reconnectez-vous pour continuer." };
  if (error instanceof TeamError) return { ok: false, message: error.message };
  return unavailable();
}
async function identity() {
  const actor = await requireStaff();
  const token = (await cookies()).get(STAFF_COOKIE)?.value;
  if (actor.role !== "admin" || !token || !/^[A-Za-z0-9_-]{43}$/.test(token)) throw new UnauthorizedError();
  return { ...actor, sessionHash: tokenHash(token) };
}

async function lockAccounts(tx: Transaction, actor: AdminContext, targetId?: number) {
  // Serialize all team mutations, including the last-admin check. Lock rows in a stable order.
  await tx.execute(sql`SELECT pg_advisory_xact_lock(20261107)`);
  const rows = await tx.select().from(staffUsers)
    .where(inArray(staffUsers.id, targetId ? [actor.id, targetId] : [actor.id]))
    .orderBy(asc(staffUsers.id)).for("update");
  const currentActor = rows.find((row) => row.id === actor.id);
  if (!currentActor || !currentActor.enabled || currentActor.deletedAt || currentActor.role !== "admin") throw new UnauthorizedError();
  // A session revoked while this request waited for the lock cannot authorize a write.
  const [session] = await tx.select({ userId: staffSessions.userId }).from(staffSessions).where(and(
    eq(staffSessions.tokenHash, actor.sessionHash), eq(staffSessions.userId, actor.id), gt(staffSessions.expiresAt, new Date()),
  )).limit(1);
  if (!session) throw new UnauthorizedError();
  return { actor: currentActor, target: rows.find((row) => row.id === targetId) };
}
async function audit(tx: Transaction, actor: StaffRow, target: StaffRow, action: string, details: string) {
  await tx.insert(teamAudit).values({ actorId: actor.id, actorName: actor.name, targetId: target.id, targetName: target.name, action, details });
}
async function limitInvitations(tx: Transaction, actorId: number, targetId?: number) {
  const actions = inArray(teamAudit.action, ["invited", "invitation_renewed"]);
  const [recent] = await tx.select({ total: count() }).from(teamAudit).where(and(
    eq(teamAudit.actorId, actorId), actions, gt(teamAudit.createdAt, new Date(Date.now() - 60 * 60_000)),
  ));
  if (recent.total >= 10) throw new TeamError("La limite de dix invitations par heure est atteinte. Réessayez plus tard.");
  if (targetId) {
    const [last] = await tx.select({ id: teamAudit.id }).from(teamAudit).where(and(
      eq(teamAudit.targetId, targetId), actions, gt(teamAudit.createdAt, new Date(Date.now() - 60_000)),
    )).limit(1);
    if (last) throw new TeamError("Patientez une minute avant de renvoyer une invitation à ce compte.");
  }
}
function ensureMailConfigured() {
  if (!serverEnv.email.transactionalEnabled) throw new TeamError("L’envoi des invitations est indisponible. Vérifiez la configuration Resend avant de réessayer.");
}
async function makeInvitation(tx: Transaction, user: StaffRow, actor: StaffRow): Promise<Invitation> {
  const token = randomBytes(32).toString("base64url");
  await tx.delete(staffInvites).where(eq(staffInvites.userId, user.id));
  await tx.insert(staffInvites).values({ tokenHash: tokenHash(token), userId: user.id, expiresAt: new Date(Date.now() + 24 * 60 * 60_000) });
  await tx.delete(staffSessions).where(eq(staffSessions.userId, user.id));
  return { token, user, actor };
}
async function deliverInvitation(invitation: Invitation): Promise<TeamActionState> {
  let sent = false;
  try {
    const url = new URL("/admin/activer", serverEnv.NEXT_PUBLIC_SITE_URL);
    url.searchParams.set("token", invitation.token);
    const role = teamRoleLabels[invitation.user.role as TeamRole].toLocaleLowerCase("fr");
    const body = `Bonjour ${invitation.user.name},\n\nVous êtes invité(e) à rejoindre l’équipe Carriova avec le rôle ${role}. Choisissez votre mot de passe pour activer votre accès.`;
    const response = await fetch(new URL("emails", serverEnv.email.baseUrl.replace(/\/$/, "") + "/"), {
      method: "POST",
      headers: { Authorization: `Bearer ${serverEnv.email.apiKey}`, "Content-Type": "application/json", "Idempotency-Key": `carriova-staff-invite-${tokenHash(invitation.token)}` },
      body: JSON.stringify({ from: serverEnv.email.transactionalFrom, reply_to: serverEnv.SUPPORT_EMAIL, to: [invitation.user.email],
        subject: "Votre invitation à l’équipe Carriova",
        html: renderTransactionalEmail({ title: "Bienvenue dans l’équipe Carriova", body, actionLabel: "Activer mon accès équipe",
          actionUrl: url.href, supportEmail: serverEnv.SUPPORT_EMAIL,
          note: "Ce lien est personnel, valable 24 heures et utilisable une seule fois. Si vous ne l’attendiez pas, ignorez ce message." }),
        text: `${body}\n\n${url.href}\n\nCe lien est personnel, valable 24 heures et utilisable une seule fois.\nAssistance : ${serverEnv.SUPPORT_EMAIL}`,
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (response.ok) {
      const result: unknown = await response.json();
      sent = typeof result === "object" && result !== null && "id" in result && typeof result.id === "string" && /^[A-Za-z0-9_-]{1,128}$/.test(result.id);
    }
  } catch { /* Provider details and invitation tokens must never enter logs or the UI. */ }
  try {
    await getDb().insert(teamAudit).values({ actorId: invitation.actor.id, actorName: invitation.actor.name,
      targetId: invitation.user.id, targetName: invitation.user.name,
      action: sent ? "invite_sent" : "invite_delivery_failed",
      details: sent ? "Invitation acceptée par le service d’envoi." : "Échec de l’envoi. Le compte reste en attente ; une nouvelle invitation peut être envoyée.",
    });
  } catch {
    revalidatePath("/admin/equipe");
    return { ok: false, message: "L’invitation a été enregistrée, mais son suivi d’envoi est indisponible. Rechargez la page avant de réessayer." };
  }
  revalidatePath("/admin/equipe");
  return sent
    ? { ok: true, message: "L’invitation a été envoyée. Le destinataire dispose de 24 heures pour activer son accès." }
    : { ok: false, message: "Le compte est enregistré en attente, mais l’e-mail n’a pas pu être envoyé. Rechargez la page puis renvoyez l’invitation après une minute." };
}

export async function inviteTeamMember(_previous: TeamActionState, data: FormData): Promise<TeamActionState> {
  try {
    const session = await identity();
    const input = validateTeamInvitation(data);
    if (Object.keys(input.fieldErrors).length) return { ok: false, message: "Vérifiez les champs indiqués.", fieldErrors: input.fieldErrors };
    ensureMailConfigured();
    const invitation = await getDb().transaction(async (tx) => {
      const { actor } = await lockAccounts(tx, session);
      await limitInvitations(tx, actor.id);
      const [existing] = await tx.select({ id: staffUsers.id }).from(staffUsers).where(sql`lower(${staffUsers.email}) = ${input.email}`).limit(1);
      if (existing) throw new TeamError("Cette adresse appartient déjà à un compte équipe. Utilisez sa fiche pour gérer son accès ou renvoyer une invitation.");
      const [user] = await tx.insert(staffUsers).values({ email: input.email, name: input.name, role: input.role,
        passwordHash: DUMMY_PASSWORD_HASH, enabled: false,
      }).returning();
      const result = await makeInvitation(tx, user, actor);
      await audit(tx, actor, user, "invited", `Compte invité avec le rôle ${teamRoleLabels[input.role]}.`);
      return result;
    });
    return deliverInvitation(invitation);
  } catch (error) { return failure(error); }
}

export async function manageTeamMember(_previous: TeamActionState, data: FormData): Promise<TeamActionState> {
  let invitation: Invitation | undefined;
  try {
    const session = await identity();
    const input = validateTeamMutation(data);
    if (Object.keys(input.fieldErrors).length) return { ok: false, message: "Vérifiez les champs indiqués.", fieldErrors: input.fieldErrors };
    if (input.operation === "resend_invitation") ensureMailConfigured();
    const outcome = await getDb().transaction(async (tx) => {
      const { actor, target } = await lockAccounts(tx, session, input.memberId);
      if (!target) throw new TeamError("Ce compte n’existe pas.");
      if (target.version !== input.version) throw new TeamError("Ce compte a été modifié depuis son ouverture. Rechargez la page avant de continuer.");
      if (target.deletedAt && input.operation !== "restore") throw new TeamError("Restaurez ce compte supprimé avant de modifier son accès.");
      if (!target.deletedAt && input.operation === "restore") throw new TeamError("Ce compte n’est pas supprimé.");
      const roleChanged = input.operation === "update" && input.role !== target.role;
      if (actor.id === target.id && (roleChanged || ["disable", "delete"].includes(input.operation)))
        throw new TeamError("Vous ne pouvez pas retirer votre propre accès administrateur. Demandez à un autre administrateur.");
      const removesAdmin = target.enabled && !target.deletedAt && target.role === "admin" &&
        (roleChanged || ["disable", "delete"].includes(input.operation));
      if (removesAdmin) {
        const [admins] = await tx.select({ total: count() }).from(staffUsers).where(and(eq(staffUsers.enabled, true), eq(staffUsers.role, "admin"), isNull(staffUsers.deletedAt)));
        if (admins.total <= 1) throw new TeamError("Conservez au moins un administrateur actif avant de retirer cet accès.");
      }
      const next: Partial<typeof staffUsers.$inferInsert> = { version: target.version + 1 };
      let action: string = input.operation, details: string, message: string;
      let revoke = false, revokeInvites = false, send = false;
      switch (input.operation) {
        case "update":
          next.name = input.name; next.role = input.role;
          revoke = roleChanged; revokeInvites = roleChanged;
          action = roleChanged ? "role_changed" : "updated";
          details = roleChanged ? `Rôle modifié : ${teamRoleLabels[target.role as TeamRole]} → ${teamRoleLabels[input.role]}. Sessions et anciennes invitations révoquées.` : "Nom du membre mis à jour.";
          message = roleChanged ? "Le rôle a été modifié et les sessions révoquées. Un compte en attente doit recevoir une nouvelle invitation." : "Le compte a été mis à jour.";
          break;
        case "disable":
          if (!target.enabled) throw new TeamError("Ce compte est déjà désactivé.");
          next.enabled = false; revoke = true; revokeInvites = true;
          details = "Accès désactivé ; sessions et invitations révoquées."; message = "Le compte est désactivé et ses sessions sont fermées.";
          break;
        case "enable":
          if (target.enabled) throw new TeamError("Ce compte est déjà actif.");
          if (target.passwordHash === DUMMY_PASSWORD_HASH) throw new TeamError("Ce compte doit d’abord définir son mot de passe. Envoyez-lui une invitation.");
          next.enabled = true; revoke = true; revokeInvites = true;
          details = "Accès réactivé ; une nouvelle connexion est nécessaire."; message = "Le compte est réactivé. Le membre peut se reconnecter.";
          break;
        case "revoke_sessions":
          revoke = true; details = "Toutes les sessions de ce compte ont été révoquées."; message = "Les sessions du compte sont fermées.";
          break;
        case "delete":
          if (input.confirmEmail !== target.email.toLowerCase()) throw new TeamError("Recopiez l’adresse e-mail du compte pour confirmer sa suppression.");
          next.enabled = false; next.deletedAt = new Date(); revoke = true; revokeInvites = true;
          details = "Compte supprimé de l’équipe. Historique et dossiers conservés ; accès et invitations révoqués."; message = "Le compte a été supprimé de l’équipe. Son historique est conservé.";
          break;
        case "restore":
          next.deletedAt = null; next.enabled = false; revoke = true; revokeInvites = true;
          details = "Compte restauré avec accès désactivé."; message = "Le compte est restauré. Réactivez son accès ou envoyez une invitation s’il n’a pas encore été activé.";
          break;
        case "resend_invitation":
          if (target.enabled || target.passwordHash !== DUMMY_PASSWORD_HASH) throw new TeamError("Ce compte a déjà été activé. Une invitation ne peut pas remplacer son mot de passe.");
          await limitInvitations(tx, actor.id, target.id);
          send = true; action = "invitation_renewed";
          details = "Nouvelle invitation émise pour 24 heures ; le lien précédent est révoqué."; message = "Invitation renouvelée.";
          break;
      }
      const [updated] = await tx.update(staffUsers).set(next).where(and(eq(staffUsers.id, target.id), eq(staffUsers.version, input.version))).returning();
      if (!updated) throw new TeamError("Ce compte a été modifié. Rechargez la page avant de continuer.");
      if (revoke) await tx.delete(staffSessions).where(eq(staffSessions.userId, target.id));
      if (revokeInvites) await tx.delete(staffInvites).where(eq(staffInvites.userId, target.id));
      const pending = send ? await makeInvitation(tx, updated, actor) : undefined;
      await audit(tx, actor, updated, action, details);
      return { message, invitation: pending };
    });
    invitation = outcome.invitation;
    if (!invitation) {
      revalidatePath("/admin/equipe");
      revalidatePath("/admin", "layout");
      return { ok: true, message: outcome.message };
    }
  } catch (error) { return failure(error); }
  return deliverInvitation(invitation);
}
