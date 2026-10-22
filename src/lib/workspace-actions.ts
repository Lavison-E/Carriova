"use server";

import { createHash } from "node:crypto";
import { and, count, desc, eq, gt, gte, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/db";
import { requestEvents, requestFiles, requestMessages, serviceRequests } from "@/db/workspace-schema";
import { scheduleWorkspaceNotifications } from "@/lib/workspace-mail";
import type { ActionState } from "@/lib/actions";
import { CustomerUnauthorizedError, requireCustomer } from "@/lib/customer-auth";
import { requireStaff, UnauthorizedError } from "@/lib/staff-auth";
import { validateWorkspaceFile, WorkspaceFileValidationError } from "@/lib/workspace-files";
import { staffRequestTransitions, WORKSPACE_MAX_FILES, workspaceServiceOptions, workspaceStatusLabel, workspaceStatusOptions, type WorkspaceContext, type WorkspaceStatus } from "@/lib/workspace";

type Actor = { id: number; name: string; type: "customer" | "staff" };
type Transaction = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
class WorkspaceError extends Error {}
const text = (fd: FormData, key: string) => typeof fd.get(key) === "string" ? (fd.get(key) as string).trim() : "";
const failure = (message: string, fieldErrors?: Record<string, string>): ActionState => ({ ok: false, message, ...(fieldErrors ? { fieldErrors } : {}) });
const contextFor = (fd: FormData): WorkspaceContext => text(fd, "context") === "team" ? "team" : "customer";

async function asActor(context: WorkspaceContext, work: (actor: Actor) => Promise<ActionState>): Promise<ActionState> {
  try {
    const user = context === "team" ? await requireStaff() : await requireCustomer();
    return await work({ id: user.id, name: user.name, type: context === "team" ? "staff" : "customer" });
  } catch (error) {
    if (error instanceof CustomerUnauthorizedError) redirect("/compte/connexion");
    if (error instanceof UnauthorizedError) redirect("/admin/connexion");
    if (error instanceof WorkspaceError || error instanceof WorkspaceFileValidationError) return failure(error.message);
    return failure("Le service est temporairement indisponible. Votre modification n’a pas pu être enregistrée.");
  }
}
function requestId(fd: FormData) {
  const value = text(fd, "requestId");
  const id = Number(value);
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(id)) throw new WorkspaceError("Demande introuvable.");
  return id;
}
function versionOf(fd: FormData) {
  const value = text(fd, "version");
  const version = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(version)) throw new WorkspaceError("Rechargez la demande avant de la modifier.");
  return version;
}
async function lockedRequest(tx: Transaction, id: number, actor: Actor) {
  const scope = actor.type === "customer" ? and(eq(serviceRequests.id, id), eq(serviceRequests.customerId, actor.id)) : eq(serviceRequests.id, id);
  const [request] = await tx.select().from(serviceRequests).where(scope).for("update");
  if (!request) throw new WorkspaceError("Demande introuvable.");
  return request;
}
function checkVersion(current: number, expected: number) {
  if (current !== expected) throw new WorkspaceError("Cette demande a été modifiée. Rechargez la page avant de réessayer.");
}
function requireOpen(status: WorkspaceStatus) {
  if (status === "completed" || status === "cancelled") throw new WorkspaceError("Cette demande est clôturée.");
}
function invalidate(id?: number) {
  revalidatePath("/espace");
  revalidatePath("/espace/documents");
  revalidatePath("/admin/commandes");
  if (id) {
    scheduleWorkspaceNotifications({ requestId: id });
    revalidatePath(`/espace/demandes/${id}`);
    revalidatePath(`/admin/commandes/${id}`);
  }
}
async function customerQuota(tx: Transaction, actor: Actor, scope: string, limit: number, seconds: number, explanation: string) {
  if (actor.type !== "customer") return;
  const key = createHash("sha256").update(`workspace:${scope}:${actor.id}`).digest("hex");
  const result = await tx.execute(sql`INSERT INTO staff_login_attempts (key, attempts, reset_at)
    VALUES (${key}, 1, now() + ${seconds} * interval '1 second')
    ON CONFLICT (key) DO UPDATE SET
      attempts = CASE WHEN staff_login_attempts.reset_at <= now() THEN 1 ELSE staff_login_attempts.attempts + 1 END,
      reset_at = CASE WHEN staff_login_attempts.reset_at <= now() THEN now() + ${seconds} * interval '1 second' ELSE staff_login_attempts.reset_at END
    WHERE staff_login_attempts.reset_at <= now() OR staff_login_attempts.attempts < ${limit}
    RETURNING key`);
  if (!result.rows.length) throw new WorkspaceError(explanation);
}
async function message(tx: Transaction, id: number, actor: Actor, body: string) {
  await customerQuota(tx, actor, "messages", 60, 3600, "Vous avez atteint la limite de 60 messages par heure. Patientez avant de réessayer.");
  await tx.insert(requestMessages).values({ requestId: id, authorType: actor.type, authorId: actor.id, authorName: actor.name, body, createdAt: new Date() });
}

