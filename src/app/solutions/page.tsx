import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { Badge, ButtonLink, Card, JsonLd, Section, SectionHeader } from "@/components/ui/primitives";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { ecosystemModules, solutions } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Solutions carrière et employabilité",
  description:
    "Découvrez l’écosystème CARRIOVA : CV professionnel, lettre de motivation, opportunités, matching, coaching et expertise humaine.",
  path: "/solutions",
  keywords: ["solutions carrière", "CV", "coaching", "emploi"],
});

export default function SolutionsPage() {
  const crumbs = [
    { href: "/", label: "Accueil" },
    { href: "/solutions", label: "Solutions" },
  ];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href })))} />
      <PageHero
        eyebrow="Solutions"
        title="Un écosystème, pas une collection d’outils."
        text="Profil, CV, lettre, opportunités, matching, candidatures, coaching et expertise humaine forment un parcours continu."
        primary={{ href: "/compte/creer", label: "Commencer maintenant" }}
        secondary={{ href: "/tarifs", label: "Voir les offres" }}
        crumbs={crumbs}
      />
      <Section>
        <div className="grid gap-5 md:grid-cols-3">
          {solutions.map((item) => (
            <Card key={item.slug} className="flex flex-col">
              <Badge>{item.audience}</Badge>
              <h2 className="mt-4 text-xl font-bold text-night">{item.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-6 text-muted">{item.short}</p>
              <ButtonLink href={item.href} className="mt-6" size="sm">
                {item.cta}
              </ButtonLink>
            </Card>
          ))}
        </div>
      </Section>
      <Section tone="paper">
        <SectionHeader
          eyebrow="Parcours"
          title="Your career journey in one ecosystem."
          text="Les modules ne sont pas isolés. Ils s’enchaînent du potentiel à la croissance."
        />
        <div className="mt-10 grid gap-4 md:grid-cols-4">
          {ecosystemModules.map((module) => (
            <Link key={module.n} href={module.href} className="rounded-3xl bg-white p-5 shadow-[0_12px_30px_rgba(0,18,82,0.06)]">
              <p className="text-xs font-semibold tracking-[0.16em] text-orange">{module.n}</p>
              <h3 className="mt-2 font-bold text-night">{module.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{module.text}</p>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
