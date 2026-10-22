import { qualificationOptions } from "@/lib/qualification";

export const workspaceStatusOptions = [
  { value: "received", label: "Demande" },
  { value: "reviewing", label: "En étude" },
  { value: "quoted", label: "Proposition" },
  { value: "in_progress", label: "En cours" },
  { value: "awaiting_validation", label: "En attente de validation" },
  { value: "finalized", label: "Finalisé" },
  { value: "delivered", label: "Projet envoyé" },
  { value: "revision_requested", label: "Révision demandée" },
  { value: "completed", label: "Validé" },
  { value: "cancelled", label: "Annulée" },
] as const;
export const workspaceServiceOptions = qualificationOptions.need;
export type WorkspaceStatus = (typeof workspaceStatusOptions)[number]["value"];
export type WorkspaceFileKind = "brief" | "review" | "delivery";
export type WorkspaceContext = "customer" | "team";
export type CustomerRequestAction = "accept_quote" | "reject_quote" | "approve_review" | "request_revision" | "complete";
export const WORKSPACE_MAX_FILE_BYTES = 3 * 1024 * 1024;
// Per request AND per kind: brief, review and delivery have independent allowances.
export const WORKSPACE_MAX_FILES = 12;
export const WORKSPACE_FILE_ACCEPT = ".pdf,.docx,.jpg,.jpeg,.png";

// A proposal is accepted by the customer. No transition records a payment.
export const staffRequestTransitions: Record<WorkspaceStatus, readonly WorkspaceStatus[]> = {
  received: ["reviewing", "quoted", "cancelled"],
  reviewing: ["quoted", "cancelled"],
  quoted: ["reviewing", "cancelled"],
  in_progress: ["awaiting_validation", "cancelled"],
  awaiting_validation: ["cancelled"],
  finalized: ["delivered", "cancelled"],
  delivered: [],
  revision_requested: ["in_progress", "cancelled"],
  completed: [],
  cancelled: [],
};
export function workspaceStatusLabel(status: string) {
  return workspaceStatusOptions.find((option) => option.value === status)?.label ?? status;
}
export function workspaceServiceLabel(service: string) {
  return workspaceServiceOptions.find((option) => option.value === service)?.label ?? service;
}
export type WorkspaceRequestSummary = {
  id: number; title: string; service: string; status: WorkspaceStatus;
  quotedAmount: number | null; dueAt: string | null; version: number;
  customerName: string; customerEmail: string; customerWhatsApp: string | null; createdAt: string; updatedAt: string;
};
export type WorkspaceMessage = {
  id: number; authorType: "customer" | "staff"; authorName: string; body: string; createdAt: string;
};
export type WorkspaceEvent = {
  id: number; type: string; actorName: string; body: string;
  status: WorkspaceStatus | null; createdAt: string;
};
export type WorkspaceFile = {
  id: number; filename: string; mimeType: string; size: number; kind: WorkspaceFileKind;
  uploadedByName: string; createdAt: string;
};
export type WorkspaceRequestDetail = WorkspaceRequestSummary & {
  brief: string; messages: WorkspaceMessage[]; events: WorkspaceEvent[]; files: WorkspaceFile[];
};
export type CustomerWorkspace = {
  requests: WorkspaceRequestSummary[];
  stats: { total: number; active: number; awaitingResponse: number; completed: number };
};
export type WorkspaceCustomerFile = WorkspaceFile & { requestId: number; requestTitle: string };
export type TeamRequestFilters = { q?: string; status?: string; page?: number | string; sort?: "recent" | "oldest" | "due" };
export type TeamRequests = { requests: WorkspaceRequestSummary[]; total: number; page: number; pageSize: number; totalPages: number };

export const workspaceStages = ["Demande", "Proposition", "Réalisation", "Livraison", "Validation"] as const;
export function workspaceStageIndex(status: WorkspaceStatus): number {
  return { received: 0, reviewing: 0, quoted: 1, in_progress: 2, awaiting_validation: 2, finalized: 2, revision_requested: 2, delivered: 3, completed: 4, cancelled: 0 }[status];
}
export function isWorkspaceFilePublished(file: Pick<WorkspaceFile, "kind" | "createdAt">, events: Pick<WorkspaceEvent, "type" | "createdAt">[]): boolean {
  if (file.kind === "brief") return true;
  const publication = file.kind === "review" ? "awaiting_validation" : "delivered";
  return events.some(event => event.type === publication && event.createdAt >= file.createdAt);
}
