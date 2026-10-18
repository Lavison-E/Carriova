import { RefreshButton } from "@/components/workspace/RefreshButton";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { CrmShell } from "@/components/admin/CrmShell";
import { RequestStatusBadge, formatAmount, formatWorkspaceDate } from "@/components/workspace/WorkspaceUi";
import { getStaffSession, UnauthorizedError, type StaffIdentity } from "@/lib/staff-auth";
import { getTeamRequests } from "@/lib/workspace-queries";
import { workspaceServiceLabel, workspaceStatusOptions, type TeamRequestFilters, type TeamRequests } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const metadata = { title: "Commandes | Équipe Carriova", robots: { index: false, follow: false } };
const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;
function listHref(filters: TeamRequestFilters, page: number) {
  const query = new URLSearchParams();
  for (const key of ["q", "status", "sort"] as const) if (filters[key]) query.set(key, filters[key]!);
  if (page > 1) query.set("page", String(page));
  return `/admin/commandes${query.size ? `?${query}` : ""}`;
}
function Unavailable({ retryHref = "/admin/commandes" }: { retryHref?: string }) {
  return <div role="alert" className="rounded-xl border border-line bg-white p-7 sm:p-10"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">Chargement indisponible</p><h2 className="mt-4 text-2xl font-semibold">Les commandes ne sont pas disponibles pour le moment.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-muted">Réessayez dans un instant. Les dossiers restent enregistrés dans l’espace client.</p><a href={retryHref} className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-night px-5 text-sm font-semibold text-white">Réessayer</a></div>;
}

