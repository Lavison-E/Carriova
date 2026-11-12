export type TeamRole = "admin" | "advisor";
export type TeamOperation = "update" | "disable" | "enable" | "revoke_sessions" | "delete" | "restore" | "resend_invitation";
export type TeamActionState = { ok: boolean; message: string; fieldErrors?: Record<string, string> };
export const EMPTY_TEAM_ACTION_STATE: TeamActionState = { ok: false, message: "" };
export type TeamMember = {
  id: number; email: string; name: string; role: TeamRole; enabled: boolean;
  deletedAt: string | null; version: number; createdAt: string;
  invitationExpiresAt: string | null; activeSessions: number; hasPassword: boolean;
};
export type TeamAuditEntry = {
  id: number; actorName: string; targetName: string; action: string; details: string; createdAt: string;
};
export type TeamManagementData = {
  members: TeamMember[]; audit: TeamAuditEntry[];
  stats: { total: number; active: number; admins: number; pending: number; deleted: number };
  mailEnabled: boolean;
};
export const teamRoleLabels: Record<TeamRole, string> = { admin: "Administrateur", advisor: "Collaborateur" };
export function readTeamText(data: FormData, name: string) {
  const value = data.get(name);
  return typeof value === "string" ? value.trim() : "";
}
export function validateTeamInvitation(data: FormData) {
  const name = readTeamText(data, "name");
  const email = readTeamText(data, "email").toLowerCase();
  const role = readTeamText(data, "role");
  const fieldErrors: Record<string, string> = {};
  if (name.length < 2 || name.length > 120 || /[\u0000-\u001f\u007f]/.test(name)) fieldErrors.name = "Indiquez un nom de 2 à 120 caractères.";
  if (email.length > 255 || !/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(email)) fieldErrors.email = "Indiquez une adresse e-mail valide.";
  if (role !== "admin" && role !== "advisor") fieldErrors.role = "Choisissez un rôle valide.";
  return { name, email, role: role as TeamRole, fieldErrors };
}
export function validateTeamMutation(data: FormData) {
  const memberIdText = readTeamText(data, "memberId"), versionText = readTeamText(data, "version");
  const memberId = Number(memberIdText), version = Number(versionText);
  const operation = readTeamText(data, "operation");
  const name = readTeamText(data, "name"), role = readTeamText(data, "role");
  const fieldErrors: Record<string, string> = {};
  if (!/^[1-9]\d*$/.test(memberIdText) || !Number.isSafeInteger(memberId)) fieldErrors.memberId = "Compte invalide.";
  if (!/^[1-9]\d*$/.test(versionText) || !Number.isSafeInteger(version)) fieldErrors.version = "Rechargez la page avant de modifier ce compte.";
  if (!["update", "disable", "enable", "revoke_sessions", "delete", "restore", "resend_invitation"].includes(operation)) fieldErrors.operation = "Action invalide.";
  if (operation === "update") {
    if (name.length < 2 || name.length > 120 || /[\u0000-\u001f\u007f]/.test(name)) fieldErrors.name = "Indiquez un nom de 2 à 120 caractères.";
    if (role !== "admin" && role !== "advisor") fieldErrors.role = "Choisissez un rôle valide.";
  }
  return { memberId, version, operation: operation as TeamOperation, name, role: role as TeamRole,
    confirmEmail: readTeamText(data, "confirmEmail").toLowerCase(), fieldErrors };
}
