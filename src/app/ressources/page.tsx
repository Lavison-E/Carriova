import { ResourceLeadForm } from "@/components/forms/LeadForms";
import { PageHero } from "@/components/layout/PageHero";
import { ButtonLink, Card, JsonLd, Section, SectionHeader } from "@/components/ui/primitives";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Ressources carrière",
  description:
    "Blog, guides, conseils CV et ressources CARRIOVA pour progresser dans votre carrière, avec consentement.",
  path: "/ressources",
});

const resources = [
  { href: "/blog", title: "Blog", text: "Articles d’intention : CV, emploi, lettre, coaching." },
  { href: "/guides", title: "Guides", text: "Parcours pas à pas pour construire vos livrables." },
  { href: "/conseils-carriere", title: "Conseils carrière", text: "Direction, reconversion, employabilité." },
  { href: "/faq", title: "FAQ", text: "Les réponses aux questions les plus fréquentes." },
  { href: "/conseils-cv", title: "Conseils CV", text: "Méthode pour un CV lisible et utile." },
  { href: "/lettre-de-motivation", title: "Lettre de motivation", text: "Pages et contenus dédiés à la lettre." },
];

export default function ResourcesPage() {
  const crumbs = [
    { href: "/", label: "Accueil" },
    { href: "/ressources", label: "Ressources" },
  ];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href })))} />
      <PageHero
        eyebrow="Ressources"
        title="Apprendre, puis agir."
        text="Un hub éditorial pour comprendre, puis un chemin clair vers CV, lettre, emploi ou coaching."
        crumbs={crumbs}
      />
      <Section>
        <div className="grid gap-5 md:grid-cols-3">
          {resources.map((item) => (
            <Card key={item.href}>
              <h2 className="text-xl font-bold text-night">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{item.text}</p>
              <ButtonLink href={item.href} size="sm" className="mt-5">
                Ouvrir
              </ButtonLink>
            </Card>
          ))}
        </div>
      </Section>
      <Section tone="paper">
        <div className="grid gap-10 md:grid-cols-2">
          <SectionHeader
            eyebrow="Guide"
            title="Recevoir un guide CV"
            text="Laissez votre prénom et votre e-mail. Nous vous enverrons une ressource utile, uniquement avec votre consentement."
          />
          <Card>
            <ResourceLeadForm resource="guide-cv" />
          </Card>
        </div>
      </Section>
    </>
  );
}
