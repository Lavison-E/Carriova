import "dotenv/config";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

const jobs = [
  {
    slug: "charge-de-clientele-abidjan",
    title: "Chargé de clientèle",
    company: "Institution financière — offre publiée via CARRIOVA",
    location: "Abidjan",
    country: "Côte d'Ivoire",
    contractType: "CDI",
    experience: "1-3 ans",
    industry: "Banque & finance",
    workMode: "Sur site",
    description:
      "Accompagner un portefeuille de clients, comprendre leurs besoins et proposer des solutions adaptées, dans un environnement de service exigeant.",
    responsibilities:
      "- Accueillir et conseiller les clients\n- Analyser les besoins et orienter vers les offres pertinentes\n- Suivre les dossiers et la qualité de service\n- Contribuer aux objectifs d’activité avec éthique",
    qualifications:
      "- Formation supérieure en gestion, commerce ou équivalent\n- Aisance relationnelle et rigueur\n- Maîtrise des outils bureautiques\n- Français impeccable, anglais un plus",
    applicationMethod:
      "Préparez un CV ciblé via CARRIOVA, puis envoyez votre candidature à l’adresse indiquée lors de la mise en relation.",
    keywords: "clientèle, banque, Abidjan, conseil",
  },
  {
    slug: "developpeur-fullstack-abidjan",
    title: "Développeur full stack",
    company: "Éditeur digital — offre publiée via CARRIOVA",
    location: "Abidjan",
    country: "Côte d'Ivoire",
    contractType: "CDI",
    experience: "3-5 ans",
    industry: "Technologie",
    workMode: "Hybride",
    description:
      "Concevoir et faire évoluer des produits web, en lien avec les métiers, avec un souci de qualité, de clarté et de maintenance.",
    responsibilities:
      "- Développer des fonctionnalités front et back\n- Participer aux choix techniques\n- Documenter et tester\n- Collaborer avec produit et design",
    qualifications:
      "- Expérience avérée sur des applications web\n- JavaScript/TypeScript, API, bases SQL\n- Capacité à expliquer des choix\n- Curiosité et rigueur",
    applicationMethod:
      "CV et lien vers réalisations. Une lettre courte expliquant un projet dont vous êtes fier est bienvenue.",
    keywords: "développeur, fullstack, javascript, abidjan",
  },
  {
    slug: "responsable-marketing-dakar",
    title: "Responsable marketing",
    company: "Marque régionale — offre publiée via CARRIOVA",
    location: "Dakar",
    country: "Sénégal",
    contractType: "CDI",
    experience: "5+ ans",
    industry: "Marketing",
    workMode: "Hybride",
    description:
      "Piloter la stratégie d’acquisition et de marque sur un marché ouest-africain, avec une exigence de clarté et de mesure.",
    responsibilities:
      "- Définir les priorités marketing\n- Superviser campagnes et contenus\n- Coordonner agences et équipes internes\n- Suivre des indicateurs utiles, sans vanité",
    qualifications:
      "- Expérience marketing en Afrique de l’Ouest\n- Capacité à relier marque et business\n- Leadership sobre\n- Français, anglais professionnel",
    applicationMethod: "Candidature via CARRIOVA : CV adapté et lettre de motivation ciblée.",
    keywords: "marketing, dakar, marque, acquisition",
  },
  {
    slug: "assistant-rh-abidjan",
    title: "Assistant ressources humaines",
    company: "Groupe industriel — offre publiée via CARRIOVA",
    location: "Abidjan",
    country: "Côte d'Ivoire",
    contractType: "CDD",
    experience: "0-2 ans",
    industry: "Ressources humaines",
    workMode: "Sur site",
    description:
      "Soutenir les opérations RH du quotidien : administration, accueil des candidats, suivi des dossiers et communication interne.",
    responsibilities:
      "- Gérer des dossiers administratifs\n- Appuyer le recrutement opérationnel\n- Organiser des entretiens\n- Contribuer à une expérience candidat respectueuse",
    qualifications:
      "- Formation RH, droit ou gestion\n- Discrétion et organisation\n- Bon relationnel\n- Première expérience ou stage valorisé",
    applicationMethod: "CV étudiant ou junior bien structuré. Une lettre courte est recommandée.",
    keywords: "RH, assistant, junior, abidjan",
  },
  {
    slug: "chef-de-projet-digital-remote",
    title: "Chef de projet digital",
    company: "Cabinet — offre publiée via CARRIOVA",
    location: "Afrique de l’Ouest",
    country: "Côte d'Ivoire",
    contractType: "Freelance",
    experience: "3-5 ans",
    industry: "Conseil",
    workMode: "Télétravail",
    description:
      "Piloter des projets digitaux pour des organisations de la région, à distance, avec une communication claire et des livrables nets.",
    responsibilities:
      "- Cadre projet et planning\n- Coordination des parties prenantes\n- Suivi qualité\n- Restitutions régulières",
    qualifications:
      "- Expérience de gestion de projet digital\n- Aisance à l’écrit\n- Autonomie\n- Sens du service",
    applicationMethod: "CV international et exemples de projets. Entretien visio.",
    keywords: "chef de projet, remote, digital, freelance",
  },
  {
    slug: "commercial-terrain-bouake",
    title: "Commercial terrain",
    company: "Réseau de distribution — offre publiée via CARRIOVA",
    location: "Bouaké",
    country: "Côte d'Ivoire",
    contractType: "CDI",
    experience: "1-3 ans",
    industry: "Vente",
    workMode: "Sur site",
    description:
      "Développer un portefeuille en région, visiter les points de vente et faire remonter une information terrain utile.",
    responsibilities:
      "- Prospection et suivi clients\n- Négociation dans le cadre fixé\n- Reporting simple et régulier\n- Représentation professionnelle de la marque",
    qualifications:
      "- Expérience commerciale souhaitée\n- Permis et mobilité\n- Résistance et courtoisie\n- Goût du terrain",
    applicationMethod: "CV + disponibilité. Préparation d’entretien conseillée.",
    keywords: "commercial, bouaké, vente, terrain",
  },
];

