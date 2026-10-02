import Link from "next/link";
import type { ReactNode } from "react";
import { safeJsonLd } from "@/lib/security";

type ButtonVariant = "primary" | "secondary" | "ghost" | "orange" | "white";
type ButtonSize = "md" | "lg" | "sm";

const variantClass: Record<ButtonVariant, string> = {
  primary:
    "bg-bright text-white hover:bg-royal shadow-[0_10px_24px_rgba(3,72,214,0.28)]",
  secondary:
    "bg-white text-night border border-line hover:border-bright hover:text-bright",
  ghost: "bg-transparent text-white border border-white/25 hover:bg-white/10",
  orange:
    "bg-orange text-white hover:bg-[#d45307] shadow-[0_10px_24px_rgba(238,94,8,0.28)]",
  white: "bg-white text-night hover:bg-soft",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "h-10 px-4 text-sm",
  md: "h-11 px-5 text-sm",
  lg: "h-12 px-6 text-[0.95rem]",
};

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
  eventName,
}: {
  href: string;
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  eventName?: string;
}) {
  return (
    <Link
      href={href}
      data-event={eventName}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  type = "button",
  disabled,
}: {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors disabled:opacity-60",
        variantClass[variant],
        sizeClass[size],
        className,
      )}
    >
      {children}
    </button>
  );
}

export function Section({
  children,
  className,
  id,
  tone = "white",
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  tone?: "white" | "paper" | "night" | "soft";
}) {
  const tones = {
    white: "bg-white text-ink",
    paper: "bg-paper text-ink",
    night: "bg-night text-white",
    soft: "bg-soft text-ink",
  };
  return (
    <section id={id} className={cn("py-20 md:py-28", tones[tone], className)}>
      <div className="mx-auto w-full max-w-6xl px-5 md:px-8">{children}</div>
    </section>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-bright",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  text,
  align = "left",
  light = false,
}: {
  eyebrow?: string;
  title: string;
  text?: string;
  align?: "left" | "center";
  light?: boolean;
}) {
  return (
    <div className={cn(align === "center" ? "mx-auto max-w-3xl text-center" : "max-w-3xl")}>
      {eyebrow ? (
        <Eyebrow className={light ? "text-gold" : undefined}>{eyebrow}</Eyebrow>
      ) : null}
      <h2
        className={cn(
          "mt-3 text-3xl font-extrabold tracking-tight md:text-4xl",
          light ? "text-white" : "text-night",
        )}
      >
        {title}
      </h2>
      {text ? (
        <p className={cn("mt-4 text-base leading-7 md:text-lg", light ? "text-white/75" : "text-muted")}>
          {text}
        </p>
      ) : null}
    </div>
  );
}

export function Card({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-line bg-white p-6 shadow-[0_16px_40px_rgba(0,18,82,0.06)]",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Badge({ children, tone = "blue" }: { children: ReactNode; tone?: "blue" | "orange" | "navy" }) {
  const tones = {
    blue: "bg-soft text-royal",
    orange: "bg-[#fff1e6] text-orange",
    navy: "bg-night text-white",
  };
  return (
    <span className={cn("inline-flex rounded-full px-3 py-1 text-xs font-semibold", tones[tone])}>
      {children}
    </span>
  );
}

export function Breadcrumb({ items }: { items: { href: string; label: string }[] }) {
  return (
    <nav aria-label="Fil d’Ariane" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, i) => (
          <li key={item.href} className="inline-flex items-center gap-2">
            {i > 0 ? <span aria-hidden="true">/</span> : null}
            {i === items.length - 1 ? (
              <span className="font-medium text-night">{item.label}</span>
            ) : (
              <Link href={item.href} className="hover:text-bright">
                {item.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

export function FaqList({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <div className="divide-y divide-line rounded-3xl border border-line bg-white">
      {items.map((item) => (
        <details key={item.question} className="group px-6 py-5">
          <summary className="cursor-pointer list-none font-semibold text-night marker:content-none">
            <span className="flex items-start justify-between gap-4">
              {item.question}
              <span className="mt-0.5 text-bright transition group-open:rotate-45">+</span>
            </span>
          </summary>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}

export function JsonLd({ data }: { data: unknown }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }}
    />
  );
}
