import type { CSSProperties, ReactNode } from "react";
import { CV_ACCENTS, type CvDocument } from "@/lib/cv";

function cvDate(value: string) {
  if (!/^\d{4}-\d{2}$/.test(value)) return value;
  const date = new Date(`${value}-01T12:00:00Z`);
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}
function Dates({ start, end, current = false }: { start: string; end: string; current?: boolean }) {
  const values = [cvDate(start), current ? "Aujourd’hui" : cvDate(end)].filter(Boolean);
  return values.length ? <p className="mt-1 text-[10px] leading-5 text-[#64707d]">{values.join(" — ")}</p> : null;
}
function PreviewSection({ title, children, signature }: { title: string; children: ReactNode; signature: boolean }) {
  return <section className="mt-6 break-inside-avoid"><h3 className={`mb-3 border-b border-[var(--cv-accent)]/25 pb-2 text-[var(--cv-accent)] ${signature ? "font-editorial text-lg italic" : "text-[10px] font-bold uppercase tracking-[0.15em]"}`}>{title}</h3>{children}</section>;
}

export function CvPreview({ content, templateId, accent, compact = false }: Pick<CvDocument, "content" | "templateId" | "accent"> & { compact?: boolean }) {
  const horizon = templateId === "horizon";
  const signature = templateId === "signature";
  const contacts = [content.basics.email, content.basics.phone, content.basics.location, content.basics.website].filter((value) => value.trim());
  const experiences = content.experiences.filter((entry) => entry.role.trim() || entry.company.trim() || entry.description.trim());
  const education = content.education.filter((entry) => entry.degree.trim() || entry.school.trim() || entry.description.trim());
  const projects = content.projects.filter((entry) => entry.name.trim() || entry.description.trim());
  const languages = content.languages.filter((entry) => entry.name.trim());
  const skills = content.skills.filter((skill) => skill.trim());
  const hasContent = content.summary.trim() || experiences.length || education.length || skills.length || projects.length || languages.length;
  return <article aria-label="Aperçu du CV" style={{ "--cv-accent": CV_ACCENTS.find((item) => item.value === accent)?.color ?? "#bd470d" } as CSSProperties} className={`min-w-0 break-words bg-white text-[#203045] ${compact ? "min-h-[340px] px-6 py-7" : "min-h-[650px] px-6 py-8 sm:min-h-[760px] sm:px-9 sm:py-10"}`}>
    <header className={horizon ? "-mx-6 -mt-8 border-t-[6px] border-[var(--cv-accent)] bg-[#f1f4f5] px-6 py-7 sm:-mx-9 sm:-mt-10 sm:px-9" : signature ? "border-b-2 border-[var(--cv-accent)] pb-6" : "border-l-4 border-[var(--cv-accent)] pl-5"}>
      <h2 className={`${signature ? "font-editorial text-[2rem] italic" : "text-[1.65rem] font-bold"} leading-tight tracking-tight text-[#182b3b]`}>{content.basics.fullName || <span className="font-sans text-lg font-normal text-[#8b949c]">Votre nom apparaîtra ici</span>}</h2>
      {content.basics.headline ? <p className="mt-2 text-sm font-medium leading-6 text-[var(--cv-accent)]">{content.basics.headline}</p> : null}
      {contacts.length ? <p className="mt-3 break-words text-[10px] leading-6 text-[#52606d]">{contacts.join(" · ")}</p> : null}
    </header>
    {content.summary.trim() ? <PreviewSection title="Profil" signature={signature}><p className="whitespace-pre-wrap text-[11px] leading-[1.8]">{content.summary}</p></PreviewSection> : null}
    {experiences.length ? <PreviewSection title="Expériences professionnelles" signature={signature}><div className="space-y-5">{experiences.map((entry) => <div key={entry.id} className="break-inside-avoid"><h4 className="text-xs font-bold leading-6">{entry.role || entry.company}</h4>{entry.role && entry.company ? <p className="text-[11px] font-medium leading-5">{entry.company}{entry.location ? ` · ${entry.location}` : ""}</p> : entry.location ? <p className="text-[11px] leading-5">{entry.location}</p> : null}<Dates start={entry.startDate} end={entry.endDate} current={entry.current} />{entry.description ? <p className="mt-2 whitespace-pre-wrap text-[11px] leading-[1.8]">{entry.description}</p> : null}</div>)}</div></PreviewSection> : null}
    {education.length ? <PreviewSection title="Formation" signature={signature}><div className="space-y-4">{education.map((entry) => <div key={entry.id} className="break-inside-avoid"><h4 className="text-xs font-bold leading-6">{entry.degree || entry.school}</h4>{entry.degree && entry.school ? <p className="text-[11px] leading-5">{entry.school}</p> : null}<Dates start={entry.startDate} end={entry.endDate} />{entry.description ? <p className="mt-2 whitespace-pre-wrap text-[11px] leading-[1.8]">{entry.description}</p> : null}</div>)}</div></PreviewSection> : null}
    {skills.length ? <PreviewSection title="Compétences" signature={signature}><p className="text-[11px] leading-[1.9]">{skills.join(" · ")}</p></PreviewSection> : null}
    {languages.length ? <PreviewSection title="Langues" signature={signature}><ul className="space-y-1 text-[11px] leading-6">{languages.map((entry) => <li key={entry.id}><span className="font-semibold">{entry.name}</span>{entry.level ? ` — ${entry.level}` : ""}</li>)}</ul></PreviewSection> : null}
    {projects.length ? <PreviewSection title="Projets" signature={signature}><div className="space-y-4">{projects.map((entry) => <div key={entry.id}><h4 className="text-xs font-bold leading-6">{entry.name}</h4>{entry.url ? <p className="break-all text-[10px] leading-5 text-[var(--cv-accent)]">{entry.url}</p> : null}{entry.description ? <p className="mt-2 whitespace-pre-wrap text-[11px] leading-[1.8]">{entry.description}</p> : null}</div>)}</div></PreviewSection> : null}
    {!hasContent && !compact ? <p className="mt-12 border-t border-dashed border-[#d8dce0] pt-7 text-xs leading-7 text-[#8b949c]">Votre parcours prend place ici au fil de la saisie. Les rubriques vides ne figurent pas dans le PDF.</p> : null}
  </article>;
}
