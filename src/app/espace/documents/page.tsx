import type { Metadata } from "next";
import Link from "next/link";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { WorkspaceHeading, WorkspaceUnavailable, FileList } from "@/components/workspace/WorkspaceUi";
import { loadWorkspaceData } from "@/components/workspace/WorkspaceData";
import { getCustomerFiles } from "@/lib/workspace-queries";
import type { WorkspaceCustomerFile } from "@/lib/workspace";

export const metadata: Metadata = { title: "Mes produits et documents" };

function FilesByRequest({ files, products = false, review = false }: { files: WorkspaceCustomerFile[]; products?: boolean; review?: boolean }) {
  const grouped = new Map<number, { title: string; files: WorkspaceCustomerFile[] }>();
  for (const file of files) {
    const group = grouped.get(file.requestId);
    if (group) group.files.push(file);
    else grouped.set(file.requestId, { title: file.requestTitle, files: [file] });
  }
  return <div className="space-y-5">{[...grouped].map(([id, group]) => <section key={id} className="rounded-xl border border-line bg-white p-5 sm:p-6">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0"><p className="text-[10px] uppercase tracking-[0.1em] text-muted">Commande {String(id).padStart(3, "0")}</p><h3 className="mt-2 break-words text-base font-semibold text-night">{group.title}</h3></div>
      <Link href={`/espace/demandes/${id}${products ? "#livrables" : review ? "#validation" : "#documents"}`} className="inline-flex min-h-10 items-center gap-3 text-xs font-medium text-night hover:text-orange">Voir la commande <CareerIcon name="arrow" className="h-3.5 w-3.5" /></Link>
    </div><FileList files={group.files} prominent={products} />
  </section>)}</div>;
}

export default async function DocumentsPage() {
  const result = await loadWorkspaceData(getCustomerFiles);
  if (!result) return <WorkspaceUnavailable href="/espace/documents" />;
  const products = result.data.filter((file) => file.kind === "delivery");
  const reviews = result.data.filter(file => file.kind === "review");
  const documents = result.data.filter((file) => file.kind === "brief");
  return <>
    <WorkspaceHeading eyebrow="Votre bibliothèque privée" title="Vos produits, prêts à télécharger." text="Chaque produit livré par l’équipe reste rattaché à sa commande. Retrouvez ici vos fichiers finaux, vos versions précédentes et vos documents de travail." />
    <section aria-labelledby="delivered-products-title">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 id="delivered-products-title" className="text-lg font-semibold text-night">Mes produits livrés</h2><span className="rounded-md bg-[#e9f2ec] px-3 py-1.5 text-[11px] font-semibold text-[#285236]">{products.length} fichier{products.length > 1 ? "s" : ""}</span></div>
      {products.length ? <FilesByRequest files={products} products /> : <div className="rounded-xl border border-dashed border-line bg-white p-6 sm:p-8"><CareerIcon name="document" className="h-8 w-8 text-night" /><h3 className="mt-5 text-base font-semibold text-night">Votre prochaine livraison apparaîtra ici.</h3><p className="mt-3 max-w-xl text-sm leading-7 text-muted">Lorsque l’équipe publie votre CV, votre lettre ou un autre produit, vous pouvez le télécharger ici et depuis le suivi de votre commande.</p><Link href="/espace/demandes" className="mt-5 inline-flex min-h-11 items-center gap-5 rounded-lg bg-night px-5 text-xs font-semibold text-white">Suivre mes demandes <CareerIcon name="arrow" className="h-4 w-4" /></Link></div>}
    </section>
    <section aria-labelledby="review-documents-title" className="mt-10"><h2 id="review-documents-title" className="mb-4 text-lg font-semibold text-night">Versions de travail à valider</h2><p className="mb-5 text-xs leading-7 text-muted">Ces versions sont soumises à votre retour avant l’envoi final. Ouvrez la commande concernée pour valider la réalisation ou demander des ajustements.</p>{reviews.length ? <FilesByRequest files={reviews} review /> : <p className="rounded-xl border border-line bg-white p-6 text-xs leading-7 text-muted">Aucune version de travail publiée pour le moment.</p>}</section>
    <section aria-labelledby="working-documents-title" className="mt-10">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><h2 id="working-documents-title" className="text-lg font-semibold text-night">Documents de travail</h2><span className="text-xs text-muted">{documents.length} document{documents.length > 1 ? "s" : ""}</span></div>
      <p className="mb-5 text-xs leading-7 text-muted">Les pièces transmises pour préparer vos commandes : CV actuel, annonce ou autres éléments utiles à l’équipe.</p>
      {documents.length ? <FilesByRequest files={documents} /> : <p className="rounded-xl border border-line bg-white p-6 text-xs leading-7 text-muted">Aucun document transmis pour le moment. Ajoutez vos fichiers depuis la commande concernée.</p>}
    </section>
  </>;
}