import { SolutionView } from "@/components/solutions/SolutionView";
import { getFaqs } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { solutionPages } from "@/lib/solution-content";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Matching emploi-profil",
  description:
    "Étudiez votre candidature avec l’équipe CARRIOVA : lecture de l’offre, parcours et adaptations utiles pour votre CV. Un accompagnement humain sur demande.",
  path: "/solutions/matching",
  keywords: ["matching emploi", "adéquation profil poste"],
});

export default async function MatchingPage() {
  const faqs = await getFaqs("matching").catch(() => []);
  return <SolutionView content={solutionPages.matching} faqs={faqs} />;
}
