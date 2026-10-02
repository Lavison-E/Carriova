import { SolutionView } from "@/components/solutions/SolutionView";
import { getFaqs } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { solutionPages } from "@/lib/solution-content";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Coaching carrière",
  description:
    "Coaching individuel, orientation, employabilité, entretien, positionnement et progression. Réservez une séance CARRIOVA selon vos disponibilités.",
  path: "/solutions/coaching",
  keywords: ["coaching carrière", "accompagnement professionnel", "entretien"],
});

export default async function CoachingPage() {
  const faqs = await getFaqs("coaching");
  return <SolutionView content={solutionPages.coaching} faqs={faqs} />;
}
