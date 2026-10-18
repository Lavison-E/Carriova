import Link from "next/link";
import { redirect } from "next/navigation";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { CrmShell, CrmStatusBadge, CrmUnavailable, formatCrmDate } from "@/components/admin/CrmShell";
import { crmDueOptions, crmStatusOptions, type CrmDashboard, type CrmFilters, type CrmLeadSummary } from "@/lib/crm";
import { getCrmDashboard } from "@/lib/crm-queries";
import { qualificationLabel, qualificationOptions } from "@/lib/qualification";
import { getStaffSession, UnauthorizedError, type StaffIdentity } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prospects et suivi | CRM CARRIOVA", robots: { index: false, follow: false } };

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value; }
function listHref(filters: CrmFilters, page: number) {
  const query = new URLSearchParams();
  for (const key of ["q", "status", "need", "due"] as const) if (filters[key]) query.set(key, filters[key]!);
  if (page > 1) query.set("page", String(page));
  return `/admin/crm${query.size ? `?${query}` : ""}`;
}

async function getDashboardSnapshot(filters: CrmFilters) {
  const dashboard = await getCrmDashboard(filters);
  return { dashboard, now: Date.now() };
}

function FollowUp({ lead, now }: { lead: CrmLeadSummary; now: number }) {
  const overdue = lead.followUpAt && new Date(lead.followUpAt).getTime() < now;
  return <span className={`text-xs leading-6 ${overdue ? "text-orange" : "text-muted"}`}>{formatCrmDate(lead.followUpAt)}{overdue ? <span className="block text-[10px] font-semibold uppercase tracking-wide">En retard</span> : null}</span>;
}

