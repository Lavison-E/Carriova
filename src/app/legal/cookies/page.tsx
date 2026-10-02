import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/ui/primitives";
import { buildMetadata } from "@/lib/seo";
import { publicIntegrations } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Cookies",
  description: "Information sur les cookies et mesures d’audience du site CARRIOVA.",
  path: "/legal/cookies",
});

export default function CookiesPage() {
  return (
    <>
      <PageHero
        eyebrow="Légal"
        title="Cookies"
        text="Ce site privilégie des mesures d’audience non invasives. Une bannière de consentement avancée pourra être ajoutée selon les exigences du marché."
        crumbs={[
          { href: "/", label: "Accueil" },
          { href: "/legal/cookies", label: "Cookies" },
        ]}
      />
      <Section>
        <div className="mx-auto max-w-3xl space-y-6 text-sm leading-7 text-muted">
          <p>
            Les cookies strictement nécessaires au fonctionnement (session, sécurité, préférence de
            langue future) peuvent être utilisés. Les trackers marketing tiers ne sont pas activés par
            défaut sur cette version du site.
          </p>
          <p>
            Les événements de conversion (CTA, formulaires, création de compte) sont enregistrés côté
            serveur dans l’environnement CARRIOVA, sans profilage publicitaire.
          </p>
          <p>
            {publicIntegrations.plausibleDomain
              ? "La mesure d’audience Plausible Analytics est activée : elle n’utilise aucun cookie et ne collecte pas de données personnelles identifiantes."
              : "Aucun outil tiers de mesure d’audience n’est activé à ce jour."}
          </p>
        </div>
      </Section>
    </>
  );
}