export async function createServiceRequest(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return asActor("customer", async (actor) => {
    const title = text(fd, "title");
    const service = text(fd, "service");
    const brief = text(fd, "brief");
    const fieldErrors: Record<string, string> = {};
    if (title.length < 3 || title.length > 160) fieldErrors.title = "Indiquez un titre de 3 à 160 caractères.";
    if (!workspaceServiceOptions.some((option) => option.value === service)) fieldErrors.service = "Choisissez un service valide.";
    if (brief.length < 10 || brief.length > 10000) fieldErrors.brief = "Décrivez votre besoin en 10 à 10 000 caractères.";
    if (Object.keys(fieldErrors).length) return failure("Vérifiez les champs indiqués.", fieldErrors);
    const id = await getDb().transaction(async (tx) => {
      await customerQuota(tx, actor, "requests", 20, 86400, "Vous avez atteint la limite de 20 nouvelles demandes sur 24 heures. Patientez ou poursuivez vos demandes existantes.");
      const [request] = await tx.insert(serviceRequests).values({ customerId: actor.id, title, service, brief }).returning({ id: serviceRequests.id });
      await tx.insert(requestEvents).values({ requestId: request.id, type: "created", actorName: actor.name, body: "Votre demande a été reçue. L’équipe va l’étudier.", status: "received", createdAt: new Date() });
      return request.id;
    });
    invalidate(id);
    return { ok: true, requestId: id, message: "Votre demande a été créée. Vous pouvez maintenant joindre vos documents et suivre son avancement." };
  });
}

export async function addRequestMessage(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return asActor(contextFor(fd), async (actor) => {
    const id = requestId(fd);
    const body = text(fd, "body");
    if (!body || body.length > 5000) return failure("Vérifiez votre message.", { body: "Le message doit contenir de 1 à 5 000 caractères." });
    await getDb().transaction(async (tx) => {
      await lockedRequest(tx, id, actor);
      await message(tx, id, actor, body);
      await tx.update(serviceRequests).set({ updatedAt: new Date() }).where(eq(serviceRequests.id, id));
    });
    invalidate(id);
    return { ok: true, message: "Votre message a été ajouté à la demande." };
  });
}

export async function uploadRequestFile(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return asActor(contextFor(fd), async (actor) => {
    const id = requestId(fd);
    const kind = text(fd, "kind");
    if (kind !== "brief" && kind !== "review" && kind !== "delivery") return failure("Choisissez un type de document valide.");
    if (kind !== "brief" && actor.type !== "staff") return failure("Seule l’équipe peut préparer les documents à valider ou à livrer.");
    const expectedVersion = kind !== "brief" ? versionOf(fd) : null;
    const value = fd.get("file");
    if (!value || typeof value === "string") return failure("Choisissez un fichier.", { file: "Un fichier est requis." });
    await getDb().transaction(async (tx) => {
      const current = await lockedRequest(tx, id, actor);
      if (expectedVersion !== null) checkVersion(current.version, expectedVersion);
      requireOpen(current.status);
      if (kind === "review" && current.status !== "in_progress") throw new WorkspaceError("La réalisation doit être en cours pour préparer une validation client.");
      if (kind === "delivery" && !["in_progress", "revision_requested", "finalized"].includes(current.status)) throw new WorkspaceError("La demande doit être en cours pour préparer sa livraison.");
      const [existing] = await tx.select({ total: count() }).from(requestFiles).where(and(eq(requestFiles.requestId, id), eq(requestFiles.kind, kind)));
      if (existing.total >= WORKSPACE_MAX_FILES) throw new WorkspaceError(`Cette demande contient déjà ${WORKSPACE_MAX_FILES} fichiers de ce type.`);
      await customerQuota(tx, actor, "uploads", 24, 86400, "Vous avez atteint la limite de 24 fichiers déposés sur 24 heures. Patientez avant d’ajouter un document.");
      // Ownership and count are checked under the same lock before reading or persisting bytes.
      const file = await validateWorkspaceFile(value);
      await tx.insert(requestFiles).values({ ...file, requestId: id, kind, uploadedByType: actor.type, uploadedById: actor.id, uploadedByName: actor.name, createdAt: new Date() });
      if (kind === "brief") await tx.insert(requestEvents).values({ requestId: id, type: "file_added", actorName: actor.name, body: `Document ajouté : ${file.filename}`, createdAt: new Date() });
      // A publisher must review the current set of drafts, including uploads from another staff member.
      await tx.update(serviceRequests).set({ updatedAt: new Date(), ...(kind !== "brief" ? { version: current.version + 1 } : {}) }).where(eq(serviceRequests.id, id));
    });
    invalidate(id);
    return { ok: true, message: kind === "review" ? "Version de travail préparée. Envoyez-la pour validation afin de la rendre accessible au client." : kind === "delivery" ? "Fichier de livraison préparé. Publiez la livraison pour le rendre accessible au client." : "Votre document a été ajouté." };
  });
}

