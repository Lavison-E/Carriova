import type { Opportunity } from "@/lib/opportunities";
// Editorial selection verified against the official vacancy and closing-date pages.
// Automatically hidden on the exact closing time, or after seven days without review.
const checked = "2026-10-18T20:40:00Z";
const unicefChecked = "2026-10-22T05:06:21Z";
export const selectedOpportunities: Opportunity[] = [
  {
    slug: "unfpa-programme-associate-37279", title: "Programme Associate, G6", company: "UNFPA", location: "Abidjan", country: "Côte d’Ivoire", countryCode: "CI", contractType: "Engagement à durée déterminée", experience: "Confirmé", industry: "Administration & programmes", workMode: null,
    description: "Appuyer la gestion administrative et opérationnelle des programmes, le suivi des plans de travail et la coordination logistique. Bac+2 en secrétariat ou administration et six ans d’expérience pertinente demandés.",
    publishedAt: null, updatedAt: checked, expiresAt: "2026-10-20T17:30:00Z", sourceKind: "selection", sourceName: "UNFPA · Carrières", sourceUrl: "https://www.unfpa.org/jobs/programme-associate-g6-abidjanc%C3%B4te-divoire", reference: "37279", verifiedAt: checked,
  },
  {
    slug: "unicef-evaluation-bounkani-596346", title: "Consultant international — évaluation du projet Bounkani", company: "UNICEF", location: "Abidjan", country: "Côte d’Ivoire", countryCode: "CI", contractType: "Consultance · 5 mois", experience: "Confirmé", industry: "Évaluation & développement", workMode: "Télétravail et missions",
    description: "Conduire l’évaluation d’un projet de résilience des communautés frontalières, coordonner les travaux et analyser les données. Diplôme supérieur pertinent et dix ans d’expérience en évaluation requis.",
    publishedAt: "2026-10-15T00:00:00Z", updatedAt: unicefChecked, expiresAt: "2026-10-29T23:55:00Z", sourceKind: "selection", sourceName: "UNICEF · Carrières", sourceUrl: "https://jobs.unicef.org/cw/es/job/596346/consultante-internationale-evaluation-formative-du-projet-renforcer-la-r%C3%A9silience-des-communaut%C3%A9s-frontali%C3%A8res-du-bounkani-pmde-abidjan-cote-divoire-5-mois-teletravailmission-596346", reference: "596346", verifiedAt: unicefChecked,
  },
  {
    slug: "unicef-revision-rapports-596251", title: "Consultant international — révision des rapports en anglais", company: "UNICEF", location: "Abidjan", country: "Côte d’Ivoire", countryCode: "CI", contractType: "Consultance · 4 mois", experience: "Confirmé", industry: "Rédaction & communication", workMode: "Télétravail",
    description: "Réviser en anglais le rapport annuel du bureau, les résultats des programmes et le rapport humanitaire. Master pertinent et cinq ans d’expérience rédactionnelle demandés, avec anglais C2 et français B2/C1.",
    publishedAt: "2026-10-12T00:00:00Z", updatedAt: unicefChecked, expiresAt: "2026-10-27T23:55:00Z", sourceKind: "selection", sourceName: "UNICEF · Carrières", sourceUrl: "https://jobs.unicef.org/cw/fr/job/596251/international-consultantediting-and-review-the-english-country-office-annual-reportannual-sitrep-the-results-assessment4-month-unicef-pmde-section-cote-divoire-abidjanhome-based-596251", reference: "596251", verifiedAt: unicefChecked,
  },
];
