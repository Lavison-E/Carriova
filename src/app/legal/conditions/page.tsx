import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/ui/primitives";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Conditions d’utilisation",
  description: "Conditions d’utilisation du site public CARRIOVA.",
  path: "/legal/conditions",
});

export default function TermsPage() {
  return (
    <>
      <PageHero
        eyebrow="Légal"
        title="Conditions d’utilisation"
        text="Le site public présente l’écosystème CARRIOVA et collecte des demandes. Il n’est pas l’application authentifiée."
        crumbs={[
          { href: "/", label: "Accueil" },
          { href: "/legal/conditions", label: "Conditions" },
        ]}
      />
      <Section>
        <div className="mx-auto max-w-3xl space-y-6 text-sm leading-7 text-muted">
          <p>
            En utilisant ce site, vous acceptez de fournir des informations exactes dans les formulaires
            et de ne pas détourner les services. Les contenus éditoriaux sont la propriété de CARRIOVA.
          </p>
          <p>
            Les pages d’offres d’emploi décrivent des opportunités publiées dans la base CARRIOVA. Elles
            ne constituent pas une offre d’embauche de CARRIOVA, sauf mention contraire.
          </p>
          <p>
            Les tarifs affichés comme « sur devis » n’engagent pas un prix. Un devis ou un contrat
            distinct encadrera toute prestation payante.
          </p>
        </div>
      </Section>
    </>
  );
}
