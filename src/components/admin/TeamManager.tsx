"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { inviteTeamMember, manageTeamMember } from "@/lib/team-actions";
import { EMPTY_TEAM_ACTION_STATE, teamRoleLabels, type TeamActionState, type TeamMember, type TeamManagementData, type TeamOperation } from "@/lib/team-management";

type MemberStatus = "active" | "pending" | "disabled" | "deleted";
const inputClass = "mt-2 min-h-12 w-full min-w-0 rounded-lg border border-line bg-white px-3 py-2 text-sm font-normal text-night outline-offset-4 focus:border-night disabled:cursor-not-allowed disabled:bg-paper disabled:text-muted";
const buttonClass = "inline-flex min-h-11 items-center justify-center gap-3 rounded-lg px-4 py-3 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50";
const statusLabels: Record<MemberStatus, string> = { active: "Actif", pending: "À activer", disabled: "Suspendu", deleted: "Supprimé" };
const statusColors: Record<MemberStatus, string> = { active: "bg-[#edf4ee] text-[#285236]", pending: "bg-[#fff1e4] text-[#964111]", disabled: "bg-[#f0f0f3] text-[#606777]", deleted: "bg-[#f8eeee] text-[#91403a]" };
const operationCopy: Record<Exclude<TeamOperation, "update">, { title: string; description: string; button: string }> = {
  disable: { title: "Suspendre cet accès", description: "La personne sera déconnectée et ne pourra plus accéder à l’espace équipe. Son compte pourra être réactivé plus tard.", button: "Confirmer la suspension" },
  enable: { title: "Réactiver ce compte", description: "La personne pourra de nouveau se connecter à l’espace équipe avec son mot de passe et le rôle indiqué sur sa fiche.", button: "Réactiver le compte" },
  revoke_sessions: { title: "Fermer les sessions en cours", description: "Toutes les connexions de cette personne seront fermées. Elle devra se reconnecter avec son mot de passe pour continuer.", button: "Fermer toutes les sessions" },
  delete: { title: "Supprimer ce compte de l’équipe", description: "L’accès sera retiré et les sessions fermées. La fiche restera dans les comptes supprimés pour préserver l’historique des actions. Les dossiers clients restent disponibles.", button: "Supprimer ce compte" },
  restore: { title: "Restaurer la fiche de ce compte", description: "La fiche reviendra dans la liste de l’équipe, sans accès actif. Vous pourrez ensuite réactiver le compte ou renvoyer une invitation si nécessaire.", button: "Restaurer la fiche" },
  resend_invitation: { title: "Renvoyer l’invitation", description: "Un nouveau lien d’activation sera envoyé à cette adresse e-mail. Il sera valable 24 heures et remplacera le précédent lien.", button: "Envoyer une nouvelle invitation" },
};
const auditLabels: Record<string, string> = {
  role_changed: "Rôle modifié", invitation_renewed: "Invitation renouvelée", invite_sent: "Invitation envoyée", invite_delivery_failed: "Échec d’envoi de l’invitation",
  invited: "Invitation créée", invite: "Invitation créée", invitation_sent: "Invitation envoyée", invitation_resent: "Invitation renvoyée", resend_invitation: "Invitation renvoyée", updated: "Compte modifié", update: "Compte modifié", disabled: "Compte suspendu", disable: "Compte suspendu", enabled: "Compte réactivé", enable: "Compte réactivé", sessions_revoked: "Sessions fermées", revoke_sessions: "Sessions fermées", deleted: "Compte supprimé", delete: "Compte supprimé", restored: "Fiche restaurée", restore: "Fiche restaurée", activated: "Compte activé",
};
function memberStatus(member: TeamMember): MemberStatus {
  if (member.deletedAt) return "deleted";
  if (member.enabled) return "active";
  return member.hasPassword ? "disabled" : "pending";
}
function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Africa/Abidjan" }).format(new Date(value));
}
function Feedback({ state }: { state: TeamActionState }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (state.message) ref.current?.focus(); }, [state]);
  return state.message ? <div ref={ref} role={state.ok ? "status" : "alert"} tabIndex={-1} className={`scroll-mt-6 rounded-lg border px-4 py-3 text-xs leading-6 outline-none ${state.ok ? "border-[#c4d6c8] bg-[#edf4ee] text-[#285236]" : "border-orange/30 bg-[#fff7f0] text-orange"}`}>{state.message}</div> : null;
}
function FieldError({ state, name, prefix }: { state: TeamActionState; name: string; prefix: string }) {
  return state.fieldErrors?.[name] ? <span id={`${prefix}-${name}-error`} className="mt-2 block text-xs font-normal leading-5 text-orange">{state.fieldErrors[name]}</span> : null;
}
function StatusBadge({ status }: { status: MemberStatus }) {
  return <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-[10px] font-semibold ${statusColors[status]}`}><span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current" />{statusLabels[status]}</span>;
}

export function TeamManager({ data, currentUserId }: { data: TeamManagementData; currentUserId: number }) {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("current");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(EMPTY_TEAM_ACTION_STATE);
  const needle = search.trim().toLocaleLowerCase("fr");
  const members = data.members.filter((member) => {
    const currentStatus = memberStatus(member);
    return (role === "all" || member.role === role)
      && (status === "all" || (status === "current" ? currentStatus !== "deleted" : currentStatus === status))
      && (!needle || `${member.name} ${member.email}`.toLocaleLowerCase("fr").includes(needle));
  });
  const resetFilters = () => { setSearch(""); setRole("all"); setStatus("current"); };
  return <div className="space-y-7">
    <dl className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {[
        { label: "Accès actifs", value: data.stats.active, caption: "Peuvent se connecter" },
        { label: "Administrateurs actifs", value: data.stats.admins, caption: "Gèrent les comptes et les accès" },
        { label: "Invitations à activer", value: data.stats.pending, caption: "Activation par e-mail" },
        { label: "Comptes supprimés", value: data.stats.deleted, caption: "Conservés dans l’historique" },
      ].map((item) => <div key={item.label} className="rounded-xl border border-line bg-white p-4 sm:p-5"><dt className="text-[11px] leading-5 text-muted">{item.label}</dt><dd className="mt-2 text-3xl font-semibold tabular-nums tracking-tight">{item.value}<span className="mt-2 block text-[10px] font-normal leading-5 tracking-normal text-muted">{item.caption}</span></dd></div>)}
    </dl>
    <Feedback state={notice} />
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(290px,1fr)]">
      <section aria-labelledby="team-members-title" className="min-w-0 overflow-hidden rounded-xl border border-line bg-white">
        <div className="border-b border-line p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">Annuaire de l’équipe</p><h2 id="team-members-title" className="mt-2 text-xl font-semibold tracking-tight">Comptes et responsabilités</h2></div><a href="#team-invite" className={`${buttonClass} bg-night text-white hover:bg-royal xl:hidden`}>Inviter une personne <span aria-hidden="true">↓</span></a></div>
          <div className="mt-5 space-y-3">
            <label className="block text-xs font-semibold" htmlFor="team-search">Rechercher dans l’équipe</label>
            <div className="relative"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="pointer-events-none absolute left-3.5 top-4 h-4 w-4 text-muted"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" /></svg><input id="team-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} disabled={busy} placeholder="Nom ou adresse e-mail" className={`${inputClass} mt-0 pl-10`} /></div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block text-[11px] font-medium text-muted">Rôle<select value={role} onChange={(event) => setRole(event.target.value)} disabled={busy} className={`${inputClass} mt-1 min-h-11 text-xs`}><option value="all">Tous les rôles</option><option value="admin">Administrateurs</option><option value="advisor">Collaborateurs</option></select></label>
              <label className="block text-[11px] font-medium text-muted">État du compte<select value={status} onChange={(event) => setStatus(event.target.value)} disabled={busy} className={`${inputClass} mt-1 min-h-11 text-xs`}><option value="current">Équipe actuelle</option><option value="active">Actifs</option><option value="pending">Invitations à activer</option><option value="disabled">Suspendus</option><option value="deleted">Supprimés</option><option value="all">Tous les comptes</option></select></label>
            </div>
          </div>
          <p role="status" aria-live="polite" className="mt-4 text-[11px] text-muted">{members.length} compte{members.length > 1 ? "s" : ""} affiché{members.length > 1 ? "s" : ""}</p>
        </div>
        <div className="divide-y divide-line">
          {members.map((member) => {
            const expanded = selectedId === member.id;
            const isSelf = member.id === currentUserId;
            return <article key={member.id} className={expanded ? "bg-[#fbfaf7]" : "bg-white"}>
              <div className="flex flex-wrap items-center gap-3 px-5 py-5 sm:gap-4 sm:px-6">
                <div aria-hidden="true" className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${member.role === "admin" ? "bg-night text-white" : "bg-paper text-night"}`}>{member.name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toLocaleUpperCase("fr")}</div>
                <div className="min-w-0 flex-1 basis-36"><div className="flex flex-wrap items-center gap-2"><h3 className="break-words text-sm font-semibold">{member.name}</h3>{isSelf ? <span className="rounded border border-night/15 px-1.5 py-0.5 text-[9px] font-medium text-muted">Vous</span> : null}</div><p className="mt-1 break-all text-xs leading-5 text-muted">{member.email}</p><div className="mt-2 flex flex-wrap items-center gap-2"><span className="text-[10px] text-muted">{teamRoleLabels[member.role]}</span><span aria-hidden="true" className="text-line">·</span><StatusBadge status={memberStatus(member)} /></div></div>
                <button type="button" disabled={busy} aria-expanded={expanded} aria-controls={expanded ? `team-member-${member.id}` : undefined} aria-label={`${expanded ? "Fermer" : "Gérer"} le compte de ${member.name}`} onClick={() => { setSelectedId(expanded ? null : member.id); setNotice(EMPTY_TEAM_ACTION_STATE); }} className={`${buttonClass} ml-auto border ${expanded ? "border-night bg-night text-white" : "border-line bg-white text-night hover:border-night/40"}`}>{expanded ? "Fermer" : "Gérer"}<span aria-hidden="true">{expanded ? "−" : "+"}</span></button>
              </div>
              {expanded ? <div id={`team-member-${member.id}`} className="border-t border-line px-5 py-6 sm:px-6"><MemberEditor key={member.id} member={member} isSelf={isSelf} lastAdmin={member.role === "admin" && member.enabled && !member.deletedAt && data.stats.admins <= 1} mailEnabled={data.mailEnabled} busy={busy} setBusy={setBusy} onSuccess={setNotice} /></div> : null}
            </article>;
          })}
          {!members.length ? <div className="px-5 py-12 text-center sm:px-6"><CareerIcon name="people" className="mx-auto h-8 w-8 text-muted" /><h3 className="mt-4 text-base font-semibold">Aucun compte dans cette sélection</h3><p className="mt-2 text-xs leading-6 text-muted">Essayez un autre nom ou élargissez les filtres.</p><button type="button" onClick={resetFilters} disabled={busy} className={`${buttonClass} mt-4 border border-line bg-white hover:border-night/40`}>Réinitialiser les filtres</button></div> : null}
        </div>
      </section>
      <aside className="min-w-0 space-y-5">
        <InviteMember mailEnabled={data.mailEnabled} busy={busy} setBusy={setBusy} />
        <section className="rounded-xl border border-night/10 bg-[#eeede7] p-5 sm:p-6" aria-labelledby="team-roles-title">
          <h2 id="team-roles-title" className="text-sm font-semibold">Un rôle adapté à chacun</h2>
          <dl className="mt-4 space-y-4 text-xs leading-6"><div><dt className="font-semibold">Collaborateur</dt><dd className="mt-1 text-muted">Travaille sur les prospects, les commandes, les livraisons et les notifications clients.</dd></div><div><dt className="font-semibold">Administrateur</dt><dd className="mt-1 text-muted">Dispose aussi de la gestion des comptes de l’équipe, des rôles et des accès.</dd></div></dl>
          <p className="mt-5 border-t border-night/10 pt-4 text-[11px] leading-6 text-muted">Au moins un administrateur doit rester actif. Vous pouvez modifier votre nom ; un autre administrateur doit gérer votre rôle et votre accès.</p>
        </section>
      </aside>
    </div>
    <section className="overflow-hidden rounded-xl border border-line bg-white" aria-labelledby="team-audit-title">
      <div className="border-b border-line p-5 sm:p-6"><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">Traçabilité</p><h2 id="team-audit-title" className="mt-2 text-xl font-semibold tracking-tight">Historique des accès</h2><p className="mt-2 text-xs leading-6 text-muted">Les dernières actions enregistrées, avec leur auteur et le compte concerné. Horaires d’Abidjan.</p></div>
      {data.audit.length ? <ol className="divide-y divide-line">{data.audit.map((entry) => <li key={entry.id} className="grid gap-2 px-5 py-4 text-xs sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-6 sm:px-6"><div className="min-w-0"><p className="break-words font-semibold">{auditLabels[entry.action] ?? "Compte mis à jour"} <span className="font-normal text-muted">· {entry.targetName}</span></p><p className="mt-1 break-words text-[11px] leading-6 text-muted">Par {entry.actorName}{entry.details ? ` — ${entry.details}` : ""}</p></div><time dateTime={entry.createdAt} className="text-[10px] leading-6 text-muted sm:text-right">{formatDate(entry.createdAt)}</time></li>)}</ol> : <p className="p-6 text-xs leading-6 text-muted">Les prochaines modifications de l’équipe apparaîtront ici.</p>}
    </section>
  </div>;
}