const posts = [
  {
    slug: "comment-faire-un-cv-professionnel",
    title: "Comment faire un CV professionnel sans se perdre dans les modèles",
    excerpt:
      "Un CV utile commence par un positionnement. Voici une méthode claire, adaptée aux candidats en Côte d’Ivoire et à l’international.",
    category: "CV",
    cluster: "cv",
    readingTime: 8,
    relatedSolution: "Créer mon CV",
    relatedHref: "/solutions/cv",
    seoTitle: "Comment faire un CV professionnel",
    seoDescription:
      "Méthode pour concevoir un CV professionnel : cible, preuves, compétences, lisibilité. Conseils CARRIOVA.",
    content: `Un CV professionnel n’est pas un exercice de décoration. C’est un document de décision : en quelques secondes, un recruteur doit comprendre qui vous êtes, ce que vous savez faire, et pourquoi cela concerne le poste.

## Commencer par la cible

Avant le modèle, choisissez un angle. Un même parcours ne se raconte pas de la même façon pour un poste commercial, un poste RH ou une mobilité internationale. CARRIOVA part de cette cible.

## Raconter des réalisations

Remplacez « responsable de » par des faits. Quel périmètre ? Quelle action ? Quel résultat ? Si vous n’avez pas de chiffre, restez honnête : décrivez l’impact sans l’inventer.

## Rendre le document lisible

Titres clairs, dates cohérentes, marges respirantes, compétences réellement mobilisées. Un CV trop chargé fatigue. Un CV trop vide n’aide pas.

## Relier ensuite à la candidature

Un bon CV prépare la lettre, l’entretien et le matching. Ce n’est pas un livrable isolé. Découvrez la solution CV CARRIOVA pour structurer cette étape.`,
  },
  {
    slug: "erreurs-cv-a-eviter",
    title: "Erreurs CV : ce qui fait perdre un recruteur en dix secondes",
    excerpt:
      "Les erreurs de CV les plus fréquentes ne sont pas graphiques. Elles sont stratégiques : flou, jargon, incohérence, absence de preuves.",
    category: "CV",
    cluster: "cv",
    readingTime: 6,
    relatedSolution: "Faire auditer mon CV",
    relatedHref: "/solutions/expertise",
    seoTitle: "Erreurs CV à éviter",
    seoDescription: "Les erreurs de CV qui affaiblissent une candidature, et comment les corriger avec méthode.",
    content: `Un recruteur ne « lit » pas toujours un CV. Il le scanne. Tout ce qui ralentit cette lecture devient une raison de passer au suivant.

## Le flou

« Dynamique, motivé, à l’écoute » ne dit rien. Dites plutôt ce que vous avez fait, dans quel contexte, avec quel résultat.

## L’incohérence

Des dates qui se chevauchent, un titre trop ambitieux, des compétences jamais illustrées : le doute s’installe.

## Le modèle illisible

Colonnes étroites, icônes gratuites, graphiques de compétences. La forme doit servir le fond.

## L’absence de cible

Un CV « pour tout » parle à personne. Choisissez un marché, un type de poste, un niveau. Puis adaptez.`,
  },
  {
    slug: "cv-ats-ce-quil-faut-vraiment-savoir",
    title: "CV ATS : ce qu’il faut vraiment savoir",
    excerpt:
      "L’ATS n’est pas un mythe, mais ce n’est pas non plus une excuse pour produire un document laid et pauvre.",
    category: "CV",
    cluster: "cv",
    readingTime: 7,
    relatedSolution: "Créer mon CV",
    relatedHref: "/solutions/cv",
    seoTitle: "CV ATS",
    seoDescription: "Comprendre les ATS sans sacrifier la lisibilité humaine de votre CV.",
    content: `Les systèmes de suivi des candidatures (ATS) extraient du texte. Ils aiment les intitulés simples, les dates claires, l’absence de tableaux complexes.

## Ce qui aide

- Un fichier propre, souvent un PDF textuel
- Des rubriques nommées classiquement
- Des mots du poste, s’ils correspondent vraiment à votre parcours

## Ce qui n’aide pas

Sacrifier toute personnalité pour « matcher » des mots-clés. Un ATS mal paramétré n’excuse pas un CV vide de preuves.

## La lecture humaine reste première

Même filtré, votre CV sera lu par quelqu’un. CARRIOVA vise les deux exigences : extraction possible, lecture agréable.`,
  },
  {
    slug: "comment-rediger-une-lettre-de-motivation",
    title: "Comment rédiger une lettre de motivation professionnelle",
    excerpt:
      "Une lettre utile n’est pas un modèle à remplir. Elle relie votre contribution à un besoin réel.",
    category: "Lettre",
    cluster: "lettre",
    readingTime: 7,
    relatedSolution: "Créer ma lettre",
    relatedHref: "/solutions/lettre-de-motivation",
    seoTitle: "Comment rédiger une lettre de motivation",
    seoDescription:
      "Méthode pour une lettre de motivation personnalisée : structure, preuves, ton, erreurs à éviter.",
    content: `La lettre de motivation a mauvaise réputation parce qu’elle est souvent générique. Pourtant, lorsqu’elle est spécifique, elle accélère la décision.

## Une structure simple

Pourquoi cette organisation, pourquoi ce poste, pourquoi vous, quelle preuve, quelle suite. Quatre mouvements suffisent.

## Une preuve plutôt qu’une déclaration

« Je suis passionné » convainc peu. Une situation courte, un résultat, un apprentissage convainquent davantage.

## Relier au CV

La lettre ne répète pas. Elle éclaire. CARRIOVA reliera plus tard lettre, CV et profil dans le même espace candidat.`,
  },
  {
    slug: "recherche-emploi-methode",
    title: "Recherche d’emploi : une méthode plus utile que le volume",
    excerpt:
      "Postuler plus ne remplace pas un ciblage, un CV adapté et un suivi. Voici une approche sobre.",
    category: "Emploi",
    cluster: "emploi",
    readingTime: 8,
    relatedSolution: "Trouver un emploi",
    relatedHref: "/emploi",
    seoTitle: "Recherche d’emploi méthode",
    seoDescription: "Comment chercher un emploi avec méthode : ciblage, candidatures, suivi, entretien.",
    content: `La recherche d’emploi fatigue lorsqu’elle n’a pas de cadre. On multiplie les envois, on attend, on doute.

## Cibler

Métier, secteur, ville, contrat. Trois cibles valent mieux que trente pistes floues.

## Adapter

Chaque candidature sérieuse mérite un angle. CARRIOVA existe pour relier offre, CV et lettre.

## Préparer l’entretien

Le matching n’est pas une garantie. C’est une lecture des alignements et des écarts, pour arriver en entretien lucide.`,
  },
  {
    slug: "reussir-un-entretien-embauche",
    title: "Réussir un entretien : raconter des preuves, pas un personnage",
    excerpt:
      "L’entretien se prépare comme un dossier : situations, résultats, questions, clarté du projet.",
    category: "Emploi",
    cluster: "emploi",
    readingTime: 6,
    relatedSolution: "Réserver une séance",
    relatedHref: "/solutions/coaching",
    seoTitle: "Réussir un entretien d’embauche",
    seoDescription: "Préparer un entretien d’embauche avec des preuves concrètes et un discours cohérent.",
    content: `Un entretien n’est pas un oral de motivation abstraite. C’est une conversation professionnelle sur votre capacité à faire le travail.

## Préparez des situations

Choisissez cinq situations : un succès, un désaccord, une contrainte, un apprentissage, une collaboration.

## Alignez-vous à l’offre

Relisez missions et exigences. Le matching CARRIOVA sert précisément à cela : voir ce qui s’aligne et ce qui doit être expliqué.

## Restez vrai

Le coaching d’entretien n’apprend pas à jouer un rôle. Il aide à ordonner ce qui est déjà là.`,
  },
  {
    slug: "reconversion-professionnelle-par-ou-commencer",
    title: "Reconversion professionnelle : par où commencer sans tout casser",
    excerpt:
      "Une reconversion n’est pas un slogan. C’est un travail de preuves transférables, de cible et de discours.",
    category: "Carrière",
    cluster: "carriere",
    readingTime: 8,
    relatedSolution: "Coaching carrière",
    relatedHref: "/solutions/coaching",
    seoTitle: "Reconversion professionnelle",
    seoDescription:
      "Commencer une reconversion professionnelle avec méthode : compétences transférables, cible, CV, coaching.",
    content: `La reconversion attire les discours emphatiques. La réalité est plus simple et plus exigeante : que savez-vous déjà faire qui a de la valeur ailleurs ?

## Inventaire

Compétences, preuves, contraintes, énergie. Sans cet inventaire, on copie un métier à la mode.

## Cible réaliste

Un pont, pas un saut magique. Parfois un poste adjacent, un projet, une formation courte.

## Documents

Le CV de reconversion doit expliquer le fil, pas le cacher. La lettre et le coaching aident à tenir ce fil.`,
  },
  {
    slug: "employabilite-competences-professionnelles",
    title: "Employabilité : quelles compétences professionnelles renforcer",
    excerpt:
      "L’employabilité n’est pas un badge. C’est la capacité à rester lisible et utile sur un marché qui bouge.",
    category: "Carrière",
    cluster: "carriere",
    readingTime: 7,
    relatedSolution: "Analyser mon profil",
    relatedHref: "/solutions/matching",
    seoTitle: "Employabilité et compétences professionnelles",
    seoDescription:
      "Comprendre l’employabilité : compétences techniques, relationnelles, preuves et lisibilité du profil.",
    content: `On parle beaucoup de compétences. On montre trop peu de preuves.

## Compétences visibles

Outils, langues, méthodes, réglementations. Nommez-les seulement si vous pouvez les situer dans un vécu.

## Compétences de travail

Fiabilité, clarté, collaboration, apprentissage. Elles se démontrent par des situations, pas par une liste.

## Mise à jour du profil

Un profil CARRIOVA vivant vaut mieux qu’un CV figé depuis trois ans.`,
  },
  {
    slug: "coaching-carriere-a-quoi-s-attendre",
    title: "Coaching carrière : à quoi s’attendre, concrètement",
    excerpt:
      "Un coaching utile a un objet, une durée, une confidentialité et un prochain pas. Rien de magique.",
    category: "Coaching",
    cluster: "guides",
    readingTime: 6,
    relatedSolution: "Réserver une séance",
    relatedHref: "/solutions/coaching",
    seoTitle: "Coaching carrière à quoi s’attendre",
    seoDescription: "Ce qu’est un coaching carrière utile : formats, limites, lien avec CV et opportunités.",
    content: `Le coaching carrière n’est pas une conférence privée. C’est un espace de travail sur votre situation.

## Formats

Orientation, employabilité, entretien, positionnement, progression. Choisissez un objet.

## Limites

Pas de garantie d’embauche, pas de CV magique en 20 minutes, pas de substitution à votre décision.

## Suite

Une séance peut déboucher sur un CV, une lettre, une stratégie d’offres ou une relecture experte.`,
  },
  {
    slug: "orientation-professionnelle-etudiants",
    title: "Orientation professionnelle : aider un étudiant à choisir sans paniquer",
    excerpt:
      "L’orientation n’exige pas de tout savoir à 22 ans. Elle exige un premier angle et des preuves d’apprentissage.",
    category: "Carrière",
    cluster: "guides",
    readingTime: 6,
    relatedSolution: "CV étudiant",
    relatedHref: "/cv-etudiant",
    seoTitle: "Orientation professionnelle étudiants",
    seoDescription:
      "Pistes d’orientation professionnelle pour étudiants et jeunes diplômés, reliées au premier CV.",
    content: `Beaucoup d’étudiants croient qu’il leur manque une vocation spectaculaire. Il leur manque surtout un premier récit cohérent.

## Explorer

Stages, projets, conversations, lectures de fiches de poste. L’orientation se nourrit du réel.

## Premier CV

Le CV étudiant rassemble des preuves d’apprentissage. Il n’a pas à imiter un profil senior.

## Accompagnement

Un coaching d’orientation aide à trancher un angle, pas à figer une vie entière.`,
  },
];

