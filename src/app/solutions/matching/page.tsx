import { SolutionView } from "@/components/solutions/SolutionView";
import { getFaqs } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { solutionPages } from "@/lib/solution-content";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Matching emploi-profil",
  description:
    "Comprenez l’adéquation entre votre profil et une offre d’emploi. CARRIOVA compare compétences, expériences, objectifs et exigences, sans promesse artificielle.",
  path: "/solutions/matching",
  keywords: ["matching emploi", "adéquation profil poste"],
});

export default async function MatchingPage() {
  const faqs = await getFaqs("matching");
  return <SolutionView content={solutionPages.matching} faqs={faqs} />;
}