type StaffRequestUpdate = {
  version: number;
  status: WorkspaceStatus;
  quotedAmount: number | null;
  dueAt: Date | null;
  note: string;
};

async function saveStaffRequestUpdate(tx: Transaction, actor: Actor, current: typeof serviceRequests.$inferSelect, changes: StaffRequestUpdate) {
  const { version, status, quotedAmount, dueAt, note } = changes;
  const id = current.id;
  checkVersion(current.version, version);
  requireOpen(current.status);
  if (status !== current.status && !staffRequestTransitions[current.status].includes(status)) throw new WorkspaceError("Cette transition n’est pas autorisée. L’acceptation du devis et la validation de livraison appartiennent au client.");
  if (status === "quoted" && quotedAmount === null) throw new WorkspaceError("Indiquez le prix proposé avant d’envoyer la proposition, y compris 0 pour une prestation offerte.");
  if (!["received", "reviewing", "quoted"].includes(current.status) && quotedAmount !== current.quotedAmount) throw new WorkspaceError("Le prix accepté par le client ne peut plus être modifié.");
  if ((status === "delivered" || status === "awaiting_validation") && current.status !== status) {
    const kind = status === "delivered" ? "delivery" : "review";
    const [revision] = await tx.select({ createdAt: requestEvents.createdAt }).from(requestEvents)
      .where(and(eq(requestEvents.requestId, id), eq(requestEvents.type, "revision_requested"))).orderBy(desc(requestEvents.id)).limit(1);
    const [delivery] = await tx.select({ id: requestFiles.id }).from(requestFiles)
      .where(and(eq(requestFiles.requestId, id), eq(requestFiles.kind, kind), revision ? gt(requestFiles.createdAt, revision.createdAt) : undefined)).limit(1);
    if (!delivery) throw new WorkspaceError(revision ? "Ajoutez un nouveau fichier de ce type après la demande de révision." : kind === "review" ? "Ajoutez une version de travail avant de demander la validation du client." : "Ajoutez un fichier final avant d’envoyer le projet.");
  }
  const now = new Date();
  const [updated] = await tx.update(serviceRequests).set({ status, quotedAmount, dueAt, version: version + 1, updatedAt: now })
    .where(and(eq(serviceRequests.id, id), eq(serviceRequests.version, version))).returning({ id: serviceRequests.id });
  if (!updated) throw new WorkspaceError("Cette demande a changé. Rechargez la page.");
  const description = status === "quoted" ? `Proposition : ${quotedAmount === 0 ? "prestation offerte" : `${quotedAmount} FCFA (XOF)`}. Votre acceptation est attendue ; aucun paiement n’est enregistré ici.` : `Suivi mis à jour : ${workspaceStatusLabel(status)}.`;
  await tx.insert(requestEvents).values({ requestId: id, type: status === "quoted" || status !== current.status ? status : "updated", actorName: actor.name, body: description, status, createdAt: now });
  if (note) await message(tx, id, actor, note);
}

