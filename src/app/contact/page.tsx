import { ContactForm } from "@/components/forms/LeadForms";
import { PageHero } from "@/components/layout/PageHero";
import { Card, JsonLd, Section } from "@/components/ui/primitives";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";
import { serverEnv } from "@/lib/env";
import { whatsappChatUrl } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Contact",
  description:
    "Contactez CARRIOVA pour un CV, une lettre, un coaching, une opportunité ou un projet recruteur. Formulaire avec consentement.",
  path: "/contact",
});

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ objet?: string }>;
}) {
  const { objet } = await searchParams;
  const whatsappUrl = whatsappChatUrl();
  const crumbs = [
    { href: "/", label: "Accueil" },
    { href: "/contact", label: "Contact" },
  ];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href })))} />
      <PageHero
        eyebrow="Contact"
        title="Parlez à l’équipe CARRIOVA."
        text="Décrivez votre besoin. Nous reviendrons vers vous. Aucune donnée n’est utilisée à des fins marketing sans consentement."
        crumbs={crumbs}
      />
      <Section>
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-3">
            <Card>
              <ContactForm defaultInterest={objet} />
            </Card>
          </div>
          <div className="md:col-span-2">
            <Card>
              <h2 className="text-lg font-bold text-night">Coordonnées</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                E-mail :{" "}
                <a className="text-bright" href={`mailto:${serverEnv.CONTACT_EMAIL}`}>
                  {serverEnv.CONTACT_EMAIL}
                </a>
              </p>
              {whatsappUrl ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex h-11 items-center justify-center rounded-full bg-bright px-5 text-sm font-semibold text-white transition-colors hover:bg-royal"
                >
                  Écrire sur WhatsApp
                </a>
              ) : null}
              <p className="mt-2 text-sm leading-6 text-muted">
                Marché initial : Côte d’Ivoire, avec une architecture prête pour l’Afrique de l’Ouest et
                l’international.
              </p>
              <p className="mt-6 text-xs text-muted">
                Les messages sont enregistrés comme prospects dans le système CARRIOVA, avec horodatage,
                source et page d’entrée.
              </p>
            </Card>
          </div>
        </div>
      </Section>
    </>
  );
}
