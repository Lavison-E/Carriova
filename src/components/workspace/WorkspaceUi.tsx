import Link from "next/link";
import type { ReactNode } from "react";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { workspaceStatusLabel, type WorkspaceContext, type WorkspaceFile, type WorkspaceStatus } from "@/lib/workspace";

export function formatWorkspaceDate(value: string | null, withTime = false) {
  if (!value) return "À convenir";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Date indisponible";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", ...(withTime ? { timeStyle: "short" as const } : {}), timeZone: "Africa/Abidjan" }).format(date);
}

export function formatAmount(value: number | null) {
  return value === null ? "À définir" : value === 0 ? "Offert" : `${new Intl.NumberFormat("fr-FR").format(value)} FCFA`;
}

export function RequestStatusBadge({ status }: { status: WorkspaceStatus }) {
  const tones: Record<WorkspaceStatus, string> = {
    received: "bg-soft text-night", reviewing: "bg-[#f1eee5] text-[#745323]",
    quoted: "bg-[#fff0e5] text-[#9e3708]", in_progress: "bg-[#edf1fa] text-[#294a85]",
    delivered: "bg-[#e9f2ec] text-[#285236]", revision_requested: "bg-[#f2edf6] text-[#604575]",
    completed: "bg-[#e9f2ec] text-[#285236]", cancelled: "bg-[#f4eeee] text-[#7c4440]",
  };
  return <span className={`inline-flex w-fit items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[10px] font-semibold leading-4 ${tones[status]}`}><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{workspaceStatusLabel(status)}</span>;
}

export function RequestProgress({ status }: { status: WorkspaceStatus }) {
  if (status === "cancelled") return <p className="rounded-lg bg-paper px-4 py-3 text-xs leading-6 text-muted">Cette demande a été annulée. Son historique reste disponible.</p>;
  const labels = ["Demande", "Proposition", "Réalisation", "Livraison", "Validation"];
  const index = { received: 0, reviewing: 0, quoted: 1, in_progress: 2, revision_requested: 2, delivered: 3, completed: 4 }[status];
  return <ol aria-label="Avancement de la demande" className="grid grid-cols-5 gap-1 sm:gap-2">{labels.map((label, step) => <li key={label} aria-current={step === index ? "step" : undefined} className="min-w-0"><div className="flex items-center gap-1.5"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${step <= index ? "bg-night text-white" : "border border-line bg-white text-muted"}`}>{step < index || status === "completed" ? <CareerIcon name="check" className="h-3.5 w-3.5" /> : step + 1}</span>{step < 4 ? <span className={`h-px flex-1 ${step < index ? "bg-night" : "bg-line"}`} /> : null}</div><span className={`mt-2.5 block break-words text-[9px] leading-4 sm:text-[11px] ${step <= index ? "font-medium text-night" : "text-muted"}`}>{label}</span></li>)}</ol>;
}

export function FileList({ files, context = "customer", emptyText = "Aucun document pour le moment.", prominent = false }: { files: WorkspaceFile[]; context?: WorkspaceContext; emptyText?: string; prominent?: boolean }) {
  if (!files.length) return <p className="rounded-lg border border-dashed border-line bg-paper px-5 py-6 text-xs leading-6 text-muted">{emptyText}</p>;
  return <ul className="divide-y divide-line rounded-lg border border-line">{files.map((file) => <li key={file.id}><a href={context === "team" ? `/admin/fichiers/${file.id}` : `/api/espace/fichiers/${file.id}`} download className={`group flex min-w-0 flex-wrap items-center gap-3 px-4 py-4 transition-colors hover:bg-paper ${prominent ? "bg-[#f4f8f5]" : ""}`}><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-soft text-night"><CareerIcon name="document" className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block break-all text-xs font-semibold leading-6 text-night group-hover:text-orange">{file.filename}</span><span className="mt-0.5 block text-[10px] leading-5 text-muted">{Math.max(1, Math.ceil(file.size / 1024))} Ko · {formatWorkspaceDate(file.createdAt, file.kind === "delivery")} · {file.kind === "delivery" ? "Livrable" : "Document transmis"}</span></span><svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-night"><path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4" /></svg><span className={prominent ? "w-full text-right text-xs font-semibold text-[#285236] sm:w-auto" : "sr-only"}>Télécharger</span></a></li>)}</ul>;
}

export function WorkspaceUnavailable({ href = "/espace" }: { href?: string }) {
  return <div role="alert" className="rounded-xl border border-line bg-white p-7 sm:p-10"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">Un instant, s’il vous plaît</p><h1 className="mt-4 text-2xl font-semibold tracking-tight text-night">Votre espace est temporairement indisponible.</h1><p className="mt-4 max-w-xl text-sm leading-7 text-muted">Nous n’avons pas pu charger vos informations. Vous pouvez réessayer dans un instant.</p><a href={href} className="mt-6 inline-flex min-h-11 items-center gap-5 rounded-lg bg-night px-5 text-sm font-semibold text-white">Réessayer <CareerIcon name="arrow" className="h-4 w-4" /></a></div>;
}

export function WorkspaceHeading({ eyebrow, title, text, back, action }: { eyebrow: string; title: string; text?: string; back?: string; action?: ReactNode }) {
  return <div className="mb-7 sm:mb-9">{back ? <Link href={back} className="mb-5 inline-flex min-h-9 items-center gap-2 text-xs font-medium text-muted hover:text-night"><CareerIcon name="arrow" className="h-3.5 w-3.5 rotate-180" />Retour aux demandes</Link> : null}<div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange">{eyebrow}</p><h1 className="mt-3 break-words font-editorial text-[2.35rem] italic leading-[1.1] tracking-tight text-night sm:text-[3.1rem]">{title}</h1>{text ? <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">{text}</p> : null}</div>{action}</div></div>;
}
