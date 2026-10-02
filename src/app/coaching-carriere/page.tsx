import { SeoLanding } from "@/components/seo/SeoLanding";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Coaching carrière",
  description:
    "Coaching carrière et accompagnement professionnel : orientation, employabilité, entretien, bilan et progression. CARRIOVA.",
  path: "/coaching-carriere",
  keywords: ["coaching carrière", "accompagnement professionnel", "bilan professionnel"],
});

export default function Page() {
  return (
    <SeoLanding
      content={{
        path: "/coaching-carriere",
        eyebrow: "Coaching carrière",
        title: "Un coaching carrière pour décider, pas pour collectionner les conseils.",
        text: "Orientation, employabilité, entretien, positionnement, progression : chaque séance a un objet. Les créneaux suivent les disponibilités.",
        primary: { href: "/solutions/coaching", label: "Réserver une séance" },
        secondary: { href: "/conseils-carriere", label: "Conseils carrière" },
        sections: [
          {
            title: "Quand c’est utile",
            text: "Projet flou, mobilité, reconversion, préparation d’entretien, prise de responsabilité.",
          },
          {
            title: "Ce que ce n’est pas",
            text: "Ni un discours miracle, ni un remplacement d’un CV, ni une garantie d’embauche.",
          },
          {
            title: "Lien avec l’écosystème",
            text: "Le coaching peut déboucher sur un CV, une lettre, une stratégie d’opportunités ou une relecture experte.",
          },
          {
            title: "Format",
            text: "Demande en ligne, confirmation selon disponibilités, suivi possible par ressources.",
          },
        ],
        related: [
          { href: "/solutions/coaching", label: "Solution coaching" },
          { href: "/solutions/expertise", label: "Expertise" },
          { href: "/faq", label: "FAQ" },
        ],
      }}
    />
  );
}
