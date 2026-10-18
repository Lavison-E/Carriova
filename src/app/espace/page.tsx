import type { Metadata } from "next";
import Link from "next/link";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { RequestCard, EmptyRequests } from "@/components/workspace/RequestCard";
import { WorkspaceHeading, WorkspaceUnavailable } from "@/components/workspace/WorkspaceUi";
import { loadWorkspaceData } from "@/components/workspace/WorkspaceData";
import { requireCustomer } from "@/lib/customer-auth";
import { getCustomerWorkspace } from "@/lib/workspace-queries";

export const metadata: Metadata = { title: "Mon espace" };

export default async function WorkspacePage() {
  const result = await loadWorkspaceData(async () => {
    const [customer, workspace] = await Promise.all([requireCustomer(), getCustomerWorkspace()]);
    return { customer, workspace };
  });
  if (!result) return <WorkspaceUnavailable />;
  const { customer, workspace: { requests, stats } } = result.data;
  const firstName = customer.name.trim().split(/\s+/)[0];
  const waiting = requests.filter((request) => ["quoted", "delivered"].includes(request.status));
  const featured = [...waiting, ...requests.filter((request) => !waiting.includes(request))].slice(0, 4);
  return <>
    <WorkspaceHeading eyebrow="Votre espace CARRIOVA" title={`Bonjour ${firstName}.`} text="Vos projets, vos échanges et vos documents. Tout est ici pour avancer avec nous." />
    <div className="mb-7 grid grid-cols-3 overflow-hidden rounded-xl border border-line bg-white">{[{ label: "En cours", value: stats.active, href: "/espace/demandes?view=active" }, { label: "À vous de jouer", value: stats.awaitingResponse, href: "/espace/demandes?view=waiting" }, { label: "Terminées", value: stats.completed, href: "/espace/demandes?view=completed" }].map((metric) => <Link key={metric.label} href={metric.href} className="group border-r border-line px-3 py-5 last:border-0 hover:bg-paper sm:px-6 sm:py-6"><span className="block text-3xl font-semibold tracking-tight text-night sm:text-4xl">{metric.value}</span><span className="mt-2 block text-[9px] font-medium leading-5 text-muted group-hover:text-night sm:text-[11px]">{metric.label}</span></Link>)}</div>
    {waiting.length ? <div className="mb-7 flex flex-col gap-4 rounded-xl bg-night p-5 text-white sm:flex-row sm:items-center sm:justify-between sm:p-6"><div><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-[#f7bd92]">La prochaine étape vous appartient</p><p className="mt-2 text-sm leading-7">{waiting.length === 1 ? "Une demande attend votre retour." : `${waiting.length} demandes attendent votre retour.`}</p></div><Link href={`/espace/demandes/${waiting[0].id}`} className="inline-flex min-h-11 shrink-0 items-center justify-between gap-7 rounded-lg bg-white px-4 text-xs font-semibold text-night">{waiting[0].status === "quoted" ? "Consulter la proposition" : "Consulter la livraison"}<CareerIcon name="arrow" className="h-4 w-4" /></Link></div> : null}
    {!requests.length ? <EmptyRequests /> : <section aria-labelledby="recent-requests"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 id="recent-requests" className="text-lg font-semibold tracking-tight text-night">Vos demandes à suivre</h2><Link href="/espace/demandes" className="inline-flex min-h-9 items-center gap-3 text-xs font-medium text-muted hover:text-night">Tout voir ({stats.total})<CareerIcon name="arrow" className="h-3.5 w-3.5" /></Link></div><div className="grid gap-4 xl:grid-cols-2">{featured.map((request) => <RequestCard key={request.id} request={request} progress />)}</div></section>}
    <div className="mt-7 grid gap-4 sm:grid-cols-2"><Link href="/espace/documents" className="flex items-center gap-4 rounded-xl border border-line bg-white p-5 hover:border-night/30"><CareerIcon name="document" className="h-6 w-6 shrink-0 text-night" /><span className="flex-1"><span className="block text-xs font-semibold text-night">Mes produits livrés</span><span className="mt-1 block text-[11px] leading-6 text-muted">Téléchargez vos produits et retrouvez vos documents.</span></span><CareerIcon name="arrow" className="h-4 w-4 text-night" /></Link><Link href="/espace/nouvelle-demande" className="flex items-center gap-4 rounded-xl border border-line bg-white p-5 hover:border-night/30"><CareerIcon name="target" className="h-6 w-6 shrink-0 text-orange" /><span className="flex-1"><span className="block text-xs font-semibold text-night">Un nouvel objectif ?</span><span className="mt-1 block text-[11px] leading-6 text-muted">Parlons de votre prochaine étape.</span></span><CareerIcon name="arrow" className="h-4 w-4 text-night" /></Link></div>
  </>;
}