function InviteMember({ mailEnabled, busy, setBusy }: { mailEnabled: boolean; busy: boolean; setBusy: (value: boolean) => void }) {
  const [draft, setDraft] = useState({ name: "", email: "", role: "advisor" });
  const [state, action, pending] = useActionState(async (previous: TeamActionState, formData: FormData): Promise<TeamActionState> => {
    setBusy(true);
    try {
      const result = await inviteTeamMember(previous, formData);
      if (result.ok) setDraft({ name: "", email: "", role: "advisor" });
      return result;
    } catch { return { ok: false, message: "L’envoi n’a pas pu être confirmé. Actualisez la liste avant de réessayer pour vérifier si le compte a été créé." }; }
    finally { setBusy(false); }
  }, EMPTY_TEAM_ACTION_STATE);
  return <section id="team-invite" aria-labelledby="team-invite-title" className="scroll-mt-6 overflow-hidden rounded-xl border border-line bg-white">
    <div className="bg-night p-5 text-white sm:p-6"><CareerIcon name="letter" className="h-6 w-6 text-[#ffc7a1]" /><h2 id="team-invite-title" className="mt-3 text-xl font-semibold tracking-tight">Agrandir l’équipe</h2><p className="mt-2 text-xs leading-6 text-white/70">Une invitation personnelle pour rejoindre l’espace Carriova et choisir son mot de passe.</p></div>
    <form action={action} onReset={(event) => event.preventDefault()} aria-busy={pending} className="space-y-5 p-5 sm:p-6">
      <Feedback state={state} />
      {!mailEnabled ? <p role="alert" className="rounded-lg border border-orange/25 bg-[#fff7f0] p-3 text-xs leading-6 text-orange">L’envoi des invitations est indisponible. Vérifiez la configuration des e-mails pour inviter une personne.</p> : null}
      <fieldset disabled={busy || pending || !mailEnabled} className="min-w-0 space-y-4">
        <label className="block text-xs font-semibold">Nom et prénom<input name="name" autoComplete="off" required minLength={2} maxLength={120} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} aria-invalid={state.fieldErrors?.name ? true : undefined} aria-describedby={state.fieldErrors?.name ? "invite-name-error" : undefined} className={inputClass} /><FieldError state={state} name="name" prefix="invite" /></label>
        <label className="block text-xs font-semibold">Adresse e-mail professionnelle<input name="email" type="email" autoComplete="off" required maxLength={255} value={draft.email} onChange={(event) => setDraft((current) => ({ ...current, email: event.target.value }))} aria-invalid={state.fieldErrors?.email ? true : undefined} aria-describedby={state.fieldErrors?.email ? "invite-email-error" : "invite-email-help"} className={inputClass} /><span id="invite-email-help" className="mt-2 block text-[11px] font-normal leading-5 text-muted">L’invitation sera envoyée à cette adresse.</span><FieldError state={state} name="email" prefix="invite" /></label>
        <label className="block text-xs font-semibold">Rôle<select name="role" value={draft.role} onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value }))} aria-invalid={state.fieldErrors?.role ? true : undefined} aria-describedby={state.fieldErrors?.role ? "invite-role-help invite-role-error" : "invite-role-help"} className={inputClass}><option value="advisor">Collaborateur</option><option value="admin">Administrateur</option></select><span id="invite-role-help" className="mt-2 block text-[11px] font-normal leading-5 text-muted">{draft.role === "admin" ? "Cette personne pourra gérer les autres comptes de l’équipe." : "Cette personne pourra accompagner les clients et traiter les commandes."}</span><FieldError state={state} name="role" prefix="invite" /></label>
      </fieldset>
      <button type="submit" disabled={busy || pending || !mailEnabled} className={`${buttonClass} w-full justify-between bg-orange text-white hover:bg-[#9e3708]`}>{pending ? "Envoi de l’invitation…" : "Envoyer l’invitation"}<CareerIcon name="arrow" className="h-4 w-4 shrink-0" /></button>
      <p className="text-[10px] leading-5 text-muted">Le lien d’activation est valable 24 heures. L’accès est ouvert uniquement après la création du mot de passe.</p>
    </form>
  </section>;
}

