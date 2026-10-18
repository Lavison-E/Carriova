import { qualificationOptions } from "@/lib/qualification";

export type ServiceNeed = (typeof qualificationOptions.need)[number]["value"];
export type CommercialOffer = {
  slug: string;
  name: string;
  category: string;
  tagline: string | null;
  benefits: string[];
  need?: ServiceNeed;
  priceAmount: number | null;
  currency: string;
  priceLabel: string;
  featured: boolean;
};

const needsBySlug: Record<string, ServiceNeed> = {
  cv: "first_cv", first_cv: "first_cv", "premier-cv": "first_cv",
  "audit-cv": "improve_cv", expertise: "improve_cv", improve_cv: "improve_cv", premium: "improve_cv",
  matching: "targeted_cv", "cv-lettre": "targeted_cv", targeted_cv: "targeted_cv",
  lettre: "cover_letter", "lettre-de-motivation": "cover_letter", cover_letter: "cover_letter",
  entretien: "interview", interview: "interview",
  coaching: "career_growth", career_growth: "career_growth",
  opportunites: "opportunities", opportunities: "opportunities",
};

export function serviceNeedForSlug(slug: string): ServiceNeed | undefined {
  return Object.hasOwn(needsBySlug, slug) ? needsBySlug[slug] : undefined;
}

export function qualificationRequestHref(need?: ServiceNeed) {
  return need ? `/qualification?need=${encodeURIComponent(need)}` : "/qualification";
}

export function workspaceRequestHref(need?: ServiceNeed) {
  return need ? `/espace/nouvelle-demande?service=${encodeURIComponent(need)}` : "/espace/nouvelle-demande";
}

// These are the services accepted by the request form. No price is inferred from a budget answer.
const catalogueDefinitions = [
  { slug: "first_cv", name: "Création de CV professionnel", category: "Démarrer", tagline: "Construire un CV structuré qui présente votre parcours, vos compétences et votre objectif professionnel.", benefits: ["Échange sur votre parcours", "Rédaction et présentation du CV", "Document partagé dans votre espace"], need: "first_cv" },
  { slug: "improve_cv", name: "CV Cleaning — Optimisation de CV", category: "Valoriser", tagline: "Corriger, restructurer et harmoniser un CV existant pour valoriser votre expérience et clarifier votre candidature.", benefits: ["Relecture du contenu et de la structure", "Correction et harmonisation de la présentation", "Version optimisée livrée dans votre espace"], need: "improve_cv" },
  { slug: "targeted_cv", name: "CV ciblé — Adaptation à une offre", category: "Se positionner", tagline: "Relier votre parcours aux attentes d’une offre précise.", benefits: ["Lecture de l’offre et de votre profil", "Choix des expériences pertinentes", "Adaptation du CV à la candidature"], need: "targeted_cv" },
  { slug: "cover_letter", name: "Lettre de motivation personnalisée", category: "Convaincre", tagline: "Expliquer votre motivation et votre contribution à partir d’une opportunité réelle.", benefits: ["Échange sur le poste visé", "Rédaction personnalisée", "Ajustements dans la conversation de votre demande"], need: "cover_letter" },
  { slug: "interview", name: "Coaching entretien", category: "Se préparer", tagline: "Travailler la présentation de votre parcours et les exemples utiles pour votre entretien.", benefits: ["Objectif et format convenus avec l’équipe", "Préparation de votre discours", "Retours et pistes de travail"], need: "interview" },
  { slug: "career_growth", name: "Coaching carrière", category: "Faire le point", tagline: "Clarifier une évolution, une reconversion ou votre prochaine étape professionnelle.", benefits: ["Échange sur votre situation", "Séance et créneau confirmés avec vous", "Prochaines actions définies ensemble"], need: "career_growth" },
  { slug: "opportunities", name: "Recherche d’opportunités ciblée", category: "Cibler", tagline: "Préciser votre recherche et repérer les types d’offres adaptés à votre profil.", benefits: ["Critères de recherche clarifiés", "Lecture de votre positionnement", "Conseils pour prioriser vos candidatures"], need: "opportunities" },
] satisfies Array<Omit<CommercialOffer, "priceAmount" | "currency" | "priceLabel" | "featured">>;

export const catalogueOffers: CommercialOffer[] = catalogueDefinitions.map((offer) => ({ ...offer, priceAmount: null, currency: "XOF", priceLabel: "Sur devis", featured: false }));