const faqs = [
  ["home", 1, "Qu’est-ce que CARRIOVA ?", "CARRIOVA est une plateforme digitale de carrière et d’employabilité. Elle relie profil, CV, lettre, opportunités, matching, candidatures, coaching et expertise humaine."],
  ["home", 2, "Pour qui est CARRIOVA ?", "Chercheurs d’emploi, professionnels en poste, étudiants, jeunes diplômés, profils en mobilité ou diaspora. Un parcours recruteur peut être ouvert plus tard, sans mélanger les expériences."],
  ["home", 3, "CARRIOVA est-il seulement un générateur de CV ?", "Non. Le CV est un module. L’écosystème couvre aussi la lettre, les opportunités, le matching, le coaching et la validation humaine."],
  ["home", 4, "L’intelligence artificielle remplace-t-elle l’humain ?", "Non. L’IA structure. Les règles métier encadrent. L’expertise humaine valide lorsque c’est nécessaire."],
  ["cv", 1, "Comment fonctionne le service CV ?", "Nous commençons par la découverte du profil et de la cible, puis nous rédigeons un CV orienté recruteur. Une relecture humaine est possible."],
  ["cv", 2, "Puis-je utiliser CARRIOVA sans fiche de poste ?", "Oui. Sans offre, nous clarifions un positionnement. Avec offre, nous adaptons davantage le document."],
  ["cv", 3, "Mon CV peut-il être adapté à une offre précise ?", "Oui. C’est même l’usage recommandé : un angle par cible, sans inventer d’expérience."],
  ["cv", 4, "Puis-je demander une relecture experte ?", "Oui. L’expertise humaine est un module distinct, utile surtout pour les dossiers à fort enjeu."],
  ["lettre", 1, "La lettre est-elle liée à mon CV ?", "Oui, dans la logique de l’écosystème. La lettre éclaire le CV, elle ne le recopie pas."],
  ["lettre", 2, "Proposez-vous des exemples à copier ?", "Nous expliquons une méthode. Copier une lettre type affaiblit souvent la candidature."],
  ["opportunites", 1, "D’où viennent les offres ?", "Des opportunités publiées et administrées dans CARRIOVA. Le volume n’est pas mis en scène artificiellement."],
  ["opportunites", 2, "Puis-je créer un CV pour une offre ?", "Oui. Chaque fiche propose de relier l’offre à un CV ou à une candidature adaptée."],
  ["matching", 1, "Le matching est-il garanti ?", "Non. Il éclaire une adéquation. Il ne promet pas un recrutement."],
  ["matching", 2, "Que compare le matching ?", "Profil, compétences, expériences, objectifs et exigences du poste."],
  ["coaching", 1, "Comment réserver une séance ?", "Via le formulaire de la page coaching. Nous confirmons un créneau selon les disponibilités."],
  ["coaching", 2, "Quels formats existent ?", "Individuel, orientation, employabilité, entretien, positionnement, progression."],
  ["expertise", 1, "Quand l’humain intervient-il ?", "Lorsque le livrable le mérite : profil senior, reconversion, mobilité internationale, enjeu élevé."],
  ["global", 1, "Qu’est-ce que CARRIOVA ?", "Une plateforme de carrière et d’employabilité qui relie méthode, technologie et expertise humaine."],
  ["global", 2, "Comment accéder à mes documents ?", "En créant un compte. L’espace authentifié accueillera progressivement CV, lettres, demandes et préférences."],
  ["global", 3, "Comment contacter un expert ?", "Via la page Contact ou une demande de coaching / d’expertise."],
  ["global", 4, "Mes données sont-elles utilisées pour du marketing ?", "Uniquement si vous y consentez. Vous pouvez refuser le consentement marketing tout en envoyant une demande."],
];

