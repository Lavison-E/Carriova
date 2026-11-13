import type { Metadata } from "next";
import Link from "next/link";
import { CareerIcon, type CareerIconName } from "@/components/brand/CareerIcon";
import { PasteOfferForm } from "@/components/premium/PremiumForms";
import { Panel, PremiumBadge, PremiumGlow, ScoreRing, StatusChip } from "@/components/premium/PremiumUi";
import { loadWorkspaceData } from "@/components/workspace/WorkspaceData";
import { WorkspaceUnavailable, formatWorkspaceDate } from "@/components/workspace/WorkspaceUi";
import { isProfileReadyForMatching } from "@/lib/career-profile";
import { getCustomerCareerProfile } from "@/lib/career-profile-queries";
import { getCareerMatches } from "@/lib/career-matching";
import { requireCustomer } from "@/lib/customer-auth";
import { getOpportunityCatalog } from "@/lib/job-catalog";
import { analyzeApplication, PREMIUM_AI_DAILY_LIMIT, PREMIUM_DAYS, PREMIUM_PRICE } from "@/lib/premium";
import { startPremiumPass, prepareFromCatalog } from "@/lib/premium-actions";
import { applicationStats, getPremiumStatus, listApplications } from "@/lib/premium-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Premium", robots: { index: false, follow: false } };

const pillars: { icon: CareerIconName; title: string; text: string }[] = [
  { icon: "target", title: "Offres sélectionnées pour vous", text: "Les offres vérifiées rapprochées de votre profil, classées par score de compatibilité." },
  { icon: "spark", title: "Dossier de candidature en 1 clic", text: "Lettre de motivation, message au recruteur, ajustements du CV et relance, rédigés pour chaque offre." },
  { icon: "document", title: "Analyse de n’importe quelle annonce", text: "Collez une offre trouvée sur LinkedIn ou ailleurs : score, mots-clés manquants et plan d’action." },
  { icon: "briefcase", title: "Suivi de vos candidatures", text: "Statuts, dates de relance et notes : vous savez toujours où en est chaque candidature." },
  { icon: "people", title: "Préparation aux entretiens", text: "Questions probables pour votre métier, conseils de réponse et méthode STAR." },
  { icon: "compass", title: "Plan de compétences sur 4 semaines", text: "Les compétences à renforcer selon votre profil, avec des actions concrètes chaque semaine." },
];

