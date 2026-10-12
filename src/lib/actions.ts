"use server";

import { headers } from "next/headers";
import { after } from "next/server";
import { databaseConfigured, getDb } from "@/db";
import { accounts, analyticsEvents, coachingRequests, leads } from "@/db/schema";
import { serverEnv } from "@/lib/env";
import { dispatchLeadEvent, type LeadEventName, type LeadPayload } from "@/lib/integrations";
import { clip, isEmail, looksLikeBot, rateLimit, sanitizePhone } from "@/lib/security";

function asString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export type ActionState = {
  ok: boolean;
  message: string;
  fieldErrors?: Record<string, string>;
};

async function clientKey(scope: string) {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "unknown";
  return `${scope}:${ip}`;
}

const genericError = "Le service est temporairement indisponible. Réessayez dans un instant.";
const rateError = "Trop de tentatives. Merci de patienter quelques minutes.";

const COACHING_LABELS: Record<string, string> = {
  individuel: "Coaching individuel",
  orientation: "Orientation professionnelle",
  employabilite: "Employabilité",
  entretien: "Préparation aux entretiens",
  positionnement: "Positionnement professionnel",
  progression: "Progression de carrière",
};

/** E-mails, WhatsApp et CRM partent après la réponse : un échec n’annule jamais la demande. */
function scheduleIntegrations(name: LeadEventName, leadId: number, lead: LeadPayload) {
  after(() => dispatchLeadEvent({ name, leadId, lead }));
}

function scheduleAnalytics(event: typeof analyticsEvents.$inferInsert) {
  after(async () => {
    try {
      await getDb().insert(analyticsEvents).values(event);
    } catch {
      // La mesure d’audience ne doit jamais faire échouer une demande déjà enregistrée.
      console.error("[analytics] unable to record submission event");
    }
  });
}

/** N’annonce un accusé de réception que si l’envoi d’e-mails est réellement configuré. */
function confirmationNote() {
  return serverEnv.email.enabled ? " Un e-mail de confirmation va vous être envoyé." : "";
}

export async function submitLead(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (looksLikeBot(formData)) {
    return { ok: true, message: "Merci. Votre demande a bien été enregistrée." };
  }
  if (!rateLimit(await clientKey("lead")).ok) {
    return { ok: false, message: rateError };
  }

  const firstName = clip(asString(formData, "firstName"), 80);
  const lastName = clip(asString(formData, "lastName"), 80);
  const email = asString(formData, "email").toLowerCase();
  const whatsapp = sanitizePhone(asString(formData, "whatsapp"));
  const objective = clip(asString(formData, "objective"), 160);
  const interest = clip(asString(formData, "interest"), 160);
  const message = clip(asString(formData, "message"), 4000);
  const type = clip(asString(formData, "type") || "contact", 40);
  const source = clip(asString(formData, "source") || "website", 80);
  const landingPage = clip(asString(formData, "landingPage") || "/", 200);
  const consentPrivacy = asString(formData, "consentPrivacy") === "on";
  const consentMarketing = asString(formData, "consentMarketing") === "on";
  const isNewsletter = type === "newsletter";

  const fieldErrors: Record<string, string> = {};
  if (!firstName) fieldErrors.firstName = "Indiquez votre prénom.";
  if (!email || !isEmail(email)) fieldErrors.email = "Indiquez un e-mail valide.";
  if (!consentPrivacy) {
    fieldErrors.consentPrivacy = "Le consentement à la politique de confidentialité est requis.";
  }
  if (isNewsletter && !consentMarketing) {
    fieldErrors.consentMarketing = "Cochez cette case pour recevoir nos conseils carrière.";
  }

  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: "Merci de corriger les champs indiqués.", fieldErrors };
  }

  const lead: LeadPayload = {
    type,
    status: isNewsletter ? "prospect" : "lead",
    firstName,
    lastName: lastName || null,
    email,
    whatsapp: whatsapp || null,
    objective: objective || null,
    interest: interest || null,
    message: message || null,
    source,
    landingPage,
    consentPrivacy,
    consentMarketing,
  };

  let leadId: number;
  try {
    const [row] = await getDb().insert(leads).values(lead).returning({ id: leads.id });
    leadId = row.id;
  } catch {
    return { ok: false, message: genericError };
  }

  scheduleAnalytics({
    eventName: isNewsletter ? "newsletter_signup" : "lead_form_submit",
    path: landingPage,
    metadata: JSON.stringify({ type, interest, objective }),
  });
  scheduleIntegrations(isNewsletter ? "newsletter.subscribed" : "lead.created", leadId, lead);

  return {
    ok: true,
    message: isNewsletter
      ? `Votre inscription aux conseils carrière est enregistrée.${confirmationNote()}`
      : `Merci. Votre demande a bien été enregistrée. Un membre de l’équipe CARRIOVA vous recontactera.${confirmationNote()}`,
  };
}

export async function submitNewsletter(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  formData.set("type", "newsletter");
  formData.set("firstName", asString(formData, "firstName") || "Abonné");
  return submitLead(_prev, formData);
}

