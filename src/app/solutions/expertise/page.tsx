import { SolutionView } from "@/components/solutions/SolutionView";
import { getFaqs } from "@/lib/queries";
import { buildMetadata } from "@/lib/seo";
import { solutionPages } from "@/lib/solution-content";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Expertise humaine",
  description:
    "L’IA comprend. Les règles décident. L’expertise humaine valide lorsque c’est nécessaire. Découvrez le différenciateur CARRIOVA.",
  path: "/solutions/expertise",
  keywords: ["expertise carrière", "relecture CV", "accompagnement expert"],
});

export default async function ExpertisePage() {
  const faqs = await getFaqs("expertise");
  return <SolutionView content={solutionPages.expertise} faqs={faqs} />;
}
