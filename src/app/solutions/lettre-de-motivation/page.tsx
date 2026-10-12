import { DocumentPreview } from "@/components/solutions/CareerVisuals";
import { SolutionView } from "@/components/solutions/SolutionView";
import { Section } from "@/components/ui/primitives";
import { getFaqs } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { solutionPages } from "@/lib/solution-content";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Lettre de motivation personnalisée",
  description:
    "Rédigez une lettre de motivation liée à votre profil, à l’opportunité et à votre contribution, avec la méthode CARRIOVA.",
  path: "/solutions/lettre-de-motivation",
  keywords: ["lettre de motivation", "lettre professionnelle", "candidature"],
});

export default async function LetterPage() {
  const faqs = await getFaqs("lettre");
  return (
    <>
      <SolutionView content={solutionPages["lettre-de-motivation"]} faqs={faqs} />
      <Section tone="paper">
        <div className="grid items-center gap-10 md:grid-cols-2">
          <div>
            <h2 className="text-3xl font-extrabold text-night">Une lettre utile dit pourquoi vous, maintenant.</h2>
            <p className="mt-4 text-base leading-7 text-muted">
              Elle ne répète pas le CV. Elle relie une preuve à un besoin, une motivation à un contexte, un
              objectif à une contribution possible.
            </p>
          </div>
          <DocumentPreview variant="letter" />
        </div>
      </Section>
    </>
  );
}
