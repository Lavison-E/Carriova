import { SeoLanding } from "@/components/seo/SeoLanding";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "CV international",
  description:
    "CV international et mobilité professionnelle : adapter format, preuves et discours au marché visé, avec CARRIOVA.",
  path: "/cv-international",
  keywords: ["CV international", "mobilité", "diaspora"],
});

export default function Page() {
  return (
    <SeoLanding
      content={{
        path: "/cv-international",
        eyebrow: "CV international",
        title: "Un CV international traduit un parcours d’un marché à un autre.",
        text: "Format, titre, preuves, langues et attentes culturelles changent. L’enjeu n’est pas de tout copier : c’est de rester vrai et lisible.",
        primary: { href: "/solutions/cv", label: "Créer mon CV" },
        secondary: { href: "/solutions/expertise", label: "Demander une relecture" },
        sections: [
          {
            title: "Diaspora et mobilité",
            text: "CARRIOVA s’adresse aussi aux profils qui visent plusieurs marchés : Côte d’Ivoire, Afrique de l’Ouest, Europe, ailleurs.",
          },
          {
            title: "Ce qui change",
            text: "Longueur, photo, titre, niveau de détail, références : les conventions varient. Une relecture experte évite les malentendus.",
          },
          {
            title: "Ce qui ne change pas",
            text: "La clarté des preuves, l’honnêteté du parcours, et un positionnement compréhensible en quelques secondes.",
          },
          {
            title: "Candidature complète",
            text: "Le CV international se relie souvent à une lettre, un discours d’entretien et une lecture réaliste des offres.",
          },
        ],
        related: [
          { href: "/solutions/cv", label: "Solution CV" },
          { href: "/solutions/expertise", label: "Expertise" },
          { href: "/emploi", label: "Opportunités" },
        ],
      }}
    />
  );
}
