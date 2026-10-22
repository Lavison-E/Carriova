export type Opportunity = {
  slug: string; title: string; company: string; location: string; country: string; countryCode: string;
  contractType: string; experience: string | null; industry: string | null; workMode: string | null;
  description: string; matchingText?: string; publishedAt: string | null; updatedAt: string; expiresAt: string | null;
  sourceKind?: "feed" | "selection"; sourceName: string; sourceUrl: string; reference: string; verifiedAt: string;
};
export type OpportunityFilters = Partial<Record<"q" | "location" | "country" | "industry" | "contractType" | "experience" | "workMode", string>>;
export const MAX_POSTING_AGE = 60 * 24 * 60 * 60 * 1000;
export const MAX_SOURCE_AGE = 24 * 60 * 60 * 1000;
const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
const text = (value: unknown, max = 255) => typeof value === "string" ? value.trim().slice(0, max) : "";
export const fold = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, " ").toLowerCase();

// Plain text for private relevance matching, never rendered as recruiter HTML.
export function postingMatchingText(value: unknown): string {
  const sections = record(record(value).sections);
  const named: Record<string, string> = { amp: "&", nbsp: " ", lt: "<", gt: ">", quot: '"', apos: "'", eacute: "é", egrave: "è", agrave: "à", ocirc: "ô", ccedil: "ç" };
  return ["jobDescription", "qualifications"].map(key => text(record(sections[key]).text, 100_000)
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, " ").replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]*>/g, " ")
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, raw: string) => {
      const code = raw[0] === "#" ? Number.parseInt(raw.slice(raw[1]?.toLowerCase() === "x" ? 2 : 1), raw[1]?.toLowerCase() === "x" ? 16 : 10) : NaN;
      return Number.isInteger(code) && code > 31 && code <= 0x10ffff && !(code >= 0xd800 && code <= 0xdfff) ? String.fromCodePoint(code) : named[raw.toLowerCase()] ?? entity;
    }).replace(/\s+/g, " ").trim()).filter(Boolean).join(" ").slice(0, 16_000);
}

export function safeSourceUrl(value: unknown, hosts: readonly string[]): string | null {
  try {
    const url = new URL(String(value));
    if (url.protocol !== "https:" || url.username || url.password || url.port || !hosts.includes(url.hostname)) return null;
    return url.href;
  } catch { return null; }
}

// Do not keep an advertisement with an explicit closing date past its deadline.
// An unrecognised closing-date format is excluded rather than guessed.
export function postingDeadline(value: unknown): string | null | false {
  const sections = record(record(value).sections);
  const content = Object.values(sections).map(section => text(record(section).text, 100_000)).join(" ").replace(/<[^>]*>/g, " ");
  const mention = /(?:date\s+limite(?:\s+de\s+(?:d[ée]p[ôo]t\s+des?\s+)?candidatures?)?|closing\s+date|application\s+deadline)\s*:?\s*([^.!?\n]{1,100})/i.exec(content);
  if (!mention) return null;
  const date = /(\d{4})-(\d{2})-(\d{2})/.exec(mention[1]);
  if (date) { const parsed = Date.parse(`${date[1]}-${date[2]}-${date[3]}T23:59:59Z`); return Number.isFinite(parsed) ? new Date(parsed).toISOString() : false; }
  const french = /(\d{1,2})\s+(janvier|f[ée]vrier|mars|avril|mai|juin|juillet|ao[ûu]t|septembre|octobre|novembre|d[ée]cembre)\s+(\d{4})/i.exec(mention[1]);
  if (french) {
    const months = ["janvier","fevrier","mars","avril","mai","juin","juillet","aout","septembre","octobre","novembre","decembre"];
    const month = months.indexOf(fold(french[2])) + 1;
    const parsed = Date.parse(`${french[3]}-${String(month).padStart(2,"0")}-${french[1].padStart(2,"0")}T23:59:59Z`);
    return Number.isFinite(parsed) ? new Date(parsed).toISOString() : false;
  }
  return false;
}

