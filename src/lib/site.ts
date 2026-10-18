export const DEFAULT_SITE_URL = "https://www.carriovaci.com";

/**
 * Normalise une origine publique (http/https, sans slash final).
 * Module partagé client/serveur : n’y lire que des variables NEXT_PUBLIC_*.
 * Les variables serveur (DATABASE_URL, CONTACT_EMAIL) vivent dans src/lib/env.ts.
 */
export function normalizeSiteUrl(raw?: string | null): string | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    if (url.hostname.toLowerCase() === "carriovaci.com") {
      url.hostname = "www.carriovaci.com";
      url.protocol = "https:";
    }
    return `${url.origin}${url.pathname}`.replace(/\/+$/, "");
  } catch {
    return null;
  }
}

/** Numéro au format international, chiffres uniquement (ex. 2250700000000) ; null sinon. */
export function normalizeWhatsappNumber(raw?: string | null): string | null {
  const digits = (raw ?? "").trim().replace(/^(\+|00)/, "").replace(/[\s().-]/g, "");
  // Les indicatifs pays ne commencent jamais par 0 : un numéro local (07…) est refusé.
  return /^[1-9]\d{7,14}$/.test(digits) ? digits : null;
}

export function normalizePlausibleDomain(raw?: string | null): string | null {
  const value = raw?.trim().toLowerCase();
  return value && /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(value) ? value : null;
}

// Intégrations publiques : variables NEXT_PUBLIC_* inlinées au build (reconstruire après modification).
export const publicIntegrations = {
  whatsappNumber: normalizeWhatsappNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER),
  plausibleDomain: normalizePlausibleDomain(process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN),
} as const;

/** Lien « click-to-chat » WhatsApp, ou null tant qu’aucun numéro n’est configuré. */
export function whatsappChatUrl(
  text = "Bonjour CARRIOVA, je souhaite échanger sur mon projet carrière.",
): string | null {
  const number = publicIntegrations.whatsappNumber;
  return number ? `https://wa.me/${number}?text=${encodeURIComponent(text)}` : null;
}

export const siteConfig = {
  name: "CARRIOVA",
  tagline: "Révélez votre potentiel. Boostez votre carrière.",
  description:
    "Une plateforme intelligente pour valoriser votre profil, construire des candidatures convaincantes, trouver les bonnes opportunités et faire progresser votre carrière.",
  // NEXT_PUBLIC_SITE_URL est inliné au build : reconstruire après modification.
  url: normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ?? DEFAULT_SITE_URL,
  locale: "fr_CI",
  lang: "fr",
  social: {
    linkedin: "https://www.linkedin.com/company/carriova",
    facebook: "https://www.facebook.com/carriova",
  },
  market: "Côte d'Ivoire",
} as const;

