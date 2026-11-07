import Image from "next/image";
import Link from "next/link";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { OfferCard } from "@/components/pricing/OfferCard";
import { PackComparison } from "@/components/pricing/PackComparison";
import { PricingTabs } from "@/components/pricing/PricingTabs";
import { Breadcrumb, ButtonLink, FaqList, JsonLd, Section } from "@/components/ui/primitives";
import { commercialOptions, commercialSolutionLabels, formatOfferPrice, publishedOffers } from "@/lib/commercial-offers";
import { breadcrumbJsonLd, buildMetadata, faqJsonLd } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Tarifs : packs et accompagnements carrière",
  description: "Découvrez les tarifs Carriova : Diagnostic CV dès 3 000 FCFA, six packs de 7 500 à 60 000 FCFA et 22 formules CV, LinkedIn, entretien et carrière. Prix, contenu et délais transparents.",
  path: "/tarifs",
});

const packs = publishedOffers.filter((offer) => offer.kind === "pack");
const services = publishedOffers.filter((offer) => offer.kind === "service");
const organisations = publishedOffers.filter((offer) => offer.kind === "organisation");
const serviceGroups = Object.entries(commercialSolutionLabels).filter(([key]) => key !== "organisations");
const solutionLinks: Record<string, string> = {
  cv: "/solutions/cv", lettres: "/solutions/lettre-de-motivation", matching: "/solutions/matching",
  linkedin: "/solutions/linkedin", entretien: "/solutions/entretien", carriere: "/solutions/coaching",
  recherche: "/solutions/opportunites", expertise: "/solutions/expertise",
};
const faqs = [
  { question: "Quand commence le délai annoncé ?", answer: "Le délai démarre une fois votre proposition validée, les informations et documents nécessaires reçus et le paiement prévu effectué. Pour une séance, le créneau est confirmé ensemble. L’option express 24 h reste soumise à la confirmation de l’équipe. Si le délai annoncé n’est pas respecté, la livraison express est offerte sur votre prochaine commande." },
  { question: "Combien de corrections sont incluses ?", answer: "Les corrections sont incluses jusqu’à votre validation, dans la limite du nombre de séries indiqué dans votre offre. Une série rassemble vos retours sur la version livrée. Pour toute prestation écrite, une série supplémentaire peut être ajoutée à 2 000 FCFA et confirmée dans la proposition." },
  { question: "Comment se déroule le paiement ?", answer: "Vous validez d’abord la proposition dans votre espace client. GeniusPay est le prestataire de paiement retenu ; les instructions de règlement vous sont communiquées après validation. Jusqu’à 25 000 FCFA, le paiement est intégral avant le démarrage. Au-delà, il se répartit en 50 % au démarrage et 50 % à la livraison. L’envoi de votre demande ne déclenche aucun paiement." },
  { question: "Mes informations et documents restent-ils confidentiels ?", answer: "Vos documents sont accessibles dans votre espace privé et à l’équipe chargée de votre accompagnement. Ils ne sont pas publiés ni partagés avec des recruteurs sans votre accord. Les échanges et les livrables restent réunis dans votre demande." },
  { question: "Est-ce une prestation humaine ou un CV généré automatiquement ?", answer: "Les offres présentées ici sont réalisées avec l’équipe Carriova : échanges, rédaction, conseils et corrections selon la formule choisie. Le Studio CV est un outil distinct en libre-service dans votre espace ; vous y gardez la main sur votre contenu, avec une assistance IA lorsqu’elle est disponible." },
  { question: "Puis-je déduire le prix du Diagnostic CV ?", answer: "Oui. Si vous choisissez un CV Cleaning ou un pack dans les 15 jours suivant votre Diagnostic CV, les 3 000 FCFA du diagnostic sont déduits. Signalez votre diagnostic à l’équipe pour que la déduction apparaisse dans votre proposition." },
  { question: "Et si mon besoin ne rentre dans aucune case ?", answer: "Présentez votre situation dans le formulaire « Trouver ma solution ». L’équipe pourra préciser le bon périmètre et vous transmettre une proposition adaptée, sans engagement au moment de la demande." },
];

