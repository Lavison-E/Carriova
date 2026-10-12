"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { CareerIcon, type CareerIconName } from "@/components/brand/CareerIcon";
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

const solutionIcons: Record<string, CareerIconName> = {
  cv: "document",
  "lettre-de-motivation": "letter",
  opportunites: "briefcase",
  matching: "target",
  coaching: "compass",
  expertise: "people",
};

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
      className="sticky top-0 z-50 border-b border-white/10 bg-night text-white"
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
      <div className="relative mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
        <Logo variant="light" markId="nav" />

        <nav className="hidden items-center gap-6 xl:flex" aria-label="Navigation principale">
          <div
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) setSolutionsOpen(false);
            }}
          >
            <button
              ref={solutionsButtonRef}
              type="button"
              className={`inline-flex min-h-11 items-center gap-2 border-b py-1 text-[13px] font-medium transition-colors hover:text-white ${pathname.startsWith("/solutions") || solutionsOpen ? "border-[#edab84] text-white" : "border-transparent text-white/75"}`}
              aria-expanded={solutionsOpen}
              aria-controls="solutions-nav"
              onClick={() => setSolutionsOpen((value) => !value)}
            >
              Nos solutions
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true" className={`transition-transform ${solutionsOpen ? "rotate-180" : ""}`}>
                <path d="m3 4.5 3 3 3-3" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
            {solutionsOpen ? (
              <div id="solutions-nav" className="absolute inset-x-12 top-full z-50 pt-3">
                <div className="grid max-h-[calc(100dvh-7rem)] grid-cols-[0.85fr_2fr] overflow-y-auto rounded-xl border border-night/10 bg-[#f7f5ef] text-night shadow-[0_18px_45px_rgba(0,18,82,0.15)]">
                  <div className="flex flex-col border-r border-night/10 p-8">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#bd470d]">À chaque étape</p>
                    <p className="mt-5 text-2xl font-semibold leading-tight tracking-tight">Une ambition.<br />Votre façon d’avancer.</p>
                    <p className="mt-4 text-sm leading-6 text-muted">Trouvez le bon accompagnement pour votre prochain objectif professionnel.</p>
                    <Link href="/solutions" className="mt-8 inline-flex items-center justify-between gap-5 border-t border-night/15 pt-5 text-sm font-semibold hover:text-[#bd470d]">
                      Toutes nos solutions <CareerIcon name="arrow" className="h-4 w-4" />
                    </Link>
                  </div>
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 p-5">
                    {solutions.map((item) => (
                      <Link
                        key={item.slug}
                        href={item.href}
                        aria-current={pathname === item.href ? "page" : undefined}
                        className={`group flex gap-3 rounded-lg p-4 transition-colors hover:bg-night/5 ${pathname === item.href ? "bg-night/5" : ""}`}
                      >
                        <CareerIcon name={solutionIcons[item.slug]} className="mt-0.5 h-5 w-5 shrink-0 text-[#bd470d]" />
                        <span>
                          <span className="block text-sm font-semibold group-hover:text-[#bd470d]">{item.title}</span>
                          <span className="mt-2 block text-xs leading-5 text-muted">{item.short}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
          {mainLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={pathname === item.href ? "page" : undefined}
              className={`inline-flex min-h-11 items-center whitespace-nowrap border-b text-[13px] font-medium transition-colors hover:text-white ${pathname === item.href ? "border-[#edab84] text-white" : "border-transparent text-white/75"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-6 sm:flex xl:ml-0">
          <Link href="/compte/connexion" className="inline-flex min-h-11 items-center text-[13px] font-medium text-white/75 hover:text-white">Connexion</Link>
          <ButtonLink href="/solutions" size="sm" variant="orange" className="gap-4 whitespace-nowrap rounded-lg" eventName="cta_click">
            Trouver ma solution <CareerIcon name="arrow" className="h-4 w-4" />
          </ButtonLink>
        </div>
        <button
          ref={menuButtonRef}
          type="button"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/25 hover:border-white/60 xl:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((value) => !value)}
        >
          <span className="sr-only">{open ? "Fermer le menu" : "Ouvrir le menu"}</span>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" aria-hidden="true">
            {open ? <path d="m5 5 10 10M5 15 15 5" /> : <path d="M3 6h14M3 14h14" />}
          </svg>
        </button>
      </div>

      {open ? (
        <div id="mobile-nav" className="absolute inset-x-0 top-full max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain border-b border-night/15 bg-[#f7f5ef] px-5 pt-7 pb-[max(1.75rem,env(safe-area-inset-bottom))] text-night shadow-[0_16px_30px_rgba(0,18,82,0.12)] sm:px-8 lg:px-12 xl:hidden">
          <nav className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 sm:gap-10" aria-label="Navigation mobile">
            <div>
              <Link href="/solutions" className="mb-3 inline-flex min-h-10 items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#bd470d]">
                Nos solutions <CareerIcon name="arrow" className="h-4 w-4" />
              </Link>
              <div>
                {solutions.map((item, index) => (
                  <Link key={item.slug} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className={`group flex min-h-12 items-center gap-4 border-t border-night/10 py-3 text-sm font-medium hover:text-[#bd470d] ${pathname === item.href ? "text-[#bd470d]" : "text-night"}`}>
                    <span className="text-[10px] tabular-nums text-muted">0{index + 1}</span>
                    <span className="flex-1">{item.title}</span>
                    <CareerIcon name="arrow" className="h-4 w-4 text-muted group-hover:text-[#bd470d]" />
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-3 flex min-h-10 items-center text-[11px] font-semibold uppercase tracking-[0.16em] text-[#bd470d]">Explorer CARRIOVA</p>
              <div className="grid grid-cols-2 gap-x-5">
                {[...mainLinks, { href: "/contact", label: "Contact" }].map((item) => (
                  <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined} className={`flex min-h-12 items-center border-t border-night/10 py-3 text-sm font-medium hover:text-[#bd470d] ${pathname === item.href ? "text-[#bd470d]" : "text-night"}`}>
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="mt-6 grid gap-3 border-t border-night/15 pt-6">
                <ButtonLink href="/contact" variant="orange" className="justify-between rounded-lg">Parlons de mon projet <CareerIcon name="arrow" className="h-4 w-4" /></ButtonLink>
                <Link href="/compte/connexion" className="flex min-h-11 items-center justify-center text-sm font-medium text-night underline-offset-4 hover:underline">Se connecter à mon espace</Link>
              </div>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
