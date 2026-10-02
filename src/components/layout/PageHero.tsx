import type { ReactNode } from "react";
import { Breadcrumb, ButtonLink, Eyebrow } from "@/components/ui/primitives";

export function PageHero({
  eyebrow,
  title,
  text,
  primary,
  secondary,
  crumbs,
  children,
}: {
  eyebrow?: string;
  title: string;
  text: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
  crumbs?: { href: string; label: string }[];
  children?: ReactNode;
}) {
  return (
    <section className="hero-grid relative overflow-hidden text-white">
      <div className="mesh pointer-events-none absolute inset-0 opacity-40" />
      <div className="relative mx-auto max-w-6xl px-5 py-16 md:px-8 md:py-24">
        {crumbs ? (
          <div className="mb-6 text-white/70 [&_a]:text-white/70 [&_span]:text-white">
            <Breadcrumb items={crumbs} />
          </div>
        ) : null}
        {eyebrow ? <Eyebrow className="text-gold">{eyebrow}</Eyebrow> : null}
        <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-[1.08] tracking-tight md:text-5xl">
          {title}
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/80 md:text-lg">{text}</p>
        {(primary || secondary) && (
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {primary ? (
              <ButtonLink href={primary.href} variant="orange" size="lg">
                {primary.label}
              </ButtonLink>
            ) : null}
            {secondary ? (
              <ButtonLink href={secondary.href} variant="ghost" size="lg">
                {secondary.label}
              </ButtonLink>
            ) : null}
          </div>
        )}
        {children}
      </div>
    </section>
  );
}
