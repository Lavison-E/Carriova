import { SolutionView } from "@/components/solutions/SolutionView";
import { getFaqs } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { solutionPages } from "@/lib/solution-content";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Coaching carrière",
  description:
    "Présentez votre objectif de carrière ou votre entretien à préparer. Le format, le tarif et le créneau de coaching sont confirmés avec l’équipe CARRIOVA.",
  path: "/solutions/coaching",
  keywords: ["coaching carrière", "accompagnement professionnel", "entretien"],
});

export default async function CoachingPage() {
  const faqs = await getFaqs("coaching").catch(() => []);
  return <SolutionView content={solutionPages.coaching} faqs={faqs} />;
}
