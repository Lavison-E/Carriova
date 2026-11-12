import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { WorkspaceNavigation } from "@/components/workspace/WorkspaceNavigation";
import { customerLogout } from "@/lib/customer-actions";

export function customerInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : parts[0]?.[1] ?? "")).toLocaleUpperCase("fr");
}

export function CustomerAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "xl" }) {
  const sizes = { sm: "h-9 w-9 text-[11px]", md: "h-11 w-11 text-sm", xl: "h-20 w-20 text-2xl sm:h-24 sm:w-24 sm:text-3xl" };
  return <span aria-hidden="true" className={`relative inline-flex shrink-0 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_25%,#2f5bc4,#001252_70%)] font-semibold tracking-wide text-white ring-2 ring-gold/70 ring-offset-2 ring-offset-transparent ${sizes[size]}`}>{customerInitials(name) || "C"}</span>;
}

export function WorkspaceShell({ customer, children }: { customer: { name: string; email: string } | null; children: ReactNode }) {
  return <div className="min-h-screen bg-[#f6f4ef] text-night">
    <header className="sticky top-0 z-40 bg-night/95 text-white backdrop-blur supports-[backdrop-filter]:bg-night/85">
      <div className="mx-auto flex h-[4.5rem] max-w-[1480px] items-center justify-between gap-4 px-5 sm:px-8">
        <div className="flex min-w-0 items-center gap-5"><Logo variant="light" markId="workspace" /><span className="hidden border-l border-white/15 pl-5 text-[10px] font-medium uppercase tracking-[0.22em] text-white/55 md:block">Espace carrière</span></div>
        {customer ? <div className="flex items-center gap-3 sm:gap-5">
          <Link href="/espace/nouvelle-demande" className="inline-flex min-h-10 items-center gap-2 rounded-full bg-orange px-4 text-[11px] font-semibold shadow-[0_8px_22px_rgba(189,71,13,0.35)] transition hover:-translate-y-px hover:bg-[#d4540f]"><span aria-hidden="true" className="text-base font-normal leading-none">+</span><span className="sm:hidden">Demande</span><span className="hidden sm:inline">Nouvelle demande</span></Link>
          <Link href="/espace/compte" className="group hidden items-center gap-3 rounded-full py-1 pl-1 pr-4 transition hover:bg-white/[0.07] sm:flex" aria-label={`Mon compte : ${customer.name}`}><CustomerAvatar name={customer.name} size="sm" /><span className="hidden min-w-0 leading-tight md:block"><span className="block max-w-40 truncate text-xs font-semibold">{customer.name}</span><span className="block max-w-40 truncate text-[10px] text-white/55">{customer.email}</span></span></Link>
        </div> : <Link href="/compte/connexion" className="text-xs">Connexion</Link>}
      </div>
      <div aria-hidden="true" className="h-px bg-[linear-gradient(90deg,transparent,rgba(214,168,79,0.65),transparent)]" />
    </header>
    <div className="mx-auto grid min-h-[calc(100dvh-4.5rem)] max-w-[1480px] lg:grid-cols-[264px_minmax(0,1fr)]">
      {customer ? <aside className="sticky top-[4.5rem] hidden h-[calc(100dvh-4.5rem)] flex-col overflow-y-auto border-r border-night/[0.07] bg-white/70 px-4 pb-6 pt-6 backdrop-blur lg:flex">
        <Link href="/espace/compte" className="mb-7 flex items-center gap-3 rounded-2xl border border-night/[0.06] bg-[linear-gradient(135deg,#fff,#f7f3ea)] p-3 shadow-[0_6px_18px_rgba(0,18,82,0.05)] transition hover:border-night/15"><CustomerAvatar name={customer.name} /><span className="min-w-0"><span className="block truncate text-[13px] font-semibold text-night">{customer.name}</span><span className="mt-0.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.12em] text-[#9a7428]"><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-gold" />Membre Carriova</span></span></Link>
        <WorkspaceNavigation />
        <div className="mt-auto space-y-4 pt-8">
          <div className="relative overflow-hidden rounded-2xl bg-night p-4 text-white"><div aria-hidden="true" className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-orange/30 blur-2xl" /><p className="relative font-editorial text-lg italic leading-snug">Un pas après l’autre.</p><p className="relative mt-2 text-[11px] leading-5 text-white/65">Une question sur votre parcours ? L’équipe vous répond.</p><Link href="/support" className="relative mt-3 inline-flex min-h-9 items-center gap-2 text-[11px] font-semibold text-gold hover:text-white">Contacter un conseiller <CareerIcon name="arrow" className="h-3 w-3" /></Link></div>
          <div className="flex items-center justify-between px-2"><Link href="/" className="inline-flex min-h-9 items-center gap-2 text-[11px] text-muted hover:text-night"><CareerIcon name="home" className="h-3.5 w-3.5" />Retour au site</Link><form action={customerLogout}><button type="submit" className="inline-flex min-h-9 items-center gap-2 text-[11px] font-medium text-muted hover:text-orange"><CareerIcon name="logout" className="h-3.5 w-3.5" />Déconnexion</button></form></div>
        </div>
      </aside> : null}
      <div id="espace-contenu" className={`min-w-0 px-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-7 sm:px-8 sm:pt-10 lg:px-10 lg:pb-14 xl:px-14 ${customer ? "" : "lg:col-span-2"}`}>{children}</div>
    </div>
    {customer ? <WorkspaceNavigation mobile /> : null}
  </div>;
}
