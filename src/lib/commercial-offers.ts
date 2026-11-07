/** Catalogue commercial validé dans la grille Carriova du 29 octobre 2026. Montants en XOF. */
export type CommercialOfferNeed =
  | "first_cv" | "improve_cv" | "targeted_cv" | "cover_letter"
  | "interview" | "career_growth" | "opportunities"
  | "linkedin" | "executive" | "special_file" | "organisation";

export type PublishedOffer = {
  slug: string;
  name: string;
  kind: "pack" | "service" | "organisation";
  solution: string;
  need: CommercialOfferNeed;
  priceAmount: number | null;
  priceMode: "fixed" | "from" | "quote";
  audience: string;
  benefits: string[];
  delivery: string;
  featured: boolean;
  referenceAmount?: number;
  badge?: string;
};

export const commercialSolutionLabels: Record<string, string> = {
  cv: "CV professionnel",
  lettres: "Lettre de motivation",
  matching: "Matching emploi-profil",
  linkedin: "Profil LinkedIn",
  entretien: "Coaching entretien",
  carriere: "Coaching carrière",
  recherche: "Recherche d’opportunités",
  expertise: "Relecture experte",
  organisations: "Entreprises & Écoles",
};

// Les valeurs de référence des packs sont celles de la grille validée.
// Elles ne sont pas recalculées en additionnant des prestations de périmètres différents.
export const publishedOffers: PublishedOffer[] = [
  {
    slug: "premier-pas", name: "Premier Pas", kind: "pack", solution: "cv", need: "improve_cv",
    priceAmount: 7500, priceMode: "fixed", referenceAmount: 9000,
    audience: "Étudiants, jeunes diplômés, premier emploi ou stage",
    benefits: ["CV Cleaning : CV existant restructuré et corrigé", "Fiche « Valoriser ses compétences »", "Checklist de candidature", "Modèle d’email de candidature", "1 série de corrections"],
    delivery: "72 h", featured: false, badge: "Petit budget",
  },
  {
    slug: "candidature-signature", name: "Candidature Signature", kind: "pack", solution: "cv", need: "first_cv",
    priceAmount: 15000, priceMode: "fixed", referenceAmount: 18000,
    audience: "Toute personne qui postule et veut un dossier cohérent",
    benefits: ["CV Signature : entièrement réécrit, design premium, Word + PDF", "Lettre de motivation ciblée sur une offre", "Conseils de personnalisation", "2 séries de corrections"],
    delivery: "5 jours ouvrés", featured: true, badge: "Recommandé",
  },
  {
    slug: "visibilite-professionnelle", name: "Visibilité Professionnelle", kind: "pack", solution: "linkedin", need: "linkedin",
    priceAmount: 25000, priceMode: "fixed", referenceAmount: 30000,
    audience: "Professionnels qui veulent être trouvés par les recruteurs",
    benefits: ["CV Signature", "Profil LinkedIn optimisé complet : titre, résumé, expériences et compétences", "Séance de positionnement de 30 min"],
    delivery: "7 jours ouvrés", featured: false,
  },
  {
    slug: "objectif-recrutement", name: "Objectif Recrutement", kind: "pack", solution: "entretien", need: "interview",
    priceAmount: 30000, priceMode: "fixed", referenceAmount: 35000,
    audience: "Candidature importante ou entretien déjà programmé",
    benefits: ["CV Signature", "Lettre ciblée", "Simulation d’entretien d’1 h", "Retour écrit personnalisé", "Pitch « Parlez-moi de vous » rédigé", "Fiche de préparation sur l’entreprise"],
    delivery: "7 jours · express possible après confirmation", featured: false,
  },
  {
    slug: "cap-reconversion", name: "Cap Reconversion", kind: "pack", solution: "carriere", need: "career_growth",
    priceAmount: 40000, priceMode: "fixed", referenceAmount: 48000,
    audience: "Changement de métier, de secteur, ou retour après une pause",
    benefits: ["Séance Bilan d’1 h 30", "1 séance de suivi", "CV Signature repositionné vers le nouveau métier", "LinkedIn Essentiel", "Plan d’action 90 jours"],
    delivery: "3 à 4 semaines", featured: false,
  },
  {
    slug: "executive", name: "Executive", kind: "pack", solution: "cv", need: "executive",
    priceAmount: 60000, priceMode: "fixed", referenceAmount: 71000,
    audience: "Cadres de plus de 8 ans d’expérience, managers, candidats à l’international",
    benefits: ["CV Executive", "LinkedIn optimisé complet", "Lettre Premium", "Préparation entretien intensive : 2 simulations", "Suivi WhatsApp pendant 30 jours"],
    delivery: "2 à 3 semaines", featured: false, badge: "Cadres et dirigeants",
  },
  {
    slug: "diagnostic-cv", name: "Diagnostic CV", kind: "service", solution: "cv", need: "improve_cv",
    priceAmount: 3000, priceMode: "fixed", audience: "Comprendre comment améliorer son CV existant",
    benefits: ["Lecture du CV existant", "Rapport écrit des 10 points à améliorer"],
    delivery: "48 h", featured: false, badge: "Pour commencer",
  },
  {
    slug: "cv-cleaning", name: "CV Cleaning", kind: "service", solution: "cv", need: "improve_cv",
    priceAmount: 6000, priceMode: "fixed", audience: "Professionnaliser un CV existant",
    benefits: ["CV existant restructuré, corrigé et harmonisé", "1 série de corrections"],
    delivery: "72 h", featured: false,
  },
  {
    slug: "cv-signature", name: "CV Signature", kind: "service", solution: "cv", need: "first_cv",
    priceAmount: 12000, priceMode: "fixed", audience: "Construire un CV qui valorise son parcours",
    benefits: ["Échange de 30 min sur le parcours", "CV entièrement réécrit", "Design premium", "Word + PDF", "2 séries de corrections"],
    delivery: "5 jours ouvrés", featured: false,
  },
  {
    slug: "cv-executive", name: "CV Executive", kind: "service", solution: "cv", need: "executive",
    priceAmount: 25000, priceMode: "fixed", audience: "Cadres, managers et profils expérimentés",
    benefits: ["Échange de 1 h", "CV cadre sur 2 pages", "Résumé de profil et réalisations chiffrées", "Version lisible par les logiciels de tri (ATS)", "3 séries de corrections"],
    delivery: "7 jours ouvrés", featured: false,
  },
  {
    slug: "correction-lettre", name: "Correction de lettre", kind: "service", solution: "lettres", need: "cover_letter",
    priceAmount: 3000, priceMode: "fixed", audience: "Améliorer une lettre déjà rédigée",
    benefits: ["Lettre existante relue, corrigée et resserrée"],
    delivery: "48 h", featured: false,
  },
  {
    slug: "lettre-ciblee", name: "Lettre ciblée", kind: "service", solution: "lettres", need: "cover_letter",
    priceAmount: 6000, priceMode: "fixed", audience: "Répondre à une offre précise",
    benefits: ["Lettre rédigée pour une offre précise", "1 série de corrections"],
    delivery: "72 h", featured: false,
  },
  {
    slug: "lettre-premium", name: "Lettre Premium", kind: "service", solution: "lettres", need: "cover_letter",
    priceAmount: 9000, priceMode: "fixed", audience: "Préparer la lettre et l’email de sa candidature",
    benefits: ["Lettre ciblée", "Email d’accompagnement de la candidature", "Version modèle réutilisable", "2 séries de corrections"],
    delivery: "4 jours ouvrés", featured: false,
  },
  {
    slug: "analyse-adequation", name: "Analyse d’adéquation", kind: "service", solution: "matching", need: "targeted_cv",
    priceAmount: 5000, priceMode: "fixed", audience: "Évaluer la correspondance entre son profil et une offre",
    benefits: ["Lecture croisée de l’offre et du CV", "Fiche atouts, écarts et questions à préparer"],
    delivery: "48 h", featured: false,
  },
  {
    slug: "cv-cible", name: "CV ciblé", kind: "service", solution: "matching", need: "targeted_cv",
    priceAmount: 7500, priceMode: "fixed", audience: "Adapter son CV à un poste précis",
    benefits: ["Analyse d’adéquation", "CV existant adapté à l’offre"],
    delivery: "72 h", featured: false,
  },
  {
    slug: "candidature-ciblee-complete", name: "Candidature ciblée complète", kind: "service", solution: "matching", need: "targeted_cv",
    priceAmount: 15000, priceMode: "fixed", audience: "Préparer un dossier complet pour une offre précise",
    benefits: ["Analyse d’adéquation", "CV adapté", "Lettre ciblée", "Email d’envoi"],
    delivery: "5 jours ouvrés", featured: false,
  },
  {
    slug: "linkedin-essentiel", name: "LinkedIn Essentiel", kind: "service", solution: "linkedin", need: "linkedin",
    priceAmount: 6000, priceMode: "fixed", audience: "Poser les bases de sa présence professionnelle sur LinkedIn",
    benefits: ["Conseils sur le titre, le résumé et la photo ou bannière", "Rédaction du titre et du résumé"],
    delivery: "72 h", featured: false,
  },
  {
    slug: "linkedin-complet", name: "LinkedIn Complet", kind: "service", solution: "linkedin", need: "linkedin",
    priceAmount: 12000, priceMode: "fixed", audience: "Valoriser l’ensemble de son profil LinkedIn",
    benefits: ["LinkedIn Essentiel inclus", "Expériences et compétences réécrites", "10 mots-clés recruteurs", "Conseils de publication"],
    delivery: "5 jours ouvrés", featured: false,
  },
  {
    slug: "preparation-express", name: "Préparation Express", kind: "service", solution: "entretien", need: "interview",
    priceAmount: 8000, priceMode: "fixed", audience: "Se préparer rapidement à un entretien",
    benefits: ["Séance de 45 min", "Questions fréquentes du poste", "Pitch de présentation travaillé"],
    delivery: "Sous 48 h", featured: false,
  },
  {
    slug: "simulation-complete", name: "Simulation complète", kind: "service", solution: "entretien", need: "interview",
    priceAmount: 12000, priceMode: "fixed", audience: "S’entraîner à un entretien avec un retour personnalisé",
    benefits: ["Simulation d’entretien d’1 h en visio ou en présentiel", "Retour écrit personnalisé"],
    delivery: "Sous 72 h", featured: false,
  },
  {
    slug: "preparation-intensive", name: "Préparation Intensive", kind: "service", solution: "entretien", need: "interview",
    priceAmount: 25000, priceMode: "fixed", audience: "Approfondir sa préparation à un recrutement",
    benefits: ["2 simulations", "Fiche de préparation entreprise", "Pitch rédigé", "Questions à poser au recruteur", "Préparation à la négociation salariale"],
    delivery: "1 semaine", featured: false,
  },
  {
    slug: "seance-declic", name: "Séance Déclic", kind: "service", solution: "carriere", need: "career_growth",
    priceAmount: 10000, priceMode: "fixed", audience: "Débloquer une question précise sur sa carrière",
    benefits: ["Séance de 45 min sur une question précise", "Prochaines actions"],
    delivery: "Sous 1 semaine", featured: false,
  },
  {
    slug: "seance-bilan", name: "Séance Bilan", kind: "service", solution: "carriere", need: "career_growth",
    priceAmount: 20000, priceMode: "fixed", audience: "Faire le point sur ses atouts et ses pistes d’évolution",
    benefits: ["Séance d’1 h 30", "Bilan des atouts, envies et pistes", "Plan d’action écrit"],
    delivery: "Sous 1 semaine", featured: false,
  },
  {
    slug: "parcours-cap-carriere", name: "Parcours Cap Carrière", kind: "service", solution: "carriere", need: "career_growth",
    priceAmount: 40000, priceMode: "fixed", audience: "Avancer dans son projet avec un accompagnement suivi",
    benefits: ["3 séances sur 6 semaines", "Plan d’action", "Suivi WhatsApp entre les séances"],
    delivery: "6 semaines", featured: false,
  },
  {
    slug: "strategie-recherche", name: "Stratégie de recherche", kind: "service", solution: "recherche", need: "opportunities",
    priceAmount: 10000, priceMode: "fixed", audience: "Organiser sa recherche d’emploi et identifier ses cibles",
    benefits: ["Séance de 45 min", "Critères et cibles définis", "Liste de 15 entreprises ou sites à suivre", "Plan de recherche"],
    delivery: "Sous 1 semaine", featured: false,
  },
  {
    slug: "accompagnement-un-mois", name: "Accompagnement 1 mois", kind: "service", solution: "recherche", need: "opportunities",
    priceAmount: 35000, priceMode: "fixed", audience: "Être accompagné chaque semaine dans sa recherche d’emploi",
    benefits: ["Stratégie de recherche", "Sélection d’offres chaque semaine", "3 CV ciblés", "Point hebdomadaire"],
    delivery: "4 semaines", featured: false,
  },
  {
    slug: "relecture-dossier", name: "Relecture de dossier", kind: "service", solution: "expertise", need: "improve_cv",
    priceAmount: 5000, priceMode: "fixed", audience: "Faire relire son CV et sa lettre avant de candidater",
    benefits: ["CV et lettre relus", "Retours commentés et priorités d’amélioration"],
    delivery: "48 h", featured: false,
  },
  {
    slug: "dossier-special", name: "Dossier spécial", kind: "service", solution: "expertise", need: "special_file",
    priceAmount: 15000, priceMode: "fixed", audience: "Bourse, concours, stage ou candidature à l’international",
    benefits: ["Relecture du dossier de bourse, concours, stage ou candidature à l’international", "Recommandations", "Document retravaillé"],
    delivery: "5 jours ouvrés", featured: false,
  },
  {
    slug: "atelier-cv-candidature", name: "Atelier CV & candidature", kind: "organisation", solution: "organisations", need: "organisation",
    priceAmount: 100000, priceMode: "from", audience: "Promotions d’étudiants et associations",
    benefits: ["Atelier de 2 h pour 20 à 40 participants", "Supports remis", "5 CV corrigés en direct"],
    delivery: "Calendrier à convenir", featured: false,
  },
  {
    slug: "programme-employabilite", name: "Programme Employabilité", kind: "organisation", solution: "organisations", need: "organisation",
    priceAmount: null, priceMode: "quote", audience: "Écoles et centres de formation",
    benefits: ["3 ateliers : CV, LinkedIn et entretien", "Simulations d’entretien en petits groupes", "Kit de candidature"],
    delivery: "Calendrier à convenir", featured: false,
  },
  {
    slug: "salaries-en-transition", name: "Accompagnement des salariés en transition", kind: "organisation", solution: "organisations", need: "organisation",
    priceAmount: null, priceMode: "quote", audience: "Entreprises : mobilité interne ou fin de contrat",
    benefits: ["Packs individuels à tarif négocié", "Coaching carrière", "Suivi"],
    delivery: "Calendrier à convenir", featured: false,
  },
];

