import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { PrepPlanGenerator } from "@/components/premium/PremiumForms";
import { PremiumBadge, PremiumGlow } from "@/components/premium/PremiumUi";
import { loadWorkspaceData } from "@/components/workspace/WorkspaceData";
import { WorkspaceUnavailable, formatWorkspaceDate } from "@/components/workspace/WorkspaceUi";
import { getCustomerCareerProfile } from "@/lib/career-profile-queries";
import { requireCustomer } from "@/lib/customer-auth";
import { isCvAiAvailable } from "@/lib/cv-ai-config";
import { ebook } from "@/lib/ebook";
import { buildPrepPlan } from "@/lib/premium";
import { getPremiumStatus, getPrepPlan } from "@/lib/premium-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Ma préparation", robots: { index: false, follow: false } };

export default async function PreparationPage() {
  const result = await loadWorkspaceData(async () => {
    const customer = await requireCustomer();
    const status = await getPremiumStatus(customer.id);
    if (!status.active) return { status, profile: null, saved: null };
    const [record, saved] = await Promise.all([getCustomerCareerProfile(), getPrepPlan(customer.id)]);
    return { status, profile: record.profile, saved };
  });
  if (!result) return <WorkspaceUnavailable href="/espace/premium/preparation" />;
  if (!result.data.status.active || !result.data.profile) redirect("/espace/premium");
  const { profile, saved } = result.data;
  const plan = saved?.plan ?? buildPrepPlan(profile);
  const aiReady = isCvAiAvailable();

  return <div className="mx-auto max-w-[1180px] space-y-7">
    <section className="relative isolate overflow-hidden rounded-[1.5rem] bg-night px-6 py-9 text-white shadow-[0_28px_70px_rgba(0,18,82,0.22)] sm:px-10">
      <PremiumGlow />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl"><PremiumBadge /><h1 className="mt-4 font-editorial text-[2.3rem] italic leading-tight sm:text-[2.8rem]">Votre préparation sur 4 semaines</h1><p className="mt-3 text-sm leading-7 text-white/75">{plan.focus}</p>
          <p className="mt-3 text-[11px] text-white/55">{plan.source === "ai" && saved ? `Plan personnalisé par l’IA le ${formatWorkspaceDate(saved.generatedAt)}` : "Plan de la méthode CARRIOVA, adapté à vos métiers"} · {profile.targetRoles.filter(Boolean).join(", ") || "métiers à préciser"}</p></div>
        {aiReady ? <PrepPlanGenerator hasAiPlan={plan.source === "ai"} /> : null}
      </div>
    </section>
    {!profile.targetRoles.length ? <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-orange/25 bg-[#fff6ee] p-5"><p className="text-sm text-night">Indiquez vos métiers recherchés pour un plan vraiment ciblé.</p><Link href="/espace/profil/modifier" className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-night px-4 text-xs font-semibold text-white">Compléter mon profil<CareerIcon name="arrow" className="h-3.5 w-3.5" /></Link></div> : null}

    <section aria-labelledby="skills-title"><h2 id="skills-title" className="text-xl font-semibold tracking-tight text-night">Compétences à renforcer en priorité</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-3">{plan.skills.map((skill, index) => <article key={skill.name} className="ws-card flex flex-col p-6"><span className="font-editorial text-3xl italic text-orange">{String(index + 1).padStart(2, "0")}</span><h3 className="mt-3 text-base font-semibold text-night">{skill.name}</h3><p className="mt-2 text-xs leading-6 text-muted">{skill.why}</p><ul className="mt-4 space-y-2 border-t border-night/[0.06] pt-4">{skill.actions.map((action) => <li key={action} className="flex gap-2.5 text-xs leading-6 text-night"><CareerIcon name="check" className="mt-1 h-3.5 w-3.5 shrink-0 text-[#2f8a4f]" />{action}</li>)}</ul></article>)}</div>
    </section>

    <section aria-labelledby="weeks-title" className="ws-card p-6 sm:p-8"><h2 id="weeks-title" className="text-xl font-semibold tracking-tight text-night">Votre programme semaine par semaine</h2>
      <ol className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">{plan.weeks.map((week, index) => <li key={week.title} className="relative rounded-2xl bg-[#f8f6f1] p-5"><span className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-night text-[11px] font-semibold text-white">{index + 1}</span><h3 className="pr-9"><span className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-orange">{week.title.split(" · ")[0]}</span><span className="mt-1 block text-sm font-semibold text-night">{week.title.split(" · ").slice(1).join(" · ") || week.title}</span></h3><ul className="mt-4 space-y-2.5">{week.tasks.map((task) => <li key={task} className="flex gap-2.5 text-xs leading-5 text-[#4a5272]"><span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-orange" />{task}</li>)}</ul></li>)}</ol>
    </section>

    <section aria-labelledby="questions-title" className="ws-card p-6 sm:p-8"><h2 id="questions-title" className="text-xl font-semibold tracking-tight text-night">Entraînement aux entretiens</h2><p className="mt-1 text-xs text-muted">Répondez à voix haute, en 1 à 2 minutes, avec la méthode STAR : situation, tâche, action, résultat.</p>
      <div className="mt-5 divide-y divide-night/[0.06]">{plan.interviewQuestions.map((item) => <details key={item.question} className="group py-4"><summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-semibold leading-6 text-night">{item.question}<span aria-hidden="true" className="mt-1 text-muted transition group-open:rotate-45">+</span></summary><p className="mt-2 text-xs leading-6 text-[#4a5272]">{item.tip}</p></details>)}</div>
    </section>

    <section className="flex flex-col items-start justify-between gap-5 rounded-2xl border border-night/10 bg-white p-6 sm:flex-row sm:items-center"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">Pour aller plus loin</p><p className="mt-1 text-sm font-semibold text-night">{ebook.name} : la méthode complète, avec manuel d’entretien et modèles de CV.</p></div><Link href="/espace/bibliotheque" className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-xl border border-night/15 px-5 text-xs font-semibold text-night hover:border-night">Voir dans la bibliothèque<CareerIcon name="arrow" className="h-3.5 w-3.5" /></Link></section>
  </div>;
}
