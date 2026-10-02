import { SeoLanding } from "@/components/seo/SeoLanding";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "CV sans expérience",
  description:
    "Comment faire un CV sans expérience salariée : transferts de compétences, projets, bénévolat, apprentissages. Méthode CARRIOVA.",
  path: "/cv-sans-experience",
  keywords: ["CV sans expérience", "premier emploi"],
});

export default function Page() {
  return (
    <SeoLanding
      content={{
        path: "/cv-sans-experience",
        eyebrow: "CV sans expérience",
        title: "Sans expérience salariée, il reste des preuves.",
        text: "Stages informels, projets, aide familiale, vente, associatif, contenus, langues : le travail consiste à les nommer proprement.",
        primary: { href: "/solutions/cv", label: "Créer mon CV" },
        secondary: { href: "/solutions/coaching", label: "Se faire accompagner" },
        sections: [
          {
            title: "Ne pas mentir",
            text: "Un CV sans expérience ne se sauve pas par l’invention. Il se sauve par la précision et le transfert de compétences.",
          },
          {
            title: "Compétences transférables",
            text: "Organisation, relation client, outils numériques, langues, fiabilité : montrez-les à travers des situations concrètes.",
          },
          {
            title: "Un objectif net",
            text: "Le recruteur doit comprendre ce que vous visez. Un objectif flou affaiblit même un bon potentiel.",
          },
          {
            title: "Ensuite, la candidature",
            text: "Lettre, matching et préparation d’entretien deviennent décisifs lorsque le parcours est encore court.",
          },
        ],
        related: [
          { href: "/cv-etudiant", label: "CV étudiant" },
          { href: "/solutions/lettre-de-motivation", label: "Lettre" },
          { href: "/solutions/coaching", label: "Coaching" },
        ],
      }}
    />
  );
}
