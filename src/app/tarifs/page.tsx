import Link from "next/link";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { PageHero } from "@/components/layout/PageHero";
import { ButtonLink, JsonLd, Section } from "@/components/ui/primitives";
import { getPricingOffers } from "@/lib/queries";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { parseStringList } from "@/lib/security";
import { catalogueOffers, qualificationRequestHref, serviceNeedForSlug, workspaceRequestHref, type CommercialOffer } from "@/lib/service-catalog";

export const dynamic = "force-dynamic";
export const metadata = buildMetadata({
  title: "Tarifs et accompagnements",
  description: "Création de CV professionnel, CV Cleaning, candidature ciblée ou coaching : choisissez votre accompagnement CARRIOVA et demandez une proposition adaptée à votre besoin.",
  path: "/tarifs",
});

async function loadCommercialOffers() {
  try {
    const published = await getPricingOffers();
    const offers: CommercialOffer[] = published.length ? published.map((offer) => ({
      slug: offer.slug, name: offer.name, category: offer.category, tagline: offer.tagline,
      benefits: parseStringList(offer.benefits), need: serviceNeedForSlug(offer.slug),
      priceAmount: offer.priceAmount !== null && Number.isFinite(offer.priceAmount) && offer.priceAmount >= 0 ? offer.priceAmount : null,
      currency: offer.currency?.trim() || "XOF", priceLabel: offer.priceLabel?.trim() || "Sur devis", featured: offer.featured,
    })) : catalogueOffers;
    return { offers, unavailable: false, hasPublishedOffers: published.length > 0 };
  } catch {
    return { offers: catalogueOffers, unavailable: true, hasPublishedOffers: false };
  }
}

function priceText(offer: CommercialOffer) {
  if (offer.priceAmount === null) return offer.priceLabel;
  if (offer.priceAmount === 0) return "Offert";
  return `${offer.priceAmount.toLocaleString("fr-FR")} ${offer.currency === "XOF" ? "FCFA" : offer.currency}`;
}