export default async function PremiumPage() {
  const result = await loadWorkspaceData(async () => {
    const customer = await requireCustomer();
    const [status, record] = await Promise.all([getPremiumStatus(customer.id), getCustomerCareerProfile()]);
    const ready = isProfileReadyForMatching(record.profile);
    const catalog = ready ? await getOpportunityCatalog() : null;
    const matches = catalog ? getCareerMatches(record.profile, catalog.jobs) : [];
    const [applications, stats] = status.active ? await Promise.all([listApplications(customer.id), applicationStats(customer.id)]) : [[], {}];
    return { customer, status, profile: record.profile, ready, matches, applications, stats };
  });
  if (!result) return <WorkspaceUnavailable href="/espace/premium" />;
  const { customer, status, profile, ready, matches, applications, stats } = result.data;
  const firstName = customer.name.trim().split(/\s+/)[0];
  const ranked = matches.map((match) => ({ ...match, analysis: analyzeApplication(profile, { title: match.opportunity.title, description: match.opportunity.matchingText ?? match.opportunity.description }) }))
    .sort((a, b) => b.analysis.score - a.analysis.score).slice(0, 6);
  const prepared = new Map(applications.filter((item) => item.jobSlug).map((item) => [item.jobSlug!, item.id]));

  if (!status.active) return <div className="mx-auto max-w-[1120px]">
    <section className="relative isolate overflow-hidden rounded-[1.75rem] bg-night px-6 py-10 text-white shadow-[0_30px_80px_rgba(0,18,82,0.28)] sm:px-12 sm:py-14">
      <PremiumGlow />
      <div className="relative grid items-center gap-10 lg:grid-cols-[1.25fr_0.75fr]">
        <div>
          <PremiumBadge />
          <h1 className="mt-6 text-[clamp(2.2rem,4.6vw,3.6rem)] font-semibold leading-[1.02] tracking-[-0.05em]">Votre recherche d’emploi, <span className="font-editorial font-normal italic text-gold">menée comme un pro.</span></h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/75">{firstName}, Premium trouve les offres qui vous correspondent, prépare chaque candidature (lettre, message, CV ajusté) et vous entraîne pour les entretiens.</p>
          {ready && matches.length ? <p className="mt-6 inline-flex items-center gap-3 rounded-full border border-gold/30 bg-white/[0.06] px-4 py-2 text-xs font-semibold text-gold"><CareerIcon name="target" className="h-4 w-4" />{matches.length} offre{matches.length > 1 ? "s" : ""} correspond{matches.length > 1 ? "ent" : ""} déjà à votre profil</p> : null}
        </div>
        <div className="rounded-3xl border border-white/15 bg-white/[0.07] p-7 backdrop-blur">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">Pass Premium</p>
          <p className="mt-3 flex items-baseline gap-2"><span className="text-5xl font-semibold tracking-tight">{new Intl.NumberFormat("fr-FR").format(PREMIUM_PRICE)}</span><span className="text-sm text-white/70">FCFA / {PREMIUM_DAYS} jours</span></p>
          <ul className="mt-6 space-y-2.5 text-sm text-white/85">{["Sans engagement ni prélèvement automatique", "Paiement en ligne sécurisé via GeniusPay", "Accès immédiat après confirmation"].map((item) => <li key={item} className="flex gap-3"><CareerIcon name="check" className="mt-0.5 h-4 w-4 shrink-0 text-gold" />{item}</li>)}</ul>
          <form action={startPremiumPass} className="mt-7"><button className="group inline-flex min-h-14 w-full items-center justify-between rounded-xl bg-orange px-6 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(189,71,13,0.45)] transition hover:-translate-y-0.5 hover:bg-[#d4540f]">Activer Premium<CareerIcon name="arrow" className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button></form>
        </div>
      </div>
    </section>
    <section className="mt-10"><h2 className="text-2xl font-semibold tracking-tight text-night">Ce que Premium fait pour vous</h2>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{pillars.map((pillar) => <div key={pillar.title} className="ws-card p-6"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[linear-gradient(140deg,#fff4ea,#ffe6d2)] text-orange"><CareerIcon name={pillar.icon} className="h-5 w-5" /></span><h3 className="mt-5 text-base font-semibold text-night">{pillar.title}</h3><p className="mt-2 text-xs leading-6 text-muted">{pillar.text}</p></div>)}</div>
    </section>
    <section className="mt-10 grid gap-4 md:grid-cols-3">{[["1", "Activez votre pass", `${new Intl.NumberFormat("fr-FR").format(PREMIUM_PRICE)} FCFA, réglés en ligne en toute sécurité.`], ["2", "Complétez votre profil", "Métiers, compétences et parcours : l’assistant ne travaille qu’avec vos vraies informations."], ["3", "Postulez avec un dossier prêt", "Pour chaque offre : analyse, lettre, message et suivi."]].map(([step, title, text]) => <div key={step} className="rounded-2xl border border-dashed border-night/15 p-6"><span className="font-editorial text-4xl italic text-orange">{step}</span><h3 className="mt-3 text-sm font-semibold text-night">{title}</h3><p className="mt-1 text-xs leading-6 text-muted">{text}</p></div>)}</section>
    <p className="mt-8 text-[11px] leading-6 text-muted">L’assistant prépare vos candidatures à partir des informations de votre profil, sans jamais inventer d’expérience. Vous relisez et envoyez vous-même chaque candidature. Premium ne garantit pas d’embauche.</p>
  </div>;

  const counters = [["to_apply", "À postuler"], ["applied", "Envoyées"], ["interview", "Entretiens"], ["offer", "Offres"]] as const;
  return <div className="mx-auto max-w-[1180px] space-y-7">
    <section className="relative isolate overflow-hidden rounded-[1.5rem] bg-night px-6 py-8 text-white shadow-[0_28px_70px_rgba(0,18,82,0.22)] sm:px-10">
      <PremiumGlow />
      <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div><PremiumBadge /><h1 className="mt-4 font-editorial text-[2.3rem] italic leading-tight sm:text-[2.8rem]">À vous de jouer, {firstName}.</h1>
          <p className="mt-2 text-sm text-white/70">Premium actif jusqu’au {formatWorkspaceDate(status.endsAt!)} · {status.daysLeft} jour{status.daysLeft > 1 ? "s" : ""} restant{status.daysLeft > 1 ? "s" : ""}{status.isTest ? " · mode test" : ""}</p>
          {status.daysLeft <= 5 ? <form action={startPremiumPass} className="mt-4"><button className="inline-flex min-h-10 items-center gap-2 rounded-full bg-orange px-4 text-xs font-semibold">Prolonger de {PREMIUM_DAYS} jours · {new Intl.NumberFormat("fr-FR").format(PREMIUM_PRICE)} FCFA<CareerIcon name="arrow" className="h-3.5 w-3.5" /></button></form> : null}
        </div>
        <dl className="grid grid-cols-4 gap-2 sm:gap-3">{counters.map(([key, label]) => <div key={key} className="rounded-2xl border border-white/12 bg-white/[0.06] px-3 py-3 text-center backdrop-blur sm:px-5"><dd className="text-2xl font-semibold">{stats[key] ?? 0}</dd><dt className="mt-0.5 text-[10px] text-white/60">{label}</dt></div>)}</dl>
      </div>
      <nav className="relative mt-7 flex flex-wrap gap-2 border-t border-white/10 pt-5" aria-label="Premium">{[["/espace/premium/candidatures", "briefcase", "Mes candidatures"], ["/espace/premium/preparation", "compass", "Ma préparation"], ["/espace/profil/modifier", "user", "Améliorer mon profil"]].map(([href, icon, label]) => <Link key={href} href={href} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/15 px-4 text-xs font-semibold text-white/90 hover:bg-white/10"><CareerIcon name={icon as CareerIconName} className="h-3.5 w-3.5 text-gold" />{label}</Link>)}</nav>
    </section>

    <Panel eyebrow="Recherche ciblée" title="Les offres faites pour vous" action={<Link href="/espace/opportunites" className="text-xs font-semibold text-night underline decoration-night/20 underline-offset-4 hover:decoration-orange">Toutes mes opportunités</Link>}>
      {!ready ? <div className="rounded-2xl bg-paper p-6"><p className="text-sm font-semibold text-night">Complétez votre profil pour recevoir des offres ciblées.</p><p className="mt-1 text-xs leading-6 text-muted">Métiers recherchés, pays et niveau d’expérience suffisent pour démarrer.</p><Link href="/espace/profil/modifier" className="mt-4 inline-flex min-h-11 items-center gap-2 rounded-xl bg-night px-5 text-xs font-semibold text-white">Compléter mon profil<CareerIcon name="arrow" className="h-3.5 w-3.5" /></Link></div>
        : !ranked.length ? <p className="rounded-2xl bg-paper p-6 text-sm leading-7 text-muted">Aucune offre publiée ne correspond encore à votre profil. Collez une annonce trouvée ailleurs ci-dessous : l’assistant la prépare pour vous.</p>
        : <ul className="grid gap-4 lg:grid-cols-2">{ranked.map(({ opportunity, analysis, reasons }) => { const existing = prepared.get(opportunity.slug); return <li key={opportunity.slug} className="flex gap-5 rounded-2xl border border-night/[0.08] bg-white p-5 transition hover:border-night/20 hover:shadow-[0_14px_34px_rgba(0,18,82,0.07)]">
          <ScoreRing score={analysis.score} size={64} />
          <div className="min-w-0 flex-1"><h3 className="text-sm font-semibold leading-snug text-night">{opportunity.title}</h3><p className="mt-1 text-xs text-muted">{[opportunity.company, opportunity.location, opportunity.contractType].filter(Boolean).join(" · ")}</p>
            {reasons[0] ? <p className="mt-2 line-clamp-2 text-[11px] leading-5 text-[#4a5272]">{reasons[0]}</p> : null}
            {existing ? <Link href={`/espace/premium/candidatures/${existing}`} className="mt-3 inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-[#285236]">Dossier préparé · ouvrir<CareerIcon name="arrow" className="h-3.5 w-3.5" /></Link>
              : <form action={prepareFromCatalog} className="mt-3"><input type="hidden" name="slug" value={opportunity.slug} /><button className="inline-flex min-h-9 items-center gap-2 rounded-lg bg-night px-3.5 text-[11px] font-semibold text-white hover:bg-royal">Préparer ma candidature<CareerIcon name="arrow" className="h-3 w-3" /></button></form>}
          </div></li>; })}</ul>}
    </Panel>

    <div className="grid items-start gap-7 xl:grid-cols-[1.15fr_0.85fr]">
      <Panel eyebrow="Offre trouvée ailleurs" title="Analysez n’importe quelle annonce">
        <p className="-mt-3 mb-5 text-xs leading-6 text-muted">LinkedIn, Emploi.ci, Educarriere, un groupe WhatsApp… Collez l’annonce : vous obtenez un score de compatibilité, les mots-clés à reprendre et un dossier de candidature complet.</p>
        <PasteOfferForm />
      </Panel>
      <Panel eyebrow="Suivi" title="Candidatures récentes" action={<Link href="/espace/premium/candidatures" className="text-xs font-semibold text-night underline decoration-night/20 underline-offset-4">Tout voir</Link>}>
        {applications.length ? <ul className="divide-y divide-night/[0.06]">{applications.slice(0, 6).map((item) => <li key={item.id}><Link href={`/espace/premium/candidatures/${item.id}`} className="flex items-center gap-4 py-3.5"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-paper text-xs font-bold text-night">{item.matchScore ?? "–"}</span><span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-night">{item.title}</span><span className="block truncate text-[11px] text-muted">{item.company || "Entreprise non précisée"}</span></span><StatusChip status={item.status} /></Link></li>)}</ul>
          : <p className="rounded-2xl bg-paper p-5 text-xs leading-6 text-muted">Vos candidatures préparées apparaîtront ici, avec leur statut et leurs relances.</p>}
        <p className="mt-5 text-[10px] leading-5 text-muted">Jusqu’à {PREMIUM_AI_DAILY_LIMIT} dossiers ou plans générés par l’IA toutes les 24 heures.</p>
      </Panel>
    </div>
  </div>;
}
