import type { Metadata } from "next";
import Link from "next/link";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { WorkspaceHeading, WorkspaceUnavailable, FileList } from "@/components/workspace/WorkspaceUi";
import { loadWorkspaceData } from "@/components/workspace/WorkspaceData";
import { getCustomerFiles } from "@/lib/workspace-queries";
import type { WorkspaceCustomerFile } from "@/lib/workspace";

export const metadata: Metadata = { title: "Mes documents" };

export default async function DocumentsPage() {
  const result = await loadWorkspaceData(getCustomerFiles);
  if (!result) return <WorkspaceUnavailable href="/espace/documents" />;
  const files = result.data;
  const grouped = new Map<number, { title: string; files: WorkspaceCustomerFile[] }>();
  for (const file of files) {
    const group = grouped.get(file.requestId);
    if (group) group.files.push(file);
    else grouped.set(file.requestId, { title: file.requestTitle, files: [file] });
  }
  return <><WorkspaceHeading eyebrow="Votre bibliothèque privée" title="Vos documents, à portée de main." text="Retrouvez les documents que vous avez transmis et les livrables partagés par l’équipe, regroupés par demande." />{files.length ? <><p className="mb-5 text-xs text-muted">{files.length} document{files.length > 1 ? "s" : ""} disponible{files.length > 1 ? "s" : ""}</p><div className="space-y-5">{[...grouped].map(([id, group]) => <section key={id} className="rounded-xl border border-line bg-white p-5 sm:p-6"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] uppercase tracking-[0.1em] text-muted">Demande {String(id).padStart(3, "0")}</p><h2 className="mt-2 break-words text-base font-semibold text-night">{group.title}</h2></div><Link href={`/espace/demandes/${id}`} className="inline-flex min-h-10 items-center gap-3 text-xs font-medium text-night hover:text-orange">Ouvrir la demande <CareerIcon name="arrow" className="h-3.5 w-3.5" /></Link></div><FileList files={group.files} /></section>)}</div></> : <section className="rounded-xl border border-line bg-white p-7 sm:p-10"><CareerIcon name="document" className="h-10 w-10 text-night" /><h2 className="mt-6 text-xl font-semibold tracking-tight text-night">Vos documents trouveront leur place ici.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-muted">Ajoutez vos fichiers depuis une demande. Les livrables de l’équipe apparaîtront dès qu’ils seront partagés avec vous.</p><Link href="/espace/demandes" className="mt-6 inline-flex min-h-12 items-center gap-6 rounded-lg bg-night px-5 text-xs font-semibold text-white">Voir mes demandes <CareerIcon name="arrow" className="h-4 w-4" /></Link></section>}</>;
}
