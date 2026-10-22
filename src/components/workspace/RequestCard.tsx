import Link from "next/link";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { RequestProgress, RequestStatusBadge, formatWorkspaceDate } from "@/components/workspace/WorkspaceUi";
import { workspaceServiceLabel, type WorkspaceRequestSummary } from "@/lib/workspace";

const descriptions = {
  received: "Votre demande est enregistrée. L’équipe va prendre connaissance de votre besoin.",
  reviewing: "L’équipe étudie votre besoin et prépare la suite de votre accompagnement.",
  quoted: "Une proposition vous attend. Consultez-la pour poursuivre votre accompagnement.",
  in_progress: "Votre accompagnement est en cours. Retrouvez vos échanges dans la demande.",
  awaiting_validation: "La version de travail attend votre retour. Validez-la ou demandez des ajustements avant la livraison finale.",
  finalized: "Vous avez validé la réalisation. L’équipe prépare l’envoi du projet final.",
  delivered: "Vos livrables sont disponibles. Vous pouvez les consulter et donner votre retour.",
  revision_requested: "Vos ajustements ont été transmis à l’équipe. Retrouvez-les dans la conversation.",
  completed: "Vous avez validé votre livraison. Vos documents restent disponibles.",
  cancelled: "Cette demande est clôturée. Vous pouvez toujours consulter son historique.",
};

export function RequestCard({ request, progress = false }: { request: WorkspaceRequestSummary; progress?: boolean }) {
  return <article className="min-w-0 rounded-xl border border-line bg-white p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted">Demande {String(request.id).padStart(3, "0")}</p><RequestStatusBadge status={request.status} /></div><p className="mt-5 text-[10px] font-medium text-orange">{workspaceServiceLabel(request.service)}</p><h3 className="mt-2 break-words text-lg font-semibold leading-7 tracking-tight text-night"><Link href={`/espace/demandes/${request.id}`} className="hover:text-orange">{request.title}</Link></h3><p className="mt-3 text-xs leading-6 text-muted">{descriptions[request.status]}</p>{progress ? <div className="mt-6 border-t border-line pt-5"><RequestProgress status={request.status} /></div> : null}<div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4"><p className="text-[10px] leading-5 text-muted">Mise à jour le {formatWorkspaceDate(request.updatedAt)}</p><Link href={`/espace/demandes/${request.id}`} className="inline-flex min-h-9 items-center gap-4 text-xs font-semibold text-night hover:text-orange">{request.status === "quoted" ? "Voir la proposition" : request.status === "awaiting_validation" ? "Valider la réalisation" : request.status === "delivered" ? "Voir la livraison" : "Ouvrir la demande"}<CareerIcon name="arrow" className="h-4 w-4" /></Link></div></article>;
}

export function EmptyRequests() {
  return <div className="overflow-hidden rounded-xl border border-line bg-white"><div className="p-6 sm:p-9"><span className="flex h-14 w-14 items-center justify-center rounded-xl bg-soft text-night"><CareerIcon name="compass" className="h-7 w-7" /></span><h2 className="mt-6 font-editorial text-3xl italic leading-tight text-night sm:text-4xl">Tout commence par votre objectif.</h2><p className="mt-4 max-w-lg text-sm leading-7 text-muted">Un CV à retravailler, un entretien à préparer ou un nouveau cap à prendre ? Parlez-nous de votre besoin. Nous étudierons votre demande avec vous.</p><Link href="/espace/nouvelle-demande" className="mt-7 inline-flex min-h-12 items-center gap-8 rounded-lg bg-orange px-5 text-xs font-semibold text-white hover:bg-[#9e3708]">Créer ma première demande <CareerIcon name="arrow" className="h-4 w-4" /></Link></div><ol className="grid border-t border-line bg-paper sm:grid-cols-3">{["Décrivez votre objectif", "Échangez avec notre équipe", "Retrouvez vos livrables"].map((label, index) => <li key={label} className="flex items-center gap-3 border-line px-6 py-5 text-[11px] font-medium text-night sm:border-r last:border-0"><span className="text-orange">0{index + 1}</span>{label}</li>)}</ol></div>;
}