export async function createAccount(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (looksLikeBot(formData)) {
    return { ok: true, message: "Votre préinscription est enregistrée." };
  }
  if (!rateLimit(await clientKey("account"), 5).ok) {
    return { ok: false, message: rateError };
  }

  const firstName = clip(asString(formData, "firstName"), 80);
  const lastName = clip(asString(formData, "lastName"), 80);
  const email = asString(formData, "email").toLowerCase();
  const objective = clip(asString(formData, "objective"), 160);
  const consentPrivacy = asString(formData, "consentPrivacy") === "on";
  const consentMarketing = asString(formData, "consentMarketing") === "on";

  const fieldErrors: Record<string, string> = {};
  if (!firstName) fieldErrors.firstName = "Indiquez votre prénom.";
  if (!lastName) fieldErrors.lastName = "Indiquez votre nom.";
  if (!email || !isEmail(email)) fieldErrors.email = "Indiquez un e-mail valide.";
  if (!consentPrivacy) {
    fieldErrors.consentPrivacy =
      "Acceptez la politique de confidentialité pour créer un compte.";
  }

  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: "Merci de corriger les champs indiqués.", fieldErrors };
  }

  const lead: LeadPayload = {
    type: "account",
    status: "account_created",
    firstName,
    lastName,
    email,
    objective: objective || null,
    source: "account_creation",
    landingPage: "/compte/creer",
    consentPrivacy,
    consentMarketing,
  };

  let leadId: number | null;
  try {
    leadId = await getDb().transaction(async (tx) => {
      const [account] = await tx
        .insert(accounts)
        .values({ firstName, lastName, email, objective: objective || null, consentMarketing })
        .onConflictDoNothing({ target: accounts.email })
        .returning({ id: accounts.id });
      if (!account) return null;

      const [row] = await tx.insert(leads).values(lead).returning({ id: leads.id });
      return row.id;
    });
  } catch {
    return { ok: false, message: genericError };
  }

  if (leadId !== null) {
    scheduleAnalytics({
      eventName: "account_created",
      path: "/compte/creer",
      metadata: JSON.stringify({ objective }),
    });
    scheduleIntegrations("account.created", leadId, lead);
  }

  return {
    ok: true,
    message: "Votre préinscription est enregistrée. Si cette adresse était déjà inscrite, elle est conservée. L’espace de connexion n’est pas encore ouvert.",
  };
}

export async function loginAccount(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (!rateLimit(await clientKey("login"), 10, 5 * 60 * 1000).ok) {
    return { ok: false, message: rateError };
  }

  const email = asString(formData, "email").toLowerCase();
  if (!email || !isEmail(email)) {
    return {
      ok: false,
      message: "Indiquez l’e-mail de votre compte.",
      fieldErrors: { email: "E-mail invalide." },
    };
  }

  if (databaseConfigured) {
    scheduleAnalytics({ eventName: "login_request", path: "/compte/connexion" });
  }
  return {
    ok: false,
    message: "L’espace de connexion n’est pas encore ouvert. Les préinscriptions seront informées de son ouverture par e-mail.",
  };
}

export async function submitCoaching(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  if (looksLikeBot(formData)) {
    return { ok: true, message: "Votre demande de séance a été enregistrée." };
  }
  if (!rateLimit(await clientKey("coaching"), 5).ok) {
    return { ok: false, message: rateError };
  }

  const firstName = clip(asString(formData, "firstName"), 80);
  const lastName = clip(asString(formData, "lastName"), 80);
  const email = asString(formData, "email").toLowerCase();
  const whatsapp = sanitizePhone(asString(formData, "whatsapp"));
  const requestedCoachingType = asString(formData, "coachingType");
  const coachingType = Object.hasOwn(COACHING_LABELS, requestedCoachingType)
    ? COACHING_LABELS[requestedCoachingType]
    : "";
  const availability = clip(asString(formData, "availability"), 200);
  const message = clip(asString(formData, "message"), 4000);
  const consentPrivacy = asString(formData, "consentPrivacy") === "on";
  const consentMarketing = asString(formData, "consentMarketing") === "on";

  const fieldErrors: Record<string, string> = {};
  if (!firstName) fieldErrors.firstName = "Indiquez votre prénom.";
  if (!lastName) fieldErrors.lastName = "Indiquez votre nom.";
  if (!email || !isEmail(email)) fieldErrors.email = "Indiquez un e-mail valide.";
  if (!coachingType) fieldErrors.coachingType = "Choisissez un type de séance.";
  if (!consentPrivacy) {
    fieldErrors.consentPrivacy = "Le consentement à la politique de confidentialité est requis.";
  }

  if (Object.keys(fieldErrors).length) {
    return { ok: false, message: "Merci de corriger les champs indiqués.", fieldErrors };
  }

  const lead: LeadPayload = {
    type: "coaching",
    status: "lead",
    firstName,
    lastName,
    email,
    whatsapp: whatsapp || null,
    interest: coachingType,
    message:
      [message, availability ? `Disponibilités : ${availability}` : ""].filter(Boolean).join("\n\n") ||
      null,
    source: "coaching_form",
    landingPage: "/solutions/coaching",
    consentPrivacy,
    consentMarketing,
  };

  let leadId: number;
  try {
    leadId = await getDb().transaction(async (tx) => {
      await tx.insert(coachingRequests).values({
        firstName,
        lastName,
        email,
        whatsapp: whatsapp || null,
        coachingType,
        availability: availability || null,
        message: message || null,
        consentPrivacy,
      });

      const [row] = await tx.insert(leads).values(lead).returning({ id: leads.id });
      return row.id;
    });
  } catch {
    return { ok: false, message: genericError };
  }

  scheduleAnalytics({
    eventName: "coaching_booking",
    path: "/solutions/coaching",
    metadata: JSON.stringify({ coachingType }),
  });

  scheduleIntegrations("coaching.requested", leadId, lead);

  return {
    ok: true,
    message: `Votre demande de séance a été enregistrée. Nous reviendrons vers vous pour confirmer un créneau selon les disponibilités. Aucun paiement n’est déclenché ici.${confirmationNote()}`,
  };
}
