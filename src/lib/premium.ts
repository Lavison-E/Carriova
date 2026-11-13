import type { CareerProfile } from "@/lib/career-profile";

export const PREMIUM_SERVICE = "premium_pass";
export const PREMIUM_PRICE = 2000;
export const PREMIUM_DAYS = 30;
export const PREMIUM_AI_DAILY_LIMIT = 15;
export const PREMIUM_AD_MAX = 12000;

export const applicationStatusOptions = [
  { value: "to_apply", label: "À postuler", tone: "bg-[#f1efe9] text-[#4a5272]" },
  { value: "applied", label: "Candidature envoyée", tone: "bg-[#e8eefb] text-[#1d3c8a]" },
  { value: "interview", label: "Entretien", tone: "bg-[#fff1e3] text-[#9a4a0b]" },
  { value: "offer", label: "Offre reçue", tone: "bg-[#e8f4ec] text-[#285236]" },
  { value: "rejected", label: "Non retenue", tone: "bg-[#f7eeee] text-[#7c4440]" },
  { value: "archived", label: "Archivée", tone: "bg-[#efefef] text-[#6b6b6b]" },
] as const;
export type ApplicationStatus = (typeof applicationStatusOptions)[number]["value"];
export const isApplicationStatus = (value: unknown): value is ApplicationStatus => applicationStatusOptions.some((option) => option.value === value);
export const applicationStatusLabel = (status: ApplicationStatus) => applicationStatusOptions.find((option) => option.value === status)?.label ?? status;

export type ApplicationAnalysis = {
  score: number;
  verdict: "strong" | "good" | "stretch";
  roleMatch: boolean;
  matchedSkills: string[];
  missingKeywords: string[];
  experienceNote: string | null;
  languageNote: string | null;
  strengths: string[];
  actions: string[];
};
export type ApplicationKit = {
  pitch: string;
  coverLetter: string;
  cvAdjustments: string[];
  interviewQuestions: { question: string; tip: string }[];
  followUpMessage: string;
};
export type PrepPlan = {
  focus: string;
  skills: { name: string; why: string; actions: string[] }[];
  weeks: { title: string; tasks: string[] }[];
  interviewQuestions: { question: string; tip: string }[];
  source: "method" | "ai";
};

