import Image from "next/image";
import { PageHero } from "@/components/layout/PageHero";
import { ButtonLink, Card, JsonLd, Section, SectionHeader } from "@/components/ui/primitives";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { journeySteps, whyPoints } from "@/lib/site";

export const metadata = buildMetadata({
  title: "À propos de CARRIOVA",
  description:
    "CARRIOVA est une plateforme digitale de carrière et d’employabilité. Potentiel, direction, opportunité, candidature, progression.",
  path: "/a-propos",
});

export default function AboutPage() {
  const crumbs = [
    { href: "/", label: "Accueil" },
    { href: "/a-propos", label: "À propos" },
  ];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href })))} />
      <PageHero
        eyebrow="À propos"
        title="CARRIOVA accompagne le potentiel jusqu’à la progression."
        text="Nous concevons un écosystème de carrière : comprendre un profil, le positionner, produire des candidatures convaincantes, relier aux opportunités et faire intervenir l’humain lorsque c’est nécessaire."
        primary={{ href: "/compte/creer", label: "Commencer maintenant" }}
        secondary={{ href: "/contact", label: "Nous écrire" }}
        crumbs={crumbs}
      />
      <Section>
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <SectionHeader
              eyebrow="Promesse"
              title="Révélez votre potentiel. Boostez votre carrière."
              text="CARRIOVA n’est pas un générateur de CV, ni un job board, ni un chatbot, ni un site de coaching générique. C’est une plateforme d’employabilité qui relie méthode, technologie et expertise."
            />
          </div>
          <div className="overflow-hidden rounded-[2rem]">
            <Image
              src="/images/young-professional.jpg"
              alt="Professionnel regardant vers l’avenir, métaphore de la promesse CARRIOVA"
              width={900}
              height={700}
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </Section>
      <Section tone="paper">
        <SectionHeader eyebrow="Parcours" title="Le voyage que nous concevons." />
        <div className="mt-8 grid gap-4 md:grid-cols-6">
          {journeySteps.map((step) => (
            <Card key={step.key}>
              <p className="font-bold text-night">{step.label}</p>
            </Card>
          ))}
        </div>
      </Section>
      <Section>
        <SectionHeader eyebrow="Principe" title="Ce qui nous distingue." />
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {whyPoints.map((item) => (
            <Card key={item.title}>
              <h2 className="text-lg font-bold text-night">{item.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{item.text}</p>
            </Card>
          ))}
        </div>
        <div className="mt-10">
          <ButtonLink href="/solutions">Découvrir nos solutions</ButtonLink>
        </div>
      </Section>
    </>
  );
}
