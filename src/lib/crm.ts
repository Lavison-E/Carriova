export const crmStatusOptions = [
  { value: "new", label: "Nouveau" },
  { value: "to_qualify", label: "À qualifier" },
  { value: "hot", label: "Chaud" },
  { value: "qualified", label: "Qualifié" },
  { value: "proposal_sent", label: "Offre envoyée" },
  { value: "negotiating", label: "En négociation" },
  { value: "client", label: "Client" },
  { value: "lost", label: "Perdu" },
  { value: "nurture", label: "À nourrir" },
] as const;
export const crmPriorityOptions = [
  { value: "low", label: "Basse" },
  { value: "normal", label: "Normale" },
  { value: "high", label: "Haute" },
] as const;
export const crmDueOptions = [
  { value: "overdue", label: "En retard" },
  { value: "today", label: "Aujourd’hui" },
  { value: "upcoming", label: "À venir" },
  { value: "none", label: "Sans relance" },
] as const;
export type CrmStatus = (typeof crmStatusOptions)[number]["value"];
export type CrmPriority = (typeof crmPriorityOptions)[number]["value"];
export type CrmDue = (typeof crmDueOptions)[number]["value"];
export type CrmFilters = { q?: string; status?: string; need?: string; due?: string; page?: string | number };
export type CrmLeadSummary = {
  id: number; fullName: string; email: string | null; whatsapp: string | null;
  country: string | null; need: string | null; profile: string | null; budget: string | null;
  status: CrmStatus; priority: CrmPriority; followUpAt: string | null;
  createdAt: string; updatedAt: string; version: number; source: string | null;
  canContactWhatsApp: boolean;
};
export type CrmHistoryItem = {
  id: number; action: string; actorId: number | null; actorName: string | null;
  note: string | null; previousStatus: string | null; status: string | null; createdAt: string;
  changes: Record<string, unknown> | null;
};
export type CrmLeadDetail = CrmLeadSummary & {
  message: string | null; consentPrivacy: boolean; consentMarketing: boolean;
  qualification: null | {
    discoverySource: string; cvStatus: string; timeline: string;
    targetOffer: string | null; difficulty: string | null;
    budget: string; paymentReadiness: string; contactWhatsApp: "yes" | "no";
    consentVersion: string; submittedAt: string;
  };
  history: CrmHistoryItem[];
};
export type CrmDashboard = {
  leads: CrmLeadSummary[]; total: number; page: number; pageSize: number; totalPages: number;
  stats: { total: number; new: number; qualified: number; overdue: number };
};