function PackOffers() {
  return <>
    <div className="mb-8"><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-orange">Un objectif. Un accompagnement complet.</p><h2 className="mt-3 text-2xl font-semibold tracking-tight text-night sm:text-3xl">Le pack qui vous fait avancer.</h2></div>
    <div className="grid items-stretch gap-5 sm:grid-cols-2 lg:grid-cols-4">{packs.slice(0, 4).map((offer) => <OfferCard key={offer.slug} offer={offer} />)}</div>
    <div className="mt-12 rounded-2xl bg-paper p-5 sm:p-8">
      <div className="mb-7 max-w-2xl"><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-orange">Accompagnements avancés</p><h2 className="mt-3 text-2xl font-semibold tracking-tight text-night">Une nouvelle direction. Une autre ambition.</h2><p className="mt-3 text-sm leading-7 text-muted">Pour un changement de métier, une évolution vers un poste de cadre ou une candidature à l’international.</p></div>
      <div className="grid items-stretch gap-5 md:grid-cols-2">{packs.slice(4).map((offer) => <OfferCard key={offer.slug} offer={offer} compact />)}</div>
    </div>
    <PackComparison packs={packs} />
  </>;
}

function ServiceOffers() {
  return <>
    <div className="mb-7"><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-orange">À la carte</p><h2 className="mt-3 text-2xl font-semibold tracking-tight text-night sm:text-3xl">Une réponse précise à votre besoin.</h2></div>
    <nav aria-label="Choisir une famille de prestations" className="mb-9 flex flex-wrap gap-2">{serviceGroups.map(([key, label]) => <a key={key} href={`#formules-${key}`} className="inline-flex min-h-10 items-center rounded-full border border-line px-4 py-2 text-xs font-medium text-night hover:border-night hover:bg-paper">{label}</a>)}</nav>
    <div className="space-y-14">{serviceGroups.map(([key, label], index) => {
      const offers = services.filter((offer) => offer.solution === key);
      return <section key={key} id={`formules-${key}`} aria-labelledby={`titre-${key}`}>
        <div className="mb-5 flex flex-col gap-3 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between"><h3 id={`titre-${key}`} className="flex items-baseline gap-3 text-xl font-semibold tracking-tight text-night"><span className="text-[10px] font-medium text-orange">{String(index + 1).padStart(2, "0")}</span>{label}</h3><Link href={solutionLinks[key]} className="inline-flex min-h-10 items-center text-xs font-semibold text-night underline decoration-line underline-offset-4 hover:text-orange">Comprendre cette solution ↗</Link></div>
        {key === "recherche" ? <p className="mb-6 text-sm leading-7 text-muted">La <Link href="/emploi" className="font-semibold text-night underline decoration-line underline-offset-4">consultation des offres d’emploi est gratuite</Link>. Ces formules couvrent un accompagnement personnel dans votre recherche.</p> : null}
        <div className={`grid items-stretch gap-5 sm:grid-cols-2 ${offers.length === 4 ? "xl:grid-cols-4" : offers.length === 3 ? "lg:grid-cols-3" : ""}`}>{offers.map((offer) => <OfferCard key={offer.slug} offer={offer} compact />)}</div>
        {key === "cv" ? <p className="mt-5 rounded-lg border border-line bg-paper px-5 py-4 text-xs leading-7 text-muted"><strong className="text-night">Un premier pas qui compte.</strong> Le Diagnostic CV à 3 000 FCFA est déduit si vous choisissez un CV Cleaning ou un pack dans les 15 jours. L’équipe applique la déduction à votre proposition.</p> : null}
      </section>;
    })}</div>
  </>;
}

