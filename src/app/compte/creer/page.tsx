import { AccountForm } from "@/components/forms/LeadForms";
import { PageHero } from "@/components/layout/PageHero";
import { Card, JsonLd, Section } from "@/components/ui/primitives";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Préparer mon espace",
  description:
    "Inscrivez votre demande auprès de CARRIOVA et indiquez votre priorité : CV, candidature, emploi ou coaching.",
  path: "/compte/creer",
  noindex: true,
});

export default function CreateAccountPage() {
  const crumbs = [
    { href: "/", label: "Accueil" },
    { href: "/compte/creer", label: "Préparer mon espace" },
  ];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href })))} />
      <PageHero
        eyebrow="Compte"
        title="Votre prochain chapitre commence ici."
        text="Présentez-nous votre besoin pour préparer votre accompagnement. Cette inscription enregistre votre demande ; l’espace personnel et la connexion sécurisée sont en préparation."
        crumbs={crumbs}
      />
      <Section>
        <div className="mx-auto max-w-xl">
          <Card>
            <AccountForm />
            <p className="mt-4 text-sm text-muted">
              Déjà inscrit ?{" "}
              <a className="font-semibold text-bright" href="/compte/connexion">
                Se connecter
              </a>
            </p>
          </Card>
        </div>
      </Section>
    </>
  );
}
