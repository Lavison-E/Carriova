import { SolutionView } from "@/components/solutions/SolutionView";
import { getFaqs } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { solutionPages } from "@/lib/solution-content";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Emploi et opportunités",
  description:
    "Découvrez des opportunités d’emploi et reliez-les à votre CV, votre lettre et votre stratégie de candidature CARRIOVA.",
  path: "/solutions/opportunites",
  keywords: ["offres d’emploi", "recherche d’emploi", "opportunités"],
});

export default async function OpportunitiesSolutionPage() {
  const faqs = await getFaqs("opportunites");
  return <SolutionView content={solutionPages.opportunites} faqs={faqs} />;
}
