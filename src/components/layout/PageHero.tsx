import type { ReactNode } from "react";
import Image from "next/image";
import { Breadcrumb, ButtonLink } from "@/components/ui/primitives";

export function PageHero({
  eyebrow,
  title,
  text,
  primary,
  secondary,
  crumbs,
  children,
  image,
}: {
  eyebrow?: string;
  title: string;
  text: string;
  primary?: { href: string; label: string };
  secondary?: { href: string; label: string };
  crumbs?: { href: string; label: string }[];
  children?: ReactNode;
  image?: { src: string; alt: string; width: number; height: number; caption: string };
}) {
  return (
    <section className="bg-[#f7f5ef] text-night">
      <div className="mx-auto max-w-7xl px-5 pb-12 pt-7 sm:px-8 md:pb-16 md:pt-9 lg:px-12">
        {crumbs ? (
          <div className="border-b border-night/15 pb-5 [&_nav]:text-xs [&_nav]:leading-5">
            <Breadcrumb items={crumbs} />
          </div>
        ) : null}
        <div className={image ? "grid items-center gap-10 pt-10 md:grid-cols-12 md:gap-8 md:pt-12 lg:gap-12" : "grid gap-7 pt-10 md:grid-cols-12 md:gap-8 md:pt-16"}>
          {!image ? <div className="md:col-span-3 md:pt-3">
            <p className="flex items-baseline gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.17em]">
              <span aria-hidden="true" className="text-[#bd470d]">01 /</span>
              <span>{eyebrow ?? "CARRIOVA"}</span>
            </p>
          </div> : null}
          <div className={image ? "min-w-0 md:col-span-7" : "min-w-0 md:col-span-9"}>
            {image ? <p className="mb-5 flex items-baseline gap-3 text-[0.65rem] font-semibold uppercase tracking-[0.17em]"><span aria-hidden="true" className="text-[#bd470d]">01 /</span><span>{eyebrow ?? "CARRIOVA"}</span></p> : null}
            <h1 className={`font-editorial max-w-4xl text-[2.9rem] font-normal italic leading-[1.04] tracking-[-0.025em] text-balance sm:text-6xl ${image ? "md:text-5xl lg:text-[4.25rem]" : "lg:text-[4.75rem]"}`}>
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
          {image ? <figure className="mx-auto w-full max-w-md md:col-span-5 md:max-w-none">
            <div className="overflow-hidden rounded-xl bg-night/5 ring-1 ring-night/10">
              <Image src={image.src} alt={image.alt} width={image.width} height={image.height} sizes="(max-width: 639px) calc(100vw - 40px), (max-width: 767px) 448px, (max-width: 1279px) 40vw, 460px" loading="eager" fetchPriority="high" className="h-auto w-full" />
            </div>
            <figcaption className="mt-4 flex items-start gap-3 text-[11px] leading-6 text-muted"><span aria-hidden="true" className="mt-3 h-px w-6 shrink-0 bg-orange" />{image.caption}</figcaption>
          </figure> : null}
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
