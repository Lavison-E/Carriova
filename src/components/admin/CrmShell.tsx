import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { crmStatusOptions, type CrmStatus } from "@/lib/crm";
import type { StaffIdentity } from "@/lib/staff-auth";
import { staffLogout } from "@/lib/staff-actions";

export function CrmShell({ user, children, title, description, back, action, section = "prospects" }: {
  user: StaffIdentity | null;
  children: ReactNode;
  title: string;
  description?: string;
  back?: boolean;
  action?: ReactNode;
  section?: "prospects" | "orders" | "notifications";
}) {
  return (
    <div className="min-h-screen bg-paper text-night">
      <header className="border-b border-white/15 bg-night text-white">
        <div className="mx-auto flex min-h-20 max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-5 py-3 sm:px-8 lg:px-12">
          <div className="flex items-center gap-4 sm:gap-6"><Logo variant="light" markId="crm" /><span className="border-l border-white/25 pl-4 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/65 sm:pl-6">Espace équipe</span></div>
          {user ? (
            <div className="flex items-center gap-4 sm:gap-6"><div className="hidden text-right sm:block"><p className="text-xs font-medium">{user.name}</p><p className="mt-1 text-[10px] text-white/60">{user.role === "admin" ? "Administrateur" : "Conseiller"}</p></div><form action={staffLogout}><button type="submit" className="min-h-10 rounded-lg border border-white/25 px-3 text-xs font-medium hover:border-white/60">Se déconnecter</button></form></div>
          ) : <Link href="/admin/connexion" className="min-h-10 py-3 text-xs font-medium text-white/80 hover:text-white">Connexion équipe</Link>}
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 pb-16 pt-8 sm:px-8 lg:px-12 lg:pt-10">
        <nav aria-label="Navigation équipe" className="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-night/15 pb-5 text-xs">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <Link href="/admin/crm" aria-current={section === "prospects" ? "page" : undefined} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 font-semibold ${section === "prospects" ? "bg-night text-white" : "text-muted hover:bg-white hover:text-night"}`}><CareerIcon name="people" className="h-4 w-4" />Prospects</Link>
            <Link href="/admin/commandes" aria-current={section === "orders" ? "page" : undefined} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 font-semibold ${section === "orders" ? "bg-night text-white" : "text-muted hover:bg-white hover:text-night"}`}><CareerIcon name="briefcase" className="h-4 w-4" />Commandes</Link>
            <Link href="/admin/notifications" aria-current={section === "notifications" ? "page" : undefined} className={`inline-flex min-h-10 items-center gap-2 rounded-lg px-3 font-semibold ${section === "notifications" ? "bg-night text-white" : "text-muted hover:bg-white hover:text-night"}`}>Notifications</Link>
          </div>
          <Link href="/qualification" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center gap-2 text-muted hover:text-night">Formulaire public <span aria-hidden="true">↗</span><span className="sr-only">(nouvel onglet)</span></Link>
        </nav>
        {back ? <Link href={section === "orders" ? "/admin/commandes" : "/admin/crm"} className="mb-6 inline-flex min-h-9 items-center gap-2 text-xs font-medium text-muted hover:text-night"><CareerIcon name="arrow" className="h-4 w-4 rotate-180" />{section === "orders" ? "Retour aux commandes" : "Retour aux prospects"}</Link> : null}
        <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange">CARRIOVA / {section === "orders" ? "Commandes & accompagnement" : section === "notifications" ? "Notifications" : "Relation prospects"}</p><h1 className="mt-3 break-words font-editorial text-4xl italic leading-tight tracking-tight sm:text-5xl">{title}</h1>{description ? <p className="mt-4 max-w-3xl text-sm leading-7 text-muted">{description}</p> : null}</div>{action}</div>
        {children}
      </div>
      <footer className="mx-auto flex max-w-7xl flex-col gap-2 border-t border-night/10 px-5 py-6 text-[10px] leading-5 text-muted sm:flex-row sm:justify-between sm:px-8 lg:px-12"><p>CARRIOVA · Espace réservé à l’équipe</p><p>Horaires affichés en UTC · Abidjan</p></footer>
    </div>
  );
}

export function CrmUnavailable({ retryHref = "/admin/crm" }: { retryHref?: string }) {
  return (
    <div role="alert" className="rounded-xl border border-line bg-white p-7 sm:p-10">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">Chargement indisponible</p>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight">Le CRM est temporairement indisponible.</h2>
      <p className="mt-4 max-w-xl text-sm leading-7 text-muted">Les données n’ont pas pu être chargées. Réessayez dans un instant ou signalez le problème à votre administrateur.</p>
      <a href={retryHref} className="mt-6 inline-flex min-h-11 items-center gap-5 rounded-lg bg-night px-5 text-sm font-semibold text-white hover:bg-royal">Réessayer <CareerIcon name="arrow" className="h-4 w-4" /></a>
    </div>
  );
}

export function CrmStatusBadge({ status }: { status: CrmStatus }) {
  const tones: Record<CrmStatus, string> = {
    new: "bg-soft text-night", to_qualify: "bg-[#f3eee4] text-[#745323]",
    hot: "bg-[#fff0e5] text-[#9e3708]", qualified: "bg-[#edf4ee] text-[#285236]",
    proposal_sent: "bg-[#edf1fa] text-[#294a85]", negotiating: "bg-[#f2edf6] text-[#604575]",
    client: "bg-[#e7f1e9] text-[#285236]", lost: "bg-[#f8eeee] text-[#91403a]",
    nurture: "bg-[#f1eef6] text-[#604575]",
  };
  return <span className={`inline-flex whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-medium ${tones[status] ?? tones.new}`}>{crmStatusOptions.find((item) => item.value === status)?.label ?? status}</span>;
}

export function formatCrmDate(value: string | null, withTime = true) {
  if (!value) return "Non planifiée";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Date indisponible";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", ...(withTime ? { timeStyle: "short" as const } : {}), timeZone: "Africa/Abidjan" }).format(date);
}
