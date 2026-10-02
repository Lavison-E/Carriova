import "server-only";
import { createHmac, randomUUID } from "node:crypto";
import { db } from "@/db";
import { integrationLogs } from "@/db/schema";
import { serverEnv } from "@/lib/env";

/**
 * Notifications sortantes après une demande : e-mails (Resend), WhatsApp (Cloud API), webhook CRM.
 *
 * - Chaque canal reste inactif tant que ses variables d’environnement ne sont pas configurées.
 * - Exécuté via `after()` : un échec n’empêche jamais l’enregistrement du lead (déjà en base).
 * - Chaque tentative est tracée dans `integration_logs` (aucun secret journalisé).
 */

export type LeadEventName =
  | "lead.created"
  | "account.created"
  | "coaching.requested"
  | "newsletter.subscribed";

export type LeadPayload = {
  type: string;
  status: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  whatsapp?: string | null;
  objective?: string | null;
  interest?: string | null;
  message?: string | null;
  source?: string | null;
  landingPage?: string | null;
  consentPrivacy: boolean;
  consentMarketing: boolean;
};

export type LeadEvent = {
  name: LeadEventName;
  leadId: number | null;
  lead: LeadPayload;
};

type Outcome = { status: "sent" | "failed"; detail?: string };
type Attempt = { channel: "email" | "whatsapp" | "crm"; event: string; outcome: Outcome };

const TIMEOUT_MS = 8_000;

/** Étapes du cycle de vie CRM : VISITOR → PROSPECT → LEAD → ACCOUNT_CREATED → CUSTOMER… */
const LIFECYCLE: Record<LeadEventName, string> = {
  "newsletter.subscribed": "PROSPECT",
  "lead.created": "LEAD",
  "coaching.requested": "LEAD",
  "account.created": "ACCOUNT_CREATED",
};

const TYPE_LABELS: Record<string, string> = {
  contact: "Demande de contact",
  coaching: "Demande de coaching",
  resource: "Demande de ressource",
  newsletter: "Inscription aux conseils carrière",
  account: "Préinscription à l’espace CARRIOVA",
  api: "Demande reçue via l’API",
};

