import { countryOptions } from "@/lib/countries";

export const QUALIFICATION_CONSENT_VERSION = "2026-10-22";
export const QUALIFICATION_PRIVACY_NOTICE = "J’accepte que Carriova utilise les informations communiquées pour traiter ma demande et, si je le souhaite, me recontacte au sujet de cette demande.";

export const qualificationOptions = {
  country: countryOptions,
  profile: [
    { value: "student", label: "Étudiant(e) ou jeune diplômé(e)" },
    { value: "job_seeker", label: "En recherche d’emploi" },
    { value: "employed", label: "En poste, souhaitant évoluer" },
    { value: "career_change", label: "En reconversion professionnelle" },
    { value: "entrepreneur", label: "Entrepreneur(se) ou indépendant(e)" },
  ],
  discoverySource: [
    { value: "whatsapp", label: "WhatsApp / statut WhatsApp" },
    { value: "facebook", label: "Facebook" },
    { value: "linkedin", label: "LinkedIn" },
    { value: "tiktok", label: "TikTok" },
    { value: "referral", label: "Recommandation d’un proche" },
    { value: "other", label: "Autre" },
  ],
  need: [
    { value: "first_cv", label: "Création de CV professionnel" },
    { value: "improve_cv", label: "CV Cleaning — Optimisation de CV" },
    { value: "targeted_cv", label: "CV ciblé — Adaptation à une offre" },
    { value: "cover_letter", label: "Lettre de motivation personnalisée" },
    { value: "interview", label: "Coaching entretien" },
    { value: "career_growth", label: "Coaching carrière" },
    { value: "opportunities", label: "Recherche d’opportunités ciblée" },
  ],
  cvStatus: [
    { value: "improve", label: "Oui, et je souhaite l’améliorer" },
    { value: "outdated", label: "Oui, mais il est ancien" },
    { value: "none", label: "Non, je n’en ai pas encore" },
  ],
  timeline: [
    { value: "today", label: "Dès aujourd’hui" },
    { value: "week", label: "Dans les 7 prochains jours" },
    { value: "month", label: "Dans le mois" },
    { value: "exploring", label: "Je me renseigne pour le moment" },
  ],
  targetOffer: [
    { value: "specific", label: "Oui, j’ai une offre précise" },
    { value: "searching", label: "Non, je cherche encore" },
    { value: "not_searching", label: "Je ne recherche pas actuellement un emploi" },
  ],
  difficulty: [
    { value: "cv", label: "Mon CV ne valorise pas assez mes compétences" },
    { value: "interviews", label: "Je postule sans obtenir d’entretien" },
    { value: "targeting", label: "Je ne sais pas quelles offres cibler" },
    { value: "confidence", label: "Je manque de confiance en entretien" },
    { value: "progression", label: "Je ne sais pas comment progresser professionnellement" },
  ],
  budget: [
    { value: "7000_10000", label: "7 000 à 10 000 FCFA" },
    { value: "10000_20000", label: "10 000 à 20 000 FCFA" },
    { value: "over_20000", label: "Plus de 20 000 FCFA" },
    { value: "pricing_first", label: "Je souhaite d’abord connaître les tarifs" },
  ],
  paymentReadiness: [
    { value: "ready", label: "Oui, si la solution répond à mon besoin" },
    { value: "advisor", label: "J’aimerais d’abord échanger avec un conseiller" },
    { value: "free_only", label: "Je recherche uniquement des conseils gratuits pour le moment" },
  ],
  contactWhatsApp: [
    { value: "yes", label: "Oui, je souhaite être contacté(e)" },
    { value: "no", label: "Non, je préfère recevoir les informations sans échange individuel" },
  ],
} as const;

export const qualificationSteps = [
  { id: "profile", title: "Votre profil", fields: ["fullName", "whatsapp", "country", "profile", "discoverySource"] },
  { id: "need", title: "Votre besoin", fields: ["need", "cvStatus", "timeline", "targetOffer", "difficulty"] },
  { id: "request", title: "Votre demande", fields: ["budget", "contactWhatsApp", "message", "consentPrivacy", "consentMarketing"] },
] as const;