export default async function CrmDashboardPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  let user: StaffIdentity | null;
  try { user = await getStaffSession(); }
  catch { return <CrmShell user={null} title="Prospects & suivi"><CrmUnavailable /></CrmShell>; }
  if (!user) redirect("/admin/connexion");

  const params = await searchParams;
  const requestedStatus = first(params.status);
  const requestedNeed = first(params.need);
  const requestedDue = first(params.due);
  const filters: CrmFilters = {
    q: first(params.q)?.trim().slice(0, 160),
    status: crmStatusOptions.some((item) => item.value === requestedStatus) ? requestedStatus : undefined,
    need: qualificationOptions.need.some((item) => item.value === requestedNeed) ? requestedNeed : undefined,
    due: crmDueOptions.some((item) => item.value === requestedDue) ? requestedDue : undefined,
    page: first(params.page),
  };
  let dashboard: CrmDashboard;
  let now: number;
  try { ({ dashboard, now } = await getDashboardSnapshot(filters)); }
  catch (error) {
    if (error instanceof UnauthorizedError) redirect("/admin/connexion");
    return <CrmShell user={user} title="Prospects & suivi"><CrmUnavailable retryHref={listHref(filters, 1)} /></CrmShell>;
  }
  const filtered = Boolean(filters.q || filters.status || filters.need || filters.due);
  const count = new Intl.NumberFormat("fr-FR");

  return (
    <CrmShell user={user} title="Chaque demande, une prochaine étape." description="Retrouvez les demandes reçues, qualifiez les besoins et organisez vos prochaines relances.">
      <section aria-labelledby="crm-overview-title">
        <h2 id="crm-overview-title" className="mb-4 text-xs font-semibold uppercase tracking-[0.13em] text-muted">Vue d’ensemble · Tous les prospects</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-5">
          {[
            { label: "Prospects au total", value: dashboard.stats.total, href: "/admin/crm", accent: false },
            { label: "Nouveaux", value: dashboard.stats.new, href: "/admin/crm?status=new", accent: false },
            { label: "Qualifiés", value: dashboard.stats.qualified, href: "/admin/crm?status=qualified", accent: false },
            { label: "Relances en retard", value: dashboard.stats.overdue, href: "/admin/crm?due=overdue", accent: true },
          ].map((metric) => <Link key={metric.label} href={metric.href} className="group rounded-xl border border-line bg-white p-5 transition-colors hover:border-night/35 sm:p-6"><span className="flex items-start justify-between gap-3"><span className="text-[11px] font-medium leading-5 text-muted">{metric.label}</span><CareerIcon name="arrow" className="mt-0.5 h-3.5 w-3.5 shrink-0 -rotate-45 text-muted group-hover:text-night" /></span><span className={`mt-4 block text-3xl font-semibold tracking-tight sm:text-4xl ${metric.accent && metric.value > 0 ? "text-orange" : "text-night"}`}>{count.format(metric.value)}</span></Link>)}
        </div>
      </section>

      <section className="mt-9 overflow-hidden rounded-xl border border-line bg-white" aria-labelledby="crm-list-title">
        <div className="border-b border-line p-5 sm:p-7">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><h2 id="crm-list-title" className="text-xl font-semibold tracking-tight">Les prospects</h2><p className="text-xs text-muted">{count.format(dashboard.total)} résultat{dashboard.total > 1 ? "s" : ""}{filtered ? " pour cette recherche" : ""}</p></div>
          <form key={JSON.stringify([filters.q ?? "", filters.status ?? "", filters.need ?? "", filters.due ?? ""])} method="get" action="/admin/crm" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1.7fr_1fr_1.3fr_1fr_auto] lg:items-end">
            <label className="block text-[11px] font-semibold text-night">Rechercher<input type="search" name="q" maxLength={160} defaultValue={filters.q ?? ""} placeholder="Nom, numéro, besoin, statut…" className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 text-sm font-normal text-night placeholder:text-muted/80 focus:border-night" /></label>
            <label className="block text-[11px] font-semibold text-night">Statut<select name="status" defaultValue={filters.status ?? ""} className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 text-xs font-normal"><option value="">Tous les statuts</option>{crmStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="block text-[11px] font-semibold text-night">Besoin<select name="need" defaultValue={filters.need ?? ""} className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 text-xs font-normal"><option value="">Tous les besoins</option>{qualificationOptions.need.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <label className="block text-[11px] font-semibold text-night">Relance<select name="due" defaultValue={filters.due ?? ""} className="mt-2 h-11 w-full rounded-lg border border-line bg-white px-3 text-xs font-normal"><option value="">Toutes les relances</option>{crmDueOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>
            <button type="submit" className="min-h-11 rounded-lg bg-night px-5 py-2 text-xs font-semibold text-white hover:bg-royal sm:col-span-2 lg:col-span-1">Filtrer</button>
          </form>
          {filtered ? <Link href="/admin/crm" className="mt-3 inline-flex min-h-8 items-center text-xs font-medium text-muted underline underline-offset-4 hover:text-night">Effacer les filtres</Link> : null}
        </div>

        {dashboard.leads.length ? (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[900px] border-collapse text-left"><caption className="sr-only">Liste des prospects, leurs besoins, statuts et prochaines relances</caption><thead className="border-b border-line bg-[#fafaf7]"><tr>{["Prospect", "Besoin", "Statut", "Prochaine relance", "Reçu le", ""].map((label, index) => <th key={index} scope="col" className="px-5 py-4 text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">{label || <span className="sr-only">Dossier</span>}</th>)}</tr></thead><tbody className="divide-y divide-line">{dashboard.leads.map((lead) => <tr key={lead.id} className="hover:bg-paper/50"><td className="max-w-[250px] px-5 py-5"><Link href={`/admin/crm/${lead.id}`} className="break-words text-sm font-semibold text-night hover:text-orange">{lead.fullName}</Link><p className="mt-1.5 break-all text-xs leading-5 text-muted">{lead.whatsapp || lead.email || "Contact non renseigné"}</p>{lead.priority === "high" ? <p className="mt-2 text-[10px] font-semibold text-orange">Priorité haute</p> : null}</td><td className="max-w-[220px] px-5 py-5 text-xs leading-6 text-muted">{qualificationLabel("need", lead.need)}</td><td className="px-5 py-5"><CrmStatusBadge status={lead.status} /></td><td className="whitespace-nowrap px-5 py-5"><FollowUp lead={lead} now={now} /></td><td className="whitespace-nowrap px-5 py-5 text-xs text-muted">{formatCrmDate(lead.createdAt, false)}</td><td className="px-5 py-5"><Link href={`/admin/crm/${lead.id}`} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line text-night hover:border-night" aria-label={`Ouvrir le dossier de ${lead.fullName}`}><CareerIcon name="arrow" className="h-4 w-4" /></Link></td></tr>)}</tbody></table>
            </div>
            <ul className="divide-y divide-line md:hidden">{dashboard.leads.map((lead) => <li key={lead.id} className="p-5"><div className="flex items-start justify-between gap-3"><Link href={`/admin/crm/${lead.id}`} className="min-w-0 break-words text-base font-semibold leading-6 text-night">{lead.fullName}</Link><CrmStatusBadge status={lead.status} /></div><p className="mt-2 break-all text-xs text-muted">{lead.whatsapp || lead.email || "Contact non renseigné"}</p><p className="mt-4 text-xs leading-6 text-night">{qualificationLabel("need", lead.need)}</p><div className="mt-4 flex items-end justify-between gap-4"><div><p className="text-[10px] uppercase tracking-wider text-muted">Relance</p><FollowUp lead={lead} now={now} /></div><Link href={`/admin/crm/${lead.id}`} className="inline-flex min-h-10 shrink-0 items-center gap-2 text-xs font-semibold text-night">Voir le dossier <CareerIcon name="arrow" className="h-4 w-4" /></Link></div>{lead.priority === "high" ? <p className="mt-3 text-[10px] font-semibold text-orange">Priorité haute</p> : null}</li>)}</ul>
            <nav aria-label="Pagination des prospects" className="flex flex-col gap-4 border-t border-line px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7"><p className="text-xs text-muted">{count.format((dashboard.page - 1) * dashboard.pageSize + 1)}–{count.format(Math.min(dashboard.page * dashboard.pageSize, dashboard.total))} sur {count.format(dashboard.total)} prospects</p><div className="flex items-center justify-between gap-4 sm:justify-end">{dashboard.page > 1 ? <Link href={listHref(filters, dashboard.page - 1)} className="inline-flex min-h-10 items-center rounded-lg border border-line px-3 text-xs font-medium hover:border-night">Précédente</Link> : <span aria-disabled="true" className="px-3 py-3 text-xs text-muted/60">Précédente</span>}<span className="text-xs text-muted">{dashboard.page} / {dashboard.totalPages}</span>{dashboard.page < dashboard.totalPages ? <Link href={listHref(filters, dashboard.page + 1)} className="inline-flex min-h-10 items-center rounded-lg border border-line px-3 text-xs font-medium hover:border-night">Suivante</Link> : <span aria-disabled="true" className="px-3 py-3 text-xs text-muted/60">Suivante</span>}</div></nav>
          </>
        ) : <div className="px-6 py-14 text-center"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-paper text-night"><CareerIcon name="people" /></span><h3 className="mt-5 text-lg font-semibold">{filtered ? "Aucun prospect ne correspond à ces critères." : "Votre premier prospect apparaîtra ici."}</h3><p className="mx-auto mt-3 max-w-md text-sm leading-7 text-muted">{filtered ? "Essayez un autre nom, un autre statut ou élargissez vos filtres." : "Les demandes enregistrées sur le site seront disponibles pour qualification et suivi."}</p>{filtered ? <Link href="/admin/crm" className="mt-5 inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-xs font-semibold hover:border-night">Afficher tous les prospects</Link> : null}</div>}
      </section>
    </CrmShell>
  );
}
