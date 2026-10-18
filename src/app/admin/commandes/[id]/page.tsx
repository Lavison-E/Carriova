import { RefreshButton } from "@/components/workspace/RefreshButton";
import { notFound, redirect } from "next/navigation";
import { CrmShell } from "@/components/admin/CrmShell";
import { DraftDeliveryRemoveButton, OrderConversation, OrderManager } from "@/components/admin/OrderManager";
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
  const published = deliveries.filter((file) => request.events.some((event) => event.type === "delivered" && event.createdAt >= file.createdAt));
  const publishedIds = new Set(published.map((file) => file.id));
  const prepared = deliveries.filter((file) => !publishedIds.has(file.id));
  const latestRevision = request.events.filter((event) => event.type === "revision_requested").reduce<string | null>((latest, event) => !latest || event.createdAt > latest ? event.createdAt : latest, null);
  const publishableCount = prepared.filter((file) => !latestRevision || file.createdAt > latestRevision).length;
  const canDeliver = request.status === "in_progress" || request.status === "revision_requested";

  return <CrmShell user={user} section="orders" action={<RefreshButton />} title={request.title} description={`Commande #${request.id} · ${workspaceServiceLabel(request.service)}`} back>
    <div className="mb-7 flex flex-wrap items-center justify-between gap-4"><RequestStatusBadge status={request.status} /><p className="text-xs leading-6 text-muted">Dernière activité : {formatWorkspaceDate(request.updatedAt, true)}</p></div>
    <RequestProgress status={request.status} />
    <OrderManager key={request.id} request={{ id: request.id, version: request.version, status: request.status, quotedAmount: request.quotedAmount, dueAt: request.dueAt, briefCount: briefs.length, deliveryCount: deliveries.length, unpublishedCount: prepared.length, publishableCount }}>
        <section id="order-deliverables" className="scroll-mt-6 rounded-xl border border-line bg-white p-5 sm:p-7" aria-labelledby="order-deliverables-title">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">Les produits de cette commande</p>
          <h2 id="order-deliverables-title" className="mt-3 text-xl font-semibold tracking-tight">Préparation et livraisons</h2>
          <div className="mt-6 rounded-lg border border-orange/20 bg-[#fffaf5] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-semibold">En préparation</h3><span className="rounded-md bg-[#fff0e5] px-2.5 py-1 text-[10px] font-semibold text-orange">{prepared.length} fichier{prepared.length > 1 ? "s" : ""}</span></div>
            <p className="mt-2 text-xs leading-6 text-muted">Visibles uniquement par l’équipe. Ouvrez chaque fichier pour le vérifier avant publication.</p>
            <div className="mt-4">{prepared.length ? <ul className="space-y-4">{prepared.map((file) => <li key={file.id}><FileList files={[file]} context="team" />{canDeliver ? <DraftDeliveryRemoveButton requestId={request.id} fileId={file.id} version={request.version} filename={file.filename} /> : null}</li>)}</ul> : <p className="text-xs leading-6 text-muted">Aucun produit en préparation.</p>}</div>
          </div>
          <div className="mt-6 border-t border-line pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-sm font-semibold">Produits publiés au client</h3><span className="rounded-md bg-[#e9f2ec] px-2.5 py-1 text-[10px] font-semibold text-[#285236]">{published.length} fichier{published.length > 1 ? "s" : ""}</span></div>
            <p className="mt-2 text-xs leading-6 text-muted">Ces fichiers sont disponibles dans l’espace du client et sont conservés dans le dossier.</p>
            <div className="mt-4"><FileList files={published} context="team" emptyText="Aucun produit publié pour le moment." /></div>
          </div>
        </section>
        <section className="rounded-xl border border-line bg-white p-5 sm:p-7" aria-labelledby="order-brief-title"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">01 / Comprendre la demande</p><h2 id="order-brief-title" className="mt-3 text-xl font-semibold tracking-tight">Le besoin du client</h2>
          <dl className="mt-6 grid gap-5 border-y border-line py-5 sm:grid-cols-2"><div className="min-w-0"><dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">Client</dt><dd className="mt-2 break-words text-sm font-semibold text-night">{request.customerName}<span className="mt-1 block break-all text-xs font-normal leading-6 text-muted">{request.customerEmail}</span></dd></div><div><dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">Reçue le</dt><dd className="mt-2 text-sm leading-6">{formatWorkspaceDate(request.createdAt, true)}</dd></div><div><dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">Proposition</dt><dd className="mt-2 text-sm font-semibold">{formatAmount(request.quotedAmount)}</dd></div><div><dt className="text-[10px] font-semibold uppercase tracking-wide text-muted">Échéance</dt><dd className="mt-2 text-sm leading-6">{request.dueAt ? formatWorkspaceDate(request.dueAt, true) : "À convenir"}</dd></div></dl>
          <p className="mt-6 whitespace-pre-wrap break-words text-sm leading-8 text-night">{request.brief}</p>
        </section>
        <section className="rounded-xl border border-line bg-white p-5 sm:p-7" aria-labelledby="order-files-title"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">Les pièces du dossier</p><h2 id="order-files-title" className="mt-3 text-xl font-semibold tracking-tight">Documents de travail</h2><p className="mt-3 text-xs leading-6 text-muted">Références et documents partagés entre le client et l’équipe, distincts des produits livrés.</p><div className="mt-5"><FileList files={briefs} context="team" /></div></section>
        <OrderConversation key={request.id} requestId={request.id} messages={request.messages} />
        <section className="rounded-xl border border-line bg-white p-5 sm:p-7" aria-labelledby="order-history-title"><h2 id="order-history-title" className="text-xl font-semibold tracking-tight">Les étapes du dossier</h2>{request.events.length ? <ol className="mt-6 space-y-6">{[...request.events].reverse().map((event) => <li key={event.id} className="relative border-l border-line pl-5"><span className="absolute -left-1 top-2 h-[7px] w-[7px] rounded-full bg-orange" aria-hidden="true" /><div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"><p className="break-words text-xs font-semibold">{event.actorName}</p><time dateTime={event.createdAt} className="text-[10px] text-muted">{formatWorkspaceDate(event.createdAt, true)}</time></div><p className="mt-2 whitespace-pre-wrap break-words text-xs leading-7 text-muted">{event.body}</p></li>)}</ol> : <p className="mt-4 text-sm leading-7 text-muted">Le suivi apparaîtra ici à la première mise à jour.</p>}</section>
    </OrderManager>
  </CrmShell>;
}
