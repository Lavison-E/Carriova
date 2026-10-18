"use server";

import { createHash } from "node:crypto";
import { and, count, desc, eq, gte, sql } from "drizzle-orm";
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
    if (kind !== "brief" && kind !== "delivery") return failure("Choisissez un type de document valide.");
    if (kind === "delivery" && actor.type !== "staff") return failure("Seule l’équipe peut déposer une livraison.");
    const value = fd.get("file");
    if (!value || typeof value === "string") return failure("Choisissez un fichier.", { file: "Un fichier est requis." });
    await getDb().transaction(async (tx) => {
      const current = await lockedRequest(tx, id, actor);
      requireOpen(current.status);
      if (kind === "delivery" && !["in_progress", "revision_requested"].includes(current.status)) throw new WorkspaceError("La demande doit être en cours pour préparer sa livraison.");
      const [existing] = await tx.select({ total: count() }).from(requestFiles).where(eq(requestFiles.requestId, id));
      if (existing.total >= WORKSPACE_MAX_FILES) throw new WorkspaceError("La demande contient déjà le maximum de 12 fichiers.");
      await customerQuota(tx, actor, "uploads", 24, 86400, "Vous avez atteint la limite de 24 fichiers déposés sur 24 heures. Patientez avant d’ajouter un document.");
      // Ownership and count are checked under the same lock before reading or persisting bytes.
      const file = await validateWorkspaceFile(value);
      await tx.insert(requestFiles).values({ ...file, requestId: id, kind, uploadedByType: actor.type, uploadedById: actor.id, uploadedByName: actor.name, createdAt: new Date() });
      if (kind === "brief") await tx.insert(requestEvents).values({ requestId: id, type: "file_added", actorName: actor.name, body: `Document ajouté : ${file.filename}`, createdAt: new Date() });
      await tx.update(serviceRequests).set({ updatedAt: new Date() }).where(eq(serviceRequests.id, id));
    });
    invalidate(id);
    return { ok: true, message: kind === "delivery" ? "Fichier de livraison préparé. Passez la demande en « Livraison disponible » pour le rendre accessible au client." : "Votre document a été ajouté." };
  });
}