export function normalizeAccorPosting(value: unknown, verifiedAt: string, now = Date.now()): Opportunity | null {
  const row = record(value), location = record(row.location), company = record(row.company);
  const id = text(row.id), title = text(row.name), published = text(row.releasedDate);
  const time = Date.parse(published);
  if (!/^\d{10,20}$/.test(id) || !title || row.active !== true || row.visibility !== "PUBLIC" || company.identifier !== "AccorHotel" || location.country !== "ci") return null;
  if (!Number.isFinite(time) || time > now || now - time > MAX_POSTING_AGE || Date.parse(verifiedAt) > now || now - Date.parse(verifiedAt) > MAX_SOURCE_AGE || !Number.isFinite(Date.parse(verifiedAt))) return null;
  const sourceUrl = safeSourceUrl(row.postingUrl, ["jobs.smartrecruiters.com"]);
  if (!sourceUrl || !new URL(sourceUrl).pathname.startsWith(`/AccorHotel/${id}`)) return null;
  const expiresAt = postingDeadline(row.jobAd);
  if (expiresAt === false || (expiresAt && Date.parse(expiresAt) <= now)) return null;
  const fields = Array.isArray(row.customField) ? row.customField.map(record) : [];
  const custom = (label: string) => text(fields.find(field => field.fieldLabel === label)?.valueLabel);
  const hotel = text(fields.find(field => text(field.fieldLabel).startsWith("Hotel Region"))?.valueLabel);
  const jobType = custom("Job Type");
  const contracts: Record<string,string> = { Permanent: "Contrat permanent", Temporary: "Contrat temporaire", Internship: "Stage", Apprenticeship: "Alternance" };
  const sectors: Record<string,string> = { "Sales & Marketing": "Marketing & communication", Finance: "Finance & comptabilité", Culinary: "Cuisine", "Food & Beverage": "Restauration", Retail: "Commerce", "Talent & Culture": "Ressources humaines" };
  const experience: Record<string,string> = { entry_level: "Débutant", associate: "Junior", mid_senior_level: "Confirmé", executive: "Direction", director: "Direction", internship: "Stage" };
  const schedule: Record<string,string> = { "Full-Time": "Temps plein", "Part-Time": "Temps partiel" };
  const employer = hotel || "Accor";
  const scheduleValue = custom("Job Schedule");
  const scheduleConsistent = !(scheduleValue === "Full-Time" && record(row.typeOfEmployment).id === "part-time") && !(scheduleValue === "Part-Time" && record(row.typeOfEmployment).id === "permanent");
  return {
    slug: `accor-${id}`, title, company: employer, location: text(location.city) || "Abidjan", country: "Côte d’Ivoire", countryCode: "CI",
    contractType: contracts[jobType] || "Contrat à consulter", industry: sectors[custom("Job-Category")] || "Hôtellerie",
    experience: experience[text(record(row.experienceLevel).id)] || null,
    workMode: location.remote === true ? "Télétravail" : location.hybrid === true ? "Hybride" : location.remote === false && location.hybrid === false ? "Sur site" : null,
    description: `${employer} recrute à ${text(location.city) || "Abidjan"}.${scheduleConsistent && schedule[scheduleValue] ? " " + schedule[scheduleValue] + "." : ""} Retrouvez les missions, le profil recherché et les modalités de candidature dans l’annonce officielle.`,
    matchingText: postingMatchingText(row.jobAd), publishedAt: new Date(time).toISOString(), updatedAt: new Date(time).toISOString(), expiresAt,
    sourceName: "Accor · SmartRecruiters", sourceUrl, reference: text(row.refNumber) || id, verifiedAt,
  };
}

export function currentOpportunities(items: Opportunity[], now = Date.now()) {
  return items.filter(item => Number.isFinite(Date.parse(item.verifiedAt)) && Date.parse(item.verifiedAt) <= now && now - Date.parse(item.verifiedAt) <= (item.sourceKind === "selection" ? 7 * MAX_SOURCE_AGE : MAX_SOURCE_AGE) && (!item.expiresAt || Date.parse(item.expiresAt) > now) && (!item.publishedAt || Date.parse(item.publishedAt) <= now));
}
export function filterOpportunities(items: Opportunity[], filters: OpportunityFilters = {}) {
  return items.filter(job => {
    if (filters.q && !fold([job.title, job.company, job.description, job.industry, job.location].join(" ")).includes(fold(filters.q))) return false;
    if (filters.location && !fold(job.location).includes(fold(filters.location))) return false;
    return (["country", "industry", "contractType", "experience", "workMode"] as const).every(key => !filters[key] || job[key] === filters[key]);
  }).sort((a,b) => Date.parse(b.publishedAt ?? "1970-01-01") - Date.parse(a.publishedAt ?? "1970-01-01") || a.slug.localeCompare(b.slug));
}
export function opportunityFacets(items: Opportunity[]) {
  const unique = (key: keyof Opportunity) => [...new Set(items.map(row => row[key]).filter(Boolean) as string[])].sort((a,b) => a.localeCompare(b,"fr"));
  return { locations: unique("location"), countries: unique("country"), industries: unique("industry"), contractTypes: unique("contractType"), experiences: unique("experience"), workModes: unique("workMode") };
}
