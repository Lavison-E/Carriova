import { SeoLanding } from "@/components/seo/SeoLanding";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "CV étudiant",
  description:
    "Créer un premier CV étudiant : projets, stages, compétences, engagements. Guidance CARRIOVA pour l’entrée sur le marché.",
  path: "/cv-etudiant",
  keywords: ["CV étudiant", "premier CV", "stage"],
});

export default function Page() {
  return (
    <SeoLanding
      content={{
        path: "/cv-etudiant",
        eyebrow: "CV étudiant",
        title: "Un premier CV n’a pas besoin d’inventer dix ans d’expérience.",
        text: "Projets, cours appliqués, stages, engagements associatifs, langues et outils : il s’agit de rendre visible un potentiel déjà là.",
        primary: { href: "/solutions/cv", label: "Créer mon CV" },
        secondary: { href: "/solutions/coaching", label: "Orientation" },
        sections: [
          {
            title: "Ce qui compte vraiment",
            text: "La clarté du projet, les preuves d’apprentissage, la capacité à travailler en équipe, et un discours cohérent avec le stage ou le premier poste visé.",
          },
          {
            title: "Projets et engagements",
            text: "Un projet académique bien raconté vaut mieux qu’une liste de logiciels. Dites le problème, votre rôle, le résultat.",
          },
          {
            title: "Direction",
            text: "Le CV étudiant gagne à être relié à une orientation : métier visé, secteur, type de stage. Le coaching CARRIOVA peut aider à trancher.",
          },
          {
            title: "Marché ivoirien et au-delà",
            text: "Adaptez exemples et ton au marché visé : Abidjan, Afrique de l’Ouest, ou mobilité internationale.",
          },
        ],
        related: [
          { href: "/solutions/cv", label: "Solution CV" },
          { href: "/cv-sans-experience", label: "CV sans expérience" },
          { href: "/emploi", label: "Opportunités" },
        ],
      }}
    />
  );
}
