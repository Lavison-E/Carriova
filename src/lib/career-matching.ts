import type { CareerProfile } from "@/lib/career-profile";
import { currentOpportunities, fold, type Opportunity } from "@/lib/opportunities";

export type CareerMatch = { opportunity: Opportunity; reasons: string[]; checks: string[] };
type Contract = CareerProfile["contractTypes"][number];
type WorkMode = CareerProfile["workModes"][number];
const aliases: Record<string, string> = {
  comptable: "comptabilite", comptables: "comptabilite", accounting: "comptabilite", accountant: "comptabilite",
  commerciale: "commercial", commerciaux: "commercial", sales: "vente", salesperson: "vente",
  developpeuse: "developpeur", developer: "developpeur", developers: "developpeur",
  receptionniste: "reception", receptionist: "reception", cuisinier: "cuisine", cuisiniere: "cuisine", culinary: "cuisine",
  redactionnel: "redaction", redactrice: "redacteur", writer: "redacteur",
};
function terms(value: string): string[] {
  return (fold(value).replace(/œ/g, "oe").replace(/æ/g, "ae").match(/[a-z0-9]+(?:\+\+|#)?/g) ?? [])
    .map(term => aliases[term] ?? (term.length > 4 && term.endsWith("s") ? term.slice(0, -1) : term));
}
const unique = <T,>(values: T[]) => [...new Set(values)];
const genericRoleWords = new Set(terms("de du des le la les un une et en au aux pour avec dans d l e h f x hf emploi poste metier job work charge chargee responsable chef manager director directeur directrice agent assistant assistante consultant consultante senior junior stagiaire stage alternance apprenti apprentie confirme confirmee specialise specialisee international internationale expert experte projet projects project"));
const roleTerms = (value: string) => unique(terms(value).filter(term => term.length > 1 && !genericRoleWords.has(term)));
const skillTerms = (value: string) => terms(value).filter(term => !["de", "du", "des", "et", "en", "la", "le", "les", "d", "l"].includes(term));
const nonspecificSkills = new Set(["communication", "organisation", "rigueur", "autonomie", "leadership", "anglais", "francais", "word", "excel", "powerpoint", "bureautique", "microsoft office", "pack office", "travail en equipe", "esprit equipe", "gestion du temps"].map(value => skillTerms(value).join(" ")));
const families = [
  { label: "comptabilité et finance", words: ["comptabilité", "finance", "financier", "audit", "recouvrement", "trésorerie", "débiteur", "contrôle de gestion"] },
  { label: "commerce et vente", words: ["commercial", "vente", "vendeur", "business development", "sales"] },
  { label: "marketing et communication", words: ["marketing", "communication", "community manager", "réseaux sociaux"] },
  { label: "rédaction et édition", words: ["rédacteur", "rédaction", "editing", "édition", "révision des rapports", "report writing", "traduction"] },
  { label: "accueil et relation client", words: ["accueil", "réception", "relation client", "guest service", "front office", "réservation"] },
  { label: "cuisine et restauration", words: ["cuisine", "restauration", "pâtisserie", "culinary", "food beverage"] },
  { label: "administration", words: ["administratif", "administrative", "administration", "secrétariat", "secrétaire"] },
  { label: "informatique", words: ["informatique", "développeur", "software", "web", "cybersécurité", "système réseau"] },
  { label: "logistique", words: ["logistique", "transport", "supply chain", "approvisionnement"] },
  { label: "ressources humaines", words: ["ressources humaines", "recrutement", "paie", "payroll", "human resources"] },
  { label: "suivi et évaluation", words: ["suivi évaluation", "évaluation", "monitoring", "statistique"] },
];
function contains(value: string, haystack: Set<string>, tokenize = skillTerms) {
  const needles = tokenize(value);
  return needles.length > 0 && needles.every(term => haystack.has(term));
}
function knownContract(value: string): Contract | null {
  const normalized = fold(value).trim();
  if (/^(?:contrat permanent|permanent|cdi)$/.test(normalized)) return "permanent";
  if (/^(?:contrat temporaire|engagement a duree determinee|contrat a duree determinee|cdd|fixed.term)$/.test(normalized)) return "fixed_term";
  if (/^(?:stage|internship)$/.test(normalized)) return "internship";
  if (/^(?:alternance|apprentissage|apprenticeship)$/.test(normalized)) return "apprenticeship";
  if (/^(?:freelance|consultance|consultant)(?:\b|\s|·)/.test(normalized)) return "freelance";
  return null;
}
function knownWorkMode(value: string | null): WorkMode | null {
  const normalized = fold(value ?? "").trim();
  if (["sur site", "onsite", "on-site"].includes(normalized)) return "onsite";
  if (["hybride", "hybrid"].includes(normalized)) return "hybrid";
  if (["teletravail", "remote", "home based", "home-based"].includes(normalized)) return "remote";
  // Remote with travel is not assumed to mean fully remote or an office hybrid schedule.
  return null;
}
const levels: Record<string, string[]> = {
  student: ["stage", "etudiant", "internship"], entry: ["debutant", "entry level"], junior: ["junior"],
  mid: ["confirme", "mid senior level"], senior: ["confirme", "senior", "mid senior level"], executive: ["direction", "executive", "director"],
};

/** Deterministic reading aid, not an eligibility or hiring-probability assessment.
 * Only explicit professional preferences are used; identity, age, nationality, visa,
 * profile summaries, attached CV contents and contact details never enter this ranking.
 */
export function getCareerMatches(profile: CareerProfile, opportunities: Opportunity[], now = Date.now()): CareerMatch[] {
  if (!profile.targetRoles.some(role => role.trim()) || !profile.targetCountries.length || !profile.experienceLevel) return [];
  const targetRoles = unique(profile.targetRoles.map(role => role.trim()).filter(Boolean));
  const wantedCountries = new Set(profile.targetCountries.map(code => code.toUpperCase()));
  const wantedFamilies = families.filter(family => targetRoles.some(role => family.words.some(word => contains(word, new Set(terms(role))))));
  const ranked: (CareerMatch & { rank: number })[] = [];
  const seen = new Set<string>();
  for (const opportunity of currentOpportunities(opportunities, now)) {
    if (seen.has(opportunity.slug)) continue;
    seen.add(opportunity.slug);
    const country = opportunity.countryCode.toUpperCase();
    const contract = knownContract(opportunity.contractType), mode = knownWorkMode(opportunity.workMode);
    if (/^[A-Z]{2}$/.test(country) && !wantedCountries.has(country)) continue;
    if (profile.contractTypes.length && contract && !profile.contractTypes.includes(contract)) continue;
    if (profile.workModes.length && mode && !profile.workModes.includes(mode)) continue;
    const title = new Set(roleTerms(opportunity.title));
    const role = targetRoles.find(value => { const wanted = roleTerms(value); return wanted.length > 0 && wanted.filter(term => title.has(term)).length >= Math.ceil(wanted.length * 0.7); });
    const context = new Set(terms(`${opportunity.title} ${opportunity.industry ?? ""}`));
    const sharedFamily = wantedFamilies.find(family => family.words.some(word => contains(word, context)));
    const evidence = new Set(terms(`${opportunity.title} ${opportunity.description} ${opportunity.matchingText ?? ""}`));
    const skillKeys = new Set<string>();
    const matchedSkills = profile.skills.map(skill => skill.trim()).filter(Boolean).filter(skill => {
      const key = skillTerms(skill).slice().sort().join(" ");
      if (!key || skillKeys.has(key) || !contains(skill, evidence)) return false;
      skillKeys.add(key); return true;
    });
    const specificSkills = matchedSkills.filter(skill => !nonspecificSkills.has(skillTerms(skill).join(" ")));
    // Geography, a generic seniority title or soft skills alone cannot create a result.
    if (!role && !sharedFamily && specificSkills.length < 2) continue;
    const reasons: string[] = [], checks: string[] = [];
    let rank = 0;
    if (role) { reasons.push(`L’intitulé reprend votre métier recherché : ${role}.`); rank += 60; }
    else if (sharedFamily) { reasons.push(`Un domaine lié à votre objectif : ${sharedFamily.label}.`); rank += 35; }
    if (matchedSkills.length) { reasons.push(`Compétences mentionnées dans l’annonce : ${matchedSkills.slice(0, 4).join(", ")}.`); rank += Math.min(specificSkills.length * 8, 32) + Math.min(matchedSkills.length, 4); }
    const experience = fold(opportunity.experience ?? "").trim();
    if (experience && levels[profile.experienceLevel]?.includes(experience)) { reasons.push(`Le niveau annoncé correspond au niveau choisi : ${opportunity.experience}.`); rank += 8; }
    else checks.push(opportunity.experience ? `Niveau annoncé : ${opportunity.experience}. Comparez les années et missions demandées avec votre expérience.` : "Niveau d’expérience à vérifier dans l’annonce.");
    if (!/^[A-Z]{2}$/.test(country)) checks.push("Pays d’exercice à vérifier dans l’annonce.");
    if (!contract) checks.push("Type de contrat à vérifier dans l’annonce.");
    if (!mode) checks.push(opportunity.workMode ? `Mode de travail à vérifier : ${opportunity.workMode}.` : "Mode de travail à vérifier dans l’annonce.");
    if (!opportunity.expiresAt) checks.push("Date de clôture non communiquée : vérifiez que le recrutement est toujours ouvert.");
    checks.push("Diplômes, langues et autres exigences à vérifier sur la page du recruteur.");
    ranked.push({ opportunity, reasons, checks, rank });
  }
  return ranked.sort((a, b) => b.rank - a.rank || Date.parse(b.opportunity.publishedAt ?? "1970-01-01") - Date.parse(a.opportunity.publishedAt ?? "1970-01-01") || a.opportunity.slug.localeCompare(b.opportunity.slug))
    .map(({ opportunity, reasons, checks }) => ({ opportunity, reasons, checks }));
}