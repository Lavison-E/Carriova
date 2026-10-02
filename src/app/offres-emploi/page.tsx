import { redirect } from "next/navigation";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Offres d’emploi",
  description: "Consultez les offres d’emploi publiées sur CARRIOVA.",
  path: "/offres-emploi",
  keywords: ["offres d’emploi", "emploi Côte d’Ivoire"],
});

export default function Page() {
  redirect("/emploi");
}
