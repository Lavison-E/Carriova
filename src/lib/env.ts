import "server-only";
import { isEmail } from "./security";
import {
  DEFAULT_SITE_URL,
  normalizePlausibleDomain,
  normalizeSiteUrl,
  normalizeWhatsappNumber,
} from "./site";

/**
 * Accès centralisé et validé aux variables d’environnement côté serveur.
 *
 * - Ne jamais importer ce module depuis un Client Component : `server-only` fait échouer le build.
 * - Seules les variables NEXT_PUBLIC_* atteignent le navigateur (voir src/lib/site.ts).
 * - Chaque intégration reste désactivée tant que sa configuration est absente ou invalide.
 * - Les valeurs secrètes ne sont jamais journalisées ni exposées.
 */

export const DEFAULT_CONTACT_EMAIL = "bonjour@carriova.com";
export const MIN_ADMIN_TOKEN_LENGTH = 32;
const DEFAULT_RESEND_BASE_URL = "https://api.resend.com";
const DEFAULT_WHATSAPP_BASE_URL = "https://graph.facebook.com";
const DEFAULT_WHATSAPP_API_VERSION = "v23.0";

export type EnvIssue = {
  key: string;
  level: "error" | "warning";
  message: string;
};

export type ServerEnv = {
  DATABASE_URL: string;
  NEXT_PUBLIC_SITE_URL: string;
  CONTACT_EMAIL: string;
  isProduction: boolean;
  email: {
    enabled: boolean;
    apiKey: string;
    from: string;
    notify: string[];
    baseUrl: string;
  };
  whatsappApi: {
    enabled: boolean;
    token: string;
    phoneNumberId: string;
    templateName: string;
    templateLang: string;
    apiVersion: string;
    baseUrl: string;
  };
  crm: {
    enabled: boolean;
    url: string;
    secret: string;
  };
  adminApiToken: string;
  verification: {
    google: string;
    bing: string;
  };
};

function read(key: string) {
  return (process.env[key] ?? "").trim();
}

/** URL de service : HTTPS obligatoire ; HTTP toléré hors production ou vers localhost (tests). */
function serviceUrl(value: string, isProduction: boolean): string | null {
  try {
    const url = new URL(value);
    const isLocal = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
    if (url.protocol === "https:") return url.toString();
    if (url.protocol === "http:" && (isLocal || !isProduction)) return url.toString();
  } catch {
    // URL invalide
  }
  return null;
}

/** Extrait l’adresse de « Nom <adresse@domaine> ». */
function senderAddress(value: string) {
  const match = value.match(/<([^<>]+)>\s*$/);
  return (match ? match[1] : value).trim();
}