const offers = [
  {
    slug: "cv",
    name: "CV professionnel",
    category: "CV",
    tagline: "Découverte, positionnement et rédaction d’un CV orienté recruteur.",
    benefits: ["Analyse de profil", "Rédaction", "Template moderne", "Option relecture"],
    ctaLabel: "Créer mon CV",
    ctaHref: "/solutions/cv",
    featured: false,
    sortOrder: 1,
  },
  {
    slug: "lettre",
    name: "Lettre de motivation",
    category: "Lettre",
    tagline: "Une lettre personnalisée, liée à votre profil et à l’opportunité.",
    benefits: ["Ciblage de l’offre", "Rédaction", "Ton professionnel"],
    ctaLabel: "Créer ma lettre",
    ctaHref: "/solutions/lettre-de-motivation",
    featured: false,
    sortOrder: 2,
  },
  {
    slug: "cv-lettre",
    name: "CV + lettre",
    category: "Candidature",
    tagline: "Les deux livrables d’une candidature sérieuse, dans le même angle.",
    benefits: ["Cohérence CV / lettre", "Positionnement unique", "Adaptation à une cible"],
    ctaLabel: "Demander un devis",
    ctaHref: "/contact?objet=cv",
    featured: true,
    sortOrder: 3,
  },
  {
    slug: "audit-cv",
    name: "Audit de CV",
    category: "Expertise",
    tagline: "Un regard expert sur un CV existant, avec notes d’ajustement.",
    benefits: ["Diagnostic", "Priorités d’amélioration", "Relecture humaine"],
    ctaLabel: "Faire auditer mon CV",
    ctaHref: "/contact?objet=audit-cv",
    featured: false,
    sortOrder: 4,
  },
  {
    slug: "coaching",
    name: "Coaching",
    category: "Coaching",
    tagline: "Une séance selon votre besoin et vos disponibilités.",
    benefits: ["Objet clair", "Échange confidentiel", "Prochain pas concret"],
    ctaLabel: "Réserver une séance",
    ctaHref: "/solutions/coaching",
    featured: false,
    sortOrder: 5,
  },
  {
    slug: "premium",
    name: "Accompagnement expert",
    category: "Premium",
    tagline: "Pour les dossiers à fort enjeu : senior, reconversion, international.",
    benefits: ["Méthode + humain", "Livrables sécurisés", "Suivi de dossier"],
    ctaLabel: "Parler à un expert",
    ctaHref: "/solutions/expertise",
    featured: false,
    sortOrder: 6,
  },
];