export const primaryNav = [
  { href: "/", label: "Accueil" },
  { href: "/solutions", label: "Solutions" },
  { href: "/solutions/cv", label: "CV" },
  { href: "/solutions/lettre-de-motivation", label: "Lettre de motivation" },
  { href: "/emploi", label: "Emploi & Opportunités" },
  { href: "/solutions/coaching", label: "Coaching" },
  { href: "/a-propos", label: "À propos" },
  { href: "/ressources", label: "Ressources" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/contact", label: "Contact" },
] as const;

export const compactNav = [
  { href: "/solutions", label: "Solutions" },
  { href: "/emploi", label: "Emploi" },
  { href: "/solutions/coaching", label: "Coaching" },
  { href: "/ressources", label: "Ressources" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/a-propos", label: "À propos" },
] as const;

export const journeySteps = [
  { key: "potential", label: "Potentiel", href: "/solutions/cv" },
  { key: "direction", label: "Direction", href: "/solutions/coaching" },
  { key: "opportunity", label: "Opportunité", href: "/emploi" },
  { key: "application", label: "Candidature", href: "/solutions/lettre-de-motivation" },
  { key: "progression", label: "Progression", href: "/solutions/matching" },
  { key: "growth", label: "Croissance", href: "/solutions/expertise" },
] as const;

export const intents = [
  {
    id: "job",
    label: "Je cherche un emploi",
    href: "/emploi",
    cta: "Trouver un emploi",
  },
  {
    id: "cv",
    label: "Je veux améliorer mon CV",
    href: "/solutions/cv",
    cta: "Créer mon CV",
  },
  {
    id: "career",
    label: "Je veux évoluer ou me reconvertir",
    href: "/solutions/coaching",
    cta: "Parler à un expert",
  },
  {
    id: "coaching",
    label: "Je veux un coaching carrière",
    href: "/solutions/coaching",
    cta: "Réserver une séance",
  },
  {
    id: "recruit",
    label: "Je veux recruter",
    href: "/contact?objet=recruteur",
    cta: "Contacter CARRIOVA",
  },
] as const;

export const ecosystemModules = [
  {
    n: "01",
    title: "Mon Profil",
    href: "/solutions/cv",
    text: "Découvrez et structurez votre potentiel : expériences, compétences, réalisations, ambitions.",
  },
  {
    n: "02",
    title: "CV professionnel",
    href: "/solutions/cv",
    text: "Un CV stratégique, orienté recruteur, construit à partir de votre profil et du poste visé.",
  },
  {
    n: "03",
    title: "Lettre de motivation",
    href: "/solutions/lettre-de-motivation",
    text: "Des lettres personnalisées qui relient votre parcours à l’opportunité, sans formules génériques.",
  },
  {
    n: "04",
    title: "Opportunités",
    href: "/solutions/opportunites",
    text: "Repérez des offres pertinentes selon votre marché, votre niveau et votre projet professionnel.",
  },
  {
    n: "05",
    title: "Matching emploi-profil",
    href: "/solutions/matching",
    text: "Comparez profil, compétences, expériences et objectifs avec les exigences d’un poste.",
  },
  {
    n: "06",
    title: "Candidatures",
    href: "/emploi",
    text: "Préparez, adaptez et suivez vos candidatures dans un parcours cohérent.",
  },
  {
    n: "07",
    title: "Coaching carrière",
    href: "/solutions/coaching",
    text: "Orientation, employabilité, entretien, positionnement et progression, selon votre besoin.",
  },
  {
    n: "08",
    title: "Expertise humaine",
    href: "/solutions/expertise",
    text: "L’IA structure. La méthode décide. L’expertise humaine valide lorsque c’est nécessaire.",
  },
] as const;

export const solutions = [
  {
    slug: "cv",
    title: "CV professionnel",
    short: "Positionnez votre parcours et produisez un CV convaincant.",
    href: "/solutions/cv",
    cta: "Créer mon CV",
    audience: "Chercheurs d’emploi, professionnels, étudiants, diaspora",
  },
  {
    slug: "lettre-de-motivation",
    title: "Lettre de motivation",
    short: "Racontez votre contribution avec une lettre réellement personnalisée.",
    href: "/solutions/lettre-de-motivation",
    cta: "Créer ma lettre",
    audience: "Candidats qui visent un poste précis",
  },
  {
    slug: "opportunites",
    title: "Emploi & opportunités",
    short: "Découvrez des opportunités alignées avec votre profil et votre marché.",
    href: "/solutions/opportunites",
    cta: "Trouver un emploi",
    audience: "Chercheurs d’emploi et jeunes diplômés",
  },
  {
    slug: "matching",
    title: "Matching emploi-profil",
    short: "Comprenez l’adéquation entre votre profil et une offre, sans promesse artificielle.",
    href: "/solutions/matching",
    cta: "Analyser mon profil",
    audience: "Candidats qui veulent candidater avec discernement",
  },
  {
    slug: "coaching",
    title: "Coaching carrière",
    short: "Un accompagnement humain pour clarifier, décider et progresser.",
    href: "/solutions/coaching",
    cta: "Réserver une séance",
    audience: "Professionnels, étudiants, personnes en reconversion",
  },
  {
    slug: "expertise",
    title: "Expertise humaine",
    short: "Une relecture experte pour valider, affiner et sécuriser vos livrables.",
    href: "/solutions/expertise",
    cta: "Parler à un expert",
    audience: "Ceux qui veulent un regard senior sur leur candidature",
  },
] as const;

export const audiences = [
  {
    title: "Chercheurs d’emploi",
    text: "CV, lettre, opportunités, matching et soutien à la candidature pour avancer avec méthode.",
    href: "/emploi",
  },
  {
    title: "Professionnels en poste",
    text: "Optimisez votre positionnement, préparez une promotion ou une mobilité interne.",
    href: "/solutions/coaching",
  },
  {
    title: "Étudiants et jeunes diplômés",
    text: "Premier CV, direction de carrière, stages et guidance d’employabilité.",
    href: "/cv-etudiant",
  },
  {
    title: "Diaspora et mobilité",
    text: "CV international, positionnement transfrontalier et candidatures adaptées aux marchés visés.",
    href: "/cv-international",
  },
] as const;

export const problems = [
  "Un positionnement professionnel flou",
  "Un CV faible, générique ou mal lu par les recruteurs",
  "Des candidatures copiées-collées",
  "Des opportunités difficiles à identifier",
  "Un manque de direction de carrière",
  "Peu d’accompagnement personnalisé",
] as const;

export const transformations = [
  "Un profil clarifié et assumé",
  "Un CV stratégique, chiffré et lisible",
  "Des lettres liées à l’opportunité",
  "Des pistes d’emploi plus pertinentes",
  "Un projet professionnel plus net",
  "Un accompagnement humain lorsque c’est utile",
] as const;

export const howSteps = [
  {
    title: "Découverte",
    text: "Nous partons de vous : parcours, preuves, compétences, objectifs et, si possible, le poste visé.",
  },
  {
    title: "Positionnement",
    text: "Nous identifions ce qui vous rend pertinent pour un recruteur, un marché ou une évolution.",
  },
  {
    title: "Production",
    text: "CV, lettre, candidature ou plan d’action sont construits à partir de cette matière réelle.",
  },
  {
    title: "Validation",
    text: "La méthode cadre le livrable. L’expertise humaine intervient pour relire, ajuster et confirmer.",
  },
  {
    title: "Progression",
    text: "Vous partez avec des documents utiles, des opportunités à explorer et une direction plus claire.",
  },
] as const;

export const whyPoints = [
  {
    title: "Un écosystème, pas un outil isolé",
    text: "Profil, CV, lettre, opportunités, matching et coaching s’enchaînent. Votre carrière n’est pas un fichier PDF.",
  },
  {
    title: "Une méthode avant la production",
    text: "Nous ne commençons pas par un modèle. Nous commençons par comprendre votre potentiel et le poste visé.",
  },
  {
    title: "IA, règles et expertise humaine",
    text: "L’IA aide à structurer. Les règles métier encadrent. L’humain valide lorsque la décision le mérite.",
  },
  {
    title: "Conçu pour l’Afrique et l’international",
    text: "Né pour la Côte d’Ivoire, pensé pour l’Afrique de l’Ouest, le monde francophone et la mobilité internationale.",
  },
] as const;

export const coachingFormats = [
  {
    title: "Coaching individuel",
    text: "Un espace pour clarifier votre situation, vos options et votre prochain pas.",
  },
  {
    title: "Orientation professionnelle",
    text: "Pour les étudiants, jeunes diplômés ou personnes en questionnement de trajectoire.",
  },
  {
    title: "Coaching d’employabilité",
    text: "Préparer un marché, un CV, une stratégie de recherche et un discours cohérent.",
  },
  {
    title: "Préparation aux entretiens",
    text: "Structurer vos récits, vos preuves et vos réponses aux questions décisives.",
  },
  {
    title: "Positionnement professionnel",
    text: "Affiner votre offre de valeur, votre titre, votre narrative et votre cible.",
  },
  {
    title: "Progression de carrière",
    text: "Préparer une promotion, une mobilité ou une prise de responsabilité.",
  },
] as const;

export const footerGroups = [
  {
    title: "Solutions",
    links: [
      { href: "/solutions/cv", label: "CV" },
      { href: "/solutions/lettre-de-motivation", label: "Lettre de motivation" },
      { href: "/emploi", label: "Emploi" },
      { href: "/solutions/matching", label: "Matching" },
      { href: "/solutions/coaching", label: "Coaching" },
      { href: "/solutions/expertise", label: "Expertise" },
    ],
  },
  {
    title: "Ressources",
    links: [
      { href: "/blog", label: "Blog" },
      { href: "/guides", label: "Guides" },
      { href: "/conseils-carriere", label: "Conseils carrière" },
      { href: "/faq", label: "FAQ" },
      { href: "/support", label: "Support" },
      { href: "/conseils-cv", label: "Conseils CV" },
    ],
  },
  {
    title: "Entreprise",
    links: [
      { href: "/a-propos", label: "À propos" },
      { href: "/contact", label: "Contact" },
      { href: "/tarifs", label: "Tarifs" },
      { href: "/compte/creer", label: "Créer mon compte" },
      { href: "/compte/connexion", label: "Se connecter" },
    ],
  },
  {
    title: "Légal",
    links: [
      { href: "/legal/confidentialite", label: "Confidentialité" },
      { href: "/legal/conditions", label: "Conditions d’utilisation" },
      { href: "/legal/cookies", label: "Cookies" },
    ],
  },
] as const;
