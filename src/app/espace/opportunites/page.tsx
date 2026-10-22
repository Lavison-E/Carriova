import type { Metadata } from "next";
import Link from "next/link";
import { MatchingEmpty, OpportunityMatchCard } from "@/components/career/OpportunityMatches";
import { loadWorkspaceData } from "@/components/workspace/WorkspaceData";
import { WorkspaceHeading, WorkspaceUnavailable } from "@/components/workspace/WorkspaceUi";
import { getCustomerCareerProfile } from "@/lib/career-profile-queries";
import { isProfileReadyForMatching } from "@/lib/career-profile";
import { getCareerMatches } from "@/lib/career-matching";
import { getOpportunityCatalog } from "@/lib/job-catalog";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mes opportunités | CARRIOVA", robots: { index: false, follow: false } };

export default async function CareerOpportunitiesPage() {
  // Authenticate before reading the profile. The shared catalogue contains public vacancies only.
  const result = await loadWorkspaceData(getCustomerCareerProfile);
  if (!result) return <WorkspaceUnavailable href="/espace/opportunites" />;
  const { profile } = result.data;
  const ready = isProfileReadyForMatching(profile);
  const catalog = ready ? await getOpportunityCatalog() : null;
  const matches = catalog ? getCareerMatches(profile, catalog.jobs) : [];
  return <>
    <WorkspaceHeading eyebrow="Votre recherche d’emploi" title="Des pistes pour votre prochaine étape." text="Des offres officielles rapprochées de vos métiers, compétences et préférences. Vous gardez la main sur chaque candidature." action={<Link href="/espace/profil" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-lg border border-night/20 bg-white px-4 text-xs font-semibold text-night hover:bg-paper">Mon profil carrière</Link>} />
    {ready ? <div className="mb-7 rounded-xl border border-night/10 bg-white px-5 py-5 sm:px-6"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-orange">Vos métiers recherchés</p><p className="mt-2 break-words text-sm font-medium leading-7 text-night">{profile.targetRoles.join(" · ")}</p><p className="mt-3 text-xs leading-6 text-muted">Les pays, contrats et modes de travail choisis écartent les offres incompatibles lorsque ces informations sont connues. Le rapprochement des métiers et compétences détermine ensuite l’ordre d’affichage.</p></div> : null}
    {catalog?.unavailable ? <p role="status" className="mb-6 rounded-lg border border-[#b98b4e]/30 bg-[#fff9ef] px-4 py-4 text-xs leading-6 text-[#745323]">Une source d’offres est temporairement indisponible. Seules les annonces dont la vérification reste assez récente sont affichées ; les résultats peuvent être incomplets.</p> : null}
    {!ready ? <MatchingEmpty needsProfile /> : !matches.length ? <MatchingEmpty catalogueEmpty={!catalog?.jobs.length} /> : <section aria-label="Offres rapprochées de votre profil"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><p className="text-sm font-semibold text-night">{matches.length} {matches.length === 1 ? "offre à explorer" : "offres à explorer"}</p><Link href="/emploi" className="inline-flex min-h-9 items-center text-xs font-medium text-muted underline underline-offset-4 hover:text-night">Voir tout le catalogue</Link></div><div className="grid items-start gap-5 xl:grid-cols-2">{matches.map((match, index) => <OpportunityMatchCard key={match.opportunity.slug} match={match} index={index} />)}</div></section>}
    <aside className="mt-8 border-t border-night/15 pt-6"><h2 className="text-sm font-semibold text-night">Une aide à la recherche, à votre rythme.</h2><p className="mt-3 max-w-3xl text-xs leading-7 text-muted">Ce classement utilise des règles de rapprochement, pas une probabilité d’embauche. Votre profil reste dans Carriova pour cette comparaison et n’est pas envoyé aux recruteurs. Aucune candidature n’est envoyée automatiquement. Vérifiez l’annonce officielle, préparez vos documents, puis choisissez vous-même de candidater.</p><div className="mt-4 flex flex-wrap gap-x-6 gap-y-2"><Link href="/espace/cv" className="inline-flex min-h-9 items-center text-xs font-semibold text-night underline underline-offset-4 hover:text-orange">Préparer mon CV</Link><Link href="/legal/confidentialite#profil-carriere-confidentialite" className="inline-flex min-h-9 items-center text-xs text-muted underline underline-offset-4 hover:text-night">Utilisation de mon profil</Link></div></aside>
  </>;
}