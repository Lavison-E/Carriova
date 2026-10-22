import "server-only";

import { randomUUID } from "node:crypto";
import { setTimeout as delay } from "node:timers/promises";
import { and, asc, count, desc, eq, isNull, lte, ne, or } from "drizzle-orm";
import { after } from "next/server";
import { getDb } from "@/db";
import { customerUsers } from "@/db/customer-schema";
import { workspaceNotifications, type WorkspaceMailPayload } from "@/db/notification-schema";
import { serverEnv } from "@/lib/env";
import { renderTransactionalEmail } from "@/lib/transactional-email.mjs";
import { requireStaff } from "@/lib/staff-auth";

type DrainOptions = { requestId?: number; customerId?: number; force?: boolean; limit?: number };
const copy: Record<string, { subject: string; customer: string; team: string }> = {
  welcome: { subject: "Bienvenue dans votre espace", customer: "Votre compte Carriova a été créé. Vous pouvez présenter votre besoin et suivre vos demandes depuis votre espace.", team: "" },
  created: { subject: "Nouvelle demande enregistrée", customer: "Votre demande a bien été enregistrée. Vous pouvez suivre son étude depuis votre espace.", team: "Une nouvelle demande attend l’étude de l’équipe." },
  quoted: { subject: "Proposition disponible", customer: "Une proposition est disponible dans votre espace. Consultez son montant et ses conditions avant de l’accepter. Aucun paiement n’est effectué depuis cet e-mail.", team: "" },
  awaiting_validation: { subject: "Votre réalisation attend votre validation", customer: "Une version de travail est disponible dans votre espace. Consultez-la et validez-la ou demandez des ajustements avant l’envoi du projet final.", team: "" },
  finalized: { subject: "Réalisation validée par le client", customer: "", team: "Le client a validé la réalisation. Le projet est finalisé et peut être envoyé depuis son suivi." },
  quote_rejected: { subject: "Ajustement de proposition demandé", customer: "", team: "Le client souhaite ajuster la proposition. Consultez son message avant d’envoyer un nouveau prix." },
  delivered: { subject: "Livraison disponible", customer: "Votre livraison est disponible dans votre espace. Vous pouvez la consulter, demander une révision ou la valider.", team: "" },
  revision_requested: { subject: "Révision demandée", customer: "", team: "Le client a demandé une révision. Consultez les précisions dans le suivi de la demande." },
  in_progress: { subject: "Demande en cours", customer: "", team: "La demande est passée à l’étape de réalisation. Consultez son suivi." },
  completed: { subject: "Livraison validée", customer: "", team: "Le client a validé la livraison. La demande est terminée." },
  cancelled: { subject: "Demande annulée", customer: "Votre demande a été annulée. Le motif est accessible dans votre espace.", team: "" },
  message: { subject: "Nouveau message dans votre suivi", customer: "L’équipe a ajouté un message au suivi de votre demande.", team: "Le client a ajouté un message au suivi de sa demande." },
};

function makePayload(row: typeof workspaceNotifications.$inferSelect, email: string): WorkspaceMailPayload {
  const template = copy[row.kind];
  if (!template) throw new Error("Unsupported notification");
  const path = row.requestId ? (row.audience === "team" ? `/admin/commandes/${row.requestId}` : `/espace/demandes/${row.requestId}`) : "/espace";
  const link = new URL(path, serverEnv.NEXT_PUBLIC_SITE_URL).href;
  const support = serverEnv.SUPPORT_EMAIL || serverEnv.CONTACT_EMAIL;
  return {
    from: serverEnv.email.transactionalFrom,
    to: row.audience === "team" ? (serverEnv.email.notify.length ? [...serverEnv.email.notify] : [serverEnv.CONTACT_EMAIL]) : [email],
    reply_to: support,
    subject: `CARRIOVA — ${template.subject}`,
    html: renderTransactionalEmail({ title: template.subject, body: row.audience === "team" ? template.team : template.customer,
      actionLabel: row.kind === "welcome" ? "Ouvrir mon espace" : "Consulter la demande", actionUrl: link, supportEmail: support,
      note: row.requestId ? `Demande n° ${row.requestId}. Une connexion est nécessaire pour consulter son contenu.` : "Une connexion est nécessaire pour accéder à votre espace.",
    }),
    text: `Bonjour,\n\n${row.audience === "team" ? template.team : template.customer}\n\n${row.requestId ? `Demande n° ${row.requestId}\n` : ""}Ouvrir le suivi (connexion requise) : ${link}\n\nPour une question : ${support}\nL’équipe CARRIOVA`,
  };
}

