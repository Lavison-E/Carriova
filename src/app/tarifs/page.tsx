import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { ButtonLink, JsonLd, Section } from "@/components/ui/primitives";
import { getPricingOffers } from "@/lib/queries";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { parseStringList } from "@/lib/security";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Tarifs",
  description:
    "CV, lettre, audit et coaching : découvrez les offres CARRIOVA ou demandez un devis adapté à votre projet professionnel.",
  path: "/tarifs",
});

export default async function PricingPage() {
  const offers = await getPricingOffers();
  const crumbs = [
    { href: "/", label: "Accueil" },
    { href: "/tarifs", label: "Tarifs" },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href })))} />
      <PageHero
        eyebrow="Tarifs & accompagnements"
        title="Un accompagnement à votre mesure."
        text="Votre besoin détermine le bon accompagnement. Découvrez nos offres ou parlons de votre projet pour établir un devis : vous connaîtrez le contenu et le tarif avant de vous engager."
        primary={{ href: "/contact", label: "Demander un devis" }}
        secondary={{ href: "/solutions", label: "Explorer les solutions" }}
        crumbs={crumbs}
      />
      <Section>
        {offers.length > 0 ? (
          <>
            <div className="mb-10 max-w-2xl">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#bd470d]">Les offres CARRIOVA</p>
              <h2 className="font-editorial mt-4 text-4xl font-normal italic leading-tight text-night md:text-5xl">Choisissez votre prochain pas.</h2>
            </div>
            <div className="border-b border-night/20">
              {offers.map((offer) => {
                const benefits = parseStringList(offer.benefits);
                const price = offer.priceAmount !== null
                  ? `${offer.priceAmount.toLocaleString("fr-FR")} ${offer.currency ?? "XOF"}`
                  : offer.priceLabel;
                return (
                  <article key={offer.slug} className="grid items-start gap-7 border-t border-night/20 py-10 md:grid-cols-12 md:gap-8">
                    <div className="md:col-span-4">
                      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-[#bd470d]">{offer.category}{offer.featured ? " · Recommandé" : ""}</p>
                      <h3 className="mt-4 text-2xl font-semibold tracking-tight text-night">{offer.name}</h3>
                      {offer.tagline ? <p className="mt-4 text-sm leading-7 text-muted">{offer.tagline}</p> : null}
                    </div>
                    <ul className="space-y-4 md:col-span-5 md:pt-1">
                      {benefits.map((item) => (
                        <li key={item} className="flex items-start gap-3 text-sm leading-6 text-muted">
                          <span aria-hidden="true" className="text-[#bd470d]">✓</span>{item}
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-night/10 pt-6 md:col-span-3 md:border-t-0 md:pt-0">
                      <p className="text-2xl font-semibold tracking-tight text-night">{price}</p>
                      <ButtonLink href={offer.ctaHref} className="mt-6" variant={offer.featured ? "orange" : "primary"} size="md">{offer.ctaLabel}</ButtonLink>
                    </div>
                  </article>
                );
              })}
            </div>
            <p className="mt-8 text-sm leading-7 text-muted">Un besoin particulier ou plusieurs objectifs à combiner ? <Link href="/contact" className="font-semibold text-night underline decoration-night/30 underline-offset-4 hover:text-[#bd470d]">Parlons de votre projet.</Link></p>
          </>
        ) : (
          <div className="grid items-start gap-10 md:grid-cols-12 lg:gap-20">
            <div className="md:col-span-7">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#bd470d]">Un projet, une proposition</p>
              <h2 className="font-editorial mt-5 max-w-xl text-5xl font-normal italic leading-[1.1] text-night">Commençons<br />par votre besoin.</h2>
              <p className="mt-6 max-w-lg text-base leading-8 text-muted">CV, lettre de motivation, relecture ou coaching : notre équipe vous aide à préciser l’accompagnement qui vous sera utile.</p>
              <p className="mt-4 max-w-lg text-sm leading-7 text-muted">Contactez-nous pour recevoir une proposition personnalisée, avec le contenu de l’accompagnement et son tarif.</p>
              <ButtonLink href="/contact" variant="orange" size="lg" className="mt-8">Parler de mon projet<span aria-hidden="true">↗</span></ButtonLink>
            </div>
            <div className="rounded-xl bg-night p-7 text-white md:col-span-5 sm:p-9">
              <h3 className="text-xl font-semibold">Préparons notre échange.</h3>
              <p className="mt-4 text-sm leading-7 text-white/70">Quelques repères nous aideront à vous orienter :</p>
              <ol className="mt-7 divide-y divide-white/20">
                {[
                  { title: "Votre objectif", text: "Le poste, l’évolution ou la candidature que vous préparez." },
                  { title: "Votre point de départ", text: "Votre situation et les documents dont vous disposez déjà." },
                  { title: "Votre échéance", text: "Le moment où vous souhaitez être prêt à avancer." },
                ].map((item, index) => (
                  <li key={item.title} className="flex gap-4 py-5 first:pt-0">
                    <span aria-hidden="true" className="pt-0.5 text-xs text-[#edb294]">0{index + 1}</span>
                    <div><p className="text-sm font-semibold">{item.title}</p><p className="mt-1 text-xs leading-6 text-white/70">{item.text}</p></div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        )}
      </Section>
    </>
  );
}