async function run() {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM jobs");
    await client.query("DELETE FROM blog_posts");
    await client.query("DELETE FROM faqs");
    await client.query("DELETE FROM pricing_offers");

    for (const job of jobs) {
      await client.query(
        `INSERT INTO jobs (slug, title, company, location, country, contract_type, experience, industry, work_mode, description, responsibilities, qualifications, application_method, keywords, is_published)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,true)`,
        [
          job.slug,
          job.title,
          job.company,
          job.location,
          job.country,
          job.contractType,
          job.experience,
          job.industry,
          job.workMode,
          job.description,
          job.responsibilities,
          job.qualifications,
          job.applicationMethod,
          job.keywords,
        ],
      );
    }

    for (const post of posts) {
      await client.query(
        `INSERT INTO blog_posts (slug, title, excerpt, content, category, cluster, reading_time, seo_title, seo_description, related_solution, related_href, is_published)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,true)`,
        [
          post.slug,
          post.title,
          post.excerpt,
          post.content,
          post.category,
          post.cluster,
          post.readingTime,
          post.seoTitle,
          post.seoDescription,
          post.relatedSolution,
          post.relatedHref,
        ],
      );
    }

    for (const [page, sortOrder, question, answer] of faqs) {
      await client.query(
        `INSERT INTO faqs (page, sort_order, question, answer) VALUES ($1,$2,$3,$4)`,
        [page, sortOrder, question, answer],
      );
    }

    for (const offer of offers) {
      await client.query(
        `INSERT INTO pricing_offers (slug, name, category, tagline, benefits, cta_label, cta_href, price_label, featured, sort_order, is_available)
         VALUES ($1,$2,$3,$4,$5,$6,$7,'Sur devis',$8,$9,true)`,
        [
          offer.slug,
          offer.name,
          offer.category,
          offer.tagline,
          JSON.stringify(offer.benefits),
          offer.ctaLabel,
          offer.ctaHref,
          offer.featured,
          offer.sortOrder,
        ],
      );
    }

    await client.query("COMMIT");
    console.log("Seeded CARRIOVA content");
  } catch (error) {
    await client.query("ROLLBACK");
    console.error(error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

run();
