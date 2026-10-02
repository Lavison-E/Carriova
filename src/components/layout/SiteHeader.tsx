"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { ButtonLink } from "@/components/ui/primitives";
import { solutions } from "@/lib/site";

const mainLinks = [
  { href: "/emploi", label: "Emploi" },
  { href: "/solutions/coaching", label: "Coaching" },
  { href: "/ressources", label: "Ressources" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
] as const;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [solutionsOpen, setSolutionsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-night/95 text-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3 md:px-8">
        <Logo variant="light" markId="nav" />
        <nav className="hidden items-center gap-5 xl:flex" aria-label="Navigation principale">
          <div
            className="relative"
            onMouseEnter={() => setSolutionsOpen(true)}
            onMouseLeave={() => setSolutionsOpen(false)}
          >
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm font-medium text-white/80 transition hover:text-white"
              aria-expanded={solutionsOpen}
              onClick={() => setSolutionsOpen((v) => !v)}
            >
              Solutions
              <span aria-hidden="true">▾</span>
            </button>
            {solutionsOpen ? (
              <div className="absolute left-0 top-full z-50 w-[22rem] pt-3">
                <div className="rounded-2xl border border-white/10 bg-night p-3 shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
                  {solutions.map((item) => (
                    <Link
                      key={item.slug}
                      href={item.href}
                      className="block rounded-xl px-3 py-2.5 hover:bg-white/10"
                      onClick={() => setSolutionsOpen(false)}
                    >
                      <p className="text-sm font-semibold text-white">{item.title}</p>
                      <p className="text-xs leading-5 text-white/60">{item.short}</p>
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
          <Link href="/solutions/cv" className="text-sm font-medium text-white/80 hover:text-white">
            CV
          </Link>
          <Link
            href="/solutions/lettre-de-motivation"
            className="text-sm font-medium text-white/80 hover:text-white"
          >
            Lettre
          </Link>
          {mainLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-white/80 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 lg:flex xl:flex">
          <Link href="/compte/connexion" className="text-sm font-medium text-white/80 hover:text-white">
            Se connecter
          </Link>
          <ButtonLink href="/compte/creer" size="sm" variant="orange" eventName="cta_click">
            Commencer maintenant
          </ButtonLink>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/20 xl:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="sr-only">{open ? "Fermer le menu" : "Ouvrir le menu"}</span>
          <span className="flex flex-col gap-1.5">
            <span className={`block h-0.5 w-5 bg-white transition ${open ? "translate-y-2 rotate-45" : ""}`} />
            <span className={`block h-0.5 w-5 bg-white transition ${open ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 w-5 bg-white transition ${open ? "-translate-y-2 -rotate-45" : ""}`} />
          </span>
        </button>
      </div>
      {open ? (
        <div id="mobile-nav" className="border-t border-white/10 px-5 py-4 xl:hidden">
          <nav className="flex flex-col gap-3" aria-label="Navigation mobile">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gold">Solutions</p>
            {solutions.map((item) => (
              <Link key={item.slug} href={item.href} className="py-1 text-base font-medium" onClick={() => setOpen(false)}>
                {item.title}
              </Link>
            ))}
            {mainLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="py-1 text-base font-medium"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-3 flex flex-col gap-2">
              <ButtonLink href="/compte/connexion" variant="ghost">
                Se connecter
              </ButtonLink>
              <ButtonLink href="/compte/creer" variant="orange">
                Commencer maintenant
              </ButtonLink>
            </div>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
