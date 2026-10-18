import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { WorkspaceNavigation } from "@/components/workspace/WorkspaceNavigation";
import { customerLogout } from "@/lib/customer-actions";

export function WorkspaceShell({ customer, children }: { customer: { name: string; email: string } | null; children: ReactNode }) {
  return <div className="min-h-screen bg-paper text-night">
    <header className="sticky top-0 z-40 border-b border-white/15 bg-night text-white"><div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8"><div className="flex items-center gap-5"><Logo variant="light" markId="workspace" /><span className="hidden border-l border-white/20 pl-5 text-[10px] uppercase tracking-[0.17em] text-white/60 md:block">Votre espace carrière</span></div><div className="flex items-center gap-6">{customer ? <><Link href="/espace/compte" className="hidden max-w-48 truncate text-xs font-medium text-white/80 sm:block">{customer.name}</Link><Link href="/espace/nouvelle-demande" className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-orange px-3 text-[11px] font-semibold hover:bg-[#9e3708]"><span aria-hidden="true" className="text-lg font-normal leading-none">+</span><span className="sm:hidden">Demande</span><span className="hidden sm:inline">Nouvelle demande</span></Link></> : <Link href="/compte/connexion" className="text-xs">Connexion</Link>}</div></div></header>
    <div className="mx-auto grid min-h-[calc(100dvh-5rem)] max-w-[1440px] lg:grid-cols-[220px_minmax(0,1fr)]">
      {customer ? <aside className="sticky top-20 hidden h-[calc(100dvh-5rem)] flex-col border-r border-line bg-white px-4 py-7 lg:flex"><p className="mb-5 px-3 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted">Mon accompagnement</p><WorkspaceNavigation /><div className="mt-auto px-3 pt-10"><p className="font-editorial text-xl italic leading-snug">Un pas après l’autre.</p><p className="mt-3 text-[11px] leading-6 text-muted">Vos échanges et vos documents, au même endroit.</p><Link href="/" className="mt-5 inline-flex min-h-9 items-center gap-3 text-[11px] text-muted hover:text-night">Retour au site <CareerIcon name="arrow" className="h-3 w-3 -rotate-45" /></Link><form action={customerLogout} className="mt-3 border-t border-line pt-3"><button type="submit" className="min-h-10 text-[11px] font-medium text-muted hover:text-orange">Se déconnecter</button></form></div></aside> : null}
      <div id="espace-contenu" className={`min-w-0 px-5 pb-[calc(6.5rem+env(safe-area-inset-bottom))] pt-7 sm:px-8 sm:pt-10 lg:px-10 lg:pb-12 xl:px-12 ${customer ? "" : "lg:col-span-2"}`}>{children}</div>
    </div>
    {customer ? <WorkspaceNavigation mobile /> : null}
  </div>;
}
