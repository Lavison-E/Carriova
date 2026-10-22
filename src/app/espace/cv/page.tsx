import type { Metadata } from "next";
import { CvLibrary } from "@/components/cv/CvLibrary";
import { loadWorkspaceData } from "@/components/workspace/WorkspaceData";
import { WorkspaceUnavailable } from "@/components/workspace/WorkspaceUi";
import { requireCustomer } from "@/lib/customer-auth";
import { isCvAiAvailable } from "@/lib/cv-ai-config";
import { listCustomerCvs } from "@/lib/cv-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Mes CV | Studio CARRIOVA", robots: { index: false, follow: false } };

export default async function CvLibraryPage() {
  const result = await loadWorkspaceData(async () => {
    const customer = await requireCustomer();
    return listCustomerCvs(customer.id);
  });
  if (!result) return <WorkspaceUnavailable href="/espace/cv" />;
  return <CvLibrary documents={result.data} aiAvailable={isCvAiAvailable()} />;
}