async function send(payload: WorkspaceMailPayload, key: string): Promise<{ ok: true; providerId: string } | { ok: false; code: string }> {
  try {
    const response = await fetch(`${serverEnv.email.baseUrl.replace(/\/+$/, "")}/emails`, {
      method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${serverEnv.email.apiKey}`, "Idempotency-Key": key },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(8000), cache: "no-store",
    });
    if (!response.ok) return { ok: false, code: `HTTP_${response.status}` };
    const result: unknown = await response.json();
    const providerId = result && typeof result === "object" && "id" in result ? result.id : null;
    if (typeof providerId !== "string" || !/^[A-Za-z0-9_-]{1,128}$/.test(providerId)) return { ok: false, code: "INVALID_RESPONSE" };
    return { ok: true, providerId };
  } catch (error) {
    return { ok: false, code: error instanceof Error && ["TimeoutError", "AbortError"].includes(error.name) ? "TIMEOUT" : "NETWORK_ERROR" };
  }
}

// Internal server worker. Public entry points must authenticate before invoking it.
export async function drainWorkspaceNotifications(options: DrainOptions = {}) {
  const result = { attempted: 0, sent: 0, pending: 0, needsReview: 0, configured: serverEnv.email.transactionalEnabled };
  if (!serverEnv.email.transactionalEnabled) return result;
  const db = getDb();
  const now = new Date();
  const limit = Math.min(6, Math.max(1, options.limit ?? 6));
  const claimed = await db.transaction(async (tx) => {
    const rows = await tx.select().from(workspaceNotifications).where(and(
      or(and(eq(workspaceNotifications.status, "pending"), options.force ? undefined : lte(workspaceNotifications.availableAt, now)),
        and(eq(workspaceNotifications.status, "sending"), lte(workspaceNotifications.lockedUntil, now))),
      options.force ? undefined : or(isNull(workspaceNotifications.lastError), ne(workspaceNotifications.lastError, "PROVIDER_CHECK_REQUIRED")),
      options.requestId ? eq(workspaceNotifications.requestId, options.requestId) : undefined,
      options.customerId ? eq(workspaceNotifications.customerId, options.customerId) : undefined,
    )).orderBy(asc(workspaceNotifications.id)).limit(limit).for("update", { skipLocked: true });
    const jobs: Array<{ id: number; key: string; payload: WorkspaceMailPayload; lease: string; attempts: number }> = [];
    for (const row of rows) {
      const ambiguous = row.status === "sending" || ["TIMEOUT", "NETWORK_ERROR", "INVALID_RESPONSE", "PROVIDER_CHECK_REQUIRED"].includes(row.lastError ?? "") || row.lastError?.startsWith("HTTP_5");
      if (!options.force && ambiguous && row.firstAttemptAt && now.getTime() - row.firstAttemptAt.getTime() >= 23 * 60 * 60 * 1000) {
        await tx.update(workspaceNotifications).set({ status: "pending", lastError: "PROVIDER_CHECK_REQUIRED", lockedUntil: null, leaseToken: null }).where(eq(workspaceNotifications.id, row.id));
        result.needsReview++;
        continue;
      }
      const [customer] = await tx.select({ email: customerUsers.email }).from(customerUsers).where(eq(customerUsers.id, row.customerId)).limit(1);
      if (!customer) continue;
      // Freeze the payload so retries with the same provider key have identical content.
      const payload = row.payload ?? makePayload(row, customer.email);
      const lease = randomUUID();
      await tx.update(workspaceNotifications).set({ payload, status: "sending", leaseToken: lease,
        lockedUntil: new Date(now.getTime() + 120000), firstAttemptAt: row.firstAttemptAt ?? now,
        lastAttemptAt: now, attempts: row.attempts + 1, lastError: null,
      }).where(eq(workspaceNotifications.id, row.id));
      jobs.push({ id: row.id, key: row.dedupeKey, payload, lease, attempts: row.attempts + 1 });
    }
    return jobs;
  });
  // At most two concurrent network calls; every request has an eight-second timeout.
  for (let offset = 0; offset < claimed.length; offset += 2) {
    if (offset > 0) await delay(1000);
    await Promise.all(claimed.slice(offset, offset + 2).map(async (job) => {
      result.attempted++;
      const outcome = await send(job.payload, job.key);
      const guard = and(eq(workspaceNotifications.id, job.id), eq(workspaceNotifications.leaseToken, job.lease), eq(workspaceNotifications.status, "sending"));
      try {
        if (outcome.ok) {
          const updated = await db.update(workspaceNotifications).set({ status: "sent", sentAt: new Date(), providerId: outcome.providerId, lastError: null, lockedUntil: null, leaseToken: null }).where(guard).returning({ id: workspaceNotifications.id });
          if (updated.length) result.sent++; else result.pending++;
        } else {
          await db.update(workspaceNotifications).set({ status: "pending", lastError: outcome.code,
            availableAt: new Date(Date.now() + Math.min(3600, 60 * 2 ** Math.min(job.attempts - 1, 6)) * 1000), lockedUntil: null, leaseToken: null,
          }).where(guard);
          result.pending++;
        }
      } catch {
        // The lease expires and a later worker retries with the same idempotency key.
        result.pending++;
      }
    }));
  }
  return result;
}

export function scheduleWorkspaceNotifications(options: Omit<DrainOptions, "force" | "limit"> = {}) {
  try {
    after(async () => { try { await drainWorkspaceNotifications(options); } catch { /* Persisted jobs remain retryable. */ } });
  } catch { /* The business transaction has already committed; staff can retry the outbox. */ }
}

export async function getWorkspaceNotificationDashboard() {
  await requireStaff();
  const db = getDb();
  const [totals, recent] = await Promise.all([
    db.select({ status: workspaceNotifications.status, total: count() }).from(workspaceNotifications).groupBy(workspaceNotifications.status),
    db.select({ id: workspaceNotifications.id, requestId: workspaceNotifications.requestId, kind: workspaceNotifications.kind,
      audience: workspaceNotifications.audience, status: workspaceNotifications.status, attempts: workspaceNotifications.attempts,
      lastError: workspaceNotifications.lastError, providerId: workspaceNotifications.providerId,
      createdAt: workspaceNotifications.createdAt, sentAt: workspaceNotifications.sentAt,
    }).from(workspaceNotifications).orderBy(desc(workspaceNotifications.id)).limit(100),
  ]);
  const counts = { pending: 0, sending: 0, sent: 0 };
  for (const row of totals) counts[row.status] = row.total;
  return { configured: serverEnv.email.transactionalEnabled, counts, recent: recent.map((row) => ({ ...row, createdAt: row.createdAt.toISOString(), sentAt: row.sentAt?.toISOString() ?? null })) };
}