const ACK_TEXT: Record<string, string> = {
  contact: "Nous avons bien reçu votre message. Un membre de l’équipe CARRIOVA vous répondra.",
  coaching:
    "Nous avons bien reçu votre demande de séance. Nous reviendrons vers vous pour confirmer un créneau selon les disponibilités. Aucun paiement n’a été déclenché.",
  resource:
    "Nous avons bien reçu votre demande de ressource. L’équipe CARRIOVA vous l’enverra prochainement.",
  newsletter:
    "Votre inscription aux conseils carrière CARRIOVA est enregistrée. Pour vous désinscrire à tout moment, répondez simplement à cet e-mail.",
  account:
    "Votre préinscription à l’espace CARRIOVA est enregistrée. Nous vous informerons de l’ouverture de votre espace.",
  api: "Nous avons bien reçu votre demande. Un membre de l’équipe CARRIOVA vous recontactera.",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function oneLine(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function describe(error: unknown) {
  return (error instanceof Error ? error.message : String(error)).slice(0, 280);
}

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}${path}`;
}

async function postJson(url: string, body: string, headers: Record<string, string>): Promise<Outcome> {
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body,
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (response.ok) return { status: "sent" };
    const text = await response.text().catch(() => "");
    return { status: "failed", detail: `HTTP ${response.status} ${text}`.slice(0, 280) };
  } catch (error) {
    return { status: "failed", detail: describe(error) };
  }
}

// --- E-mail (Resend) ------------------------------------------------------------

function sendEmail(message: {
  to: string[];
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}) {
  const { email } = serverEnv;
  return postJson(
    joinUrl(email.baseUrl, "/emails"),
    JSON.stringify({
      from: email.from,
      to: message.to,
      subject: oneLine(message.subject).slice(0, 200),
      html: message.html,
      text: message.text,
      ...(message.replyTo ? { reply_to: message.replyTo } : {}),
    }),
    { Authorization: `Bearer ${email.apiKey}` },
  );
}

function teamEmail(event: LeadEvent) {
  const lead = event.lead;
  const label = TYPE_LABELS[lead.type] ?? lead.type;
  const entries: Array<[string, string | null | undefined]> = [
    ["Type", label],
    ["Étape CRM", LIFECYCLE[event.name]],
    ["Prénom", lead.firstName],
    ["Nom", lead.lastName],
    ["E-mail", lead.email],
    ["WhatsApp", lead.whatsapp],
    ["Objectif", lead.objective],
    ["Intérêt", lead.interest],
    ["Page d’entrée", lead.landingPage],
    ["Source", lead.source],
    ["Accord pour être recontacté(e)", lead.consentMarketing ? "oui" : "non"],
    ["Message", lead.message],
  ];
  const rows = entries.filter((entry): entry is [string, string] => Boolean(entry[1]));
  const name = [lead.firstName, lead.lastName].filter(Boolean).join(" ");

  return {
    subject: `[CARRIOVA] ${label} — ${name}`,
    text: rows.map(([key, value]) => `${key} : ${value}`).join("\n"),
    html: `<div style="font-family:Arial,Helvetica,sans-serif;color:#0b1638"><h2 style="color:#001252;margin:0 0 12px">${escapeHtml(
      label,
    )}</h2><table cellpadding="6" style="border-collapse:collapse;font-size:14px">${rows
      .map(
        ([key, value]) =>
          `<tr><td style="color:#4b5878;vertical-align:top;white-space:nowrap">${escapeHtml(
            key,
          )}</td><td style="white-space:pre-wrap">${escapeHtml(value)}</td></tr>`,
      )
      .join("")}</table></div>`,
  };
}

function userEmail(event: LeadEvent) {
  const lead = event.lead;
  const greeting =
    lead.firstName && lead.firstName !== "Abonné" ? `Bonjour ${oneLine(lead.firstName)},` : "Bonjour,";
  const body = ACK_TEXT[lead.type] ?? ACK_TEXT.api;
  const notice = `Vous recevez cet e-mail suite à une demande effectuée avec cette adresse sur ${serverEnv.NEXT_PUBLIC_SITE_URL}. S’il ne s’agit pas de vous, ignorez ce message ou écrivez à ${serverEnv.CONTACT_EMAIL}.`;

  return {
    subject: "CARRIOVA — nous avons bien reçu votre demande",
    text: `${greeting}\n\n${body}\n\nL’équipe CARRIOVA\nRévélez votre potentiel. Boostez votre carrière.\n\n${notice}`,
    html: `<div style="font-family:Arial,Helvetica,sans-serif;color:#0b1638;line-height:1.6;max-width:560px"><p style="font-size:20px;font-weight:800;color:#001252;margin:0 0 16px">CARRIOVA</p><p>${escapeHtml(
      greeting,
    )}</p><p>${escapeHtml(body)}</p><p>L’équipe CARRIOVA<br><span style="color:#ee5e08">Révélez votre potentiel. Boostez votre carrière.</span></p><p style="font-size:12px;color:#4b5878">${escapeHtml(
      notice,
    )}</p></div>`,
  };
}

// --- WhatsApp (Cloud API) ----------------------------------------------------------

/** Numéro saisi au format international (+225… ou 00225…) → chiffres E.164 ; sinon null. */
export function toInternationalNumber(raw?: string | null): string | null {
  const value = (raw ?? "").trim();
  if (!/^(\+|00)/.test(value)) return null;
  const digits = value.replace(/^(\+|00)/, "").replace(/[\s().-]/g, "");
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

function sendWhatsAppTemplate(to: string, firstName: string) {
  const wa = serverEnv.whatsappApi;
  return postJson(
    joinUrl(wa.baseUrl, `/${wa.apiVersion}/${wa.phoneNumberId}/messages`),
    JSON.stringify({
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to,
      type: "template",
      template: {
        name: wa.templateName,
        language: { code: wa.templateLang },
        components: [
          {
            type: "body",
            parameters: [{ type: "text", text: oneLine(firstName).slice(0, 60) || "Bonjour" }],
          },
        ],
      },
    }),
    { Authorization: `Bearer ${wa.token}` },
  );
}

// --- Webhook CRM --------------------------------------------------------------------

function pushToCrm(event: LeadEvent) {
  const { crm } = serverEnv;
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const body = JSON.stringify({
    event: event.name,
    occurredAt: new Date().toISOString(),
    source: "carriova-website",
    lifecycleStage: LIFECYCLE[event.name],
    lead: { id: event.leadId, ...event.lead },
  });
  const headers: Record<string, string> = {
    "User-Agent": "CARRIOVA-Webhook/1.0",
    "X-Carriova-Event": event.name,
    "X-Carriova-Delivery": randomUUID(),
    "X-Carriova-Timestamp": timestamp,
  };
  if (crm.secret) {
    const signature = createHmac("sha256", crm.secret).update(`${timestamp}.${body}`).digest("hex");
    headers["X-Carriova-Signature"] = `sha256=${signature}`;
  }
  return postJson(crm.url, body, headers);
}

// --- Orchestration --------------------------------------------------------------------

export async function dispatchLeadEvent(event: LeadEvent): Promise<void> {
  const { email, whatsappApi, crm } = serverEnv;
  const lead = event.lead;
  const tasks: Array<Promise<Attempt>> = [];

  function track(channel: Attempt["channel"], name: string, outcome: Promise<Outcome>) {
    tasks.push(outcome.then((result) => ({ channel, event: name, outcome: result })));
  }

  if (email.enabled) {
    if (email.notify.length > 0) {
      track(
        "email",
        `${event.name}:team`,
        sendEmail({ to: email.notify, replyTo: lead.email, ...teamEmail(event) }),
      );
    }
    // Aucun e-mail newsletter sans accord explicite.
    if (lead.type !== "newsletter" || lead.consentMarketing) {
      track(
        "email",
        `${event.name}:ack`,
        sendEmail({ to: [lead.email], replyTo: serverEnv.CONTACT_EMAIL, ...userEmail(event) }),
      );
    }
  }

  // WhatsApp : uniquement avec accord explicite et numéro international.
  const whatsappTo = toInternationalNumber(lead.whatsapp);
  if (whatsappApi.enabled && lead.consentMarketing && whatsappTo) {
    track("whatsapp", event.name, sendWhatsAppTemplate(whatsappTo, lead.firstName));
  }

  if (crm.enabled) track("crm", event.name, pushToCrm(event));

  if (tasks.length === 0) return;
  const attempts = await Promise.all(tasks);

  for (const attempt of attempts) {
    if (attempt.outcome.status === "failed") {
      console.error(
        `[integrations] ${attempt.channel} ${attempt.event} failed: ${attempt.outcome.detail ?? "unknown error"}`,
      );
    }
  }

  try {
    await db.insert(integrationLogs).values(
      attempts.map((attempt) => ({
        channel: attempt.channel,
        event: attempt.event.slice(0, 60),
        status: attempt.outcome.status,
        leadId: event.leadId,
        detail: attempt.outcome.detail?.slice(0, 300) ?? null,
      })),
    );
  } catch (error) {
    console.error("[integrations] unable to write integration_logs:", describe(error));
  }
}
