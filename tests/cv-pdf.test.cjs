const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const { createRequire } = require("node:module");
const path = require("node:path");
const ts = require("typescript");
const { loadTypeScript } = require("./helpers/crm-fixture.cjs");
const cv = loadTypeScript("src/lib/cv.ts");
function document(templateId, long = false) {
  const content = cv.createEmptyCv("Élodie Łaković — Exemple", "elodie@example.test");
  content.basics.headline = "Chargée de communication";
  content.basics.location = "Abidjan, Côte d’Ivoire";
  content.summary = "Chargée de communication expérimentée dans la coordination de projets associatifs. Organisation d’événements, rédaction de contenus et suivi des équipes.";
  content.experiences = Array.from({ length: long ? 16 : 2 }, (_, i) => ({ id: `exp-${i}`, role: `Chargée de communication ${i + 1}`, company: "Association de démonstration", location: "Abidjan", startDate: "2022-02", endDate: "2024-06", current: false, description: "Coordination des activités et des équipes bénévoles.\nRédaction de supports de présentation et préparation des événements.\nSuivi des demandes et amélioration des procédures d’accueil." }));
  content.education = [{ id: "edu-1", degree: "Licence en communication", school: "Établissement de démonstration", startDate: "2018-09", endDate: "2021-07", description: "Projet de fin d’études consacré à la communication associative." }];
  content.skills = ["Rédaction", "Organisation", "Communication"];
  content.languages = [{ id: "lang-1", name: "Français", level: "Courant" }];
  return { id: 1, title: "CV de démonstration", content, templateId, accent: "terracotta", version: 0, updatedAt: new Date().toISOString() };
}
async function renderer() {
  const reactPdf = await import("@react-pdf/renderer");
  const filename = path.resolve("src/lib/cv-pdf.tsx");
  const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
  const requireNative = createRequire(filename);
  const mocks = { "server-only": {}, "@react-pdf/renderer": reactPdf, "@/lib/cv": cv };
  const loaded = { exports: {} };
  new Function("require", "module", "exports", source)(name => Object.hasOwn(mocks, name) ? mocks[name] : requireNative(name), loaded, loaded.exports);
  return loaded.exports.renderCvPdf;
}
test("all three templates generate embedded-font PDFs and long CVs paginate", async () => {
  const render = await renderer();
  for (const template of cv.CV_TEMPLATES) {
    const buffer = await render(document(template.value));
    assert.equal(buffer.subarray(0, 5).toString(), "%PDF-");
    assert.ok(buffer.length > 9000 && buffer.length < 3 * 1024 * 1024);
    assert.match(buffer.toString("latin1"), /\/FontFile2/);
    if (process.env.CV_PDF_ARTIFACT_DIR) fs.writeFileSync(path.join(process.env.CV_PDF_ARTIFACT_DIR, `carriova-cv-${template.value}.pdf`), buffer);
  }
  const long = await render(document("horizon", true));
  const pages = [...long.toString("latin1").matchAll(/\/Type \/Page\b/g)].length;
  assert.ok(pages >= 2 && pages <= 8, `Unexpected page count: ${pages}`);
  if (process.env.CV_PDF_ARTIFACT_DIR) fs.writeFileSync(path.join(process.env.CV_PDF_ARTIFACT_DIR, "carriova-cv-multipage.pdf"), long);
});
