import { SeoLanding } from "@/components/seo/SeoLanding";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Recherche d’emploi",
  description:
    "Conseils pour chercher un emploi avec méthode : ciblage, CV, candidatures, entretiens. CARRIOVA Côte d’Ivoire et au-delà.",
  path: "/recherche-emploi",
  keywords: ["recherche d’emploi", "trouver un emploi", "candidature"],
});

export default function Page() {
  return (
    <SeoLanding
      content={{
        path: "/recherche-emploi",
        eyebrow: "Recherche d’emploi",
        title: "Chercher un emploi, ce n’est pas postuler partout.",
        text: "Cibler, adapter, relancer, préparer. CARRIOVA relie opportunités, CV, lettre et coaching dans un même parcours.",
        primary: { href: "/emploi", label: "Voir les opportunités" },
        secondary: { href: "/solutions/cv", label: "Préparer mon CV" },
        sections: [
          {
            title: "Cibler",
            text: "Métier, secteur, contrat, ville, modalité. Un ciblage pauvre produit une fatigue inutile.",
          },
          {
            title: "Adapter",
            text: "Chaque candidature sérieuse mérite un angle. Pas forcément un document entièrement nouveau, mais un choix conscient.",
          },
          {
            title: "Suivre",
            text: "L’espace CARRIOVA visera le suivi des demandes. En attendant, commencez par un compte et un profil clair.",
          },
          {
            title: "Préparer l’entretien",
            text: "Le coaching d’entretien structure vos preuves. Le matching aide à anticiper les écarts.",
          },
        ],
        related: [
          { href: "/emploi", label: "Offres" },
          { href: "/offres-emploi", label: "Offres d’emploi" },
          { href: "/solutions/matching", label: "Matching" },
        ],
      }}
    />
  );
}
