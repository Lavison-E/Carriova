"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { CareerIcon, type CareerIconName } from "@/components/brand/CareerIcon";

const links: { href: string; label: string; short: string; icon: CareerIconName; group: string; badge?: string }[] = [
  { href: "/espace", label: "Vue d’ensemble", short: "Accueil", icon: "compass", group: "Mon parcours" },
  { href: "/espace/profil", label: "Mon profil", short: "Profil", icon: "user", group: "Mon parcours" },
  { href: "/espace/opportunites", label: "Mes opportunités", short: "Opportunités", icon: "target", group: "Mon parcours" },
  { href: "/espace/cv", label: "Mes CV", short: "Mes CV", icon: "letter", group: "Mon parcours" },
  { href: "/espace/demandes", label: "Mes demandes", short: "Demandes", icon: "briefcase", group: "Mes services" },
  { href: "/espace/documents", label: "Produits & documents", short: "Produits", icon: "document", group: "Mes services" },
  { href: "/espace/bibliotheque", label: "Bibliothèque", short: "Bibliothèque", icon: "book", group: "Mes services", badge: "Nouveau" },
  { href: "/espace/compte", label: "Mon compte", short: "Compte", icon: "shield", group: "Paramètres" },
];
const groups = [...new Set(links.map((link) => link.group))];
export function WorkspaceNavigation({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const [menu, setMenu] = useState<{ path: string; open: boolean }>({ path: pathname, open: false });
  const open = menu.path === pathname && menu.open;
  const nav = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const id = useId();
  useEffect(() => {
    if (!open) return;
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setMenu({ path: pathname, open: false }); toggle.current?.focus(); } };
    const outside = (event: PointerEvent) => { if (event.target instanceof Node && !nav.current?.contains(event.target)) setMenu({ path: pathname, open: false }); };
    document.addEventListener("keydown", escape); document.addEventListener("pointerdown", outside);
    return () => { document.removeEventListener("keydown", escape); document.removeEventListener("pointerdown", outside); };
  }, [open, pathname]);
  const active = (href: string) => href === "/espace" ? pathname === href : pathname.startsWith(href) || (href === "/espace/demandes" && pathname === "/espace/nouvelle-demande");
  const renderLink = (link: typeof links[number], compact: boolean) => {
    const current = active(link.href);
    return <Link key={link.href} href={link.href} onClick={() => setMenu({ path: pathname, open: false })} aria-current={current ? "page" : undefined} className={compact
      ? `relative flex min-h-12 min-w-0 flex-col items-center justify-center gap-1.5 rounded-xl px-1 py-1 text-[9px] font-semibold transition-colors ${current ? "text-night" : "text-muted"}`
      : `group relative flex min-h-11 items-center gap-3 rounded-xl px-3 text-[12.5px] font-medium transition-all ${current ? "bg-night text-white shadow-[0_10px_24px_rgba(0,18,82,0.18)]" : "text-[#4a5272] hover:bg-night/[0.04] hover:text-night"}`}>
      {compact && current ? <span aria-hidden="true" className="absolute top-0 h-0.5 w-8 rounded-full bg-orange" /> : null}
      {!compact && current ? <span aria-hidden="true" className="absolute -left-4 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gold" /> : null}
      <span className={compact ? "" : `flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${current ? "bg-white/10 text-gold" : "bg-white text-night shadow-[0_1px_2px_rgba(0,18,82,0.08)] ring-1 ring-night/[0.06] group-hover:text-orange"}`}><CareerIcon name={link.icon} className={compact ? `h-[19px] w-[19px] ${current ? "text-orange" : ""}` : "h-4 w-4"} /></span>
      <span className="min-w-0 truncate">{compact ? link.short : link.label}</span>
      {!compact && link.badge ? <span className={`ml-auto rounded-full px-1.5 py-0.5 text-[8.5px] font-bold uppercase tracking-[0.08em] ${current ? "bg-gold text-night" : "bg-orange text-white"}`}>{link.badge}</span> : null}
    </Link>;
  };
  if (!mobile) return <nav aria-label="Navigation de votre espace" className="space-y-6">{groups.map((group) => <div key={group}><p className="mb-2 px-3 text-[9.5px] font-semibold uppercase tracking-[0.18em] text-[#8a8fa3]">{group}</p><div className="space-y-1">{links.filter((link) => link.group === group).map((link) => renderLink(link, false))}</div></div>)}</nav>;
  return <nav ref={nav} aria-label="Navigation de votre espace mobile" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-night/[0.07] bg-white/90 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-10px_30px_rgba(0,18,82,0.06)] backdrop-blur-lg lg:hidden">{links.slice(0, 4).map((link) => renderLink(link, true))}<><button ref={toggle} type="button" onClick={() => setMenu({ path: pathname, open: !open })} aria-expanded={open} aria-controls={id} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[9px] font-medium ${links.slice(4).some((link) => active(link.href)) ? "text-orange" : "text-muted"}`}><span aria-hidden="true" className="text-xl leading-5 tracking-widest">···</span><span>Plus</span></button>{open ? <div id={id} className="absolute bottom-[calc(100%+0.5rem)] right-3 w-[min(18rem,calc(100vw-1.5rem))] rounded-2xl border border-night/[0.08] bg-white p-2 shadow-[0_20px_50px_rgba(0,18,82,0.18)]"><p className="px-3 pb-2 pt-3 text-[10px] uppercase tracking-wider text-muted">Votre espace</p><div className="space-y-1">{links.slice(4).map((link) => renderLink(link, false))}</div></div> : null}</></nav>;
}
