import { AccountForm } from "@/components/forms/LeadForms";
import { PageHero } from "@/components/layout/PageHero";
import { Card, JsonLd, Section } from "@/components/ui/primitives";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Créer mon compte",
  description:
    "Créez votre compte CARRIOVA pour accéder progressivement à vos CV, lettres, demandes et opportunités.",
  path: "/compte/creer",
  noindex: true,
});

export default function CreateAccountPage() {
  const crumbs = [
    { href: "/", label: "Accueil" },
    { href: "/compte/creer", label: "Créer mon compte" },
  ];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href })))} />
      <PageHero
        eyebrow="Compte"
        title="Créer mon espace CARRIOVA."
        text="Le site public explique et convertit. L’espace utilisateur accueillera CV, lettres, demandes, rendez-vous, opportunités et préférences de communication."
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