export function getPublishedOffer(slug: unknown): PublishedOffer | undefined {
  if (typeof slug !== "string") return undefined;
  return publishedOffers.find((offer) => offer.slug === slug);
}

const priceFormatter = new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 });

export function formatOfferPrice(offer: PublishedOffer): string {
  if (offer.priceMode === "quote" || offer.priceAmount === null) return "Sur devis";
  const amount = `${priceFormatter.format(offer.priceAmount)} FCFA`;
  return offer.priceMode === "from" ? `À partir de ${amount}` : amount;
}

export function offerRequestHref(offer: PublishedOffer, context: "public" | "workspace" = "public"): string {
  const query = new URLSearchParams({ [context === "workspace" ? "service" : "need"]: offer.need, offer: offer.slug });
  return `${context === "workspace" ? "/espace/nouvelle-demande" : "/qualification"}?${query.toString()}`;
}

export type CommercialOptionId = "express-24h" | "english-cv" | "extra-letter" | "extra-corrections";
export type CommercialOption = {
  id: CommercialOptionId;
  label: string;
  priceAmount: number;
  description: string;
  eligibleSlugs: readonly string[];
  requiresConfirmation: boolean;
};

const packSlugs = publishedOffers.filter((offer) => offer.kind === "pack").map((offer) => offer.slug);
const writtenOfferSlugs = publishedOffers
  .filter((offer) => offer.kind !== "organisation" && !["preparation-express", "seance-declic"].includes(offer.slug))
  .map((offer) => offer.slug);