export default async function PricingPage() {
  const { offers, unavailable, hasPublishedOffers } = await loadCommercialOffers();
  const crumbs = [{ href: "/", label: "Accueil" }, { href: "/tarifs", label: "Tarifs" }];
  return <>
    <JsonLd data={breadcrumbJsonLd(crumbs.map((crumb) => ({ name: crumb.label, path: crumb.href })))} />
    <PageHero image={{ src: "/images/Tarifs Carriova 1.png", alt: "Une conseillère échange avec un professionnel autour de son projet.", width: 1122, height: 1402, caption: "Un accompagnement défini ensemble, selon votre besoin." }} eyebrow="Tarifs & accompagnements" title="Le bon accompagnement, au bon moment." text="Choisissez votre objectif et présentez-nous votre besoin. Le contenu de la prestation, son prix et l’échéance sont précisés dans une proposition avant de commencer." primary={{ href: "/qualification", label: "Demander une proposition" }} secondary={{ href: "/solutions", label: "Explorer les solutions" }} crumbs={crumbs} />
    <Section className="!pt-8 md:!pt-12">
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-orange">{hasPublishedOffers ? "Les offres publiées" : "Nos accompagnements sur devis"}</p><h2 className="mt-4 font-editorial text-4xl italic leading-tight text-night sm:text-5xl">Quel est votre prochain objectif ?</h2></div><p className="max-w-xs text-xs leading-7 text-muted">Chaque demande arrive à notre équipe. Vous pourrez ensuite retrouver votre proposition et vos échanges dans votre espace client.</p></div>
      {unavailable ? <p role="status" className="mb-7 rounded-lg border border-line bg-paper p-4 text-xs leading-7 text-muted">Les tarifs publiés ne peuvent pas être chargés pour le moment. Vous pouvez consulter les accompagnements ci-dessous et demander un devis à l’équipe.</p> : null}
      <div className="grid items-stretch gap-5 lg:grid-cols-2">
        {offers.map((offer) => <article key={offer.slug} className={`flex min-w-0 flex-col rounded-xl border bg-white p-6 sm:p-8 ${offer.featured ? "border-night/40" : "border-line"}`}>
          <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-orange">{offer.category}</p>{offer.featured ? <span className="rounded-md bg-paper px-2.5 py-1 text-[10px] font-medium text-night">À découvrir</span> : null}</div>
          <h3 className="mt-5 text-2xl font-semibold tracking-tight text-night">{offer.name}</h3>{offer.tagline ? <p className="mt-4 text-sm leading-7 text-muted">{offer.tagline}</p> : null}
          <ul className="mb-7 mt-6 space-y-3">{offer.benefits.map((benefit, index) => <li key={`${index}-${benefit}`} className="flex items-start gap-3 text-xs leading-6 text-muted"><CareerIcon name="check" className="mt-1 h-4 w-4 shrink-0 text-orange" />{benefit}</li>)}</ul>
          <div className="mt-auto border-t border-line pt-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-2xl font-semibold tracking-tight text-night">{priceText(offer)}</p><p className="mt-1 text-[10px] leading-5 text-muted">{offer.priceAmount === null ? "Proposition selon votre besoin" : offer.currency === "XOF" ? "Franc CFA · XOF" : "Tarif publié"}</p></div><Link href={qualificationRequestHref(offer.need)} aria-label={`Demander une proposition pour ${offer.name}`} className={`inline-flex min-h-12 items-center justify-between gap-5 rounded-lg px-5 py-3 text-xs font-semibold text-white ${offer.featured ? "bg-orange hover:bg-[#9e3708]" : "bg-night hover:bg-royal"}`}>Présenter mon besoin <CareerIcon name="arrow" className="h-4 w-4 shrink-0" /></Link></div>
            <div className="mt-4 flex flex-col gap-1"><Link href={workspaceRequestHref(offer.need)} className="inline-flex min-h-9 items-center text-[11px] font-medium text-night underline decoration-line underline-offset-4 hover:text-orange">Déjà connecté ? Créer ma demande dans mon espace</Link>{!offer.need || offer.slug === "cv-lettre" ? <p className="text-[10px] leading-6 text-muted">Précisez « {offer.name} » dans votre message pour conserver le contexte de votre choix.</p> : null}</div>
          </div>
        </article>)}
      </div>
      <p className="mt-7 text-xs leading-7 text-muted">Le périmètre et l’échéance sont confirmés dans la proposition. L’envoi d’une demande et l’acceptation d’un devis dans votre espace ne déclenchent aucun paiement en ligne.</p>
    </Section>
    <Section tone="night">
      <div className="grid gap-8 md:grid-cols-[1fr_1.1fr] md:gap-16"><div><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#f7bd92]">Du besoin à la livraison</p><h2 className="mt-5 font-editorial text-4xl italic leading-tight text-white sm:text-5xl">Une suite claire,<br />à chaque étape.</h2><p className="mt-5 max-w-sm text-sm leading-7 text-white/70">Votre espace rassemble la proposition, les documents et la conversation avec l’équipe.</p></div><ol className="divide-y divide-white/20">{[{ title: "Vous présentez votre objectif", text: "Le formulaire nous aide à comprendre votre situation et votre priorité." }, { title: "Vous étudiez la proposition", text: "Vous échangez avec l’équipe et confirmez la prestation qui vous convient." }, { title: "Vous suivez le travail", text: "Les messages, les documents et l’avancement restent dans votre demande." }, { title: "Vous donnez votre retour", text: "À la livraison, vous pouvez valider le travail ou expliquer les ajustements souhaités." }].map((step, index) => <li key={step.title} className="flex gap-5 py-5 first:pt-0"><span className="pt-1 text-[11px] text-[#f7bd92]">0{index + 1}</span><div><h3 className="text-sm font-semibold text-white">{step.title}</h3><p className="mt-2 text-xs leading-7 text-white/70">{step.text}</p></div></li>)}</ol></div>
    </Section>
    <Section tone="paper"><div className="flex flex-col gap-7 md:flex-row md:items-center md:justify-between"><div className="max-w-xl"><h2 className="font-editorial text-4xl italic leading-tight text-night">Vous hésitez encore ?</h2><p className="mt-4 text-sm leading-7 text-muted">Présentez votre situation sans choisir de prestation à l’avance. Les offres d’emploi et les ressources publiques restent consultables sans compte.</p><div className="mt-4 flex flex-wrap gap-x-6 gap-y-2"><Link href="/emploi" className="inline-flex min-h-10 items-center text-xs font-semibold text-night underline decoration-line underline-offset-4">Consulter les offres d’emploi</Link><Link href="/ressources" className="inline-flex min-h-10 items-center text-xs font-semibold text-night underline decoration-line underline-offset-4">Explorer les ressources</Link></div></div><ButtonLink href="/qualification" variant="orange" size="lg">Faire le point sur mon besoin <CareerIcon name="arrow" className="h-4 w-4" /></ButtonLink></div></Section>
  </>;
}
