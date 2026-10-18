import type { Metadata } from "next";
import { NewRequestForm } from "@/components/workspace/WorkspaceForms";
import { WorkspaceHeading, WorkspaceUnavailable } from "@/components/workspace/WorkspaceUi";
import { loadWorkspaceData } from "@/components/workspace/WorkspaceData";
import { requireCustomer } from "@/lib/customer-auth";
import { workspaceServiceOptions } from "@/lib/workspace";

export const metadata: Metadata = { title: "Nouvelle demande" };

export default async function NewRequestPage({ searchParams }: { searchParams: Promise<{ service?: string | string[] }> }) {
  const result = await loadWorkspaceData(requireCustomer);
  if (!result) return <WorkspaceUnavailable href="/espace/nouvelle-demande" />;
  const query = await searchParams;
  const service = typeof query.service === "string" && workspaceServiceOptions.some((option) => option.value === query.service) ? query.service : "";
  return <><WorkspaceHeading eyebrow="Un nouveau départ" title="Parlons de votre objectif." text="Expliquez-nous votre besoin. L’équipe pourra ensuite vous proposer un accompagnement et un devis adaptés." back="/espace/demandes" /><div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_240px]"><section aria-label="Créer une demande" className="min-w-0 rounded-xl border border-line bg-white p-5 sm:p-7"><p className="mb-6 text-[10px] text-muted">Les champs marqués d’un astérisque sont obligatoires.</p><NewRequestForm defaultService={service} /></section><aside className="rounded-xl bg-night p-6 text-white"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f7bd92]">Et ensuite ?</p><ol className="mt-6 space-y-6">{[{ title: "Nous étudions votre besoin", text: "Votre demande arrive directement dans le suivi de notre équipe." }, { title: "Nous échangeons avec vous", text: "Précisions et proposition se retrouvent dans votre espace." }, { title: "Vous décidez de la suite", text: "Vous acceptez la proposition avant le démarrage de la prestation." }].map((item, index) => <li key={item.title}><span className="text-[10px] text-[#f7bd92]">0{index + 1}</span><h2 className="mt-2 text-xs font-semibold leading-6">{item.title}</h2><p className="mt-2 text-[11px] leading-6 text-white/65">{item.text}</p></li>)}</ol></aside></div></>;
}
