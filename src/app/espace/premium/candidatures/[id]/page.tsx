import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { ApplicationTrackerForm, CopyBlock, KitGenerator } from "@/components/premium/PremiumForms";
import { PremiumGlow, ScoreRing, StatusChip, verdictLabel } from "@/components/premium/PremiumUi";
import { loadWorkspaceData } from "@/components/workspace/WorkspaceData";
import { WorkspaceUnavailable, formatWorkspaceDate } from "@/components/workspace/WorkspaceUi";
import { getCustomerCareerProfile } from "@/lib/career-profile-queries";
import { requireCustomer } from "@/lib/customer-auth";
import { isCvAiAvailable } from "@/lib/cv-ai-config";
import { analyzeApplication } from "@/lib/premium";
import { deleteApplicationAction } from "@/lib/premium-actions";
import { getApplication, getPremiumStatus } from "@/lib/premium-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Dossier de candidature", robots: { index: false, follow: false } };

export default async function ApplicationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d{0,9}$/.test(id)) notFound();
  const result = await loadWorkspaceData(async () => {
    const customer = await requireCustomer();
    const status = await getPremiumStatus(customer.id);
    if (!status.active) return { status, application: null, profile: null };
    const [application, record] = await Promise.all([getApplication(customer.id, Number(id)), getCustomerCareerProfile()]);
    return { status, application, profile: record.profile };
  });
  if (!result) return <WorkspaceUnavailable href={`/espace/premium/candidatures/${id}`} />;
  if (!result.data.status.active) redirect("/espace/premium");
  const { application, profile } = result.data;
  if (!application || !profile) notFound();
  // The analysis follows the latest profile, so improving the profile improves the score.
  const analysis = analyzeApplication(profile, application);
  const kit = application.kit;
  const aiReady = isCvAiAvailable();

  return <div className="mx-auto max-w-[1180px]">
    <Link href="/espace/premium/candidatures" className="mb-5 inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-muted hover:text-night"><span aria-hidden="true">←</span>Mes candidatures</Link>
    <section className="relative isolate overflow-hidden rounded-[1.5rem] bg-night px-6 py-8 text-white shadow-[0_28px_70px_rgba(0,18,82,0.22)] sm:px-10">
      <PremiumGlow />
      <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><StatusChip status={application.status} /><span className="rounded-full border border-white/15 px-2.5 py-1 text-[10px] font-semibold text-gold">{verdictLabel[analysis.verdict]}</span></div>
          <h1 className="mt-4 break-words text-[clamp(1.8rem,3.4vw,2.6rem)] font-semibold leading-tight tracking-[-0.03em]">{application.title}</h1>
          <p className="mt-2 text-sm text-white/70">{[application.company, application.location].filter(Boolean).join(" · ") || "Entreprise non précisée"}</p>
          {application.sourceUrl ? <a href={application.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl bg-orange px-5 text-xs font-semibold text-white shadow-[0_12px_28px_rgba(189,71,13,0.4)] hover:bg-[#d4540f]">Postuler sur le site de l’offre <span aria-hidden="true">↗</span><span className="sr-only">(nouvel onglet)</span></a> : null}
        </div>
        <div className="flex items-center gap-4 rounded-2xl bg-white p-4 text-night"><ScoreRing score={analysis.score} size={92} /><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">Compatibilité</p><p className="mt-1 max-w-[11rem] text-xs leading-5 text-[#4a5272]">Calculée à partir de votre profil et du texte de l’annonce.</p></div></div>
      </div>
    </section>

    <div className="mt-7 grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-7">
        <section className="ws-card p-6 sm:p-8" aria-labelledby="analysis-title">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange">Analyse de l’offre</p><h2 id="analysis-title" className="mt-1 text-xl font-semibold tracking-tight text-night">Ce que le recruteur va regarder</h2>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <div className="rounded-2xl bg-[#f3f8f4] p-5"><h3 className="flex items-center gap-2 text-sm font-semibold text-[#285236]"><CareerIcon name="check" className="h-4 w-4" />Vos atouts</h3>{analysis.strengths.length ? <ul className="mt-3 space-y-2 text-xs leading-6 text-[#2c4a35]">{analysis.strengths.map((item) => <li key={item}>{item}</li>)}</ul> : <p className="mt-3 text-xs leading-6 text-[#2c4a35]">Complétez vos compétences dans votre profil pour faire ressortir vos atouts.</p>}
              {analysis.matchedSkills.length ? <ul className="mt-4 flex flex-wrap gap-1.5">{analysis.matchedSkills.map((skill) => <li key={skill} className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-[#285236]">{skill}</li>)}</ul> : null}</div>
            <div className="rounded-2xl bg-[#fff6ee] p-5"><h3 className="flex items-center gap-2 text-sm font-semibold text-[#9a4a0b]"><CareerIcon name="target" className="h-4 w-4" />Mots-clés de l’annonce absents du profil</h3>{analysis.missingKeywords.length ? <><ul className="mt-3 flex flex-wrap gap-1.5">{analysis.missingKeywords.map((keyword) => <li key={keyword} className="rounded-full border border-orange/25 bg-white px-2.5 py-1 text-[10px] font-semibold text-[#9a4a0b]">{keyword}</li>)}</ul><p className="mt-3 text-[11px] leading-5 text-[#7a4a20]">Ajoutez-les au CV uniquement si vous les maîtrisez réellement.</p></> : <p className="mt-3 text-xs leading-6 text-[#7a4a20]">Aucun mot-clé important ne manque à votre profil.</p>}</div>
          </div>
          {analysis.experienceNote || analysis.languageNote ? <ul className="mt-5 space-y-2 text-xs leading-6 text-[#4a5272]">{[analysis.experienceNote, analysis.languageNote].filter(Boolean).map((note) => <li key={note} className="flex gap-2"><span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />{note}</li>)}</ul> : null}
          <div className="mt-6 border-t border-night/[0.06] pt-5"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Plan d’action avant d’envoyer</h3><ol className="mt-3 space-y-2.5">{analysis.actions.map((action, index) => <li key={action} className="flex gap-3 text-sm leading-6 text-night"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-night text-[10px] font-semibold text-white">{index + 1}</span>{action}</li>)}</ol></div>
        </section>

        <section className="ws-card overflow-hidden" aria-labelledby="kit-title">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-night/[0.06] bg-[linear-gradient(135deg,#fffaf4,#fff)] px-6 py-6 sm:px-8"><div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange">Dossier de candidature</p><h2 id="kit-title" className="mt-1 text-xl font-semibold tracking-tight text-night">Prêt à envoyer, rédigé pour cette offre</h2>{application.kitGeneratedAt ? <p className="mt-1 text-[11px] text-muted">Généré le {formatWorkspaceDate(application.kitGeneratedAt.toISOString(), true)}</p> : null}</div>{kit && aiReady ? <KitGenerator applicationId={application.id} hasKit /> : null}</div>
          <div className="space-y-5 p-6 sm:p-8">
            {!kit ? aiReady ? <div className="text-center sm:text-left"><p className="mb-5 max-w-2xl text-sm leading-7 text-[#4a5272]">L’assistant rédige votre <strong>lettre de motivation</strong>, le <strong>message au recruteur</strong>, les <strong>ajustements du CV</strong>, les <strong>questions d’entretien probables</strong> et le <strong>message de relance</strong>, à partir de votre profil et de cette annonce, sans rien inventer.</p><KitGenerator applicationId={application.id} hasKit={false} /></div>
              : <p className="rounded-2xl bg-paper p-5 text-sm leading-7 text-muted">L’assistant de rédaction est momentanément indisponible. Suivez le plan d’action ci-dessus ; vous pourrez générer le dossier plus tard.</p>
              : <>
                <CopyBlock label="Message au recruteur (e-mail ou LinkedIn)" value={kit.pitch} />
                <CopyBlock label="Lettre de motivation" value={kit.coverLetter} />
                <div className="rounded-2xl border border-night/[0.08] bg-white p-5"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Ajustements à faire dans votre CV</h3><ul className="mt-3 space-y-2.5">{kit.cvAdjustments.map((item) => <li key={item} className="flex gap-3 text-sm leading-6 text-night"><CareerIcon name="check" className="mt-1 h-4 w-4 shrink-0 text-orange" />{item}</li>)}</ul><Link href="/espace/cv" className="mt-4 inline-flex min-h-9 items-center gap-2 text-xs font-semibold text-night underline decoration-night/20 underline-offset-4">Ouvrir le Studio CV</Link></div>
                <div className="rounded-2xl border border-night/[0.08] bg-white p-5"><h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Questions d’entretien probables</h3><div className="mt-3 divide-y divide-night/[0.06]">{kit.interviewQuestions.map((item) => <details key={item.question} className="group py-3"><summary className="flex cursor-pointer list-none items-start justify-between gap-4 text-sm font-semibold leading-6 text-night">{item.question}<span aria-hidden="true" className="mt-1 text-muted transition group-open:rotate-45">+</span></summary><p className="mt-2 text-xs leading-6 text-[#4a5272]">{item.tip}</p></details>)}</div></div>
                <CopyBlock label="Message de relance (à J+7)" value={kit.followUpMessage} />
                <p className="text-[11px] leading-5 text-muted">Relisez chaque texte et complétez les éléments entre crochets avant l’envoi. L’assistant s’appuie uniquement sur votre profil.</p>
              </>}
          </div>
        </section>

        {application.description ? <details className="ws-card p-6 sm:p-8"><summary className="cursor-pointer text-sm font-semibold text-night">Texte de l’annonce</summary><p className="mt-4 whitespace-pre-wrap text-xs leading-6 text-[#4a5272]">{application.description}</p></details> : null}
      </div>

      <aside className="space-y-5 xl:sticky xl:top-28">
        <section className="ws-card p-6" aria-labelledby="tracker-title"><h2 id="tracker-title" className="mb-5 text-base font-semibold text-night">Suivi de la candidature</h2><ApplicationTrackerForm applicationId={application.id} status={application.status} notes={application.notes} followUpAt={application.followUpAt?.toISOString() ?? null} />
          {application.appliedAt ? <p className="mt-4 text-[11px] text-muted">Envoyée le {formatWorkspaceDate(application.appliedAt.toISOString())}</p> : null}</section>
        <form action={deleteApplicationAction} className="text-center"><input type="hidden" name="applicationId" value={application.id} /><button className="min-h-9 text-[11px] text-muted underline underline-offset-4 hover:text-orange">Supprimer cette candidature</button></form>
      </aside>
    </div>
  </div>;
}
