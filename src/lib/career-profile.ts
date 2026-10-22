import { countryOptions, type CountryCode } from "@/lib/countries";

export const experienceLevelOptions = [
  { value: "student", label: "Étudiant / en formation" }, { value: "entry", label: "Premier emploi" },
  { value: "junior", label: "Junior" }, { value: "mid", label: "Confirmé" },
  { value: "senior", label: "Senior" }, { value: "executive", label: "Direction / cadre dirigeant" },
] as const;
export const careerContractOptions = [
  { value: "permanent", label: "CDI" }, { value: "fixed_term", label: "CDD" },
  { value: "internship", label: "Stage" }, { value: "apprenticeship", label: "Alternance" }, { value: "freelance", label: "Freelance" },
] as const;
export const careerWorkModeOptions = [
  { value: "onsite", label: "Sur site" }, { value: "hybrid", label: "Hybride" }, { value: "remote", label: "À distance" },
] as const;
export const CAREER_PROFILE_LIMITS = { roles: 5, role: 120, skills: 40, skill: 80, targetCountries: 10, city: 120, languages: 12, language: 80, professionalSummary: 3000, educationSummary: 2000, availability: 160, contentBytes: 40000 } as const;
export type CareerProfile = {
  targetRoles: string[];
  skills: string[];
  experienceLevel: "" | (typeof experienceLevelOptions)[number]["value"];
  countryCode: "" | CountryCode;
  city: string;
  targetCountries: CountryCode[];
  contractTypes: (typeof careerContractOptions)[number]["value"][];
  workModes: (typeof careerWorkModeOptions)[number]["value"][];
  languages: { name: string; level: string }[];
  professionalSummary: string;
  educationSummary: string;
  availability: string;
  cvDocumentId: number | null;
};
export type CareerProfileRecord = { profile: CareerProfile; version: number; updatedAt: string | null };
export type CareerProfileActionState = { ok: boolean; message: string; fieldErrors?: Record<string, string>; record?: CareerProfileRecord; conflict?: boolean };
export class CareerProfileValidationError extends Error {
  constructor(public fieldErrors: Record<string, string>) { super("Vérifiez les champs du profil."); this.name = "CareerProfileValidationError"; }
}
export function createEmptyCareerProfile(): CareerProfile {
  return { targetRoles: [], skills: [], experienceLevel: "", countryCode: "", city: "", targetCountries: [], contractTypes: [], workModes: [], languages: [], professionalSummary: "", educationSummary: "", availability: "", cvDocumentId: null };
}
export function isProfileReadyForMatching(profile: CareerProfile) {
  return profile.targetRoles.some((role) => role.trim()) && profile.targetCountries.length > 0 && profile.experienceLevel !== "";
}
export function profileCompletion(profile: CareerProfile) {
  const fields = [profile.targetRoles.some((v) => v.trim()), profile.skills.some((v) => v.trim()), !!profile.experienceLevel, !!profile.countryCode, !!profile.city.trim(), profile.targetCountries.length > 0, profile.contractTypes.length > 0, profile.workModes.length > 0, profile.languages.some((v) => v.name.trim()), !!profile.professionalSummary.trim(), !!profile.educationSummary.trim(), !!profile.availability.trim(), profile.cvDocumentId !== null];
  return Math.round(fields.filter(Boolean).length / fields.length * 100);
}
const countryCodes = new Set<string>(countryOptions.map((country) => country.value));
const object = (value: unknown): Record<string, unknown> | null => value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
export function parseCareerProfile(value: unknown): CareerProfile {
  const raw = object(value);
  if (!raw) throw new CareerProfileValidationError({ content: "Le profil doit contenir des informations valides." });
  if (new TextEncoder().encode(JSON.stringify(raw)).length > CAREER_PROFILE_LIMITS.contentBytes) throw new CareerProfileValidationError({ content: "Le profil est trop volumineux. Raccourcissez les descriptions." });
  const errors: Record<string, string> = {};
  function text(key: string, max: number, source = raw!) {
    const value = source[key];
    if (typeof value !== "string" || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(value)) { errors[key] = `Saisissez au maximum ${max} caractères.`; return ""; }
    return value.trim();
  }
  function textList(key: string, max: number, length: number) {
    const value = raw![key];
    if (!Array.isArray(value) || value.length > max) { errors[key] = `Ajoutez au maximum ${max} éléments.`; return []; }
    if (value.some((item) => typeof item !== "string" || item.length > length || /[\u0000-\u001f\u007f]/.test(item))) { errors[key] = `Chaque élément doit contenir au maximum ${length} caractères, sur une ligne.`; return []; }
    return [...new Set((value as string[]).map((item) => item.trim()).filter(Boolean))];
  }
  function choices<T extends string>(key: string, allowed: readonly T[], max: number): T[] {
    const list = textList(key, max, 30);
    if (list.some((item) => !allowed.includes(item as T))) errors[key] = "Choisissez uniquement les options proposées.";
    return list as T[];
  }
  const countryCode = text("countryCode", 2).toUpperCase();
  if (countryCode && !countryCodes.has(countryCode)) errors.countryCode = "Choisissez un pays dans la liste.";
  const targetCountries = textList("targetCountries", CAREER_PROFILE_LIMITS.targetCountries, 2).map((code) => code.toUpperCase());
  if (targetCountries.some((code) => !countryCodes.has(code))) errors.targetCountries = "Choisissez les pays dans la liste proposée.";
  const experienceLevel = text("experienceLevel", 20);
  if (experienceLevel && !experienceLevelOptions.some((option) => option.value === experienceLevel)) errors.experienceLevel = "Choisissez un niveau d’expérience proposé.";
  const languages: CareerProfile["languages"] = [];
  if (!Array.isArray(raw.languages) || raw.languages.length > CAREER_PROFILE_LIMITS.languages) errors.languages = "Ajoutez au maximum 12 langues.";
  else raw.languages.forEach((value) => {
    const row = object(value);
    if (!row || typeof row.name !== "string" || typeof row.level !== "string" || row.name.length > 80 || row.level.length > 80 || /[\u0000-\u001f\u007f]/.test(row.name + row.level)) { errors.languages = "Indiquez la langue et le niveau en 80 caractères maximum chacun."; return; }
    if (row.name.trim() || row.level.trim()) languages.push({ name: row.name.trim(), level: row.level.trim() });
  });
  const cvDocumentId = raw.cvDocumentId;
  if (cvDocumentId !== null && (typeof cvDocumentId !== "number" || !Number.isInteger(cvDocumentId) || cvDocumentId < 1 || cvDocumentId > 2147483647)) errors.cvDocumentId = "Choisissez un CV de votre espace ou aucun CV.";
  const profile: CareerProfile = {
    targetRoles: textList("targetRoles", 5, 120), skills: textList("skills", 40, 80),
    experienceLevel: experienceLevel as CareerProfile["experienceLevel"], countryCode: countryCode as CareerProfile["countryCode"], city: text("city", 120),
    targetCountries: [...new Set(targetCountries)] as CountryCode[], contractTypes: choices("contractTypes", careerContractOptions.map((option) => option.value), 5), workModes: choices("workModes", careerWorkModeOptions.map((option) => option.value), 3),
    languages, professionalSummary: text("professionalSummary", 3000), educationSummary: text("educationSummary", 2000), availability: text("availability", 160), cvDocumentId: cvDocumentId as number | null,
  };
  if (Object.keys(errors).length) throw new CareerProfileValidationError(errors);
  return profile;
}
export function parseCareerProfileVersion(value: unknown) {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0 || value > 2147483646) throw new CareerProfileValidationError({ version: "Rechargez votre profil avant de continuer." });
  return value;
}
