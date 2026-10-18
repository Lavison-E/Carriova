import { RefreshButton } from "@/components/workspace/RefreshButton";
import type { Metadata } from "next";
import Link from "next/link";
import { RequestCard, EmptyRequests } from "@/components/workspace/RequestCard";
import { WorkspaceHeading, WorkspaceUnavailable } from "@/components/workspace/WorkspaceUi";
import { loadWorkspaceData } from "@/components/workspace/WorkspaceData";
import { getCustomerWorkspace } from "@/lib/workspace-queries";

export const metadata: Metadata = { title: "Mes demandes" };

export default async function RequestsPage({ searchParams }: { searchParams: Promise<{ view?: string | string[] }> }) {
  const query = await searchParams;
  const view = ["active", "waiting", "completed"].includes(typeof query.view === "string" ? query.view : "") ? query.view as string : "all";
  const result = await loadWorkspaceData(getCustomerWorkspace);
  if (!result) return <WorkspaceUnavailable href="/espace/demandes" />;
  const { requests, stats } = result.data;
  const shown = requests.filter((request) => view === "active" ? !["completed", "cancelled"].includes(request.status) : view === "waiting" ? ["quoted", "delivered"].includes(request.status) : view === "completed" ? request.status === "completed" : true);
  const filters = [{ value: "all", label: "Toutes", count: stats.total }, { value: "active", label: "En cours", count: stats.active }, { value: "waiting", label: "Votre retour", count: stats.awaitingResponse }, { value: "completed", label: "Terminées", count: stats.completed }];
  return <><WorkspaceHeading action={<RefreshButton />} eyebrow="Vos accompagnements" title="Chaque objectif, un suivi." text="Retrouvez vos demandes, consultez les propositions et échangez avec l’équipe au même endroit." />{!requests.length ? <EmptyRequests /> : <><nav aria-label="Filtrer mes demandes" className="mb-6 flex flex-wrap gap-2">{filters.map((filter) => <Link key={filter.value} href={filter.value === "all" ? "/espace/demandes" : `/espace/demandes?view=${filter.value}`} aria-current={view === filter.value ? "page" : undefined} className={`inline-flex min-h-11 items-center gap-3 rounded-lg border px-3.5 text-[11px] font-medium ${view === filter.value ? "border-night bg-night text-white" : "border-line bg-white text-muted hover:text-night"}`}>{filter.label}<span className={view === filter.value ? "text-white/60" : "text-muted"}>{filter.count}</span></Link>)}</nav>{shown.length ? <div className="grid gap-4 xl:grid-cols-2">{shown.map((request) => <RequestCard key={request.id} request={request} />)}</div> : <div className="rounded-xl border border-line bg-white px-6 py-10"><h2 className="text-lg font-semibold text-night">Aucune demande dans cette catégorie.</h2><p className="mt-3 text-sm leading-7 text-muted">Vos demandes apparaîtront ici au fil de leur avancement.</p><Link href="/espace/demandes" className="mt-5 inline-flex min-h-10 items-center text-xs font-semibold text-orange">Voir toutes mes demandes →</Link></div>}</>}</>;
}
