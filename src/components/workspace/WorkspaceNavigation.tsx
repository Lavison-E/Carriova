"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CareerIcon, type CareerIconName } from "@/components/brand/CareerIcon";

const links: { href: string; label: string; short: string; icon: CareerIconName }[] = [
  { href: "/espace", label: "Vue d’ensemble", short: "Accueil", icon: "compass" },
  { href: "/espace/demandes", label: "Mes demandes", short: "Demandes", icon: "briefcase" },
  { href: "/espace/documents", label: "Produits & documents", short: "Produits", icon: "document" },
  { href: "/espace/compte", label: "Mon compte", short: "Compte", icon: "people" },
];

export function WorkspaceNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  return <nav aria-label={mobile ? "Navigation de votre espace mobile" : "Navigation de votre espace"} className={mobile ? "fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-line bg-white px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden" : "space-y-2"}>{links.map((link) => {
    const active = link.href === "/espace" ? pathname === link.href : pathname.startsWith(link.href) || (link.href === "/espace/demandes" && pathname === "/espace/nouvelle-demande");
    return <Link key={link.href} href={link.href} aria-current={active ? "page" : undefined} className={mobile ? `flex min-h-12 flex-col items-center justify-center gap-1.5 rounded-lg px-1 py-1 text-[9px] font-medium ${active ? "text-orange" : "text-muted"}` : `flex min-h-12 items-center gap-3 rounded-lg px-3 text-[12px] font-medium transition-colors ${active ? "bg-night text-white" : "text-muted hover:bg-paper hover:text-night"}`}><CareerIcon name={link.icon} className="h-[18px] w-[18px] shrink-0" /><span>{mobile ? link.short : link.label}</span>{active && !mobile ? <span className="ml-auto h-1 w-1 rounded-full bg-white" aria-hidden="true" /> : null}</Link>;
  })}</nav>;
}
