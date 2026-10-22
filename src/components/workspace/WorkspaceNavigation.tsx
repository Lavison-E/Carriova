"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { CareerIcon, type CareerIconName } from "@/components/brand/CareerIcon";

const links: { href: string; label: string; short: string; icon: CareerIconName }[] = [
  { href: "/espace", label: "Vue d’ensemble", short: "Accueil", icon: "compass" },
  { href: "/espace/profil", label: "Mon profil", short: "Profil", icon: "people" },
  { href: "/espace/opportunites", label: "Mes opportunités", short: "Opportunités", icon: "target" },
  { href: "/espace/cv", label: "Mes CV", short: "Mes CV", icon: "letter" },
  { href: "/espace/demandes", label: "Mes demandes", short: "Demandes", icon: "briefcase" },
  { href: "/espace/documents", label: "Produits & documents", short: "Produits", icon: "document" },
  { href: "/espace/compte", label: "Mon compte", short: "Compte", icon: "people" },
];
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
  const renderLink = (link: typeof links[number], compact: boolean) => <Link key={link.href} href={link.href} onClick={() => setMenu({ path: pathname, open: false })} aria-current={active(link.href) ? "page" : undefined} className={compact ? `flex min-h-12 min-w-0 flex-col items-center justify-center gap-1.5 rounded-lg px-1 py-1 text-[9px] font-medium ${active(link.href) ? "text-orange" : "text-muted"}` : `flex min-h-12 items-center gap-3 rounded-lg px-3 text-[12px] font-medium transition-colors ${active(link.href) ? "bg-night text-white" : "text-muted hover:bg-paper hover:text-night"}`}><CareerIcon name={link.icon} className="h-[18px] w-[18px] shrink-0" /><span>{compact ? link.short : link.label}</span>{active(link.href) && !compact ? <span className="ml-auto h-1 w-1 rounded-full bg-white" aria-hidden="true" /> : null}</Link>;
  return <nav ref={nav} aria-label={mobile ? "Navigation de votre espace mobile" : "Navigation de votre espace"} className={mobile ? "fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-white px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:hidden" : "space-y-2"}>{(mobile ? links.slice(0, 4) : links).map((link) => renderLink(link, mobile))}{mobile ? <><button ref={toggle} type="button" onClick={() => setMenu({ path: pathname, open: !open })} aria-expanded={open} aria-controls={id} className={`flex min-h-12 flex-col items-center justify-center gap-1 rounded-lg text-[9px] font-medium ${links.slice(4).some((link) => active(link.href)) ? "text-orange" : "text-muted"}`}><span aria-hidden="true" className="text-xl leading-5 tracking-widest">···</span><span>Plus</span></button>{open ? <div id={id} className="absolute bottom-[calc(100%+0.5rem)] right-3 w-[min(18rem,calc(100vw-1.5rem))] rounded-xl border border-line bg-white p-2 shadow-lg"><p className="px-3 pb-2 pt-3 text-[10px] uppercase tracking-wider text-muted">Votre espace</p>{links.slice(4).map((link) => renderLink(link, false))}</div> : null}</> : null}</nav>;
}
