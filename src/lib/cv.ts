export const CV_TEMPLATES = [
  { value: "essentiel", label: "Essentiel", description: "Une présentation sobre et lisible." },
  { value: "horizon", label: "Horizon", description: "Une structure claire et contemporaine." },
  { value: "signature", label: "Signature", description: "Une présentation affirmée et élégante." },
] as const;
export const CV_ACCENTS = [
  { value: "terracotta", label: "Terracotta", color: "#bd470d" },
  { value: "petrol", label: "Pétrole", color: "#145c63" },
  { value: "slate", label: "Ardoise", color: "#334155" },
] as const;
export const CV_LIMITS = {
  documents: 20, contentBytes: 100_000, title: 160,
  experiences: 20, education: 20, skills: 40, languages: 12, projects: 12,
  fullName: 120, headline: 160, email: 255, phone: 40, location: 160,
  url: 500, summary: 3000, shortText: 160, experienceDescription: 4000,
  description: 3000, skill: 100, language: 80, entryId: 80,
} as const;
export type CvTemplateId = typeof CV_TEMPLATES[number]["value"];
export type CvAccent = typeof CV_ACCENTS[number]["value"];
export type CvContent = {
  basics: { fullName: string; headline: string; email: string; phone: string; location: string; website: string };
  summary: string;
  experiences: { id: string; role: string; company: string; location: string; startDate: string; endDate: string; current: boolean; description: string }[];
  education: { id: string; degree: string; school: string; startDate: string; endDate: string; description: string }[];
  skills: string[];
  languages: { id: string; name: string; level: string }[];
  projects: { id: string; name: string; url: string; description: string }[];
};
export type CvDocument = { id: number; title: string; content: CvContent; templateId: CvTemplateId; accent: CvAccent; version: number; updatedAt: string };
export type CvCreateInput = Pick<CvDocument, "title" | "content" | "templateId" | "accent">;
export type CvUpdateInput = Partial<CvCreateInput> & { version: number };
export class CvValidationError extends Error {
  constructor(public readonly fieldErrors: Record<string, string>) {
    super("Vérifiez les champs du CV."); this.name = "CvValidationError";
  }
}
export function createEmptyCv(name = "", email = ""): CvContent {
  return { basics: { fullName: name.slice(0, 120), headline: "", email: email.slice(0, 255), phone: "", location: "", website: "" }, summary: "", experiences: [], education: [], skills: [], languages: [], projects: [] };
}
function object(value: unknown): Record<string, unknown> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : null;
}
export function parseCvContent(value: unknown): CvContent {
  const errors: Record<string, string> = {};
  const root = object(value);
  if (!root) throw new CvValidationError({ content: "Le contenu du CV est invalide." });
  try {
    if (new TextEncoder().encode(JSON.stringify(value)).length > CV_LIMITS.contentBytes) throw new Error();
  } catch { throw new CvValidationError({ content: "Le CV dépasse la taille maximale de 100 Ko." }); }
  const read = (record: Record<string, unknown>, key: string, path: string, max: number, kind?: "date" | "url" | "id" | "email") => {
    const raw = record[key];
    if (typeof raw !== "string" || raw.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(raw)) {
      errors[path] = `Saisissez un texte de ${max} caractères maximum.`; return "";
    }
    if (kind === "date" && raw && !/^\d{4}-(0[1-9]|1[0-2])$/.test(raw)) errors[path] = "Utilisez le format AAAA-MM.";
    if (kind === "id" && !/^[A-Za-z0-9_-]{1,80}$/.test(raw)) errors[path] = "L’identifiant de cette entrée est invalide.";
    if (kind === "email" && raw && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) errors[path] = "Saisissez une adresse e-mail valide ou laissez ce champ vide.";
    if (kind === "url" && raw) {
      try { const url = new URL(raw); if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || /\s/.test(raw)) throw new Error(); }
      catch { errors[path] = "Utilisez une adresse complète commençant par https:// ou http://."; }
    }
    return raw;
  };
  const basics = object(root.basics) ?? {};
  const rows = <T>(key: string, max: number, mapper: (row: Record<string, unknown>, path: string) => T): T[] => {
    const raw = root[key];
    if (!Array.isArray(raw) || raw.length > max) { errors[key] = `Ajoutez au maximum ${max} éléments.`; return []; }
    const ids = new Set<string>();
    return raw.map((item, index) => {
      const path = `${key}.${index}`; const row = object(item) ?? {};
      const id = read(row, "id", `${path}.id`, 80, "id");
      if (ids.has(id)) errors[`${path}.id`] = "Chaque entrée doit avoir un identifiant distinct.";
      ids.add(id); return mapper(row, path);
    });
  };
  const content: CvContent = {
    basics: {
      fullName: read(basics, "fullName", "basics.fullName", 120), headline: read(basics, "headline", "basics.headline", 160),
      email: read(basics, "email", "basics.email", 255, "email"), phone: read(basics, "phone", "basics.phone", 40),
      location: read(basics, "location", "basics.location", 160), website: read(basics, "website", "basics.website", 500, "url"),
    },
    summary: read(root, "summary", "summary", 3000),
    experiences: rows("experiences", 20, (r, p) => {
      if (typeof r.current !== "boolean") errors[`${p}.current`] = "Précisez si ce poste est actuel.";
      return { id: read(r, "id", `${p}.id`, 80, "id"), role: read(r, "role", `${p}.role`, 160), company: read(r, "company", `${p}.company`, 160), location: read(r, "location", `${p}.location`, 160), startDate: read(r, "startDate", `${p}.startDate`, 7, "date"), endDate: read(r, "endDate", `${p}.endDate`, 7, "date"), current: r.current === true, description: read(r, "description", `${p}.description`, 4000) };
    }),
    education: rows("education", 20, (r, p) => ({ id: read(r, "id", `${p}.id`, 80, "id"), degree: read(r, "degree", `${p}.degree`, 160), school: read(r, "school", `${p}.school`, 160), startDate: read(r, "startDate", `${p}.startDate`, 7, "date"), endDate: read(r, "endDate", `${p}.endDate`, 7, "date"), description: read(r, "description", `${p}.description`, 3000) })),
    skills: [],
    languages: rows("languages", 12, (r, p) => ({ id: read(r, "id", `${p}.id`, 80, "id"), name: read(r, "name", `${p}.name`, 80), level: read(r, "level", `${p}.level`, 80) })),
    projects: rows("projects", 12, (r, p) => ({ id: read(r, "id", `${p}.id`, 80, "id"), name: read(r, "name", `${p}.name`, 160), url: read(r, "url", `${p}.url`, 500, "url"), description: read(r, "description", `${p}.description`, 3000) })),
  };
  if (!Array.isArray(root.skills) || root.skills.length > 40) errors.skills = "Ajoutez au maximum 40 compétences.";
  else content.skills = root.skills.map((skill, i) => read({ skill }, "skill", `skills.${i}`, 100));
  if (Object.keys(errors).length) throw new CvValidationError(errors);
  return content;
}
export function validateCvContent(value: unknown): { ok: true; data: CvContent; fieldErrors: Record<string, string> } | { ok: false; fieldErrors: Record<string, string> } {
  try { return { ok: true, data: parseCvContent(value), fieldErrors: {} }; }
  catch (error) { if (error instanceof CvValidationError) return { ok: false, fieldErrors: error.fieldErrors }; throw error; }
}
export function parseCvVersion(value: unknown): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > 2147483646) throw new CvValidationError({ version: "Rechargez le CV avant de continuer." });
  return value;
}
function writeFields(value: unknown): Partial<CvCreateInput> {
  const raw = object(value);
  if (!raw) throw new CvValidationError({ document: "Les données du CV sont invalides." });
  const output: Partial<CvCreateInput> = {};
  if (Object.hasOwn(raw, "title")) {
    if (typeof raw.title !== "string" || !raw.title.trim() || raw.title.trim().length > 160 || /[\u0000-\u001f\u007f]/.test(raw.title)) throw new CvValidationError({ title: "Donnez un titre de 1 à 160 caractères au CV." });
    output.title = raw.title.trim();
  }
  if (Object.hasOwn(raw, "content")) output.content = parseCvContent(raw.content);
  if (Object.hasOwn(raw, "templateId")) {
    if (!CV_TEMPLATES.some(item => item.value === raw.templateId)) throw new CvValidationError({ templateId: "Choisissez un modèle proposé." });
    output.templateId = raw.templateId as CvTemplateId;
  }
  if (Object.hasOwn(raw, "accent")) {
    if (!CV_ACCENTS.some(item => item.value === raw.accent)) throw new CvValidationError({ accent: "Choisissez une couleur proposée." });
    output.accent = raw.accent as CvAccent;
  }
  return output;
}
export function parseCvCreateInput(value: unknown, defaults: { name?: string; email?: string } = {}): CvCreateInput {
  return { title: "Mon CV", content: createEmptyCv(defaults.name, defaults.email), templateId: "essentiel", accent: "terracotta", ...writeFields(value) };
}
export function parseCvUpdateInput(value: unknown): CvUpdateInput {
  const raw = object(value);
  const version = parseCvVersion(raw?.version); const fields = writeFields(value);
  if (!Object.keys(fields).length) throw new CvValidationError({ document: "Aucune modification à enregistrer." });
  return { ...fields, version };
}
