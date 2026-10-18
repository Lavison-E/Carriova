import Link from "next/link";
import { redirect } from "next/navigation";
import { CrmShell, CrmUnavailable, formatCrmDate } from "@/components/admin/CrmShell";
import { NotificationRetry } from "@/components/admin/NotificationRetry";
import { RefreshButton } from "@/components/workspace/RefreshButton";
import { getWorkspaceNotificationDashboard } from "@/lib/workspace-mail";
import { requireStaff, UnauthorizedError } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const metadata = { title: "Notifications — Équipe Carriova", robots: { index: false, follow: false } };
const labels: Record<string, string> = { welcome: "Bienvenue", created: "Nouvelle demande", quoted: "Proposition", delivered: "Livraison", revision_requested: "Révision", in_progress: "En cours", completed: "Clôture", cancelled: "Annulation", message: "Nouveau message" };
const statuses = { pending: "En attente", sending: "En cours d’envoi", sent: "Acceptée par Resend" };

export default async function NotificationsPage() {
  let user;
  let data;
  try {
    user = await requireStaff();
    data = await getWorkspaceNotificationDashboard();
  } catch (error) {
    if (error instanceof UnauthorizedError) redirect("/admin/connexion");
    return <CrmShell user={null} title="Notifications" section="notifications"><CrmUnavailable retryHref="/admin/notifications" /></CrmShell>;
  }
  return <CrmShell user={user} title="Notifications" section="notifications" description="Suivez les e-mails de bienvenue et de suivi. Une demande reste enregistrée même si son e-mail doit être réessayé." action={<RefreshButton />}>
    <div className="mb-6 grid gap-4 sm:grid-cols-3">{(["pending", "sending", "sent"] as const).map((status) => <div key={status} className="rounded-xl border border-night/15 bg-white p-5"><p className="text-xs text-muted">{statuses[status]}</p><p className="mt-3 text-3xl font-semibold tabular-nums">{data.counts[status]}</p></div>)}</div>
    <section className="mb-8 space-y-4 rounded-xl border border-night/15 bg-white p-6">
      <h2 className="text-lg font-semibold">Relancer un envoi</h2>
      {!data.configured ? <p role="alert" className="text-sm leading-6 text-orange">La configuration d’envoi est indisponible. Les notifications restent dans la file d’attente.</p> : null}
      <p className="max-w-3xl text-sm leading-7 text-muted">Chaque relance traite au maximum six notifications. Les documents et le contenu des échanges restent dans les espaces authentifiés. Aucun fichier n’est joint aux e-mails.</p>
      <NotificationRetry configured={data.configured} />
      <p className="max-w-3xl text-xs leading-6 text-muted">« Acceptée par Resend » confirme l’acceptation par le prestataire, pas la réception finale. En cas d’interruption ancienne de plus de 24 heures après une tentative, vérifiez les journaux Resend avant de relancer : sa protection contre les doublons est limitée à 24 heures.</p>
    </section>
    <div className="overflow-x-auto rounded-xl border border-night/15 bg-white">
      <table className="w-full min-w-[750px] text-left text-sm"><caption className="sr-only">Les cent dernières notifications de suivi</caption><thead className="border-b border-night/15 bg-paper"><tr>{["Événement", "Destinataire", "État", "Tentatives", "Créée le", "Dossier"].map((label) => <th key={label} className="px-5 py-4 text-xs font-semibold">{label}</th>)}</tr></thead><tbody className="divide-y divide-night/10">{data.recent.map((notification) => <tr key={notification.id}><td className="px-5 py-4">{labels[notification.kind] ?? notification.kind}</td><td className="px-5 py-4">{notification.audience === "customer" ? "Client" : "Équipe"}</td><td className="px-5 py-4"><p>{statuses[notification.status]}</p>{notification.lastError ? <p className="mt-1 text-xs text-orange">{notification.lastError}</p> : null}</td><td className="px-5 py-4 tabular-nums">{notification.attempts}</td><td className="whitespace-nowrap px-5 py-4 text-xs text-muted">{formatCrmDate(notification.createdAt)}</td><td className="px-5 py-4">{notification.requestId ? <Link href={`/admin/commandes/${notification.requestId}`} className="font-medium underline underline-offset-4">Demande {notification.requestId}</Link> : <span className="text-muted">Compte créé</span>}</td></tr>)}</tbody></table>
      {!data.recent.length ? <p className="p-8 text-sm text-muted">Aucune notification de cette version n’a encore été créée.</p> : null}
    </div>
  </CrmShell>;
}