export const fold = (value: string) => value.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[’']/g, " ").toLowerCase();
const has = (haystack: string, needle: string) => {
  const term = fold(needle).trim();
  if (term.length < 2) return false;
  return new RegExp(`(^|[^a-z0-9])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^a-z0-9])`).test(haystack);
};
const unique = <T,>(values: T[]) => [...new Set(values)];

/** Skills and tools recruiters often screen for in West-African job ads. Matched as whole words. */
const KEYWORDS = [
  "excel", "word", "powerpoint", "pack office", "google workspace", "sap", "sage", "odoo", "erp", "crm", "salesforce", "power bi", "tableau", "sql", "python", "r", "spss", "stata",
  "comptabilité", "fiscalité", "audit", "contrôle de gestion", "trésorerie", "paie", "recouvrement", "syscohada", "ifrs", "analyse financière", "budget",
  "gestion de projet", "management", "leadership", "reporting", "planification", "logistique", "supply chain", "achats", "approvisionnement", "gestion des stocks", "transit",
  "prospection", "négociation", "vente", "relation client", "service client", "fidélisation", "business development", "marketing digital", "community management", "réseaux sociaux", "seo", "communication",
  "rédaction", "traduction", "ressources humaines", "recrutement", "formation", "droit", "juridique", "conformité", "secrétariat", "assistanat", "accueil",
  "javascript", "typescript", "react", "node", "java", "php", "laravel", "django", "devops", "cloud", "aws", "linux", "réseau", "cybersécurité", "data", "machine learning",
  "autocad", "génie civil", "btp", "qhse", "hse", "maintenance", "électricité", "mécanique", "agronomie", "santé", "pharmacie", "infirmier", "enseignement",
  "anglais", "espagnol", "permis b", "photoshop", "canva", "figma",
];

function experienceYears(text: string) {
  const match = fold(text).match(/(\d{1,2})\s*(?:\+\s*)?(?:a|à)?\s*(?:\d{1,2}\s*)?ans?\s+(?:d\s*)?(?:experience|exp)/);
  return match ? Number(match[1]) : null;
}
const levelYears: Record<string, [number, number]> = { student: [0, 0], entry: [0, 1], junior: [1, 3], mid: [3, 7], senior: [7, 15], executive: [10, 40] };

/** Deterministic, explainable comparison of a job ad with the career profile. No data leaves the server. */
export function analyzeApplication(profile: CareerProfile, ad: { title: string; description: string }): ApplicationAnalysis {
  const text = fold(`${ad.title}\n${ad.description}`);
  const title = fold(ad.title);
  const profileSkills = unique(profile.skills.map((skill) => skill.trim()).filter(Boolean));
  const profileText = fold([profile.skills.join(" "), profile.professionalSummary, profile.educationSummary, profile.targetRoles.join(" ")].join(" "));

  const roleWords = unique(profile.targetRoles.flatMap((role) => fold(role).split(/[^a-z0-9+#]+/)).filter((word) => word.length > 3));
  const roleMatch = roleWords.some((word) => title.includes(word)) || profile.targetRoles.some((role) => role.trim() && has(text, role));
  const matchedSkills = profileSkills.filter((skill) => has(text, skill));
  const required = KEYWORDS.filter((keyword) => has(text, keyword));
  const missingKeywords = required.filter((keyword) => !has(profileText, keyword) && !matchedSkills.some((skill) => fold(skill).includes(fold(keyword)))).slice(0, 10);
  const covered = required.length ? (required.length - missingKeywords.length) / required.length : matchedSkills.length ? 0.7 : 0.4;

  const years = experienceYears(ad.description);
  const range = levelYears[profile.experienceLevel] ?? null;
  let experienceScore = 0.6, experienceNote: string | null = null;
  if (years !== null && range) {
    if (range[1] >= years) { experienceScore = 1; experienceNote = `L’offre demande environ ${years} an${years > 1 ? "s" : ""} d’expérience : votre niveau correspond.`; }
    else if (range[1] + 2 >= years) { experienceScore = 0.6; experienceNote = `L’offre demande ${years} ans d’expérience : mettez en avant stages, projets et missions pour combler l’écart.`; }
    else { experienceScore = 0.25; experienceNote = `L’offre demande ${years} ans d’expérience, au-delà de votre niveau déclaré : candidature ambitieuse, à argumenter avec des résultats concrets.`; }
  } else if (years === null && range) experienceScore = 0.8;

  const wantsEnglish = has(text, "anglais") || has(text, "english");
  const speaksEnglish = profile.languages.some((language) => ["anglais", "english"].includes(fold(language.name).trim()));
  const languageScore = !wantsEnglish ? 1 : speaksEnglish ? 1 : 0.3;
  const languageNote = wantsEnglish ? (speaksEnglish ? "L’anglais est demandé : précisez votre niveau réel dans le CV." : "L’anglais est demandé et n’apparaît pas dans votre profil : ajoutez-le si vous le pratiquez, avec votre niveau.") : null;

  const score = Math.max(5, Math.min(98, Math.round((roleMatch ? 35 : 12) + covered * 40 + experienceScore * 15 + languageScore * 10)));
  const verdict = score >= 75 ? "strong" : score >= 55 ? "good" : "stretch";
  const strengths = [
    ...(roleMatch ? ["Le poste correspond à l’un de vos métiers recherchés."] : []),
    ...(matchedSkills.length ? [`${matchedSkills.length} de vos compétences apparaissent dans l’annonce : ${matchedSkills.slice(0, 5).join(", ")}.`] : []),
    ...(experienceScore === 1 ? ["Votre niveau d’expérience répond à l’exigence affichée."] : []),
  ];
  const actions = [
    ...(missingKeywords.length ? [`Si vous les maîtrisez réellement, ajoutez dans votre CV : ${missingKeywords.slice(0, 5).join(", ")}.`] : []),
    `Reprenez l’intitulé exact « ${ad.title.trim().slice(0, 80)} » en titre de votre CV.`,
    "Placez dans le premier tiers du CV deux réalisations chiffrées liées aux missions de l’offre.",
    ...(experienceNote && experienceScore < 1 ? ["Valorisez stages, projets et bénévolat comme expérience pertinente."] : []),
    "Envoyez la candidature sous 48 h : les premières reçues sont lues avec plus d’attention.",
  ];
  return { score, verdict, roleMatch, matchedSkills, missingKeywords, experienceNote, languageNote, strengths, actions };
}

/** Role families drive the preparation plan when no AI plan is available. */
const FAMILIES: { key: string; label: string; words: string[]; skills: { name: string; why: string; actions: string[] }[]; questions: { question: string; tip: string }[] }[] = [
  { key: "finance", label: "Comptabilité et finance", words: ["compta", "financ", "audit", "tresor", "fiscal", "controle de gestion", "recouvrement", "paie"],
    skills: [
      { name: "Excel avancé", why: "Tableaux croisés, RECHERCHEX et rapprochements sont testés dans la plupart des entretiens.", actions: ["Refaire un rapprochement bancaire complet sur un jeu de données fictif", "Construire un tableau de bord mensuel avec TCD et graphiques"] },
      { name: "SYSCOHADA et clôture", why: "Le référentiel OHADA est exigé dans la quasi-totalité des postes de la sous-région.", actions: ["Réviser les écritures de clôture et d’inventaire", "Préparer une fiche synthèse des comptes de classe 4 et 6"] },
      { name: "Logiciel comptable", why: "Sage ou un ERP est souvent cité comme indispensable.", actions: ["Suivre une formation en ligne sur Sage ou Odoo Comptabilité", "Citer précisément les modules utilisés dans votre CV"] },
    ],
    questions: [
      { question: "Comment préparez-vous une clôture mensuelle ?", tip: "Déroulez les étapes dans l’ordre : rapprochements, cut-off, provisions, contrôles, reporting." },
      { question: "Racontez une erreur comptable que vous avez détectée.", tip: "Méthode STAR : situation, action de contrôle, correction, impact chiffré." },
    ] },
  { key: "sales", label: "Commerce et vente", words: ["commercial", "vente", "vendeur", "business", "sales", "prospect", "chef de secteur", "key account"],
    skills: [
      { name: "Prospection structurée", why: "Les recruteurs veulent un pipeline, pas seulement du relationnel.", actions: ["Préparer un pitch de 60 secondes sur un produit de l’entreprise visée", "Montrer comment vous suivez vos relances (CRM, tableur)"] },
      { name: "Négociation", why: "Défendre la marge est une compétence clé en entretien.", actions: ["S’entraîner sur 3 objections prix avec un proche", "Préparer un exemple de vente conclue avec chiffre"] },
      { name: "Résultats chiffrés", why: "Un commercial se juge sur ses chiffres.", actions: ["Lister vos objectifs atteints (CA, nombre de clients, taux de conversion)", "Les placer en tête de chaque expérience du CV"] },
    ],
    questions: [
      { question: "Vendez-moi ce stylo.", tip: "Posez d’abord des questions sur le besoin avant de présenter le produit." },
      { question: "Quel est votre meilleur résultat commercial ?", tip: "Chiffre, contexte, méthode, ce que vous referiez." },
    ] },
  { key: "tech", label: "Informatique et data", words: ["develop", "informati", "data", "logiciel", "web", "devops", "reseau", "cyber", "analyste", "ingenieur"],
    skills: [
      { name: "Portfolio vérifiable", why: "Un lien GitHub ou une démo vaut plus qu’une liste de technologies.", actions: ["Publier 2 projets propres avec README", "Ajouter le lien en haut du CV"] },
      { name: "Fondamentaux techniques", why: "Les tests techniques portent sur les bases (algorithmes, SQL, HTTP).", actions: ["Faire 10 exercices SQL et 10 exercices d’algorithmique", "Revoir le fonctionnement d’une requête web de bout en bout"] },
      { name: "Communication technique", why: "Expliquer un choix technique simplement fait la différence.", actions: ["Préparer l’explication d’un projet en 2 minutes", "Savoir justifier un compromis technique"] },
    ],
    questions: [
      { question: "Présentez un projet dont vous êtes fier.", tip: "Problème, votre rôle précis, choix techniques, résultat mesurable." },
      { question: "Comment déboguez-vous un problème en production ?", tip: "Reproduire, isoler, mesurer, corriger, prévenir." },
    ] },
  { key: "admin", label: "Administration et assistanat", words: ["assistant", "secretar", "administrat", "accueil", "office", "receptionn"],
    skills: [
      { name: "Bureautique professionnelle", why: "Word, Excel et la messagerie sont évalués dès le premier entretien.", actions: ["Mettre en forme un courrier officiel et un compte rendu", "Créer un planning partagé"] },
      { name: "Organisation et priorités", why: "Gérer plusieurs demandes urgentes est le cœur du poste.", actions: ["Préparer un exemple de journée chargée bien gérée", "Présenter votre méthode de suivi des tâches"] },
      { name: "Communication écrite", why: "La qualité des écrits reflète l’image de la direction.", actions: ["Relire et corriger 3 courriers types", "Soigner l’orthographe du CV et de la lettre"] },
    ],
    questions: [
      { question: "Deux responsables vous donnent une tâche urgente en même temps : que faites-vous ?", tip: "Clarifier l’urgence réelle, informer, proposer un ordre, tenir les délais." },
      { question: "Comment gérez-vous un visiteur mécontent ?", tip: "Écoute, reformulation, solution, suivi." },
    ] },
  { key: "marketing", label: "Marketing et communication", words: ["marketing", "communic", "community", "digital", "brand", "contenu", "journal"],
    skills: [
      { name: "Résultats de campagnes", why: "Les recruteurs regardent l’impact : portée, engagement, conversions.", actions: ["Documenter une campagne avec ses chiffres", "Préparer un mini-portfolio de 5 visuels ou publications"] },
      { name: "Outils", why: "Canva, Meta Business Suite et Google Analytics sont souvent cités.", actions: ["Obtenir une certification gratuite (Google, Meta)", "Citer les outils maîtrisés dans le CV"] },
      { name: "Stratégie éditoriale", why: "Savoir planifier montre la séniorité.", actions: ["Rédiger un calendrier éditorial d’un mois pour l’entreprise visée", "Proposer 3 idées concrètes en entretien"] },
    ],
    questions: [
      { question: "Comment mesurez-vous le succès d’une campagne ?", tip: "Objectif, indicateurs, résultats, ajustements." },
      { question: "Que changeriez-vous à notre communication ?", tip: "Observez leurs réseaux avant l’entretien ; proposez sans critiquer." },
    ] },
  { key: "development", label: "Projets, programmes et développement", words: ["programme", "projet", "suivi-evaluation", "suivi evaluation", "evaluation", "ong", "humanitaire", "coordinat", "plaidoyer", "bailleur"],
    skills: [
      { name: "Suivi-évaluation et indicateurs", why: "Cadre logique, indicateurs et collecte de données sont au cœur des postes de programme.", actions: ["Reconstruire le cadre logique d’un projet que vous connaissez", "Préparer un exemple de tableau de suivi d’indicateurs"] },
      { name: "Rapports aux bailleurs", why: "Les organisations recrutent des profils capables de produire des rapports clairs, souvent en anglais.", actions: ["Rédiger un rapport d’activité d’une page sur un projet passé", "Réviser le vocabulaire projet en anglais (outcome, output, baseline)"] },
      { name: "Gestion budgétaire de projet", why: "Suivre un budget et justifier des dépenses rassure les bailleurs.", actions: ["Revoir un budget de projet et ses lignes principales", "Préparer un exemple de réallocation budgétaire justifiée"] },
    ],
    questions: [
      { question: "Comment avez-vous suivi les indicateurs d’un projet ?", tip: "Indicateurs choisis, outils de collecte, fréquence, décisions prises grâce aux données." },
      { question: "Racontez une difficulté avec un partenaire ou un bailleur.", tip: "Méthode STAR : contexte, votre action de dialogue, résultat pour le projet." },
    ] },
];
const GENERIC = {
  label: "votre métier cible",
  skills: [
    { name: "CV orienté résultats", why: "Les recruteurs lisent un CV en quelques secondes : les résultats doivent sauter aux yeux.", actions: ["Réécrire chaque expérience avec un verbe d’action et un résultat", "Limiter le CV à une page si vous avez moins de 5 ans d’expérience"] },
    { name: "Pitch de présentation", why: "« Présentez-vous » ouvre presque tous les entretiens.", actions: ["Rédiger un pitch de 90 secondes : parcours, compétences, projet", "Le répéter à voix haute 5 fois"] },
    { name: "Connaissance de l’entreprise", why: "Montrer que vous avez préparé fait souvent la différence.", actions: ["Lire le site, les réseaux et les actualités de l’entreprise", "Préparer 3 questions à poser au recruteur"] },
  ],
  questions: [
    { question: "Présentez-vous.", tip: "Présent, passé, futur : ce que vous faites, ce que vous avez accompli, pourquoi ce poste." },
    { question: "Pourquoi devrions-nous vous recruter ?", tip: "Reliez 3 exigences de l’offre à 3 preuves de votre parcours." },
    { question: "Quel est votre principal défaut ?", tip: "Un vrai point d’amélioration, et ce que vous faites concrètement pour progresser." },
  ],
};

export function profileFamily(profile: CareerProfile) {
  const text = fold([...profile.targetRoles, ...profile.skills].join(" "));
  // Short words (ong, web…) must match whole words; longer ones may be prefixes (compta…).
  return FAMILIES.find((family) => family.words.some((word) => word.length <= 4 ? has(text, word) : text.includes(word))) ?? null;
}

/** Method-based plan, always available. The AI plan, when enabled, replaces it with personalised content. */
export function buildPrepPlan(profile: CareerProfile): PrepPlan {
  const family = profileFamily(profile);
  const base = family ?? GENERIC;
  const role = profile.targetRoles.find((value) => value.trim()) ?? "";
  const declared = new Set(profile.skills.map((skill) => fold(skill)));
  const skills = base.skills.filter((skill) => !declared.has(fold(skill.name))).slice(0, 3);
  return {
    focus: role ? `Préparation ciblée pour un poste de ${role}${family ? ` (${family.label.toLowerCase()})` : ""}.` : `Préparation pour ${base.label}. Complétez vos métiers recherchés dans votre profil pour un plan plus précis.`,
    skills: skills.length ? skills : base.skills.slice(0, 2),
    weeks: [
      { title: "Semaine 1 · Positionnement", tasks: ["Choisir 2 intitulés de poste cibles", "Mettre à jour le CV avec des résultats chiffrés", "Compléter votre profil CARRIOVA à 100 %"] },
      { title: "Semaine 2 · Compétences", tasks: skills.slice(0, 2).map((skill) => skill.actions[0]).concat("Lister 5 réalisations racontables avec la méthode STAR") },
      { title: "Semaine 3 · Candidatures", tasks: ["Préparer 5 candidatures ciblées avec l’assistant Premium", "Relancer chaque candidature après 7 jours", "Demander une recommandation à un ancien responsable"] },
      { title: "Semaine 4 · Entretiens", tasks: ["S’entraîner sur les questions ci-dessous à voix haute", "Préparer 3 questions pour le recruteur", "Faire une simulation d’entretien avec un proche ou un conseiller"] },
    ],
    interviewQuestions: [...GENERIC.questions, ...(family?.questions ?? [])].slice(0, 6),
    source: "method",
  };
}

const COUNT = (min: number, max: number) => ({ type: "array", minItems: min, maxItems: max });
export const APPLICATION_KIT_SCHEMA = {
  type: "object", additionalProperties: false, required: ["pitch", "coverLetter", "cvAdjustments", "interviewQuestions", "followUpMessage"],
  properties: {
    pitch: { type: "string" }, coverLetter: { type: "string" }, followUpMessage: { type: "string" },
    cvAdjustments: { ...COUNT(3, 7), items: { type: "string" } },
    interviewQuestions: { ...COUNT(4, 8), items: { type: "object", additionalProperties: false, required: ["question", "tip"], properties: { question: { type: "string" }, tip: { type: "string" } } } },
  },
};
export const PREP_PLAN_SCHEMA = {
  type: "object", additionalProperties: false, required: ["focus", "skills", "weeks", "interviewQuestions"],
  properties: {
    focus: { type: "string" },
    skills: { ...COUNT(2, 5), items: { type: "object", additionalProperties: false, required: ["name", "why", "actions"], properties: { name: { type: "string" }, why: { type: "string" }, actions: { ...COUNT(1, 4), items: { type: "string" } } } } },
    weeks: { ...COUNT(4, 4), items: { type: "object", additionalProperties: false, required: ["title", "tasks"], properties: { title: { type: "string" }, tasks: { ...COUNT(2, 5), items: { type: "string" } } } } },
    interviewQuestions: { ...COUNT(4, 8), items: { type: "object", additionalProperties: false, required: ["question", "tip"], properties: { question: { type: "string" }, tip: { type: "string" } } } },
  },
};
