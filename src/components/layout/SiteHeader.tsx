"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/primitives";
import { solutions } from "@/lib/site";

const mainLinks = [
  { href: "/emploi", label: "Emploi" },
  { href: "/solutions/coaching", label: "Coaching" },
  { href: "/ressources", label: "Ressources" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/a-propos", label: "À propos" },
] as const;

export function SiteHeader() {
  const pathname = usePathname();
  return <HeaderNavigation key={pathname} pathname={pathname} />;
}

function HeaderNavigation({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const solutionsButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open && !solutionsOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (event.target instanceof Node && !headerRef.current?.contains(event.target)) {
        setOpen(false);
        setSolutionsOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.preventDefault();
      if (open) menuButtonRef.current?.focus();
      else solutionsButtonRef.current?.focus();
      setOpen(false);
      setSolutionsOpen(false);
    }
    function onBreakpointChange() {
      setOpen(false);
      setSolutionsOpen(false);
    }
    const breakpoint = window.matchMedia("(min-width: 1280px)");
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    breakpoint.addEventListener("change", onBreakpointChange);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
      breakpoint.removeEventListener("change", onBreakpointChange);
    };
  }, [open, solutionsOpen]);

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-50 border-b border-white/10 bg-night/95 text-white backdrop-blur-xl"
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest("a")) {
          setOpen(false);
          setSolutionsOpen(false);
        }
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setSolutionsOpen(false);
        }
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-5 py-4 md:px-8">
        <Logo variant="light" markId="nav" />
        <nav className="hidden items-center gap-5 xl:flex" aria-label="Navigation principale">
          <div className="relative" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setSolutionsOpen(false); }}>
            <button
              ref={solutionsButtonRef}
              type="button"
              className={`inline-flex min-h-10 items-center gap-1.5 text-sm font-medium transition-colors hover:text-white ${pathname.startsWith("/solutions") ? "text-gold" : "text-white/75"}`}
              aria-expanded={solutionsOpen}
              aria-controls="solutions-nav"
              onClick={() => setSolutionsOpen((value) => !value)}
            >
              Solutions <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={`transition-transform ${solutionsOpen ? "rotate-180" : ""}`}><path d="m3 4.5 3 3 3-3" stroke="currentColor" strokeWidth="1.5" /></svg>
            </button>
            {solutionsOpen ? (
              <div id="solutions-nav" className="absolute left-0 top-full z-50 w-[23rem] pt-3">
                <div className="max-h-[calc(100dvh-7rem)] overflow-y-auto rounded-2xl border border-line bg-white p-2 text-night shadow-2xl">
                  <Link href="/solutions" className="flex items-center justify-between rounded-xl px-4 py-3 text-sm font-bold text-bright hover:bg-paper">Toutes nos solutions <CareerIcon name="arrow" className="h-4 w-4" /></Link>
                  {solutions.map((item) => (
                    <Link key={item.slug} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className={`block rounded-xl px-4 py-3 hover:bg-paper ${pathname === item.href ? "bg-soft" : ""}`}>
                      <span className="block text-sm font-semibold">{item.title}</span>
                      <span className="mt-1 block text-xs leading-5 text-muted">{item.short}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          {mainLinks.map((item) => (
            <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className={`inline-flex min-h-10 items-center whitespace-nowrap text-sm font-medium transition-colors hover:text-white ${pathname === item.href ? "text-gold" : "text-white/75"}`}>{item.label}</Link>
          ))}
        </nav>
        <div className="ml-auto hidden items-center gap-5 sm:flex xl:ml-0">
          <Link href="/compte/connexion" className="text-sm font-medium text-white/75 hover:text-white">Connexion</Link>
          <ButtonLink href="/solutions" size="sm" variant="orange" eventName="cta_click">Trouver ma solution</ButtonLink>
        </div>
        <button ref={menuButtonRef} type="button" className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/20 hover:bg-white/10 xl:hidden" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((value) => !value)}>
          <span className="sr-only">{open ? "Fermer le menu" : "Ouvrir le menu"}</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">{open ? <path d="m5 5 10 10M5 15 15 5" /> : <path d="M3 5h14M3 10h14M3 15h14" />}</svg>
        </button>
      </div>
      {open ? (
        <div id="mobile-nav" className="absolute inset-x-0 top-full max-h-[calc(100dvh-5.5rem)] overflow-y-auto overscroll-contain border-t border-white/10 bg-night px-5 py-6 shadow-2xl xl:hidden">
          <nav className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2" aria-label="Navigation mobile">
            <div><Link href="/solutions" className="inline-flex min-h-11 items-center text-xs font-semibold uppercase tracking-[0.16em] text-gold">Toutes les solutions <span className="ml-2" aria-hidden="true">→</span></Link><div>{solutions.map((item) => (
              <Link key={item.slug} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className={`block rounded-lg px-3 py-3 text-sm font-medium hover:bg-white/10 ${pathname === item.href ? "bg-white/10 text-gold" : "text-white/85"}`}>{item.title}</Link>
            ))}</div></div>
            <div><p className="flex min-h-11 items-center text-xs font-semibold uppercase tracking-[0.16em] text-gold">Explorer CARRIOVA</p>{[...mainLinks, { href: "/contact", label: "Contact" }].map((item) => (
              <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className={`block rounded-lg px-3 py-3 text-sm font-medium hover:bg-white/10 ${pathname === item.href ? "bg-white/10 text-gold" : "text-white/85"}`}>{item.label}</Link>
            ))}<div className="mt-5 grid gap-3 border-t border-white/10 pt-5"><ButtonLink href="/compte/connexion" variant="ghost">Se connecter</ButtonLink><ButtonLink href="/contact" variant="orange">Parlons de mon projet</ButtonLink></div></div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
