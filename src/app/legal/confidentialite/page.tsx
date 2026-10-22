import { PageHero } from "@/components/layout/PageHero";
import { Section } from "@/components/ui/primitives";
import { privacyPolicy, type PrivacyBlock } from "@/lib/editorial";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Politique de confidentialité",
  description: "Politique de confidentialité de Carriova et compléments sur les comptes clients, WhatsApp, le profil carrière, les documents privés et le Studio CV avec son assistance IA facultative.",
  path: "/legal/confidentialite",
});

function PrivacyText({ text }: { text: string }) {
  return text.split(/(contact@carriovaci\.com|https:\/\/carriovaci\.com)/g).map((part, index) => {
    if (part === "contact@carriovaci.com") return <a key={index} className="font-medium text-night underline underline-offset-4 hover:text-[#bd470d]" href="mailto:contact@carriovaci.com">{part}</a>;
    if (part === "https://carriovaci.com") return <a key={index} className="font-medium text-night underline underline-offset-4 hover:text-[#bd470d]" href="https://carriovaci.com">{part}</a>;
    return part;
  });
}

function PolicyBlock({ block }: { block: PrivacyBlock }) {
  if (block.type === "list") return <ul className="list-disc space-y-3 pl-5 marker:text-[#bd470d]">{block.items.map((item, index) => <li key={index}><PrivacyText text={item} /></li>)}</ul>;
  if (block.type === "subheading") return <h3 className="pt-3 text-lg font-semibold text-night">{block.text}</h3>;
  return <p><PrivacyText text={block.text} /></p>;
}

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Confidentialité"
        title={privacyPolicy.title}
        text={privacyPolicy.tagline}
        crumbs={[{ href: "/", label: "Accueil" }, { href: "/legal/confidentialite", label: "Confidentialité" }]}
      />
      <Section>
        <div className="mb-12 flex flex-col items-start gap-5 border-b border-night/15 pb-8 md:flex-row md:items-center md:justify-between">
          <p className="text-sm font-semibold text-night">{privacyPolicy.updated}</p>
          <a href={privacyPolicy.downloadHref} download className="inline-flex min-h-12 items-center justify-center gap-3 rounded-lg bg-night px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-royal">Télécharger le document original <span className="text-xs text-white/70">PDF · 11 pages</span><span aria-hidden="true">↓</span></a>
        </div>
        <section aria-labelledby="espace-confidentialite" className="mb-12 rounded-xl border border-night/15 bg-[#f7f5ef] p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#bd470d]">Complément du 18 octobre 2026</p>
          <h2 id="espace-confidentialite" className="mt-3 text-2xl font-semibold leading-snug text-night">Votre compte et votre espace client</h2>
          <div className="mt-5 max-w-3xl space-y-4 text-sm leading-7 text-muted">
            <p>Les comptes clients et l’espace de suivi sont désormais proposés sur Carriova. Ce complément décrit leur fonctionnement actuel. Le texte historique ci-dessous et le PDF original restent inchangés.</p>
            <p>La création d’un compte enregistre votre nom, votre adresse e-mail, vos choix de consentement et une empreinte cryptographique de votre mot de passe. Le mot de passe n’est pas enregistré en clair. Un cookie de connexion permet de maintenir votre session pendant 7 jours au maximum. La déconnexion met fin à la session utilisée ; le changement ou la réinitialisation du mot de passe révoque les sessions précédentes.</p>
            <p>Vos demandes de prestations, propositions, messages, documents et livraisons sont conservés dans la base de données du service. Ils sont accessibles depuis votre compte et par les membres autorisés de l’équipe Carriova pour traiter votre demande. Les autres clients n’y ont pas accès. Les fichiers de livraison deviennent accessibles dans votre espace lorsque l’équipe publie la livraison.</p>
            <p>Une qualification envoyée avant la connexion peut être rattachée à votre compte depuis le même navigateur grâce à un cookie temporaire valable 7 jours. Ce rattachement utilise un jeton confidentiel ; il ne repose pas sur une simple correspondance d’adresse e-mail.</p>
            <p>Les nouveaux comptes peuvent recevoir un message de bienvenue et des notifications sur leurs demandes, propositions, messages et livraisons par Resend. Ces notifications transmettent l’adresse destinataire et un lien vers le suivi authentifié ; elles n’incluent pas le texte de vos échanges privés ni vos pièces jointes.</p>
            <p>Lorsque la récupération par e-mail est configurée, un message est envoyé à l’adresse de votre compte par le service d’envoi Resend. Ce service reçoit l’adresse destinataire et le message de récupération. Le lien permet de choisir un nouveau mot de passe pendant 30 minutes et ne peut être utilisé qu’une fois. Si cette fonction est indisponible, vous pouvez contacter l’équipe.</p>
            <p>Pour une question sur vos données ou une demande de suppression, écrivez à <a className="font-medium text-night underline underline-offset-4 hover:text-[#bd470d]" href="mailto:contact@carriovaci.com">contact@carriovaci.com</a>.</p>
          </div>
        </section>
        <section aria-labelledby="studio-cv-confidentialite" className="mb-12 rounded-xl border border-night/15 bg-[#f7f5ef] p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#bd470d]">Complément du 18 octobre 2026</p>
          <h2 id="studio-cv-confidentialite" className="mt-3 text-2xl font-semibold leading-snug text-night">Studio CV et assistance facultative par IA</h2>
          <div className="mt-5 max-w-3xl space-y-4 text-sm leading-7 text-muted">
            <p>Le Studio CV permet de préparer, d’enregistrer et de télécharger un CV dans votre espace. Les CV enregistrés sont associés à votre compte et conservés dans la base de données du service. Vous pouvez utiliser l’éditeur et le téléchargement PDF sans demander d’aide à l’intelligence artificielle.</p>
            <p>Lorsque vous demandez une aide IA après avoir donné votre accord, Carriova transmet au prestataire Groq les éléments professionnels utiles à cette demande, notamment votre objectif, votre parcours, vos compétences et les consignes que vous saisissez. Les champs d’identité et de coordonnées sont exclus de cette requête. Le texte libre peut toutefois contenir des informations personnelles que vous y avez ajoutées : évitez d’y placer des coordonnées ou des informations sensibles inutiles.</p>
            <p>Groq traite ces éléments pour produire une proposition de rédaction. Ses conditions prévoient certaines conservations de contenus pour la fiabilité du service ou la recherche d’abus, et des données peuvent être conservées aux États-Unis. Les conditions et réglages de ce prestataire déterminent cette conservation ; Carriova ne promet pas une absence totale de conservation chez Groq. Consultez les <a className="font-medium text-night underline underline-offset-4 hover:text-[#bd470d]" href="https://console.groq.com/docs/your-data">informations de Groq sur le traitement des données</a>.</p>
            <p>Les propositions de l’IA peuvent comporter des erreurs. Relisez-les et vérifiez les faits avant de les appliquer à votre CV. Cette assistance ne constitue pas une décision de recrutement et n’envoie pas votre CV à un employeur.</p>
          </div>
        </section>
        <section aria-labelledby="profil-carriere-confidentialite" className="mb-12 scroll-mt-28 rounded-xl border border-night/15 bg-[#f7f5ef] p-6 md:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#bd470d]">Complément du 22 octobre 2026</p>
          <h2 id="profil-carriere-confidentialite" className="mt-3 text-2xl font-semibold leading-snug text-night">Votre profil carrière et les offres proposées</h2>
          <div className="mt-5 max-w-3xl space-y-4 text-sm leading-7 text-muted">
            <p>Depuis le 22 octobre 2026, la création d’un compte demande aussi un numéro WhatsApp. Il sert aux échanges opérationnels liés à votre accompagnement et peut être modifié dans Mon compte. Les comptes existants restent accessibles sans numéro. Son enregistrement ne vaut pas consentement aux messages marketing.</p>
            <p>Votre profil carrière conserve dans votre compte les métiers recherchés, compétences, expériences déclarées, préférences de pays, de contrat et de travail, ainsi que les autres renseignements professionnels que vous choisissez d’enregistrer et le lien vers un CV de votre espace. Vous pouvez modifier ces informations depuis votre profil.</p>
            <p>Carriova compare localement vos métiers, compétences, niveau d’expérience et préférences aux informations des offres officielles de son catalogue. Ce rapprochement utilise des règles explicables, sans envoyer votre profil à un prestataire IA ni aux recruteurs. Les renseignements d’identité, le pays de résidence et le contenu du CV associé ne servent pas à ce classement. Il ne mesure pas une probabilité d’embauche et ne déclenche aucune candidature automatique ; vous consultez l’annonce officielle et décidez vous-même de la suite.</p>
          </div>
        </section>
        <div className="grid items-start gap-12 lg:grid-cols-[17rem_minmax(0,1fr)] lg:gap-16">
          <nav aria-label="Sommaire de la politique de confidentialité" className="rounded-xl border border-night/15 bg-[#f7f5ef] p-5 lg:sticky lg:top-28">
            <details>
              <summary className="cursor-pointer text-sm font-semibold text-night">Consulter le sommaire</summary>
              <ol className="mt-5 max-h-[65vh] space-y-3 overflow-y-auto pr-2">
                {privacyPolicy.sections.map((section) => <li key={section.number}><a href={`#section-${section.number}`} className="flex gap-3 text-xs leading-6 text-muted hover:text-[#bd470d]"><span className="font-semibold tabular-nums text-[#bd470d]">{section.number}.</span><span>{section.title}</span></a></li>)}
              </ol>
            </details>
          </nav>
          <article className="min-w-0 max-w-3xl">
            {privacyPolicy.sections.map((section) => (
              <section key={section.number} id={`section-${section.number}`} className="scroll-mt-28 border-t border-night/15 py-9 first:border-t-0 first:pt-0">
                <p aria-hidden="true" className="mb-3 text-xs font-semibold tabular-nums text-[#bd470d]">{String(section.number).padStart(2, "0")}</p>
                <h2 className="text-2xl font-semibold leading-snug tracking-tight text-night"><span className="sr-only">{section.number}. </span>{section.title}</h2>
                <div className="mt-6 space-y-5 text-sm leading-7 text-muted">{section.blocks.map((block, index) => <PolicyBlock key={index} block={block} />)}</div>
              </section>
            ))}
          </article>
        </div>
      </Section>
    </>
  );
}
