import { LoginForm } from "@/components/forms/LeadForms";
import { PageHero } from "@/components/layout/PageHero";
import { Card, JsonLd, Section } from "@/components/ui/primitives";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Se connecter",
  description: "Accédez à votre espace CARRIOVA.",
  path: "/compte/connexion",
  noindex: true,
});

export default function LoginPage() {
  const crumbs = [
    { href: "/", label: "Accueil" },
    { href: "/compte/connexion", label: "Se connecter" },
  ];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href })))} />
      <PageHero
        eyebrow="Compte"
        title="Se connecter à CARRIOVA."
        text="Indiquez l’e-mail de votre compte. L’espace authentifié s’ouvrira progressivement pour vos documents et demandes."
        crumbs={crumbs}
      />
      <Section>
        <div className="mx-auto max-w-xl">
          <Card>
            <LoginForm />
            <p className="mt-4 text-sm text-muted">
              Pas encore de compte ?{" "}
              <a className="font-semibold text-bright" href="/compte/creer">
                Créer mon compte
              </a>
            </p>
          </Card>
        </div>
      </Section>
    </>
  );
}