function staffUpdateInput(fd: FormData, forcedStatus?: WorkspaceStatus) {
  const status = forcedStatus ?? text(fd, "status") as WorkspaceStatus;
  const note = text(fd, "note");
  const rawAmount = text(fd, "quoteAmountXOF");
  const quotedAmount = rawAmount === "" ? null : Number(rawAmount);
  const rawDueAt = text(fd, "dueAt");
  const dueAt = rawDueAt ? new Date(rawDueAt) : null;
  const fieldErrors: Record<string, string> = {};
  if (!workspaceStatusOptions.some(option => option.value === status)) fieldErrors.status = "Choisissez un statut valide.";
  if (quotedAmount !== null && (!/^\d+$/.test(rawAmount) || !Number.isSafeInteger(quotedAmount) || quotedAmount > 2147483647)) fieldErrors.quoteAmountXOF = "Indiquez un montant entier positif ou nul en FCFA.";
  if (status === "quoted" && quotedAmount === null) fieldErrors.quoteAmountXOF = "Indiquez le prix proposé, y compris 0 pour une prestation offerte.";
  if (dueAt && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(rawDueAt) || !Number.isFinite(dueAt.getTime()) || dueAt.toISOString() !== (rawDueAt.includes(".") ? rawDueAt : rawDueAt.replace("Z", ".000Z")))) fieldErrors.dueAt = "Indiquez une échéance UTC valide.";
  if (note.length > 5000) fieldErrors.note = "Limitez la note à 5 000 caractères.";
  if (status === "cancelled" && note.length < 3) fieldErrors.note = "Expliquez l’annulation au client.";
  return { status, quotedAmount, dueAt, note, fieldErrors };
}
export async function updateServiceRequest(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return asActor("team", async actor => {
    const id = requestId(fd); const version = versionOf(fd);
    const { fieldErrors, ...changes } = staffUpdateInput(fd);
    if (Object.keys(fieldErrors).length) return failure("Vérifiez les champs indiqués.", fieldErrors);
    await getDb().transaction(async tx => {
      const current = await lockedRequest(tx, id, actor);
      await saveStaffRequestUpdate(tx, actor, current, { version, ...changes });
    });
    invalidate(id);
    return { ok: true, message: "La demande a été mise à jour. Les informations et la note sont visibles par le client." };
  });
}
export async function sendRequestProposal(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return asActor("team", async actor => {
    const id = requestId(fd); const version = versionOf(fd);
    const { fieldErrors, ...changes } = staffUpdateInput(fd, "quoted");
    if (Object.keys(fieldErrors).length) return failure("Vérifiez votre proposition.", fieldErrors);
    await getDb().transaction(async tx => {
      const current = await lockedRequest(tx, id, actor);
      if (!["received", "reviewing", "quoted"].includes(current.status)) throw new WorkspaceError("Le prix accepté ne peut plus être modifié. La réalisation doit suivre les étapes prévues.");
      await saveStaffRequestUpdate(tx, actor, current, { version, ...changes });
    });
    invalidate(id);
    return { ok: true, message: "La proposition a été envoyée. Le client doit valider son prix avant le début de la réalisation." };
  });
}
export async function publishRequestReview(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return asActor("team", async actor => {
    const id = requestId(fd); const version = versionOf(fd); const note = text(fd, "note");
    if (note.length > 5000) return failure("Limitez la note à 5 000 caractères.", { note: "La note est trop longue." });
    await getDb().transaction(async tx => {
      const current = await lockedRequest(tx, id, actor);
      checkVersion(current.version, version);
      if (current.status !== "in_progress") throw new WorkspaceError("La réalisation doit être en cours pour demander la validation du client.");
      await saveStaffRequestUpdate(tx, actor, current, { version, status: "awaiting_validation", quotedAmount: current.quotedAmount, dueAt: current.dueAt, note });
    });
    invalidate(id);
    return { ok: true, message: "La version de travail est disponible. Le client peut la valider ou demander des ajustements avant la livraison finale." };
  });
}

export async function publishRequestDelivery(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return asActor("team", async (actor) => {
    const id = requestId(fd);
    const version = versionOf(fd);
    const note = text(fd, "note");
    if (note.length > 5000) return failure("Vérifiez la note de livraison.", { note: "Limitez la note à 5 000 caractères." });
    await getDb().transaction(async (tx) => {
      const current = await lockedRequest(tx, id, actor);
      checkVersion(current.version, version);
      if (current.status !== "finalized") throw new WorkspaceError("Le client doit d’abord valider la réalisation. Seul un projet finalisé peut être envoyé.");
      await saveStaffRequestUpdate(tx, actor, current, {
        version, status: "delivered", quotedAmount: current.quotedAmount, dueAt: current.dueAt, note,
      });
    });
    invalidate(id);
    return { ok: true, message: "La livraison a été publiée. Le client peut maintenant consulter ses documents et votre note." };
  });
}

