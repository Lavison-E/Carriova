import "server-only";
import path from "node:path";
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { CV_ACCENTS, type CvDocument } from "@/lib/cv";

for (const [family, subset] of [["CarriovaSans", "latin"], ["CarriovaSansExtended", "latin-ext"]]) {
  Font.register({ family, fonts: [400, 700].map(weight => ({ src: path.join(process.cwd(), "public", "fonts", "cv", `noto-sans-${subset}-${weight}-normal.woff`), fontWeight: weight })) });
}
Font.registerHyphenationCallback(word => [word]);
const palette = Object.fromEntries(CV_ACCENTS.map(item => [item.value, item.color]));
const style = StyleSheet.create({
  page: { paddingTop: 42, paddingBottom: 48, paddingHorizontal: 44, fontFamily: ["CarriovaSans", "CarriovaSansExtended"], fontSize: 9.5, lineHeight: 1.55, color: "#202C32" },
  header: { paddingBottom: 18, marginBottom: 18, borderBottomWidth: 1, borderBottomColor: "#DDE2E0" },
  name: { fontSize: 28, lineHeight: 1.12, fontWeight: 700, marginBottom: 6 },
  headline: { fontSize: 12, marginBottom: 10, lineHeight: 1.4 },
  contacts: { fontSize: 8.5, lineHeight: 1.7, color: "#53615F" },
  heading: { fontSize: 9, fontWeight: 700, marginBottom: 8, marginTop: 5, textTransform: "uppercase" },
  section: { marginBottom: 13 },
  entry: { marginBottom: 11 },
  role: { fontSize: 10.5, fontWeight: 700, lineHeight: 1.45 },
  organization: { color: "#53615F", fontSize: 9, marginTop: 2, marginBottom: 4 },
  body: { fontSize: 9.5, lineHeight: 1.55 },
  footer: { position: "absolute", bottom: 23, left: 44, right: 44, fontSize: 7.5, color: "#697472", textAlign: "right" },
});
const monthNames = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
function date(value: string) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? `${monthNames[Number(value.slice(5)) - 1]} ${value.slice(0, 4)}` : ""; }
function period(start: string, end: string, current = false) { return [date(start), current ? "Aujourd’hui" : date(end)].filter(Boolean).join(" – "); }
function Body({ value }: { value: string }) { return value ? <Text style={style.body} orphans={3} widows={3}>{value}</Text> : null; }
function Section({ title, color, children }: { title: string; color: string; children: ReactNode }) {
  return <View style={style.section}><Text style={[style.heading, { color }]} minPresenceAhead={45}>{title}</Text>{children}</View>;
}
export function CvPdfDocument({ document }: { document: CvDocument }) {
  const source = document.content, color = palette[document.accent];
  const cv = { ...source,
    experiences: source.experiences.filter(item => item.role.trim() || item.company.trim() || item.description.trim()),
    education: source.education.filter(item => item.degree.trim() || item.school.trim() || item.description.trim()),
    projects: source.projects.filter(item => item.name.trim() || item.description.trim()),
    languages: source.languages.filter(item => item.name.trim()),
    skills: source.skills.filter(item => item.trim()),
  };
  const horizon = document.templateId === "horizon", signature = document.templateId === "signature";
  const contacts = [cv.basics.email, cv.basics.phone, cv.basics.location, cv.basics.website].filter(Boolean).join("  ·  ");
  return <Document title={document.title} author={cv.basics.fullName} creator="Carriova" language="fr-FR">
    <Page size="A4" style={style.page} wrap>
      <View style={[style.header, horizon ? { backgroundColor: "#F1F5F3", padding: 18, borderBottomWidth: 0, borderLeftWidth: 4, borderLeftColor: color } : {}, signature ? { textAlign: "center", borderBottomColor: color, borderBottomWidth: 2 } : {}]}>
        <Text style={[style.name, { color }, signature ? { fontFamily: ["Times-Roman", "CarriovaSans", "CarriovaSansExtended"], fontSize: 34, fontWeight: 400 } : {}]}>{cv.basics.fullName || "Curriculum vitæ"}</Text>
        {cv.basics.headline ? <Text style={style.headline}>{cv.basics.headline}</Text> : null}
        {contacts ? <Text style={style.contacts}>{contacts}</Text> : null}
      </View>
      {cv.summary.trim() ? <Section title="Profil" color={color}><Body value={cv.summary} /></Section> : null}
      {cv.experiences.length ? <Section title="Expériences professionnelles" color={color}>{cv.experiences.map(item => <View key={item.id} style={style.entry}>
        <Text style={style.role} minPresenceAhead={32}>{item.role || item.company}</Text>
        <Text style={style.organization} minPresenceAhead={22}>{[item.role ? item.company : "", item.location, period(item.startDate, item.endDate, item.current)].filter(Boolean).join(" · ")}</Text>
        <Body value={item.description} />
      </View>)}</Section> : null}
      {cv.education.length ? <Section title="Formation" color={color}>{cv.education.map(item => <View key={item.id} style={style.entry}>
        <Text style={style.role} minPresenceAhead={32}>{item.degree || item.school}</Text>
        <Text style={style.organization} minPresenceAhead={22}>{[item.degree ? item.school : "", period(item.startDate, item.endDate)].filter(Boolean).join(" · ")}</Text>
        <Body value={item.description} />
      </View>)}</Section> : null}
      {cv.skills.length ? <Section title="Compétences" color={color}><Body value={cv.skills.join(" · ")} /></Section> : null}
      {cv.languages.length ? <Section title="Langues" color={color}><Body value={cv.languages.map(item => [item.name, item.level].filter(Boolean).join(" — ")).join(" · ")} /></Section> : null}
      {cv.projects.length ? <Section title="Projets" color={color}>{cv.projects.map(item => <View key={item.id} style={style.entry}>
        <Text style={style.role} minPresenceAhead={32}>{item.name}</Text>
        {item.url ? <Text style={style.organization}>{item.url}</Text> : null}
        <Body value={item.description} />
      </View>)}</Section> : null}
      <Text style={style.footer} fixed render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} />
    </Page>
  </Document>;
}
export async function renderCvPdf(document: CvDocument) { return renderToBuffer(<CvPdfDocument document={document} />); }