function draftFrom(member: TeamMember) { return { version: member.version, name: member.name, role: member.role }; }
function MemberEditor({ member, isSelf, lastAdmin, mailEnabled, busy, setBusy, onSuccess }: {
  member: TeamMember; isSelf: boolean; lastAdmin: boolean; mailEnabled: boolean; busy: boolean;
  setBusy: (value: boolean) => void; onSuccess: (state: TeamActionState) => void;
}) {
  const [draft, setDraft] = useState(() => draftFrom(member));
  const [operation, setOperation] = useState<TeamOperation>("update");
  const [confirmEmail, setConfirmEmail] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const confirmationRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, []);
  useEffect(() => { if (operation !== "update") confirmationRef.current?.focus(); }, [operation]);
  const [state, action, pending] = useActionState(async (previous: TeamActionState, formData: FormData): Promise<TeamActionState> => {
    setBusy(true);
    try {
      const result = await manageTeamMember(previous, formData);
      if (result.ok) {
        setDraft((current) => ({ ...current, version: Number(formData.get("version")) + 1, ...(formData.get("operation") === "update" ? { name: String(formData.get("name")).trim(), role: formData.get("role") as TeamMember["role"] } : {}) }));
        setOperation("update");
        setConfirmEmail("");
        onSuccess(result);
      }
      return result;
    } catch { return { ok: false, message: "La modification n’a pas pu être confirmée. Actualisez la page pour vérifier l’état du compte avant de réessayer." }; }
    finally { setBusy(false); }
  }, EMPTY_TEAM_ACTION_STATE);
  const stale = draft.version !== member.version && !pending && !busy;
  const locked = busy || pending || stale;
  const deleted = Boolean(member.deletedAt);
  const prefix = `member-${member.id}`;
  const selectOperation = (next: TeamOperation) => { setOperation(next); setConfirmEmail(""); };
  const protectedAccount = isSelf || lastAdmin;

  return <div>
    <h4 ref={headingRef} tabIndex={-1} className="scroll-mt-6 text-sm font-semibold outline-none">Gérer {member.name}</h4>
    <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-[10px] leading-5 text-muted"><div><dt className="inline">Créé le </dt><dd className="inline">{formatDate(member.createdAt)}</dd></div><div><dt className="inline">Sessions actives : </dt><dd className="inline font-semibold text-night">{member.activeSessions}</dd></div></dl>
    {!member.hasPassword && !deleted ? <p className="mt-4 rounded-lg border border-orange/20 bg-[#fff7f0] p-3 text-xs leading-6 text-night">Ce compte attend son activation.{member.invitationExpiresAt ? <> Dernier lien valable jusqu’au <strong className="font-semibold">{formatDate(member.invitationExpiresAt)}</strong>.</> : " Renvoyez une invitation pour permettre à cette personne de choisir son mot de passe."}</p> : null}
    {protectedAccount && !deleted ? <p className="mt-4 rounded-lg bg-paper p-3 text-[11px] leading-6 text-muted">{isSelf ? "C’est votre compte. Vous pouvez modifier votre nom. Un autre administrateur doit gérer votre rôle, votre suspension ou votre suppression. Pour fermer votre session, utilisez « Se déconnecter »." : "Ce compte est le dernier administrateur actif. Activez un autre administrateur avant de retirer ses accès."}</p> : null}
    <form action={action} onReset={(event) => event.preventDefault()} aria-busy={pending} className="mt-5 space-y-5">
      <input type="hidden" name="memberId" value={member.id} /><input type="hidden" name="version" value={draft.version} /><input type="hidden" name="operation" value={operation} />
      {!state.ok ? <Feedback state={state} /> : null}
      {stale ? <div role="alert" className="rounded-lg border border-orange/30 bg-[#fff7f0] p-4 text-xs leading-6"><p>Ce compte a été modifié depuis l’ouverture de cette fiche. Vos changements n’ont pas été écrasés. Chargez la version actuelle avant de continuer ; vos modifications non enregistrées seront remplacées.</p><button type="button" onClick={() => { setDraft(draftFrom(member)); setOperation("update"); setConfirmEmail(""); }} className="mt-2 min-h-10 font-semibold text-orange underline underline-offset-4">Charger la version à jour</button></div> : null}
      {!deleted ? <>
        <fieldset disabled={locked || operation !== "update"} className="grid min-w-0 gap-4 sm:grid-cols-2">
          <label className="block text-xs font-semibold">Nom et prénom<input name="name" required minLength={2} maxLength={120} value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} aria-invalid={state.fieldErrors?.name ? true : undefined} aria-describedby={state.fieldErrors?.name ? `${prefix}-name-error` : undefined} className={inputClass} /><FieldError state={state} name="name" prefix={prefix} /></label>
          <label className="block text-xs font-semibold">Rôle<input type="hidden" name="role" value={draft.role} /><select value={draft.role} onChange={(event) => setDraft((current) => ({ ...current, role: event.target.value as TeamMember["role"] }))} disabled={locked || operation !== "update" || protectedAccount} aria-invalid={state.fieldErrors?.role ? true : undefined} aria-describedby={state.fieldErrors?.role ? `${prefix}-role-error` : undefined} className={inputClass}><option value="advisor">Collaborateur</option><option value="admin">Administrateur</option></select><FieldError state={state} name="role" prefix={prefix} /></label>
        </fieldset>
        {operation === "update" ? <div className="flex flex-wrap items-center justify-between gap-3"><p className="max-w-xs text-[10px] leading-5 text-muted">L’adresse e-mail sert d’identifiant et reste inchangée. Un changement de rôle ferme les sessions en cours.</p><button type="submit" disabled={locked || (draft.name === member.name && draft.role === member.role)} className={`${buttonClass} bg-night text-white hover:bg-royal`}>{pending ? "Enregistrement…" : "Enregistrer"}<CareerIcon name="check" className="h-4 w-4" /></button></div> : null}
      </> : <p className="text-xs leading-6 text-muted">Compte supprimé le {formatDate(member.deletedAt)}. Restaurez sa fiche pour pouvoir modifier ses informations.</p>}
      <div className="border-t border-line pt-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted">Accès et sécurité</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {deleted ? <button type="button" disabled={locked} onClick={() => selectOperation("restore")} className={`${buttonClass} border border-line bg-white hover:border-night/40`}>Restaurer la fiche</button> : <>
            {!member.hasPassword ? <button type="button" disabled={locked || !mailEnabled} onClick={() => selectOperation("resend_invitation")} className={`${buttonClass} border border-line bg-white hover:border-night/40`}>Renvoyer l’invitation</button> : member.enabled ? <button type="button" disabled={locked || protectedAccount} onClick={() => selectOperation("disable")} className={`${buttonClass} border border-line bg-white hover:border-night/40`}>Suspendre l’accès</button> : <button type="button" disabled={locked} onClick={() => selectOperation("enable")} className={`${buttonClass} border border-line bg-white hover:border-night/40`}>Réactiver l’accès</button>}
            <button type="button" disabled={locked || isSelf || member.activeSessions === 0} onClick={() => selectOperation("revoke_sessions")} className={`${buttonClass} border border-line bg-white hover:border-night/40`}>Fermer les sessions</button>
            <button type="button" disabled={locked || protectedAccount} onClick={() => selectOperation("delete")} className={`${buttonClass} border border-[#d6a8a4] bg-white text-[#913b34] hover:bg-[#f8eeee]`}>Supprimer le compte</button>
          </>}
        </div>
        {!mailEnabled && !member.hasPassword && !deleted ? <p className="mt-3 text-[11px] leading-6 text-orange">L’envoi des invitations est indisponible. Vérifiez la configuration des e-mails.</p> : null}
      </div>
      {operation !== "update" ? <div role="region" aria-labelledby={`${prefix}-confirmation`} className={`rounded-lg border p-4 ${operation === "delete" ? "border-[#d6a8a4] bg-[#fff7f6]" : "border-night/15 bg-white"}`}>
        <h5 ref={confirmationRef} tabIndex={-1} id={`${prefix}-confirmation`} className="scroll-mt-6 text-sm font-semibold outline-none">{operationCopy[operation].title}</h5>
        <p className="mt-2 break-words text-xs leading-6 text-muted">{operationCopy[operation].description}</p>
        <p className="mt-2 break-all text-xs font-semibold leading-6">{member.name} · {member.email}</p>
        {operation === "delete" ? <label className="mt-4 block text-xs font-semibold">Saisissez l’adresse e-mail du compte pour confirmer<input name="confirmEmail" type="email" autoComplete="off" required value={confirmEmail} onChange={(event) => setConfirmEmail(event.target.value)} disabled={locked} aria-invalid={state.fieldErrors?.confirmEmail ? true : undefined} aria-describedby={state.fieldErrors?.confirmEmail ? `${prefix}-confirmEmail-error` : undefined} className={inputClass} /><FieldError state={state} name="confirmEmail" prefix={prefix} /></label> : null}
        <div className="mt-4 flex flex-wrap gap-2"><button type="submit" disabled={locked || (operation === "delete" && confirmEmail.trim().toLowerCase() !== member.email.toLowerCase())} className={`${buttonClass} ${operation === "delete" ? "bg-[#913b34] text-white hover:bg-[#752d28]" : "bg-night text-white hover:bg-royal"}`}>{pending ? "Traitement en cours…" : operationCopy[operation].button}</button><button type="button" disabled={locked} onClick={() => selectOperation("update")} className={`${buttonClass} border border-line bg-white hover:border-night/40`}>Annuler</button></div>
      </div> : null}
    </form>
  </div>;
}
