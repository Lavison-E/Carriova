import { RefreshButton } from "@/components/workspace/RefreshButton";
import { notFound, redirect } from "next/navigation";
import { CrmShell } from "@/components/admin/CrmShell";
import { OrderConversation, OrderManager } from "@/components/admin/OrderManager";
import { FileList, RequestProgress, RequestStatusBadge, formatAmount, formatWorkspaceDate } from "@/components/workspace/WorkspaceUi";
import { getStaffSession, UnauthorizedError, type StaffIdentity } from "@/lib/staff-auth";
import { getTeamRequest } from "@/lib/workspace-queries";
import { workspaceServiceLabel, type WorkspaceRequestDetail } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dossier commande | Équipe Carriova", robots: { index: false, follow: false } };
function Unavailable({ id }: { id?: string }) {
  return <div role="alert" className="rounded-xl border border-line bg-white p-7 sm:p-10"><h2 className="text-2xl font-semibold">Le dossier n’a pas pu être chargé.</h2><p className="mt-4 text-sm leading-7 text-muted">Réessayez dans un instant pour retrouver les informations de cette commande.</p><a href={id ? `/admin/commandes/${id}` : "/admin/commandes"} className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-night px-5 text-sm font-semibold text-white">Réessayer</a></div>;
}
export default async function TeamOrderPage({ params }: { params: Promise<{ id: string }> }) {
  let user: StaffIdentity | null;
  try { user = await getStaffSession(); }
  catch { return <CrmShell user={null} section="orders" title="Dossier commande" back><Unavailable /></CrmShell>; }
  if (!user) redirect("/admin/connexion");
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();
  let request: WorkspaceRequestDetail | null;
  try { request = await getTeamRequest(Number(id)); }
  catch (error) {
    if (error instanceof UnauthorizedError) redirect("/admin/connexion");
    return <CrmShell user={user} section="orders" action={<RefreshButton />} title="Dossier commande" back><Unavailable id={id} /></CrmShell>;
  }
  if (!request) notFound();
  const briefs = request.files.filter((file) => file.kind === "brief");
  const deliveries = request.files.filter((file) => file.kind === "delivery");
  const unpublished = deliveries.filter((file) => !request.events.some((event) => event.type === "delivered" && event.createdAt >= file.createdAt)).length;

  return <CrmShell user={user} section="orders" action={<RefreshButton />} title={request.title} description={`Commande #${request.id} · ${workspaceServiceLabel(request.service)}`} back>
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4"><RequestStatusBadge status={request.status} /><p className="text-xs leading-6 text-muted">Dernière activité : {formatWorkspaceDate(request.updatedAt, true)}</p></div>
    <RequestProgress status={request.status} />
    <div className="mt-8 grid items-start gap-7 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-7">
        <section className="rounded-xl border border-line bg-white p-5 sm:p-7" aria-labelledby="order-brief-title"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">01 / Comprendre la demande</p><h2 id="order-brief-title" className="mt-3 text-xl font-semibold tracking-tight">Le besoin du client</h2>
          <dl className="mt-6 grid gap-5 border-y border-line py-5 sm:grid-cols-2"><div className="min-w-0"><dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">Client</dt><dd className="mt-2 break-words text-sm font-semibold text-night">{request.customerName}<span className="mt-1 block break-all text-xs font-normal leading-6 text-muted">{request.customerEmail}</span></dd></div><div><dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">Reçue le</dt><dd className="mt-2 text-sm leading-6">{formatWorkspaceDate(request.createdAt, true)}</dd></div><div><dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">Proposition</dt><dd className="mt-2 text-sm font-semibold">{formatAmount(request.quotedAmount)}</dd></div><div><dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">Échéance</dt><dd className="mt-2 text-sm leading-6">{request.dueAt ? formatWorkspaceDate(request.dueAt, true) : "À convenir"}</dd></div></dl>
          <p className="mt-6 whitespace-pre-wrap break-words text-sm leading-8 text-night">{request.brief}</p>
        </section>
        <section className="rounded-xl border border-line bg-white p-5 sm:p-7" aria-labelledby="order-files-title"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">02 / Les pièces du dossier</p><h2 id="order-files-title" className="mt-3 text-xl font-semibold tracking-tight">Documents de travail</h2><p className="mt-3 text-xs leading-6 text-muted">Les documents du dossier sont accessibles au client et à l’équipe.</p><div className="mt-5"><FileList files={briefs} context="team" /></div><div className="mt-7 border-t border-line pt-6"><div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-base font-semibold">Livrables</h3>{unpublished > 0 ? <span className="rounded-md bg-[#fff0e5] px-2.5 py-1 text-[10px] font-medium text-orange">{unpublished} en préparation</span> : null}</div><p className="mt-3 text-xs leading-6 text-muted">Les nouveaux livrables deviennent accessibles au client lorsque vous publiez la livraison.</p><div className="mt-5"><FileList files={deliveries} context="team" /></div></div></section>
        <OrderConversation key={request.id} requestId={request.id} messages={request.messages} />
        <section className="rounded-xl border border-line bg-white p-5 sm:p-7" aria-labelledby="order-history-title"><h2 id="order-history-title" className="text-xl font-semibold tracking-tight">Les étapes du dossier</h2>{request.events.length ? <ol className="mt-6 space-y-6">{[...request.events].reverse().map((event) => <li key={event.id} className="relative border-l border-line pl-5"><span className="absolute -left-1 top-2 h-[7px] w-[7px] rounded-full bg-orange" aria-hidden="true" /><div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"><p className="break-words text-xs font-semibold">{event.actorName}</p><time dateTime={event.createdAt} className="text-[10px] text-muted">{formatWorkspaceDate(event.createdAt, true)}</time></div><p className="mt-2 whitespace-pre-wrap break-words text-xs leading-7 text-muted">{event.body}</p></li>)}</ol> : <p className="mt-4 text-sm leading-7 text-muted">Le suivi apparaîtra ici à la première mise à jour.</p>}</section>
      </div>
      <OrderManager key={request.id} request={{ id: request.id, version: request.version, status: request.status, quotedAmount: request.quotedAmount, dueAt: request.dueAt, fileCount: request.files.length }} />
    </div>
  </CrmShell>;
}
