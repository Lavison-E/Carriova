import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CvEditor } from "@/components/cv/CvEditor";
import { loadWorkspaceData } from "@/components/workspace/WorkspaceData";
import { WorkspaceUnavailable } from "@/components/workspace/WorkspaceUi";
import { requireCustomer } from "@/lib/customer-auth";
import { isCvAiAvailable } from "@/lib/cv-ai-config";
import { getCustomerCv } from "@/lib/cv-store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Éditer mon CV | Studio CARRIOVA", robots: { index: false, follow: false } };

export default async function CvEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();
  const result = await loadWorkspaceData(async () => {
    const customer = await requireCustomer();
    return getCustomerCv(Number(id), customer.id);
  });
  if (!result) return <WorkspaceUnavailable href={`/espace/cv/${id}`} />;
  if (!result.data) notFound();
  return <CvEditor key={result.data.id} initialDocument={result.data} aiAvailable={isCvAiAvailable()} />;
}
