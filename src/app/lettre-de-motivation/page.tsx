import { SeoLanding } from "@/components/seo/SeoLanding";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Lettre de motivation",
  description:
    "Comment rédiger une lettre de motivation professionnelle : structure, exemples de méthode, erreurs à éviter. CARRIOVA.",
  path: "/lettre-de-motivation",
  keywords: ["lettre de motivation", "exemple lettre de motivation"],
});

export default function Page() {
  return (
    <SeoLanding
      content={{
        path: "/lettre-de-motivation",
        eyebrow: "Lettre de motivation",
        title: "Rédiger une lettre de motivation qui ajoute quelque chose au CV.",
        text: "La lettre n’est pas un résumé. Elle relie une motivation, une preuve et une contribution possible à une opportunité précise.",
        primary: { href: "/solutions/lettre-de-motivation", label: "Créer ma lettre" },
        secondary: { href: "/solutions/cv", label: "Lier à mon CV" },
        sections: [
          {
            title: "Structure utile",
            text: "Contexte, pourquoi cette organisation, pourquoi vous, une preuve, la suite. Court, spécifique, lisible.",
          },
          {
            title: "Erreurs fréquentes",
            text: "Formules toutes faites, répétition du CV, flatterie vide, lettre identique pour vingt offres.",
          },
          {
            title: "Personnalisation réelle",
            text: "CARRIOVA part du profil et de l’offre. Sans offre, on clarifie la cible. Avec offre, on relie les preuves aux attendus.",
          },
          {
            title: "Exemples",
            text: "Nous ne publions pas de lettres copiables qui nuisent aux candidats. Nous expliquons une méthode réutilisable.",
          },
        ],
        related: [
          { href: "/solutions/lettre-de-motivation", label: "Solution lettre" },
          { href: "/emploi", label: "Offres" },
          { href: "/blog", label: "Articles" },
        ],
      }}
    />
  );
}
