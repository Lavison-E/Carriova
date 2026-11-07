import { SolutionView } from "@/components/solutions/SolutionView";
import { buildMetadata } from "@/lib/seo";
import { solutionPages } from "@/lib/solution-content";

export const metadata = buildMetadata({ title: "Optimisation de profil LinkedIn", description: "Titre, résumé, expériences et compétences : découvrez LinkedIn Essentiel et LinkedIn Complet, avec un accompagnement humain.", path: "/solutions/linkedin" });
export default function Page() { return <SolutionView content={solutionPages.linkedin} faqs={[]} />; }
