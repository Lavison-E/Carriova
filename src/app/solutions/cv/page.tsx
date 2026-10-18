import { DocumentPreview } from "@/components/solutions/CareerVisuals";
import { SolutionView } from "@/components/solutions/SolutionView";
import { Section } from "@/components/ui/primitives";
import { getFaqs } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { solutionPages } from "@/lib/solution-content";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "CV professionnel",
  description:
    "CARRIOVA crée des CV professionnels à partir de votre profil, du poste visé, de vos réalisations et des attentes recruteur. Découverte avant production.",
  path: "/solutions/cv",
  keywords: ["CV professionnel", "créer un CV", "CV ATS", "améliorer son CV"],
});

export default async function CvSolutionPage() {
  const faqs = await getFaqs("cv").catch(() => []);
  return (
    <>
      <SolutionView content={solutionPages.cv} faqs={faqs} />
      <Section tone="paper">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <DocumentPreview variant="cv" />
          <div>
            <h2 className="text-3xl font-extrabold text-night">Le CV n’est pas un modèle. C’est une décision.</h2>
            <p className="mt-4 text-base leading-7 text-muted">
              Titre, preuves, compétences, résumé : chaque choix dit quelque chose au recruteur. CARRIOVA
              vous aide à le dire avec précision, puis à l’adapter à une offre lorsque c’est pertinent.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
