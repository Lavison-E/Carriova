import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/ui/primitives";
import { serverEnv } from "@/lib/env";
import { buildMetadata } from "@/lib/seo";
import { publicIntegrations } from "@/lib/site";

export const metadata = buildMetadata({
  title: "Politique de confidentialité",
  description: "Comment CARRIOVA collecte et utilise les données transmises via le site public.",
  path: "/legal/confidentialite",
});

export default function PrivacyPage() {
  // Liste générée depuis la configuration réelle : seuls les prestataires activés sont cités.
  const processors = [
    serverEnv.email.enabled ? "Resend (envoi des e-mails de confirmation et d’alerte)" : null,
    serverEnv.whatsappApi.enabled
      ? "Meta Platforms — WhatsApp Business (message de confirmation, uniquement avec votre accord)"
      : null,
    serverEnv.crm.enabled ? "l’outil CRM de CARRIOVA (suivi des demandes)" : null,
    publicIntegrations.plausibleDomain ? "Plausible Analytics (mesure d’audience sans cookie)" : null,
  ].filter((item): item is string => Boolean(item));

  return (
    <>
      <PageHero
        eyebrow="Légal"
        title="Politique de confidentialité"
        text="Ce texte décrit les pratiques du site public CARRIOVA. Il ne constitue pas un avis juridique."
        crumbs={[
          { href: "/", label: "Accueil" },
          { href: "/legal/confidentialite", label: "Confidentialité" },
        ]}
      />
      <Section>
        <div className="mx-auto max-w-3xl space-y-6 text-sm leading-7 text-muted">
          <p>
            CARRIOVA collecte les informations que vous transmettez volontairement : prénom, nom, e-mail,
            numéro WhatsApp, objectif professionnel et message. Ces données servent à traiter une
            demande ou une préinscription.{" "}
            {serverEnv.email.enabled
              ? "Un e-mail d’accusé de réception peut vous être envoyé après votre demande."
              : "L’envoi automatique d’e-mails n’est pas encore activé."}
          </p>
          <p>
            {processors.length > 0
              ? `Prestataires techniques actuellement activés : ${processors.join(" ; ")}.`
              : "Aucun prestataire tiers d’envoi de messages, de CRM ou de mesure d’audience n’est activé à ce jour."}
          </p>
          <p>
            Nous enregistrons aussi des événements d’usage agrégeables (page vue, clic CTA, envoi de
            formulaire) pour améliorer le site. Aucune donnée de paiement n’est collectée sur ce site
            public.
          </p>
          <p>
            Vous pouvez demander l’accès, la rectification ou la suppression des informations liées à
            votre e-mail en écrivant à{" "}
            <a className="text-bright underline" href={`mailto:${serverEnv.CONTACT_EMAIL}`}>
              {serverEnv.CONTACT_EMAIL}
            </a>
            . Les communications marketing peuvent être arrêtées à tout moment.
          </p>
          <p>
            Les données sont hébergées dans l’environnement technique du projet. Les durées de
            conservation et les transferts internationaux seront précisés lors de la mise en production
            de l’application authentifiée.
          </p>
        </div>
      </Section>
    </>
  );
}