/** Suppléments proposés sur les seules offres concernées, à confirmer dans la proposition de l’équipe. */
export const commercialOptions: CommercialOption[] = [
  {
    id: "express-24h", label: "Livraison express (24 h)", priceAmount: 3000,
    description: "Disponibilité et faisabilité à confirmer par l’équipe avant validation de la proposition.",
    eligibleSlugs: ["diagnostic-cv", "cv-cleaning", "cv-signature", "cv-executive", "cv-cible", "correction-lettre", "lettre-ciblee", "lettre-premium", "premier-pas", "candidature-signature"],
    requiresConfirmation: true,
  },
  {
    id: "english-cv", label: "Version anglaise du CV", priceAmount: 6000,
    description: "Version anglaise du CV livré dans la prestation.",
    eligibleSlugs: [...packSlugs, "cv-cleaning", "cv-signature", "cv-executive", "cv-cible", "candidature-ciblee-complete", "accompagnement-un-mois"],
    requiresConfirmation: true,
  },
  {
    id: "extra-letter", label: "Lettre ciblée supplémentaire", priceAmount: 4000,
    description: "Une lettre pour une autre offre, en complément d’un pack comprenant déjà une lettre.",
    eligibleSlugs: ["candidature-signature", "objectif-recrutement", "executive"],
    requiresConfirmation: true,
  },
  {
    id: "extra-corrections", label: "Série de corrections supplémentaire", priceAmount: 2000,
    description: "Une série de corrections supplémentaire sur les documents de la prestation.",
    eligibleSlugs: writtenOfferSlugs,
    requiresConfirmation: true,
  },
];

export function getApplicableCommercialOptions(offer: PublishedOffer): CommercialOption[] {
  return commercialOptions.filter((option) => option.eligibleSlugs.includes(offer.slug));
}
