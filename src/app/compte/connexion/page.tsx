
import { PageHero } from "@/components/layout/PageHero";
import { ButtonLink, Card, JsonLd, Section } from "@/components/ui/primitives";
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
        text="Votre espace personnel est en préparation. En attendant, notre équipe peut vous accompagner pour votre CV, vos candidatures et votre projet professionnel."
        crumbs={crumbs}
      />
      <Section>
        <div className="mx-auto max-w-xl">
          <Card>
            <h2 className="text-xl font-bold text-night">Besoin de retrouver une demande ?</h2>
            <p className="mt-3 text-sm leading-6 text-muted">Contactez notre équipe avec l’adresse e-mail utilisée lors de votre inscription. Nous vous aiderons à faire le point sur votre accompagnement.</p>
            <ButtonLink href="/contact" className="mt-5">Contacter l’équipe</ButtonLink>
            <p className="mt-4 text-sm text-muted">
              Pas encore de compte ?{" "}
              <a className="font-semibold text-bright" href="/compte/creer">
                Préparer mon espace
              </a>
            </p>
          </Card>
        </div>
      </Section>
    </>
  );
}