function loadServerEnv(): { env: ServerEnv; issues: EnvIssue[] } {
  const issues: EnvIssue[] = [];
  const warn = (key: string, message: string) => {
    issues.push({ key, level: "warning", message });
  };
  const fail = (key: string, message: string) => {
    issues.push({ key, level: "error", message });
  };
  const isProduction = process.env.NODE_ENV === "production";

  // --- Socle ---------------------------------------------------------------
  const databaseUrl = read("DATABASE_URL");
  if (!databaseUrl) {
    fail("DATABASE_URL", "manquante : PostgreSQL est inaccessible.");
  } else if (!/^postgres(ql)?:\/\//i.test(databaseUrl)) {
    fail("DATABASE_URL", "doit commencer par postgres:// ou postgresql://.");
  }

  const rawSiteUrl = read("NEXT_PUBLIC_SITE_URL");
  const siteUrl = normalizeSiteUrl(rawSiteUrl);
  if (!rawSiteUrl) {
    warn("NEXT_PUBLIC_SITE_URL", `absente : repli sur ${DEFAULT_SITE_URL}.`);
  } else if (!siteUrl) {
    fail("NEXT_PUBLIC_SITE_URL", `URL invalide : repli sur ${DEFAULT_SITE_URL}.`);
  } else if (isProduction && !siteUrl.startsWith("https://")) {
    warn("NEXT_PUBLIC_SITE_URL", "HTTPS attendu en production.");
  }

  const rawContact = read("CONTACT_EMAIL");
  const contactValid = rawContact !== "" && isEmail(rawContact);
  if (!rawContact) {
    warn("CONTACT_EMAIL", `absente : repli sur ${DEFAULT_CONTACT_EMAIL}.`);
  } else if (!contactValid) {
    fail("CONTACT_EMAIL", `adresse invalide : repli sur ${DEFAULT_CONTACT_EMAIL}.`);
  }

  // --- E-mails transactionnels (Resend) -------------------------------------
  const resendKey = read("RESEND_API_KEY");
  const emailFrom = read("EMAIL_FROM");
  const notifyRaw = read("LEAD_NOTIFICATION_EMAIL");
  const notifyList = notifyRaw
    .split(/[,;]/)
    .map((address) => address.trim())
    .filter(Boolean);
  const notifyValid = notifyList.every((address) => isEmail(address));
  const resendBaseUrl = serviceUrl(read("RESEND_BASE_URL") || DEFAULT_RESEND_BASE_URL, isProduction);
  let emailEnabled = false;
  if (resendKey || emailFrom || notifyRaw) {
    emailEnabled = true;
    if (!resendKey) {
      warn("RESEND_API_KEY", "absente : e-mails désactivés.");
      emailEnabled = false;
    }
    if (!emailFrom) {
      warn("EMAIL_FROM", "absente : e-mails désactivés.");
      emailEnabled = false;
    } else if (!isEmail(senderAddress(emailFrom))) {
      fail("EMAIL_FROM", "format attendu : CARRIOVA <notifications@votre-domaine.com>.");
      emailEnabled = false;
    }
    if (!resendBaseUrl) {
      fail("RESEND_BASE_URL", "URL invalide (HTTPS requis) : e-mails désactivés.");
      emailEnabled = false;
    }
    if (!notifyValid) {
      fail("LEAD_NOTIFICATION_EMAIL", "adresse invalide : alertes internes désactivées.");
    } else if (notifyList.length === 0) {
      warn("LEAD_NOTIFICATION_EMAIL", "absente : seuls les accusés de réception seront envoyés.");
    }
  }

  // --- WhatsApp ---------------------------------------------------------------
  const rawWhatsappNumber = read("NEXT_PUBLIC_WHATSAPP_NUMBER");
  if (rawWhatsappNumber && !normalizeWhatsappNumber(rawWhatsappNumber)) {
    fail(
      "NEXT_PUBLIC_WHATSAPP_NUMBER",
      "format international attendu (ex. 2250700000000) : bouton WhatsApp masqué.",
    );
  }

  const waToken = read("WHATSAPP_ACCESS_TOKEN");
  const waPhoneId = read("WHATSAPP_PHONE_NUMBER_ID");
  const waTemplate = read("WHATSAPP_TEMPLATE_NAME");
  const waLang = read("WHATSAPP_TEMPLATE_LANG") || "fr";
  const waVersion = read("WHATSAPP_GRAPH_API_VERSION") || DEFAULT_WHATSAPP_API_VERSION;
  const waBaseUrl = serviceUrl(read("WHATSAPP_API_BASE_URL") || DEFAULT_WHATSAPP_BASE_URL, isProduction);
  let whatsappApiEnabled = false;
  if (waToken || waPhoneId || waTemplate) {
    const required: Array<[string, string]> = [
      ["WHATSAPP_ACCESS_TOKEN", waToken],
      ["WHATSAPP_PHONE_NUMBER_ID", waPhoneId],
      ["WHATSAPP_TEMPLATE_NAME", waTemplate],
    ];
    const missing = required.filter(([, value]) => !value);
    for (const [key] of missing) warn(key, "absente : envoi WhatsApp désactivé.");
    if (missing.length === 0) {
      if (!/^\d+$/.test(waPhoneId)) {
        fail("WHATSAPP_PHONE_NUMBER_ID", "identifiant numérique attendu : envoi WhatsApp désactivé.");
      } else if (!/^[a-z0-9_]+$/.test(waTemplate)) {
        fail("WHATSAPP_TEMPLATE_NAME", "nom de modèle invalide (minuscules, chiffres, _).");
      } else if (!/^[a-z]{2,3}(_[A-Z]{2})?$/.test(waLang)) {
        fail("WHATSAPP_TEMPLATE_LANG", "code langue attendu (ex. fr, en_US).");
      } else if (!/^v\d+\.\d+$/.test(waVersion)) {
        fail("WHATSAPP_GRAPH_API_VERSION", "format attendu : v23.0.");
      } else if (!waBaseUrl) {
        fail("WHATSAPP_API_BASE_URL", "URL invalide (HTTPS requis).");
      } else {
        whatsappApiEnabled = true;
      }
    }
  }

  // --- Webhook CRM --------------------------------------------------------------
  const crmRaw = read("CRM_WEBHOOK_URL");
  const crmSecret = read("CRM_WEBHOOK_SECRET");
  const crmUrl = crmRaw ? serviceUrl(crmRaw, isProduction) : null;
  if (crmRaw && !crmUrl) {
    fail("CRM_WEBHOOK_URL", "URL invalide (HTTPS requis en production) : webhook CRM désactivé.");
  }
  if (crmUrl && !crmSecret) {
    warn("CRM_WEBHOOK_SECRET", "absente : les webhooks CRM ne sont pas signés.");
  } else if (crmSecret && crmSecret.length < 16) {
    warn("CRM_WEBHOOK_SECRET", "trop courte : 16 caractères minimum recommandés.");
  }
  if (!crmRaw && crmSecret) {
    warn("CRM_WEBHOOK_URL", "absente : CRM_WEBHOOK_SECRET est ignorée.");
  }

  // --- Export administrateur ------------------------------------------------------
  const adminToken = read("ADMIN_API_TOKEN");
  const adminValid = adminToken.length >= MIN_ADMIN_TOKEN_LENGTH;
  if (adminToken && !adminValid) {
    fail(
      "ADMIN_API_TOKEN",
      `trop court (${MIN_ADMIN_TOKEN_LENGTH} caractères minimum) : export désactivé.`,
    );
  }

  // --- Mesure d’audience ------------------------------------------------------------
  const plausible = read("NEXT_PUBLIC_PLAUSIBLE_DOMAIN");
  if (plausible && !normalizePlausibleDomain(plausible)) {
    fail("NEXT_PUBLIC_PLAUSIBLE_DOMAIN", "nom de domaine attendu (ex. carriova.com) : mesure désactivée.");
  }

  return {
    env: {
      DATABASE_URL: databaseUrl,
      NEXT_PUBLIC_SITE_URL: siteUrl ?? DEFAULT_SITE_URL,
      CONTACT_EMAIL: contactValid ? rawContact : DEFAULT_CONTACT_EMAIL,
      isProduction,
      email: {
        enabled: emailEnabled,
        apiKey: resendKey,
        from: emailFrom,
        notify: notifyValid ? notifyList : [],
        baseUrl: resendBaseUrl ?? DEFAULT_RESEND_BASE_URL,
      },
      whatsappApi: {
        enabled: whatsappApiEnabled,
        token: waToken,
        phoneNumberId: waPhoneId,
        templateName: waTemplate,
        templateLang: waLang,
        apiVersion: waVersion,
        baseUrl: waBaseUrl ?? DEFAULT_WHATSAPP_BASE_URL,
      },
      crm: {
        enabled: Boolean(crmUrl),
        url: crmUrl ?? "",
        secret: crmSecret,
      },
      adminApiToken: adminValid ? adminToken : "",
      verification: {
        google: read("GOOGLE_SITE_VERIFICATION"),
        bing: read("BING_SITE_VERIFICATION"),
      },
    },
    issues,
  };
}

const loaded = loadServerEnv();

export const serverEnv: Readonly<ServerEnv> = Object.freeze(loaded.env);
export const envIssues: ReadonlyArray<Readonly<EnvIssue>> = Object.freeze(loaded.issues);

export function envStatus(): "ok" | "warning" | "error" {
  if (envIssues.some((issue) => issue.level === "error")) return "error";
  return envIssues.length > 0 ? "warning" : "ok";
}
