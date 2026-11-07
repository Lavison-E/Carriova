const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const ts = require("typescript");
const React = require("react");
const { renderToStaticMarkup } = require("react-dom/server");
const { loadTypeScript } = require("./helpers/crm-fixture.cjs");

const countries = loadTypeScript("src/lib/countries.ts");
const career = loadTypeScript("src/lib/career-profile.ts", { "@/lib/countries": countries });
const filename = path.resolve("src/components/profile/CareerProfileOverview.tsx");
const source = ts.transpileModule(fs.readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
const requireNative = createRequire(filename);
const mocks = {
  "next/link": ({ children, ...props }) => React.createElement("a", props, children),
  "@/components/brand/CareerIcon": { CareerIcon: () => React.createElement("svg", { "aria-hidden": true }) },
  "@/lib/countries": countries,
  "@/lib/career-profile": career,
};
const loaded = { exports: {} };
new Function("require", "module", "exports", source)((name) => Object.hasOwn(mocks, name) ? mocks[name] : requireNative(name), loaded, loaded.exports);
const customer = { name: "Aminata Exemple", email: "aminata@example.test" };
const render = (overrides = {}) => renderToStaticMarkup(React.createElement(loaded.exports.CareerProfileOverview, {
  customer, whatsapp: "+2250700000000", record: { profile: career.createEmptyCareerProfile(), version: 0, updatedAt: null }, cvs: [], ...overrides,
}));

test("a new account displays its identity and a clear next step even with no career details", () => {
  const html = render({ welcome: true });
  for (const value of [customer.name, customer.email, "+2250700000000", "Votre compte est créé", "Compléter mon profil", "Compléter ma recherche", "3 informations restent à renseigner"]) assert.ok(html.includes(value), value);
  assert.match(html, /href="\/espace\/profil\/modifier"/);
  assert.doesNotMatch(html, /href="\/espace\/opportunites"/);
});

test("saved career information is displayed with readable labels and its selected CV", () => {
  const profile = { ...career.createEmptyCareerProfile(), targetRoles: ["Responsable communication"], skills: ["Rédaction", "Excel"], experienceLevel: "senior", countryCode: "CI", city: "Abidjan", targetCountries: ["CI", "FR"], contractTypes: ["permanent"], workModes: ["remote"], languages: [{ name: "Français", level: "Courant" }], professionalSummary: "Je coordonne des projets éditoriaux.", educationSummary: "Master en communication", availability: "Après un mois de préavis", cvDocumentId: 14 };
  const html = render({ saved: true, record: { profile, version: 2, updatedAt: "2026-10-27T12:00:00.000Z" }, cvs: [{ id: 14, title: "CV communication" }, { id: 18, title: "CV non sélectionné" }] });
  for (const value of ["Responsable communication", "Rédaction", "Excel", "Senior", "Côte d’Ivoire", "France", "CDI", "À distance", "Français", "Courant", profile.professionalSummary, profile.educationSummary, profile.availability, "Votre profil a bien été enregistré", "CV communication"]) assert.ok(html.includes(value), value);
  assert.match(html, /href="\/espace\/opportunites"/);
  assert.match(html, /href="\/espace\/cv\/14"/);
  assert.doesNotMatch(html, /CV non sélectionné|href="\/espace\/cv\/18"/);
});

test("an unavailable or unlisted reference CV never creates a link to that document", () => {
  const record = { profile: { ...career.createEmptyCareerProfile(), cvDocumentId: 999 }, version: 1, updatedAt: "2026-10-27T12:00:00.000Z" };
  const html = render({ record, cvs: [{ id: 14, title: "Mon CV" }] });
  assert.ok(html.includes("Le CV associé n’est plus disponible"));
  assert.doesNotMatch(html, /href="\/espace\/cv\/999"/);
  assert.match(html, /Associer un CV/);
});

test("a CV loading incident preserves the profile and reports a temporary error", () => {
  const html = render({ cvsAvailable: false });
  assert.ok(html.includes(customer.name));
  assert.ok(html.includes(customer.email));
  assert.ok(html.includes("Vos CV sont temporairement indisponibles. Réessayez dans un instant."));
  assert.doesNotMatch(html, /Le CV associé n’est plus disponible|Créez votre CV dans le studio/);
});
