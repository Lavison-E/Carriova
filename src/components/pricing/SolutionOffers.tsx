import Link from "next/link";
import { OfferCard } from "@/components/pricing/OfferCard";
import { Section } from "@/components/ui/primitives";
import { commercialSolutionLabels, publishedOffers } from "@/lib/commercial-offers";

const solutionGroups: Record<string, string[]> = {
  cv: ["cv"], "lettre-de-motivation": ["lettres"], matching: ["matching"],
  linkedin: ["linkedin"], entretien: ["entretien"], coaching: ["entretien", "carriere"],
  opportunites: ["recherche"], expertise: ["expertise"],
};

export function getSolutionOffers(slug: string) {
  return publishedOffers.filter((offer) => offer.kind === "service" && solutionGroups[slug]?.includes(offer.solution));
}

export function SolutionOffers({ slug }: { slug: string }) {
  const groups = solutionGroups[slug];
  if (!groups) return null;
  return <Section id="formules" className="!py-12 md:!py-16">
    <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between"><div className="max-w-2xl"><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-orange">Votre accompagnement, votre choix</p><h2 className="mt-4 font-editorial text-4xl italic leading-tight text-night sm:text-5xl">Des formules et des prix clairs.</h2><p className="mt-4 text-sm leading-7 text-muted">{slug === "opportunites" ? "La consultation des offres d’emploi reste gratuite. Ces formules rémunèrent un accompagnement personnel pour organiser votre recherche et préparer vos candidatures." : "Choisissez le niveau de service adapté à votre besoin. L’équipe confirme le périmètre et le calendrier avec vous dans votre espace client."}</p></div><Link href="/tarifs#packs" className="inline-flex min-h-11 shrink-0 items-center gap-2 text-xs font-semibold text-night underline decoration-line underline-offset-4 hover:text-orange">Voir les packs qui l’incluent <span aria-hidden="true">↗</span></Link></div>
    <div className="space-y-10">{groups.map((group) => { const offers = publishedOffers.filter((offer) => offer.kind === "service" && offer.solution === group); return <div key={group} id={`formules-${group}`}>{groups.length > 1 ? <h3 className="mb-5 text-xl font-semibold text-night">{commercialSolutionLabels[group]}</h3> : null}<div className={`grid items-stretch gap-5 sm:grid-cols-2 ${offers.length === 4 ? "xl:grid-cols-4" : offers.length === 3 ? "lg:grid-cols-3" : ""}`}>{offers.map((offer) => <OfferCard key={offer.slug} offer={offer} compact />)}</div></div>; })}</div>
    {slug === "cv" ? <p className="mt-6 rounded-lg border border-line bg-paper px-5 py-4 text-xs leading-7 text-muted"><strong className="font-semibold text-night">Votre Diagnostic CV peut compter pour la suite.</strong> Ses 3 000 FCFA sont déduits si vous choisissez un CV Cleaning ou un pack dans les 15 jours. L’équipe applique cette déduction à votre proposition.</p> : null}
    <p className="mt-5 text-xs leading-7 text-muted">Les délais démarrent après réception des informations nécessaires et du paiement prévu. <Link href="/tarifs#conditions" className="font-semibold text-night underline decoration-line underline-offset-4">Consulter les options et conditions.</Link></p>
  </Section>;
}