export async function updateServiceRequest(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return asActor("team", async (actor) => {
    const id = requestId(fd);
    const version = versionOf(fd);
    const status = text(fd, "status") as WorkspaceStatus;
    const note = text(fd, "note");
    const rawAmount = text(fd, "quoteAmountXOF");
    const quotedAmount = rawAmount === "" ? null : Number(rawAmount);
    const rawDueAt = text(fd, "dueAt");
    const dueAt = rawDueAt ? new Date(rawDueAt) : null;
    const fieldErrors: Record<string, string> = {};
    if (!workspaceStatusOptions.some((option) => option.value === status)) fieldErrors.status = "Choisissez un statut valide.";
    if (quotedAmount !== null && (!/^\d+$/.test(rawAmount) || !Number.isSafeInteger(quotedAmount) || quotedAmount > 2147483647)) fieldErrors.quoteAmountXOF = "Indiquez un montant entier positif ou nul en FCFA.";
    if (dueAt && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(rawDueAt) || !Number.isFinite(dueAt.getTime()) || dueAt.toISOString() !== (rawDueAt.includes(".") ? rawDueAt : rawDueAt.replace("Z", ".000Z")))) fieldErrors.dueAt = "Indiquez une échéance UTC valide.";
    if (note.length > 5000) fieldErrors.note = "Limitez la note à 5 000 caractères.";
    if (status === "cancelled" && note.length < 3) fieldErrors.note = "Expliquez l’annulation au client.";
    if (Object.keys(fieldErrors).length) return failure("Vérifiez les champs indiqués.", fieldErrors);
    await getDb().transaction(async (tx) => {
      const current = await lockedRequest(tx, id, actor);
      checkVersion(current.version, version);
      requireOpen(current.status);
      if (status !== current.status && !staffRequestTransitions[current.status].includes(status)) throw new WorkspaceError("Cette transition n’est pas autorisée. L’acceptation du devis et la validation de livraison appartiennent au client.");
      if (status === "quoted" && quotedAmount === null) throw new WorkspaceError("Indiquez le prix proposé avant d’envoyer la proposition, y compris 0 pour une prestation offerte.");
      if (!["received", "reviewing", "quoted"].includes(current.status) && quotedAmount !== current.quotedAmount) throw new WorkspaceError("Le prix accepté par le client ne peut plus être modifié.");
      if (status === "delivered" && current.status !== "delivered") {
        const [revision] = await tx.select({ createdAt: requestEvents.createdAt }).from(requestEvents)
          .where(and(eq(requestEvents.requestId, id), eq(requestEvents.type, "revision_requested"))).orderBy(desc(requestEvents.id)).limit(1);
        const [delivery] = await tx.select({ id: requestFiles.id }).from(requestFiles)
          .where(and(eq(requestFiles.requestId, id), eq(requestFiles.kind, "delivery"), revision ? gte(requestFiles.createdAt, revision.createdAt) : undefined)).limit(1);
        if (!delivery) throw new WorkspaceError(revision ? "Ajoutez un nouveau fichier pour livrer cette révision." : "Ajoutez un fichier de livraison avant de marquer la demande comme livrée.");
      }
      const now = new Date();
      const [updated] = await tx.update(serviceRequests).set({ status, quotedAmount, dueAt, version: version + 1, updatedAt: now })
        .where(and(eq(serviceRequests.id, id), eq(serviceRequests.version, version))).returning({ id: serviceRequests.id });
      if (!updated) throw new WorkspaceError("Cette demande a changé. Rechargez la page.");
      const description = status === "quoted" ? `Proposition : ${quotedAmount === 0 ? "prestation offerte" : `${quotedAmount} FCFA (XOF)`}. Votre acceptation est attendue ; aucun paiement n’est enregistré ici.` : `Suivi mis à jour : ${workspaceStatusLabel(status)}.`;
      await tx.insert(requestEvents).values({ requestId: id, type: status !== current.status ? status : "updated", actorName: actor.name, body: description, status, createdAt: now });
      if (note) await message(tx, id, actor, note);
    });
    invalidate(id);
    return { ok: true, message: "La demande a été mise à jour. Les informations et la note sont visibles par le client." };
  });
}

export async function customerRequestAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return asActor("customer", async (actor) => {
    const id = requestId(fd);
    const version = versionOf(fd);
    const action = text(fd, "action");
    const note = text(fd, "note");
    if (!["accept_quote", "request_revision", "complete"].includes(action)) return failure("Action non reconnue.");
    if (note.length > 5000 || (action === "request_revision" && note.length < 3)) return failure("Précisez votre demande de révision.", { note: "Décrivez les ajustements souhaités en 3 à 5 000 caractères." });
    await getDb().transaction(async (tx) => {
      const current = await lockedRequest(tx, id, actor);
      checkVersion(current.version, version);
      let status: WorkspaceStatus;
      let body: string;
      if (action === "accept_quote" && current.status === "quoted" && current.quotedAmount !== null) {
        status = "in_progress";
        body = "Le client a accepté la proposition. La prestation peut commencer ; aucun paiement n’est enregistré ici.";
      } else if (action === "request_revision" && current.status === "delivered") {
        status = "revision_requested";
        body = "Le client a demandé des ajustements à la livraison.";
      } else if (action === "complete" && current.status === "delivered") {
        status = "completed";
        body = "Le client a confirmé la réception et validé la livraison.";
      } else throw new WorkspaceError("Cette action n’est pas disponible à l’étape actuelle.");
      const now = new Date();
      const [updated] = await tx.update(serviceRequests).set({ status, version: version + 1, updatedAt: now })
        .where(and(eq(serviceRequests.id, id), eq(serviceRequests.customerId, actor.id), eq(serviceRequests.version, version))).returning({ id: serviceRequests.id });
      if (!updated) throw new WorkspaceError("Cette demande a changé. Rechargez la page.");
      await tx.insert(requestEvents).values({ requestId: id, type: status, actorName: actor.name, body, status, createdAt: now });
      if (note) await message(tx, id, actor, note);
    });
    invalidate(id);
    return { ok: true, message: "Votre choix a été enregistré et transmis à l’équipe dans le suivi de la demande." };
  });
}