async function removeDraftFile(fd: FormData, kind: "review" | "delivery"): Promise<ActionState> {
  return asActor("team", async (actor) => {
    const id = requestId(fd);
    const version = versionOf(fd);
    const rawFileId = text(fd, "fileId");
    const fileId = Number(rawFileId);
    if (!/^[1-9]\d*$/.test(rawFileId) || !Number.isSafeInteger(fileId)) return failure("Document introuvable.");
    await getDb().transaction(async (tx) => {
      const current = await lockedRequest(tx, id, actor);
      checkVersion(current.version, version);
      if (!["in_progress", "revision_requested", "finalized"].includes(current.status)) throw new WorkspaceError("Seuls les brouillons d’une demande en cours, en révision ou finalisée peuvent être retirés.");
      const scope = and(eq(requestFiles.id, fileId), eq(requestFiles.requestId, id), eq(requestFiles.kind, kind));
      const [file] = await tx.select({ createdAt: requestFiles.createdAt }).from(requestFiles).where(scope).limit(1);
      if (!file) throw new WorkspaceError("Brouillon de livraison introuvable.");
      const [publication] = await tx.select({ id: requestEvents.id }).from(requestEvents)
        .where(and(eq(requestEvents.requestId, id), eq(requestEvents.type, kind === "review" ? "awaiting_validation" : "delivered"), gte(requestEvents.createdAt, file.createdAt))).limit(1);
      if (publication) throw new WorkspaceError("Ce document a déjà été publié et ne peut plus être retiré.");
      await tx.delete(requestFiles).where(scope);
      const [updated] = await tx.update(serviceRequests).set({ version: version + 1, updatedAt: new Date() })
        .where(and(eq(serviceRequests.id, id), eq(serviceRequests.version, version))).returning({ id: serviceRequests.id });
      if (!updated) throw new WorkspaceError("Cette demande a changé. Rechargez la page.");
    });
    invalidate(id);
    return { ok: true, message: "Le brouillon a été retiré de la préparation." };
  });
}

export async function removeDraftDelivery(_prev: ActionState, fd: FormData): Promise<ActionState> { return removeDraftFile(fd, "delivery"); }
export async function removeDraftReview(_prev: ActionState, fd: FormData): Promise<ActionState> { return removeDraftFile(fd, "review"); }

export async function customerRequestAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return asActor("customer", async (actor) => {
    const id = requestId(fd);
    const version = versionOf(fd);
    const action = text(fd, "action");
    const note = text(fd, "note");
    if (!["accept_quote", "reject_quote", "approve_review", "request_revision", "complete"].includes(action)) return failure("Action non reconnue.");
    if (note.length > 5000 || (["reject_quote", "request_revision"].includes(action) && note.length < 3)) return failure("Précisez votre demande de révision.", { note: "Décrivez les ajustements souhaités en 3 à 5 000 caractères." });
    await getDb().transaction(async (tx) => {
      const current = await lockedRequest(tx, id, actor);
      checkVersion(current.version, version);
      let status: WorkspaceStatus;
      let body: string;
      if (action === "accept_quote" && current.status === "quoted" && current.quotedAmount !== null) {
        status = "in_progress";
        body = "Le client a accepté la proposition. La prestation peut commencer ; aucun paiement n’est enregistré ici.";
      } else if (action === "reject_quote" && current.status === "quoted") {
        status = "reviewing";
        body = "Le client a demandé un ajustement de la proposition. Une nouvelle proposition doit être validée avant la réalisation.";
      } else if (action === "approve_review" && current.status === "awaiting_validation") {
        status = "finalized";
        body = "Le client a validé la réalisation. Le projet est finalisé et l’équipe peut préparer son envoi final.";
      } else if (action === "request_revision" && ["awaiting_validation", "delivered"].includes(current.status)) {
        status = "revision_requested";
        body = "Le client a demandé des ajustements. Une nouvelle version devra être soumise à sa validation avant l’envoi final.";
      } else if (action === "complete" && current.status === "delivered") {
        status = "completed";
        body = "Le client a confirmé la réception et validé la livraison.";
      } else throw new WorkspaceError("Cette action n’est pas disponible à l’étape actuelle.");
      const now = new Date();
      const [updated] = await tx.update(serviceRequests).set({ status, version: version + 1, updatedAt: now })
        .where(and(eq(serviceRequests.id, id), eq(serviceRequests.customerId, actor.id), eq(serviceRequests.version, version))).returning({ id: serviceRequests.id });
      if (!updated) throw new WorkspaceError("Cette demande a changé. Rechargez la page.");
      await tx.insert(requestEvents).values({ requestId: id, type: action === "reject_quote" ? "quote_rejected" : status, actorName: actor.name, body, status, createdAt: now });
      if (note) await message(tx, id, actor, note);
    });
    invalidate(id);
    return { ok: true, message: "Votre choix a été enregistré et transmis à l’équipe dans le suivi de la demande." };
  });
}
