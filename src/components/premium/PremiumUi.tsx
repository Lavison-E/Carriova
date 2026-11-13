import type { ReactNode } from "react";
import { applicationStatusOptions, type ApplicationStatus } from "@/lib/premium";

export function PremiumGlow() {
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
    <div className="absolute -right-28 -top-32 h-96 w-96 rounded-full bg-[#2449a0] opacity-70 blur-[100px]" />
    <div className="absolute -bottom-40 left-1/4 h-80 w-80 rounded-full bg-orange opacity-[0.2] blur-[110px]" />
    <div className="absolute inset-0 opacity-[0.06] [background-image:linear-gradient(white_1px,transparent_1px),linear-gradient(90deg,white_1px,transparent_1px)] [background-size:44px_44px]" />
  </div>;
}

export function PremiumBadge({ className = "" }: { className?: string }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full bg-[linear-gradient(135deg,#f6c56b,#feaf56)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-night shadow-[0_6px_16px_rgba(254,175,86,0.35)] ${className}`}><span aria-hidden="true">✦</span>Premium</span>;
}

export function ScoreRing({ score, size = 76 }: { score: number; size?: number }) {
  const radius = 15.9155, color = score >= 75 ? "#2f8a4f" : score >= 55 ? "#d4870f" : "#bd470d";
  return <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={`Compatibilité ${score} sur 100`}>
    <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90"><circle cx="18" cy="18" r={radius} fill="none" stroke="#eeebe3" strokeWidth="3" /><circle cx="18" cy="18" r={radius} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeDasharray={`${score} 100`} /></svg>
    <span className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-lg font-semibold leading-none text-night">{score}</span><span className="text-[8px] font-semibold uppercase tracking-[0.1em] text-muted">/ 100</span></span>
  </div>;
}

export function StatusChip({ status }: { status: ApplicationStatus }) {
  const option = applicationStatusOptions.find((item) => item.value === status)!;
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${option.tone}`}>{option.label}</span>;
}

export function Panel({ eyebrow, title, action, children, className = "" }: { eyebrow?: string; title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`ws-card p-6 sm:p-8 ${className}`}>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div>{eyebrow ? <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange">{eyebrow}</p> : null}<h2 className="mt-1 text-xl font-semibold tracking-tight text-night">{title}</h2></div>{action}</div>
    {children}
  </section>;
}

export const verdictLabel = { strong: "Très bonne adéquation", good: "Bonne piste", stretch: "Candidature ambitieuse" } as const;
