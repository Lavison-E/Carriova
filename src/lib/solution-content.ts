export type SolutionPageContent = {
  slug: string;
  eyebrow: string;
  title: string;
  text: string;
  primary: { href: string; label: string };
  secondary: { href: string; label: string };
  problem: string;
  value: string;
  forWho: string[];
  process: { title: string; text: string }[];
  benefits: string[];
  deliverables: string[];
  related: { href: string; label: string }[];
};

export const solutionPages: Record<string, SolutionPageContent> = {
  cv: {
    slug: "cv",
    eyebrow: "CV professionnel",
    title: "Un CV qui positionne votre potentiel, pas seulement votre historique.",
    text: "CARRIOVA construit des CV à partir de votre profil, du poste visé, de vos réalisations chiffrées et des attentes recruteur. La découverte précède la production.",
    primary: { href: "/compte/creer", label: "Créer mon CV" },
    secondary: { href: "/contact?objet=audit-cv", label: "Faire auditer mon CV" },
    problem:
      "Un CV générique, trop long, trop vague ou mal adapté au poste laisse le recruteur deviner. Le document n’est pas le problème : c’est le positionnement.",
    value:
      "Nous analysons votre parcours, identifions les preuves utiles, rédigeons un résumé professionnel, sélectionnons compétences, langues, outils, projets et engagements, puis proposons une relecture humaine si vous le souhaitez.",
    forWho: [
      "Chercheurs d’emploi",
      "Professionnels en mobilité",
      "Étudiants et jeunes diplômés",
      "Candidats internationaux / diaspora",
    ],
    process: [
      {
        title: "Découverte du profil",
        text: "Parcours, preuves, compétences, objectifs et, lorsque c’est possible, fiche de poste.",
      },
      {
        title: "Positionnement",
        text: "Nous clarifions le titre, la cible et l’angle qui rendent votre profil lisible.",
      },
      {
        title: "Rédaction orientée recruteur",
        text: "Réalisations chiffrées, compétences pertinentes, résumé, langues, outils, projets.",
      },
      {
        title: "Mise en forme",
        text: "Un template moderne, lisible, compatible avec une lecture humaine et ATS lorsque c’est pertinent.",
      },
      {
        title: "Option relecture experte",
        text: "Un regard humain pour valider, affiner et sécuriser le livrable.",
      },
    ],
    benefits: [
      "Analyse stratégique du profil avant rédaction",
      "Positionnement professionnel clair",
      "Écriture orientée recruteur",
      "Réalisations quantifiées lorsque les données existent",
      "Compétences, langues, logiciels, intérêts, associatif, projets personnels",
      "Templates modernes",
      "Relecture humaine optionnelle",
    ],
    deliverables: [
      "CV professionnel adapté à une cible",
      "Résumé de positionnement",
      "Pistes d’adaptation à une offre précise",
    ],
    related: [
      { href: "/solutions/lettre-de-motivation", label: "Lettre de motivation" },
      { href: "/emploi", label: "Opportunités" },
      { href: "/conseils-cv", label: "Conseils CV" },
      { href: "/solutions/expertise", label: "Expertise humaine" },
    ],
  },
  "lettre-de-motivation": {
    slug: "lettre-de-motivation",
    eyebrow: "Lettre de motivation",
    title: "Une lettre liée à votre profil, à l’opportunité et à votre contribution.",
    text: "CARRIOVA rédige des lettres personnalisées à partir de votre parcours, de vos motivations, de vos réalisations et de l’offre visée — pas à partir d’un modèle générique.",
    primary: { href: "/compte/creer", label: "Créer ma lettre" },
    secondary: { href: "/solutions/cv", label: "Relier à mon CV" },
    problem:
      "La plupart des lettres répètent le CV ou recourent à des formules creuses. Le recruteur n’y voit ni motivation réelle, ni contribution possible.",
    value:
      "Nous relions votre profil à l’opportunité : pourquoi vous, pourquoi ce poste, quelle preuve, quelle ambition. La lettre pourra ensuite se connecter à votre CV et à votre espace CARRIOVA.",
    forWho: [
      "Candidats visant un poste précis",
      "Professionnels en reconversion",
      "Étudiants en stage ou premier emploi",
      "Candidats à l’international",
    ],
    process: [
      { title: "Cible", text: "Offre, organisation, contexte et attendus." },
      { title: "Matière", text: "Profil, motivations, réalisations, objectifs." },
      { title: "Angle", text: "Contribution, preuves, ton professionnel." },
      { title: "Rédaction", text: "Lettre personnalisée, concise, utile." },
      { title: "Validation", text: "Ajustements et option d’expertise humaine." },
    ],
    benefits: [
      "Personnalisation réelle",
      "Lien CV + profil + opportunité",
      "Mise en avant de la contribution",
      "Ton professionnel, sans jargon",
    ],
    deliverables: ["Lettre de motivation personnalisée", "Points d’adaptation pour d’autres offres proches"],
    related: [
      { href: "/solutions/cv", label: "CV professionnel" },
      { href: "/emploi", label: "Opportunités" },
      { href: "/blog", label: "Articles lettre de motivation" },
    ],
  },
  opportunites: {
    slug: "opportunites",
    eyebrow: "Emploi & opportunités",
    title: "Trouver des opportunités, puis construire la candidature qui suit.",
    text: "L’espace public CARRIOVA vous aide à découvrir des offres. L’écosystème vous permet ensuite d’adapter CV, lettre et candidature.",
    primary: { href: "/emploi", label: "Trouver un emploi" },
    secondary: { href: "/solutions/matching", label: "Comprendre le matching" },
    problem:
      "Chercher un emploi sans profil clair, sans CV adapté et sans filtre pertinent multiplie les candidatures peu utiles.",
    value:
      "Nous publions des opportunités avec une structure SEO-friendly : titre, entreprise, lieu, contrat, missions, profil recherché et date. Chaque offre peut relier vers un CV ou une candidature adaptée.",
    forWho: ["Chercheurs d’emploi", "Jeunes diplômés", "Professionnels en mobilité", "Diaspora"],
    process: [
      { title: "Explorer", text: "Filtres lieu, secteur, expérience, contrat, modalité." },
      { title: "Lire", text: "Fiche claire, responsabilités, qualifications." },
      { title: "Relier", text: "Créer ou adapter un CV pour cette offre." },
      { title: "Candidater", text: "Suivre le mode de candidature indiqué." },
    ],
    benefits: [
      "Fiches d’offres structurées",
      "Filtres utiles",
      "Pages pensées pour le référencement",
      "Lien vers CV et lettre",
    ],
    deliverables: ["Accès aux opportunités publiées", "Pistes d’adaptation de candidature"],
    related: [
      { href: "/emploi", label: "Offres d’emploi" },
      { href: "/solutions/cv", label: "Créer mon CV" },
      { href: "/solutions/matching", label: "Matching" },
    ],
  },
  matching: {
    slug: "matching",
    eyebrow: "Matching emploi-profil",
    title: "Comparer votre profil à une offre, avec discernement.",
    text: "Le matching CARRIOVA relie profil, compétences, expériences, objectifs et exigences du poste. Il éclaire une décision. Il ne garantit pas un recrutement.",
    primary: { href: "/compte/creer", label: "Analyser mon profil" },
    secondary: { href: "/emploi", label: "Voir les opportunités" },
    problem:
      "Postuler à tout, ou au contraire s’autocensurer, vient souvent d’une mauvaise lecture de l’adéquation profil / offre.",
    value:
      "Nous expliquons les points d’alignement et les écarts. Le langage est responsable : pas de « matching garanti », pas de score magique présenté comme une vérité.",
    forWho: ["Candidats actifs", "Professionnels qui testent une mobilité", "Personnes en reconversion"],
    process: [
      { title: "Profil", text: "Compétences, expériences, objectifs." },
      { title: "Offre", text: "Exigences, missions, contexte." },
      { title: "Lecture", text: "Alignements, écarts, points à clarifier." },
      { title: "Action", text: "Adapter le CV, la lettre, ou poursuivre ailleurs." },
    ],
    benefits: [
      "Lecture structurée de l’adéquation",
      "Aide à prioriser les candidatures",
      "Langage responsable, sans surpromesse",
    ],
    deliverables: ["Repères d’adéquation", "Recommandations d’adaptation de candidature"],
    related: [
      { href: "/emploi", label: "Opportunités" },
      { href: "/solutions/cv", label: "CV" },
      { href: "/solutions/coaching", label: "Coaching" },
    ],
  },
  coaching: {
    slug: "coaching",
    eyebrow: "Coaching carrière",
    title: "Un accompagnement humain pour clarifier, décider et avancer.",
    text: "Coaching individuel, orientation, employabilité, entretien, positionnement ou progression : les séances se planifient selon les disponibilités.",
    primary: { href: "/solutions/coaching#reserver", label: "Réserver une séance" },
    secondary: { href: "/contact", label: "Parler à un expert" },
    problem:
      "Un document ne suffit pas toujours. Il manque parfois un espace pour penser sa direction, son discours et ses choix.",
    value:
      "Le coaching CARRIOVA n’est pas un discours motivationnel générique. C’est un travail concret sur votre situation, vos options et votre prochain pas.",
    forWho: ["Professionnels", "Étudiants", "Personnes en reconversion", "Candidats en préparation d’entretien"],
    process: [
      { title: "Intention", text: "Vous précisez le besoin." },
      { title: "Demande", text: "Nous collectons contexte et disponibilités." },
      { title: "Séance", text: "Un échange structuré, confidentiel, utile." },
      { title: "Suite", text: "Des pistes d’action, éventuellement reliées au CV ou aux opportunités." },
    ],
    benefits: [
      "Formats adaptés à différents moments de carrière",
      "Planification selon disponibilités",
      "Lien possible avec CV, lettre et opportunités",
    ],
    deliverables: ["Séance de coaching", "Repères d’action", "Ressources de suivi lorsque c’est pertinent"],
    related: [
      { href: "/solutions/expertise", label: "Expertise humaine" },
      { href: "/conseils-carriere", label: "Conseils carrière" },
      { href: "/solutions/cv", label: "CV" },
    ],
  },
  expertise: {
    slug: "expertise",
    eyebrow: "Expertise humaine",
    title: "Quand l’humain doit valider ce que la méthode a produit.",
    text: "L’IA comprend. Les règles décident. L’expertise humaine valide lorsque c’est nécessaire. CARRIOVA ne remplace pas le jugement professionnel par un modèle.",
    primary: { href: "/contact", label: "Parler à un expert" },
    secondary: { href: "/solutions/cv", label: "Faire auditer mon CV" },
    problem:
      "Un livrable généré sans regard critique peut être fluide et faux, ou correct et mal positionné.",
    value:
      "L’expertise humaine intervient pour relire, challenger, affiner le positionnement et sécuriser les documents sensibles : CV senior, reconversion, mobilité internationale, postes à enjeux.",
    forWho: [
      "Profils seniors",
      "Reconversions",
      "Candidatures internationales",
      "Toute personne qui souhaite une relecture exigeante",
    ],
    process: [
      { title: "Livrable", text: "CV, lettre, discours ou plan." },
      { title: "Regard expert", text: "Cohérence, preuves, cible, ton." },
      { title: "Ajustements", text: "Recommandations concrètes." },
      { title: "Validation", text: "Une version plus solide, assumée." },
    ],
    benefits: [
      "Différenciateur majeur de CARRIOVA",
      "Complément, pas substitut, de l’IA",
      "Utile sur les dossiers à fort enjeu",
    ],
    deliverables: ["Relecture experte", "Notes d’ajustement", "Validation de positionnement"],
    related: [
      { href: "/solutions/cv", label: "CV" },
      { href: "/solutions/coaching", label: "Coaching" },
      { href: "/a-propos", label: "À propos" },
    ],
  },
};