export default async function TeamOrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  let user: StaffIdentity | null;
  try { user = await getStaffSession(); }
  catch { return <CrmShell user={null} section="orders" title="Les commandes"><Unavailable /></CrmShell>; }
  if (!user) redirect("/admin/connexion");
  const params = await searchParams;
  const rawStatus = first(params.status);
  const rawSort = first(params.sort);
  const filters: TeamRequestFilters = {
    q: first(params.q)?.trim().slice(0, 160),
    status: workspaceStatusOptions.some((option) => option.value === rawStatus) ? rawStatus : undefined,
    sort: rawSort === "oldest" || rawSort === "due" ? rawSort : "recent",
    page: first(params.page),
  };
  let result: TeamRequests;
  try { result = await getTeamRequests(filters); }
  catch (error) {
    if (error instanceof UnauthorizedError) redirect("/admin/connexion");
    return <CrmShell user={user} section="orders" action={<RefreshButton />} title="Les commandes"><Unavailable retryHref={listHref(filters, 1)} /></CrmShell>;
  }
  const filtered = Boolean(filters.q || filters.status);
  const count = new Intl.NumberFormat("fr-FR");

  return <CrmShell user={user} section="orders" action={<RefreshButton />} title="Du premier échange au travail livré." description="Étudiez les demandes, préparez vos propositions et accompagnez chaque commande jusqu’à sa validation.">
    <div className="mb-7 flex flex-col gap-5 border-y border-night/15 py-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-baseline gap-3"><span className="font-editorial text-4xl italic text-night">{count.format(result.total)}</span><span className="text-xs leading-6 text-muted">commande{result.total > 1 ? "s" : ""}{filtered ? " dans cette sélection" : " au total"}</span></div><p className="max-w-md text-xs leading-6 text-muted">Le client accepte la proposition et valide la livraison depuis son espace. Chaque étape reste visible dans le dossier.</p></div>
    <nav aria-label="Accès rapide aux étapes" className="mb-7 flex flex-wrap gap-2">{[{ value: "received", label: "À étudier" }, { value: "quoted", label: "Accord attendu" }, { value: "in_progress", label: "À réaliser" }, { value: "revision_requested", label: "À reprendre" }].map((item) => <Link key={item.value} href={`/admin/commandes?status=${item.value}`} aria-current={filters.status === item.value ? "page" : undefined} className={`inline-flex min-h-10 items-center rounded-lg border px-4 text-xs font-medium ${filters.status === item.value ? "border-night bg-night text-white" : "border-line bg-white text-night hover:border-night"}`}>{item.label}</Link>)}</nav>
    <section className="overflow-hidden rounded-xl border border-line bg-white" aria-labelledby="order-list-title">
      <div className="border-b border-line p-5 sm:p-7"><h2 id="order-list-title" className="text-xl font-semibold tracking-tight">Suivi des commandes</h2>
        <form key={`${filters.q ?? ""}|${filters.status ?? ""}|${filters.sort}`} method="get" action="/admin/commandes" className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.7fr_1.2fr_1.1fr_auto] lg:items-end">
          <label className="block text-[11px] font-semibold text-night">Rechercher<input name="q" type="search" maxLength={160} defaultValue={filters.q ?? ""} placeholder="Commande, nom ou e-mail du client…" className="mt-2 h-12 w-full rounded-lg border border-line px-3 text-sm font-normal placeholder:text-muted/80" /></label>
          <label className="block text-[11px] font-semibold text-night">Étape<select name="status" defaultValue={filters.status ?? ""} className="mt-2 h-12 w-full rounded-lg border border-line bg-white px-3 text-xs font-normal"><option value="">Toutes les étapes</option>{workspaceStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
          <label className="block text-[11px] font-semibold text-night">Trier par<select name="sort" defaultValue={filters.sort} className="mt-2 h-12 w-full rounded-lg border border-line bg-white px-3 text-xs font-normal"><option value="recent">Dernière activité</option><option value="oldest">Demandes les plus anciennes</option><option value="due">Échéance la plus proche</option></select></label>
          <button type="submit" className="min-h-12 rounded-lg bg-night px-5 py-3 text-xs font-semibold text-white hover:bg-royal">Appliquer</button>
        </form>{filtered ? <Link href="/admin/commandes" className="mt-3 inline-flex min-h-9 items-center text-xs text-muted underline underline-offset-4 hover:text-night">Effacer les filtres</Link> : null}
      </div>
      {result.requests.length ? <>
        <div className="hidden overflow-x-auto md:block"><table className="w-full min-w-[950px] border-collapse text-left"><caption className="sr-only">Commandes et dossiers clients</caption><thead className="border-b border-line bg-[#fafaf7]"><tr>{["Commande / Client", "Étape", "Proposition", "Échéance", "Dernière activité", ""].map((label, index) => <th key={index} scope="col" className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">{label || <span className="sr-only">Dossier</span>}</th>)}</tr></thead><tbody className="divide-y divide-line">{result.requests.map((request) => <tr key={request.id} className="hover:bg-paper/50"><td className="max-w-[300px] px-5 py-5"><p className="text-[10px] text-muted">#{request.id} · {workspaceServiceLabel(request.service)}</p><Link href={`/admin/commandes/${request.id}`} className="mt-2 block break-words text-sm font-semibold leading-6 text-night hover:text-orange">{request.title}</Link><p className="mt-2 break-words text-xs text-muted">{request.customerName}</p><p className="mt-1 break-all text-[11px] text-muted">{request.customerEmail}</p></td><td className="px-5 py-5"><RequestStatusBadge status={request.status} /></td><td className="whitespace-nowrap px-5 py-5 text-xs font-medium text-night">{formatAmount(request.quotedAmount)}</td><td className="px-5 py-5 text-xs leading-6 text-muted">{request.dueAt ? formatWorkspaceDate(request.dueAt, true) : "À convenir"}</td><td className="px-5 py-5 text-xs leading-6 text-muted">{formatWorkspaceDate(request.updatedAt, true)}</td><td className="px-5 py-5"><Link href={`/admin/commandes/${request.id}`} aria-label={`Ouvrir la commande ${request.title}`} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-night hover:border-night"><CareerIcon name="arrow" className="h-4 w-4" /></Link></td></tr>)}</tbody></table></div>
        <ul className="divide-y divide-line md:hidden">{result.requests.map((request) => <li key={request.id} className="p-5"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] text-muted">Commande #{request.id}</p><RequestStatusBadge status={request.status} /></div><Link href={`/admin/commandes/${request.id}`} className="mt-4 block break-words text-lg font-semibold leading-7 text-night">{request.title}</Link><p className="mt-2 text-xs leading-6 text-muted">{workspaceServiceLabel(request.service)}</p><div className="mt-4 border-t border-line pt-4"><p className="break-words text-sm font-medium">{request.customerName}</p><p className="mt-1 break-all text-xs text-muted">{request.customerEmail}</p></div><dl className="mt-5 grid grid-cols-2 gap-4 text-xs"><div><dt className="text-muted">Proposition</dt><dd className="mt-2 font-medium">{formatAmount(request.quotedAmount)}</dd></div><div><dt className="text-muted">Échéance</dt><dd className="mt-2 leading-6">{request.dueAt ? formatWorkspaceDate(request.dueAt, true) : "À convenir"}</dd></div></dl><Link href={`/admin/commandes/${request.id}`} className="mt-5 flex min-h-11 items-center justify-between border-t border-line pt-3 text-xs font-semibold">Traiter la commande<CareerIcon name="arrow" className="h-4 w-4" /></Link></li>)}</ul>
        <nav aria-label="Pagination des commandes" className="flex flex-col gap-4 border-t border-line px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><p className="text-xs text-muted">{count.format((result.page - 1) * result.pageSize + 1)}–{count.format(Math.min(result.page * result.pageSize, result.total))} sur {count.format(result.total)}</p><div className="flex items-center justify-between gap-4 sm:justify-end">{result.page > 1 ? <Link href={listHref(filters, result.page - 1)} className="inline-flex min-h-10 items-center rounded-lg border border-line px-3 text-xs font-medium">Précédente</Link> : <span className="px-3 py-3 text-xs text-muted/60">Précédente</span>}<span className="text-xs text-muted">{result.page} / {result.totalPages}</span>{result.page < result.totalPages ? <Link href={listHref(filters, result.page + 1)} className="inline-flex min-h-10 items-center rounded-lg border border-line px-3 text-xs font-medium">Suivante</Link> : <span className="px-3 py-3 text-xs text-muted/60">Suivante</span>}</div></nav>
      </> : <div className="px-6 py-16 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-paper text-night"><CareerIcon name="briefcase" /></span><h3 className="mt-5 text-lg font-semibold">{filtered ? "Aucune commande pour cette recherche." : "Les premières commandes apparaîtront ici."}</h3><p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted">{filtered ? "Modifiez les critères pour retrouver le dossier souhaité." : "Les clients peuvent décrire leur besoin et joindre leurs documents depuis leur espace."}</p>{filtered ? <Link href="/admin/commandes" className="mt-5 inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-xs font-semibold">Voir toutes les commandes</Link> : null}</div>}
    </section>
  </CrmShell>;
}
