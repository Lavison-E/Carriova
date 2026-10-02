import { PageHero } from "@/components/layout/PageHero";
import { FaqList, JsonLd, Section } from "@/components/ui/primitives";
import { getFaqs } from "@/lib/queries";
import { breadcrumbJsonLd, buildMetadata, faqJsonLd } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "FAQ",
  description:
    "Questions fréquentes sur CARRIOVA : CV, lettres, coaching, comptes, documents et contact expert.",
  path: "/faq",
});

export default async function FaqPage() {
  const items = await getFaqs("global");
  const crumbs = [
    { href: "/", label: "Accueil" },
    { href: "/faq", label: "FAQ" },
  ];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href })))} />
      {items.length ? <JsonLd data={faqJsonLd(items)} /> : null}
      <PageHero
        eyebrow="FAQ"
        title="Ce que l’on nous demande le plus souvent."
        text="Des réponses sobres, éditables, sans statistiques inventées."
        crumbs={crumbs}
      />
      <Section>
        <FaqList items={items} />
      </Section>
    </>
  );
}
