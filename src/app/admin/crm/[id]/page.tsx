import { notFound, redirect } from "next/navigation";
import type { ReactNode } from "react";
import { CrmLeadEditor } from "@/components/admin/CrmLeadEditor";
import { CrmShell, CrmStatusBadge, CrmUnavailable, formatCrmDate } from "@/components/admin/CrmShell";
import { crmPriorityOptions, crmStatusOptions, type CrmHistoryItem, type CrmLeadDetail } from "@/lib/crm";
import { getCrmLead } from "@/lib/crm-queries";
import { qualificationLabel } from "@/lib/qualification";
import { getStaffSession, UnauthorizedError, type StaffIdentity } from "@/lib/staff-auth";

export const dynamic = "force-dynamic";
export const metadata = { title: "Dossier prospect | CRM CARRIOVA", robots: { index: false, follow: false } };

async function getLeadSnapshot(id: number) {
  const lead = await getCrmLead(id);
  return { lead, now: Date.now() };
}

function DetailRow({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0 border-t border-line pt-4"><dt className="text-[10px] font-semibold uppercase tracking-[0.08em] text-muted">{label}</dt><dd className="mt-2 break-words text-sm leading-7 text-night">{children}</dd></div>;
}

function statusLabel(value: string | null) {
  return crmStatusOptions.find((option) => option.value === value)?.label ?? value ?? "Non renseigné";
}

function historyChanges(item: CrmHistoryItem) {
  const lines: string[] = [];
  if (item.previousStatus && item.status && item.previousStatus !== item.status) lines.push(`Statut : ${statusLabel(item.previousStatus)} → ${statusLabel(item.status)}`);
  for (const [key, value] of Object.entries(item.changes ?? {})) {
    if (!value || typeof value !== "object" || (key !== "priority" && key !== "followUpAt")) continue;
    const { from, to } = value as { from?: unknown; to?: unknown };
    if (from === to) continue;
    if (key === "priority" && typeof to === "string") {
      const label = crmPriorityOptions.find((option) => option.value === to)?.label;
      if (label) lines.push(`Priorité : ${label}`);
    }
    if (key === "followUpAt" && (typeof to === "string" || to === null)) lines.push(`Relance : ${to ? formatCrmDate(to) : "retirée"}`);
  }
  return lines;
}

export default async function CrmLeadPage({ params }: { params: Promise<{ id: string }> }) {
  let user: StaffIdentity | null;
  try { user = await getStaffSession(); }
  catch { return <CrmShell user={null} title="Dossier prospect" back><CrmUnavailable /></CrmShell>; }
  if (!user) redirect("/admin/connexion");
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || !Number.isSafeInteger(Number(id))) notFound();
  let lead: CrmLeadDetail | null;
  let now: number;
  try { ({ lead, now } = await getLeadSnapshot(Number(id))); }
  catch (error) {
    if (error instanceof UnauthorizedError) redirect("/admin/connexion");
    return <CrmShell user={user} title="Dossier prospect" back><CrmUnavailable retryHref={`/admin/crm/${id}`} /></CrmShell>;
  }
  if (!lead) notFound();
  const qualification = lead.qualification;
  const overdue = lead.followUpAt && new Date(lead.followUpAt).getTime() < now;
  const sourceLabels: Record<string, string> = { qualification_form: "Formulaire de qualification", contact_page: "Formulaire de contact", account_creation: "Préinscription", resource_gate: "Demande de ressource", newsletter: "Newsletter" };

  return (
    <CrmShell user={user} title={lead.fullName} description={`Dossier #${lead.id} · Reçu le ${formatCrmDate(lead.createdAt)} · Dernière mise à jour le ${formatCrmDate(lead.updatedAt)}`} back>
      <div className="mb-7 flex flex-wrap items-center gap-3"><CrmStatusBadge status={lead.status} /><span className={`rounded-md border px-2.5 py-1 text-[11px] font-medium ${lead.priority === "high" ? "border-orange/25 bg-[#fff0e5] text-orange" : "border-line bg-white text-muted"}`}>Priorité {crmPriorityOptions.find((option) => option.value === lead.priority)?.label.toLocaleLowerCase("fr") ?? lead.priority}</span>{lead.followUpAt ? <span className={`text-xs ${overdue ? "font-medium text-orange" : "text-muted"}`}>{overdue ? "Relance en retard" : "Relance prévue"} · {formatCrmDate(lead.followUpAt)}</span> : null}</div>

      <div className="grid items-start gap-7 lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-7">
          <section className="rounded-xl border border-line bg-white p-5 sm:p-7" aria-labelledby="crm-profile-title">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">01 / Votre interlocuteur</p><h2 id="crm-profile-title" className="mt-3 text-xl font-semibold tracking-tight">Profil et coordonnées</h2>
            <dl className="mt-6 grid gap-x-7 gap-y-5 sm:grid-cols-2">
              <DetailRow label="Nom et prénom">{lead.fullName}</DetailRow>
              <DetailRow label="WhatsApp"><span className="break-all">{lead.whatsapp || "Non renseigné"}</span></DetailRow>
              <DetailRow label="Pays de résidence">{qualificationLabel("country", lead.country)}</DetailRow>
              <DetailRow label="Situation professionnelle">{qualificationLabel("profile", lead.profile)}</DetailRow>
              <DetailRow label="E-mail"><span className="break-all">{lead.email || "Non demandé dans le questionnaire"}</span></DetailRow>
              <DetailRow label="Source du dossier">{sourceLabels[lead.source ?? ""] ?? lead.source ?? "Non renseignée"}</DetailRow>
              {qualification ? <DetailRow label="Découverte de Carriova">{qualificationLabel("discoverySource", qualification.discoverySource)}</DetailRow> : null}
            </dl>
          </section>

          <section className="rounded-xl border border-line bg-white p-5 sm:p-7" aria-labelledby="crm-need-title">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">02 / Son projet</p><h2 id="crm-need-title" className="mt-3 text-xl font-semibold tracking-tight">Besoin et priorités</h2>
            <dl className="mt-6 grid gap-x-7 gap-y-5 sm:grid-cols-2">
              <DetailRow label="Besoin principal">{qualificationLabel("need", lead.need)}</DetailRow>
              <DetailRow label="Budget envisagé">{qualificationLabel("budget", lead.budget)}</DetailRow>
              {qualification ? <><DetailRow label="État du CV">{qualificationLabel("cvStatus", qualification.cvStatus)}</DetailRow><DetailRow label="Délai souhaité">{qualificationLabel("timeline", qualification.timeline)}</DetailRow><DetailRow label="Offre ciblée">{qualificationLabel("targetOffer", qualification.targetOffer)}</DetailRow><DetailRow label="Difficulté principale">{qualificationLabel("difficulty", qualification.difficulty)}</DetailRow><DetailRow label="Intention d’achat">{qualificationLabel("paymentReadiness", qualification.paymentReadiness)}</DetailRow></> : null}
            </dl>
            {!qualification ? <p className="mt-5 text-xs leading-6 text-muted">Ce dossier provient d’un autre formulaire. Les réponses au questionnaire de qualification ne sont pas disponibles.</p> : null}
            <div className="mt-6 border-t border-line pt-5"><h3 className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted">Précision du prospect</h3><p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-night">{lead.message || "Aucune précision ajoutée."}</p></div>
          </section>

          <section className="rounded-xl border border-line bg-white p-5 sm:p-7" aria-labelledby="crm-consent-title">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">03 / Préférences</p><h2 id="crm-consent-title" className="mt-3 text-xl font-semibold tracking-tight">Autorisations de contact</h2>
            <dl className="mt-6 grid gap-x-7 gap-y-5 sm:grid-cols-2">
              <DetailRow label="Traitement de la demande">{lead.consentPrivacy ? "Accord donné" : "Accord non renseigné"}</DetailRow>
              <DetailRow label="Échange individuel sur WhatsApp">{qualification ? qualification.contactWhatsApp === "yes" ? "Souhaité par le prospect" : "Non souhaité" : "Choix non renseigné"}</DetailRow>
              <DetailRow label="Communications marketing">{lead.consentMarketing ? "Acceptées" : "Non acceptées"}</DetailRow>
              {qualification ? <><DetailRow label="Version du consentement">{qualification.consentVersion}</DetailRow><DetailRow label="Demande enregistrée le">{formatCrmDate(qualification.submittedAt)}</DetailRow></> : null}
            </dl>
            <p className="mt-5 border-t border-line pt-4 text-xs leading-6 text-muted">L’accord marketing et le choix d’un échange individuel sont distincts. Le bouton WhatsApp respecte le choix de contact individuel et la validité du numéro.</p>
          </section>

          <section className="rounded-xl border border-line bg-white p-5 sm:p-7" aria-labelledby="crm-history-title">
            <div className="flex items-center justify-between gap-4"><h2 id="crm-history-title" className="text-xl font-semibold tracking-tight">Historique du suivi</h2><span className="text-xs text-muted">{lead.history.length} événement{lead.history.length > 1 ? "s" : ""}</span></div>
            {lead.history.length ? <ol className="mt-6 space-y-6">{lead.history.map((item) => {
              const changes = historyChanges(item);
              return <li key={item.id} className="relative border-l border-line pl-5"><span className="absolute -left-[4px] top-2 h-[7px] w-[7px] rounded-full bg-orange" aria-hidden="true" /><div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1"><h3 className="text-sm font-semibold text-night">{item.action === "qualification_submitted" ? "Demande reçue" : item.action === "updated_with_note" ? "Suivi et note enregistrés" : "Suivi mis à jour"}</h3><time dateTime={item.createdAt} className="text-[10px] leading-6 text-muted">{formatCrmDate(item.createdAt)}</time></div><p className="mt-1 text-xs text-muted">{item.actorName || (item.action === "qualification_submitted" ? "Formulaire public" : "Système")}</p>{changes.length ? <ul className="mt-3 space-y-1 text-xs leading-6 text-muted">{changes.map((change) => <li key={change}>{change}</li>)}</ul> : null}{item.note ? <p className="mt-3 whitespace-pre-wrap break-words rounded-lg bg-paper px-4 py-3 text-sm leading-7 text-night">{item.note}</p> : null}</li>;
            })}</ol> : <p className="mt-4 text-sm leading-7 text-muted">Aucune action de suivi enregistrée. La première mise à jour apparaîtra ici.</p>}
          </section>
        </div>
        <CrmLeadEditor key={lead.id} lead={lead} />
      </div>
    </CrmShell>
  );
}
