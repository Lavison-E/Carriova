import { SeoLanding } from "@/components/seo/SeoLanding";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "CV professionnel",
  description:
    "Comment concevoir un CV professionnel : positionnement, preuves, compétences et lecture recruteur. Méthode CARRIOVA.",
  path: "/cv-professionnel",
  keywords: ["CV professionnel", "modèle CV", "CV ATS"],
});

export default function Page() {
  return (
    <SeoLanding
      content={{
        path: "/cv-professionnel",
        eyebrow: "CV professionnel",
        title: "Un CV professionnel commence par un positionnement, pas par un modèle.",
        text: "Le document doit rendre votre parcours lisible pour un recruteur pressé : titre, preuves, compétences, cohérence avec le poste visé.",
        primary: { href: "/solutions/cv", label: "Créer mon CV" },
        secondary: { href: "/conseils-cv", label: "Lire les conseils CV" },
        sections: [
          {
            title: "Ce qu’un recruteur scanne",
            text: "Un titre clair, un résumé utile, des réalisations plutôt que des tâches, des compétences réellement mobilisées, une forme lisible.",
          },
          {
            title: "ATS et lecture humaine",
            text: "Un CV doit rester lisible par un humain. La compatibilité ATS est un critère, pas une religion. Évitez les colonnes illisibles et les graphiques vides.",
          },
          {
            title: "Preuves et chiffres",
            text: "Lorsque vous avez des données, quantifiez. Lorsque vous n’en avez pas, décrivez l’impact avec honnêteté : périmètre, résultat, apprentissage.",
          },
          {
            title: "Adapter sans se trahir",
            text: "Un CV professionnel peut être décliné selon une offre, sans inventer d’expérience. CARRIOVA aide à choisir l’angle, pas à falsifier.",
          },
        ],
        related: [
          { href: "/solutions/cv", label: "Solution CV" },
          { href: "/cv-etudiant", label: "CV étudiant" },
          { href: "/cv-sans-experience", label: "CV sans expérience" },
          { href: "/blog", label: "Articles CV" },
        ],
      }}
    />
  );
}
