import { PageHero } from "@/components/layout/PageHero";
import { Badge, ButtonLink, Card, JsonLd, Section } from "@/components/ui/primitives";
import { getPricingOffers } from "@/lib/queries";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { parseStringList } from "@/lib/security";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Tarifs",
  description:
    "Offres CARRIOVA : CV, lettre, audit, coaching et accompagnement expert. Les montants sont configurables et communiqués selon votre besoin.",
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
        eyebrow="Tarifs"
        title="Des offres claires. Des prix communiqués sans improvisation."
        text="Les montants se paramètrent dans l’administration CARRIOVA. Tant qu’un tarif n’est pas publié, l’offre reste sur devis."
        primary={{ href: "/contact", label: "Demander un devis" }}
        secondary={{ href: "/compte/creer", label: "Créer mon compte" }}
        crumbs={crumbs}
      />
      <Section>
        <div className="grid gap-5 md:grid-cols-3">
          {offers.map((offer) => {
            const benefits = parseStringList(offer.benefits);
            return (
              <Card key={offer.slug} className={offer.featured ? "border-bright ring-1 ring-bright/20" : ""}>
                {offer.featured ? <Badge>Recommandé</Badge> : <Badge tone="orange">{offer.category}</Badge>}
                <h2 className="mt-4 text-2xl font-bold text-night">{offer.name}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{offer.tagline}</p>
                <p className="mt-5 text-lg font-extrabold text-royal">
                  {offer.priceAmount
                    ? `${offer.priceAmount.toLocaleString("fr-FR")} ${offer.currency}`
                    : offer.priceLabel}
                </p>
                <ul className="mt-5 space-y-2 text-sm text-muted">
                  {benefits.map((item) => (
                    <li key={item}>→ {item}</li>
                  ))}
                </ul>
                <ButtonLink href={offer.ctaHref} className="mt-6" size="sm">
                  {offer.ctaLabel}
                </ButtonLink>
              </Card>
            );
          })}
        </div>
      </Section>
    </>
  );
}
