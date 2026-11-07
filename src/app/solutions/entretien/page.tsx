import { SolutionView } from "@/components/solutions/SolutionView";
import { buildMetadata } from "@/lib/seo";
import { solutionPages } from "@/lib/solution-content";

export const metadata = buildMetadata({ title: "Coaching et préparation aux entretiens", description: "Préparation Express, simulation complète ou préparation intensive : choisissez votre entraînement avec un conseiller Carriova.", path: "/solutions/entretien" });
export default function Page() { return <SolutionView content={solutionPages.entretien} faqs={[]} />; }