export default function PricingPage() {
  const crumbs = [{ href: "/", label: "Accueil" }, { href: "/tarifs", label: "Tarifs" }];
  return <>
    <JsonLd data={breadcrumbJsonLd(crumbs.map((crumb) => ({ name: crumb.label, path: crumb.href })))} />
    <JsonLd data={faqJsonLd(faqs)} />
    <section className="bg-paper text-night">
      <div className="mx-auto max-w-7xl px-5 pb-8 pt-6 sm:px-8 md:pb-10 lg:px-12">
        <div className="border-b border-night/15 pb-4 [&_nav]:text-xs"><Breadcrumb items={crumbs} /></div>
        <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] items-center gap-5 pt-7 sm:grid-cols-[minmax(0,1fr)_9rem] sm:gap-8 lg:grid-cols-[minmax(0,1fr)_13rem] lg:gap-16">
          <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-orange">Tarifs & accompagnements</p><h1 className="mt-4 max-w-3xl font-editorial text-[2.35rem] italic leading-[1.06] tracking-tight sm:text-5xl lg:text-[3.7rem]">Votre prochain pas.<br />Un prix clair pour avancer.</h1><p className="mt-5 hidden max-w-2xl text-sm leading-7 text-muted sm:block">Des packs pour votre situation, des formules pour un besoin précis. Choisissez votre accompagnement et retrouvez l’équipe, vos documents et vos prochaines étapes dans votre espace.</p><div className="mt-5 hidden sm:block"><Link href="/qualification" className="inline-flex min-h-10 items-center gap-3 text-xs font-semibold text-night underline decoration-night/25 underline-offset-4 hover:text-orange">M’aider à choisir en 2 questions <CareerIcon name="arrow" className="h-4 w-4" /></Link></div></div>
          <figure><Image src="/images/Tarifs Carriova 1.png" alt="Une conseillère échange avec un professionnel autour de son projet." width={1122} height={1402} sizes="(max-width: 639px) 88px, (max-width: 1023px) 144px, 208px" loading="eager" className="h-auto w-full rounded-xl" /><figcaption className="mt-3 hidden text-[10px] leading-5 text-muted sm:block">Votre parcours, accompagné par une équipe.</figcaption></figure>
        </div>
        <div className="mt-5 sm:hidden"><p className="text-sm leading-7 text-muted">Des packs pour votre situation, des formules pour un besoin précis. Choisissez votre accompagnement, puis échangez avec notre équipe.</p><Link href="/qualification" className="mt-3 inline-flex min-h-11 items-center gap-3 text-xs font-semibold text-night underline decoration-line underline-offset-4">M’aider à choisir en 2 questions <span aria-hidden="true">↗</span></Link></div>
      </div>
    </section>

    <Section id="packs" className="!py-10 md:!py-12"><PricingTabs packs={<PackOffers />} services={<ServiceOffers />} /><p className="mt-7 text-xs leading-7 text-muted">Tarifs en francs CFA (XOF). Votre choix est transmis à l’équipe avec votre demande. Le périmètre, les options et le calendrier sont confirmés dans la proposition avant tout démarrage.</p></Section>

    <Section tone="night" className="!py-12 md:!py-16">
      <div className="grid gap-8 lg:grid-cols-[1fr_2fr] lg:gap-12"><div><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#f7bd92]">Nos engagements</p><h2 className="mt-4 font-editorial text-4xl italic leading-tight text-white">Un travail soigné.<br />Un cadre rassurant.</h2></div><div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">{[
        { title: "Des corrections prévues", text: "Jusqu’à votre validation, dans la limite des séries incluses dans votre offre." },
        { title: "Un délai annoncé", text: "Le délai convenu est respecté, ou la livraison express est offerte sur votre prochaine commande." },
        { title: "Vos documents, en privé", text: "Un espace confidentiel pour vos échanges avec l’équipe et vos livrables." },
        { title: "Une équipe à vos côtés", text: "Ces prestations sont réalisées avec une personne. Le Studio CV en libre-service est un outil distinct." },
      ].map((item) => <div key={item.title} className="border-t border-white/20 pt-5"><h3 className="text-sm font-semibold text-white">{item.title}</h3><p className="mt-2 text-xs leading-7 text-white/70">{item.text}</p></div>)}</div></div>
    </Section>

    <Section id="conditions" className="!py-14 md:!py-20">
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <div><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-orange">Les options</p><h2 className="mt-4 text-3xl font-semibold tracking-tight text-night">Ajustez votre accompagnement.</h2><p className="mt-4 text-sm leading-7 text-muted">Précisez les options souhaitées à l’équipe. Leur disponibilité et leur montant sont confirmés dans votre proposition.</p><dl className="mt-7 divide-y divide-line border-y border-line">{commercialOptions.map((option) => <div key={option.id} className="py-4"><div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"><dt className="text-sm font-semibold text-night">{option.label}</dt><dd className="shrink-0 text-sm font-semibold text-orange">+ {option.priceAmount.toLocaleString("fr-FR")} FCFA</dd></div><p className="mt-2 text-xs leading-6 text-muted">{option.description}{option.requiresConfirmation ? " Disponibilité à confirmer avec l’équipe." : ""}</p></div>)}<div className="py-4"><div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"><dt className="text-sm font-semibold text-night">Mise à jour du CV dans les 6 mois</dt><dd className="text-sm font-semibold text-orange">−50 % sur le CV Cleaning</dd></div><p className="mt-2 text-xs leading-6 text-muted">Pour les clients ayant déjà un CV réalisé par Carriova.</p></div></dl></div>
        <div className="rounded-2xl bg-paper p-6 sm:p-8"><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-orange">Le règlement</p><h2 className="mt-4 text-3xl font-semibold tracking-tight text-night">Vous validez.<br />Puis nous avançons.</h2><p className="mt-5 text-sm leading-7 text-muted">GeniusPay est le prestataire de paiement retenu. Les instructions de règlement sont communiquées après validation de la proposition dans votre espace client.</p><div className="mt-7 space-y-4"><div className="rounded-xl border border-line bg-white p-5"><p className="text-xs font-semibold text-muted">Jusqu’à 25 000 FCFA inclus</p><p className="mt-2 text-xl font-semibold text-night">100 % avant le démarrage</p></div><div className="rounded-xl border border-line bg-white p-5"><p className="text-xs font-semibold text-muted">Au-delà de 25 000 FCFA</p><p className="mt-2 text-xl font-semibold text-night">50 % au démarrage</p><p className="mt-1 text-sm text-muted">Puis 50 % à la livraison.</p></div></div><p className="mt-5 text-xs leading-7 text-muted">Envoyer une demande n’entraîne aucun débit et ne réserve pas automatiquement un créneau.</p><div className="mt-7 border-t border-night/15 pt-6"><h3 className="text-sm font-semibold text-night">Un coup de pouce se partage.</h3><p className="mt-3 text-xs leading-7 text-muted">Avec le parrainage, votre filleul bénéficie de 10 % de réduction et vous recevez 2 000 FCFA de remise sur votre prochaine prestation. Signalez le parrainage à l’équipe avant la validation de la proposition.</p></div></div>
      </div>
    </Section>

    <Section tone="paper" className="!py-14 md:!py-20">
      <div className="max-w-2xl"><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-orange">Entreprises & Écoles</p><h2 className="mt-4 font-editorial text-4xl italic leading-tight text-night sm:text-5xl">Faites avancer toute une promotion.<br />Ou toute une équipe.</h2><p className="mt-5 text-sm leading-7 text-muted">Ateliers collectifs et parcours adaptés aux étudiants, aux associations et aux salariés en transition.</p></div>
      <div className="mt-8 grid gap-5 lg:grid-cols-3">{organisations.map((offer) => <article key={offer.slug} className="flex min-w-0 flex-col rounded-xl border border-line bg-white p-6"><p className="text-xs leading-6 text-orange">{offer.audience}</p><h3 className="mt-3 text-xl font-semibold tracking-tight text-night">{offer.name}</h3><ul className="my-5 space-y-3">{offer.benefits.map((benefit) => <li key={benefit} className="flex items-start gap-2 text-xs leading-6 text-muted"><CareerIcon name="check" className="mt-1 h-4 w-4 shrink-0 text-orange" />{benefit}</li>)}</ul><p className="mt-auto border-t border-line pt-5 text-lg font-semibold text-night">{formatOfferPrice(offer)}</p></article>)}</div>
      <div className="mt-7"><ButtonLink href="/qualification?need=organisation" variant="orange" className="h-auto min-h-12 py-3 text-center">Demander un devis pour mon organisation <CareerIcon name="arrow" className="h-4 w-4 shrink-0" /></ButtonLink></div>
    </Section>

    <Section className="!py-14 md:!py-20"><div className="grid gap-10 md:grid-cols-[1fr_2fr] md:gap-14"><div><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-orange">Quelques réponses</p><h2 className="mt-4 font-editorial text-4xl italic leading-tight text-night">Avant de<br />vous lancer.</h2><p className="mt-5 text-sm leading-7 text-muted">Un besoin particulier ? Nous pouvons en parler.</p><Link href="/qualification" className="mt-4 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-night underline decoration-line underline-offset-4 hover:text-orange">Présenter ma situation <span aria-hidden="true">↗</span></Link></div><FaqList items={faqs} /></div></Section>
  </>;
}
