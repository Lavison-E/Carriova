import { SolutionView } from "@/components/solutions/SolutionView";
import { getFaqs } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { solutionPages } from "@/lib/solution-content";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Expertise humaine",
  description:
    "Faites relire votre CV et vos documents par l’équipe CARRIOVA. Demandez une proposition et retrouvez vos échanges dans votre espace client.",
  path: "/solutions/expertise",
  keywords: ["expertise carrière", "relecture CV", "accompagnement expert"],
});

export default async function ExpertisePage() {
  const faqs = await getFaqs("expertise").catch(() => []);
  return <SolutionView content={solutionPages.expertise} faqs={faqs} />;
}
