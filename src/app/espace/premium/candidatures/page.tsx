import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { PremiumBadge } from "@/components/premium/PremiumUi";
import { loadWorkspaceData } from "@/components/workspace/WorkspaceData";
import { WorkspaceUnavailable, formatWorkspaceDate } from "@/components/workspace/WorkspaceUi";
import { requireCustomer } from "@/lib/customer-auth";
import { applicationStatusOptions } from "@/lib/premium";
import { getPremiumStatus, listApplications } from "@/lib/premium-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mes candidatures", robots: { index: false, follow: false } };

async function loadApplications() {
  const customer = await requireCustomer();
  const status = await getPremiumStatus(customer.id);
  return { status, applications: status.active ? await listApplications(customer.id) : [], now: Date.now() };
}

export default async function ApplicationsPage() {
  const result = await loadWorkspaceData(loadApplications);
  if (!result) return <WorkspaceUnavailable href="/espace/premium/candidatures" />;
  if (!result.data.status.active) redirect("/espace/premium");
  const { applications, now } = result.data;
  const due = applications.filter((item) => item.followUpAt && item.followUpAt.getTime() <= now && ["applied", "interview"].includes(item.status));
  const columns = applicationStatusOptions.filter((option) => option.value !== "archived");
  return <div className="mx-auto max-w-[1280px]">
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div><PremiumBadge /><h1 className="mt-3 font-editorial text-[2.4rem] italic leading-tight text-night">Mes candidatures</h1><p className="mt-1 text-sm text-muted">Chaque candidature, son statut et sa prochaine relance.</p></div>
      <Link href="/espace/premium" className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-night px-5 text-xs font-semibold text-white hover:bg-royal">Préparer une candidature<CareerIcon name="arrow" className="h-3.5 w-3.5" /></Link>
    </div>
    {due.length ? <div role="status" className="mb-7 flex flex-wrap items-center gap-3 rounded-2xl border border-orange/25 bg-[#fff6ee] px-5 py-4 text-sm text-night"><CareerIcon name="spark" className="h-4 w-4 text-orange" /><span><strong>{due.length} relance{due.length > 1 ? "s" : ""} à faire</strong> aujourd’hui : {due.slice(0, 3).map((item) => item.title).join(", ")}{due.length > 3 ? "…" : ""}</span></div> : null}
    {!applications.length ? <div className="ws-card p-10 text-center"><p className="text-lg font-semibold text-night">Aucune candidature pour le moment.</p><p className="mt-2 text-sm text-muted">Choisissez une offre sélectionnée pour vous ou collez une annonce : l’assistant prépare tout.</p><Link href="/espace/premium" className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-xl bg-orange px-6 text-sm font-semibold text-white">Commencer<CareerIcon name="arrow" className="h-4 w-4" /></Link></div>
      : <div className="-mx-5 overflow-x-auto px-5 pb-4 sm:mx-0 sm:px-0"><div className="grid min-w-[980px] grid-cols-5 gap-4">{columns.map((column) => { const items = applications.filter((item) => item.status === column.value); return <section key={column.value} aria-label={column.label} className="rounded-2xl bg-[#efece4]/70 p-3">
        <h2 className="mb-3 flex items-center justify-between px-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#4a5272]">{column.label}<span className="rounded-full bg-white px-2 py-0.5 text-[10px]">{items.length}</span></h2>
        <ul className="space-y-2.5">{items.map((item) => { const late = item.followUpAt && item.followUpAt.getTime() <= now && ["applied", "interview"].includes(item.status); return <li key={item.id}><Link href={`/espace/premium/candidatures/${item.id}`} className="block rounded-xl border border-night/[0.06] bg-white p-3.5 shadow-[0_1px_2px_rgba(0,18,82,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,18,82,0.08)]">
          <div className="flex items-start justify-between gap-2"><p className="text-[13px] font-semibold leading-snug text-night">{item.title}</p>{item.matchScore !== null ? <span className="shrink-0 rounded-md bg-paper px-1.5 py-0.5 text-[10px] font-bold text-night">{item.matchScore}</span> : null}</div>
          <p className="mt-1 truncate text-[11px] text-muted">{item.company || "Entreprise non précisée"}</p>
          <p className={`mt-2.5 text-[10px] ${late ? "font-semibold text-orange" : "text-muted"}`}>{item.followUpAt ? `${late ? "Relance due" : "Relance"} · ${formatWorkspaceDate(item.followUpAt.toISOString())}` : item.kit ? "Dossier prêt" : "Dossier à générer"}</p>
        </Link></li>; })}{!items.length ? <li className="rounded-xl border border-dashed border-night/10 px-3 py-6 text-center text-[10px] text-muted">Vide</li> : null}</ul>
      </section>; })}</div></div>}
  </div>;
}