export type QualificationNeed = (typeof qualificationOptions.need)[number]["value"];

export function getInitialQualificationNeed(value: unknown): QualificationNeed | null {
  return typeof value === "string"
    ? qualificationOptions.need.find((option) => option.value === value)?.value ?? null
    : null;
}

// Historical category answers remain readable, but are no longer valid new answers.
const legacyCountryLabels: Record<string, string> = {
  cote_ivoire: "Côte d’Ivoire",
  africa: "Autre pays africain",
  europe_america: "Europe ou Amérique",
  europe: "Europe ou Amérique",
  other: "Autre",
};

type OptionKey = keyof typeof qualificationOptions;
type Answers = { [K in OptionKey]: (typeof qualificationOptions)[K][number]["value"] };
export type QualificationInput = Omit<Answers, "targetOffer" | "difficulty" | "paymentReadiness"> & {
  paymentReadiness: "not_asked";
  targetOffer: Answers["targetOffer"] | null;
  difficulty: Answers["difficulty"] | null;
  fullName: string;
  whatsapp: string;
  message: string;
  consentPrivacy: boolean;
  consentMarketing: boolean;
};

export function qualificationLabel(key: OptionKey, value: string | null | undefined) {
  if (key === "paymentReadiness" && value === "not_asked") return "Non demandé";
  if (key === "country" && value && Object.hasOwn(legacyCountryLabels, value)) return legacyCountryLabels[value];
  return qualificationOptions[key].find((option) => option.value === value)?.label ?? value ?? "Non renseigné";
}

export function normalizeQualificationPhone(raw: string): string | null {
  if (raw.length > 40 || !/^\+?[\d\s().-]+$/.test(raw.trim())) return null;
  const compact = raw.trim().replace(/[\s().-]/g, "").replace(/^00/, "+");
  const normalized = /^\d{11,15}$/.test(compact) ? `+${compact}` : compact;
  return /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : null;
}

export function validateQualification(formData: FormData): {
  ok: boolean;
  fieldErrors: Record<string, string>;
  data: QualificationInput | null;
} {
  const text = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value.trim() : "";
  };
  const fieldErrors: Record<string, string> = {};
  const fullName = text("fullName");
  if (fullName.length < 2 || fullName.length > 120) fieldErrors.fullName = "Indiquez votre nom complet (2 à 120 caractères).";
  const rawPhone = text("whatsapp");
  const localPhone = rawPhone.replace(/[\s().-]/g, "");
  const whatsapp = normalizeQualificationPhone(
    text("country") === "CI" && /^0\d{9}$/.test(localPhone) ? `+225${localPhone}` : rawPhone,
  );
  if (!whatsapp) fieldErrors.whatsapp = "Indiquez un numéro WhatsApp valide avec son indicatif (ex. +225).";
  const answers: Record<string, string | null> = {};
  for (const key of Object.keys(qualificationOptions) as OptionKey[]) {
    // Retain historical labels without accepting or inventing a new purchase intention.
    if (key === "paymentReadiness") { answers[key] = "not_asked"; continue; }
    const value = text(key);
    if (!value && (key === "targetOffer" || key === "difficulty")) {
      answers[key] = null;
    } else if (qualificationOptions[key].some((option) => option.value === value)) {
      answers[key] = value;
    } else {
      fieldErrors[key] = "Sélectionnez une réponse parmi les choix proposés.";
    }
  }
  const message = text("message");
  if (message.length > 4000) fieldErrors.message = "Limitez votre message à 4 000 caractères.";
  const consentPrivacy = text("consentPrivacy") === "on";
  const consentMarketing = text("consentMarketing") === "on";
  if (!consentPrivacy) fieldErrors.consentPrivacy = "Votre accord est nécessaire pour traiter cette demande.";
  if (Object.keys(fieldErrors).length) return { ok: false, fieldErrors, data: null };
  return {
    ok: true,
    fieldErrors,
    data: { ...answers, fullName, whatsapp, message, consentPrivacy, consentMarketing } as QualificationInput,
  };
}
