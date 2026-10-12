import type { ReactNode } from "react";
import { Breadcrumb, ButtonLink } from "@/components/ui/primitives";

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
    <section className="bg-[#f7f5ef] text-night">
      <div className="mx-auto max-w-7xl px-5 pb-12 pt-7 sm:px-8 md:pb-16 md:pt-9 lg:px-12">
        {crumbs ? (
          <div className="border-b border-night/15 pb-5 [&_nav]:text-xs [&_nav]:leading-5">
            <Breadcrumb items={crumbs} />
          </div>
        ) : null}
        <div className="grid gap-7 pt-10 md:grid-cols-12 md:gap-8 md:pt-16">
          <div className="md:col-span-3 md:pt-3">
            <p className="flex items-baseline gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.17em]">
              <span aria-hidden="true" className="text-[#bd470d]">01 /</span>
              <span>{eyebrow ?? "CARRIOVA"}</span>
            </p>
          </div>
          <div className="min-w-0 md:col-span-9">
            <h1 className="font-editorial max-w-4xl text-[2.9rem] font-normal italic leading-[1.04] tracking-[-0.025em] text-balance sm:text-6xl lg:text-[4.75rem]">
              {title}
            </h1>
            <p className="mt-7 max-w-2xl text-base leading-8 text-muted md:text-[1.05rem]">{text}</p>
            {primary || secondary ? (
              <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                {primary ? (
                  <ButtonLink href={primary.href} variant="orange" size="lg">
                    {primary.label}
                    <span aria-hidden="true">↗</span>
                  </ButtonLink>
                ) : null}
                {secondary ? (
                  <ButtonLink href={secondary.href} variant="secondary" size="lg">
                    {secondary.label}
                  </ButtonLink>
                ) : null}
              </div>
            ) : null}
            {children ? <div className="mt-7 [&>p]:text-muted">{children}</div> : null}
          </div>
        </div>
        <div aria-hidden="true" className="mt-12 flex items-center gap-4 md:mt-16">
          <span className="h-px w-12 bg-[#bd470d]" />
          <span className="h-px flex-1 bg-night/15" />
          <span className="text-lg text-[#bd470d]">↓</span>
        </div>
      </div>
    </section>
  );
}
