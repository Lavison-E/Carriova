import { SeoLanding } from "@/components/seo/SeoLanding";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Conseils CV",
  description:
    "Conseils CV : erreurs fréquentes, structure, ATS, résumé professionnel, réalisations. Guide CARRIOVA.",
  path: "/conseils-cv",
  keywords: ["conseils CV", "erreurs CV", "améliorer son CV"],
});

export default function Page() {
  return (
    <SeoLanding
      content={{
        path: "/conseils-cv",
        eyebrow: "Conseils CV",
        title: "Améliorer son CV sans tomber dans les recettes creuses.",
        text: "Moins de jargon, plus de preuves. Moins de décoration, plus de lisibilité. Moins de copier-coller, plus de cible.",
        primary: { href: "/solutions/cv", label: "Créer mon CV" },
        secondary: { href: "/cv-professionnel", label: "CV professionnel" },
        sections: [
          {
            title: "Erreurs fréquentes",
            text: "Paragraphes illisibles, verbes vagues, dates incohérentes, compétences inventées, modèle trop chargé.",
          },
          {
            title: "Résumé professionnel",
            text: "Quatre à six lignes qui disent qui vous êtes pour ce marché, pas une biographie.",
          },
          {
            title: "Réalisations",
            text: "Contexte, action, résultat. Si le chiffre n’existe pas, ne l’inventez pas.",
          },
          {
            title: "Audit",
            text: "Un regard expert reste utile sur les profils seniors, les reconversions et les dossiers internationaux.",
          },
        ],
        related: [
          { href: "/solutions/cv", label: "Solution CV" },
          { href: "/solutions/expertise", label: "Faire auditer mon CV" },
          { href: "/blog", label: "Articles" },
        ],
      }}
    />
  );
}
