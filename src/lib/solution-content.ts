import { qualificationRequestHref } from "@/lib/service-catalog";

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
    slug: "cv", eyebrow: "CV professionnel",
    title: "Un CV qui donne du sens à votre parcours.",
    text: "Construisez votre premier CV ou retravaillez un document existant avec notre équipe. Nous partons de votre expérience et du poste visé pour préparer une présentation claire de votre candidature.",
    primary: { href: qualificationRequestHref("first_cv"), label: "Demander mon premier CV" },
    secondary: { href: qualificationRequestHref("improve_cv"), label: "Améliorer mon CV actuel" },
    problem: "Un CV trop long, peu précis ou éloigné du poste visé peut masquer l’essentiel de votre expérience. Vous avez besoin de choisir les informations qui serviront votre candidature.",
    value: "Nous reprenons avec vous votre parcours, vos compétences et vos réalisations. Le contenu et la mise en forme sont travaillés selon votre objectif, puis partagés dans votre espace pour recueillir votre retour.",
    forWho: ["Étudiants et jeunes diplômés", "Chercheurs d’emploi", "Professionnels en mobilité", "Candidats à l’international"],
    process: [
      { title: "Votre point de départ", text: "Vous décrivez votre objectif et, si vous en avez un, partagez votre CV actuel depuis votre demande." },
      { title: "Une proposition claire", text: "Nous précisons le travail à réaliser, son prix et l’échéance avant de commencer." },
      { title: "Rédaction et présentation", text: "Votre parcours est organisé autour des expériences et compétences utiles au poste visé." },
      { title: "Votre retour", text: "Vous téléchargez le document, puis validez la livraison ou expliquez les ajustements souhaités." },
    ],
    benefits: ["Un objectif professionnel lisible", "Des expériences et compétences sélectionnées avec vous", "Des réalisations chiffrées lorsque les données existent", "Une présentation claire, adaptée aux exigences de candidature", "Des échanges conservés dans votre demande"],
    deliverables: ["CV travaillé selon le périmètre convenu", "Document téléchargeable dans votre espace", "Retours et ajustements selon la proposition acceptée"],
    related: [{ href: "/solutions/lettre-de-motivation", label: "Préparer une lettre de motivation" }, { href: qualificationRequestHref("targeted_cv"), label: "Adapter mon CV à une offre précise" }, { href: "/conseils-cv", label: "Lire les conseils CV" }],
  },
  "lettre-de-motivation": {
    slug: "lettre-de-motivation", eyebrow: "Lettre de motivation",
    title: "Une lettre qui relie votre parcours à une opportunité.",
    text: "Travaillez avec notre équipe une lettre personnelle, appuyée sur votre motivation, vos expériences et les attentes du poste visé.",
    primary: { href: qualificationRequestHref("cover_letter"), label: "Demander ma lettre" },
    secondary: { href: "/solutions/cv", label: "Découvrir le service CV" },
    problem: "Une lettre qui répète votre CV ne dit pas toujours ce qui vous attire dans le poste ni ce que vous pouvez apporter. Le choix des exemples et l’angle de la candidature font la différence.",
    value: "Vous partagez l’offre et les éléments de votre parcours. Nous construisons une lettre cohérente avec votre CV, puis vous retrouvez le document et les échanges dans votre demande.",
    forWho: ["Candidats à un poste précis", "Professionnels en reconversion", "Étudiants en recherche de stage", "Candidats à l’international"],
    process: [
      { title: "Comprendre la cible", text: "L’offre, l’organisation et vos motivations donnent le point de départ." },
      { title: "Définir la prestation", text: "Nous confirmons le contenu du travail et son tarif dans une proposition." },
      { title: "Choisir les bons exemples", text: "Vos expériences réelles sont reliées aux besoins du poste, avec un ton professionnel." },
      { title: "Relire et ajuster", text: "Vous consultez la lettre dans votre espace et transmettez vos retours à l’équipe." },
    ],
    benefits: ["Une motivation explicitée", "Des exemples cohérents avec votre CV", "Un texte ciblé sur l’opportunité", "Une conversation pour préciser vos attentes"],
    deliverables: ["Lettre de motivation personnalisée", "Document téléchargeable", "Ajustements selon le périmètre accepté"],
    related: [{ href: "/solutions/cv", label: "Faire travailler mon CV" }, { href: "/emploi", label: "Consulter les offres d’emploi" }, { href: "/guides", label: "Explorer les guides de candidature" }],
  },
  opportunites: {
    slug: "opportunites", eyebrow: "Emploi & opportunités",
    title: "Repérez une opportunité. Préparez la suite.",
    text: "Consultez les offres publiées sur CARRIOVA et les modalités indiquées par chaque recruteur. Si vous souhaitez un accompagnement, notre équipe peut vous aider à travailler votre candidature.",
    primary: { href: "/emploi", label: "Consulter les offres" },
    secondary: { href: qualificationRequestHref("opportunities"), label: "Être accompagné dans ma recherche" },
    problem: "Une recherche trop large peut disperser vos efforts. Définir votre cible et lire les exigences de chaque offre vous aide à décider où concentrer votre candidature.",
    value: "Les fiches rassemblent les informations disponibles sur le poste et son mode de candidature. Vous postulez selon les instructions du recruteur ; les demandes de CV, de lettre ou de conseil se suivent séparément dans votre espace CARRIOVA.",
    forWho: ["Chercheurs d’emploi", "Jeunes diplômés", "Professionnels en mobilité", "Personnes qui précisent leur recherche"],
    process: [
      { title: "Explorer les offres", text: "Utilisez les filtres disponibles pour affiner votre recherche." },
      { title: "Lire les conditions", text: "Vérifiez les missions, le profil recherché et les modalités de candidature." },
      { title: "Préparer votre dossier", text: "Adaptez vos documents ou demandez un accompagnement à notre équipe." },
      { title: "Contacter le recruteur", text: "Suivez le lien ou les instructions de l’offre. Le recrutement reste à la décision de l’employeur." },
    ],
    benefits: ["Des offres consultables sans compte", "Les informations utiles à la candidature", "Un accès aux modalités du recruteur", "Un accompagnement possible pour vos documents"],
    deliverables: ["Accès aux offres publiées", "Informations et lien de candidature lorsqu’ils sont disponibles", "Accompagnement de candidature sur demande"],
    related: [{ href: "/emploi", label: "Voir les offres d’emploi" }, { href: "/solutions/cv", label: "Découvrir l’accompagnement CV" }, { href: "/solutions/matching", label: "Étudier l’adéquation avec une offre" }],
  },
  matching: {
    slug: "matching", eyebrow: "Profil & offre d’emploi",
    title: "Comprendre ce qui vous relie à un poste.",
    text: "Notre équipe vous accompagne dans la lecture d’une offre et de votre parcours. Vous identifiez les éléments à valoriser et les points à clarifier pour préparer votre candidature.",
    primary: { href: qualificationRequestHref("targeted_cv"), label: "Étudier ma candidature" },
    secondary: { href: "/emploi", label: "Consulter les offres" },
    problem: "Les intitulés de poste ne suffisent pas pour savoir si une opportunité vous correspond. Il faut regarder les missions, les compétences attendues et les exemples que vous pouvez apporter.",
    value: "Vous partagez l’annonce et votre CV. L’équipe examine leur cohérence avec vous et propose les adaptations utiles. Cet accompagnement repose sur un échange et une lecture du dossier ; il ne produit pas de score automatique.",
    forWho: ["Candidats visant une offre précise", "Professionnels en mobilité", "Personnes en reconversion"],
    process: [
      { title: "Le poste que vous visez", text: "Vous présentez l’offre et l’objectif de votre candidature." },
      { title: "Les éléments de votre parcours", text: "Vous partagez votre CV et précisez vos expériences pertinentes." },
      { title: "Un regard croisé", text: "L’équipe vous aide à repérer les correspondances, les écarts et les questions à éclaircir." },
      { title: "La candidature à préparer", text: "Le travail et les documents à adapter sont définis dans la proposition." },
    ],
    benefits: ["Une lecture plus précise des attentes du poste", "Des exemples de parcours choisis avec vous", "Des priorités pour adapter votre candidature", "Un échange humain sur votre positionnement"],
    deliverables: ["Retours sur votre candidature", "Adaptation du CV si prévue dans le devis", "Échanges et documents accessibles dans votre demande"],
    related: [{ href: "/emploi", label: "Trouver une offre à étudier" }, { href: "/solutions/cv", label: "Améliorer mon CV" }, { href: "/solutions/coaching", label: "Préparer la suite avec un coaching" }],
  },
  coaching: {
    slug: "coaching", eyebrow: "Coaching carrière",
    title: "Un échange pour clarifier votre prochain pas.",
    text: "Évolution professionnelle, reconversion ou préparation d’entretien : présentez votre situation. Le format, le tarif et le créneau sont ensuite convenus avec notre équipe.",
    primary: { href: qualificationRequestHref("career_growth"), label: "Demander un coaching" },
    secondary: { href: qualificationRequestHref("interview"), label: "Préparer un entretien" },
    problem: "Vous pouvez avoir besoin de recul pour choisir une direction, présenter votre parcours ou préparer une décision professionnelle.",
    value: "L’accompagnement commence par votre objectif. Vous échangez avec l’équipe pour définir une séance utile et les prochaines actions à travailler. Les modalités et la disponibilité sont confirmées avant la séance.",
    forWho: ["Professionnels en évolution", "Étudiants et jeunes diplômés", "Personnes en reconversion", "Candidats en préparation d’entretien"],
    process: [
      { title: "Exprimer votre besoin", text: "Vous décrivez votre situation, votre objectif et votre échéance." },
      { title: "Convenir du cadre", text: "Le format, le tarif et un créneau sont confirmés avec vous dans les échanges." },
      { title: "Travailler ensemble", text: "La séance se concentre sur le sujet convenu : direction, candidature ou entretien." },
      { title: "Préparer la suite", text: "Vous repartez avec des pistes d’action et retrouvez les échanges dans votre espace." },
    ],
    benefits: ["Un objectif défini avec vous", "Un format adapté à votre situation", "Un créneau confirmé par l’équipe", "Des échanges de suivi dans votre demande"],
    deliverables: ["Séance selon le format convenu", "Retours et pistes de travail", "Supports de suivi si prévus dans la proposition"],
    related: [{ href: qualificationRequestHref("interview"), label: "Demander une préparation d’entretien" }, { href: "/conseils-carriere", label: "Lire les conseils carrière" }, { href: "/solutions/cv", label: "Retravailler mon CV" }],
  },
  expertise: {
    slug: "expertise", eyebrow: "Relecture & conseil",
    title: "Un regard attentif sur votre candidature.",
    text: "Faites relire votre CV ou vos documents par notre équipe pour préciser votre positionnement, vérifier leur cohérence et définir les améliorations utiles.",
    primary: { href: qualificationRequestHref("improve_cv"), label: "Demander une relecture" },
    secondary: { href: "/solutions/coaching", label: "Découvrir le coaching" },
    problem: "Après plusieurs révisions d’un document, il devient difficile de voir ce qui manque ou ce qui mérite d’être simplifié. Un regard extérieur aide à reprendre les priorités.",
    value: "L’équipe lit vos documents à la lumière du poste ou de l’évolution que vous visez. Les retours portent sur les informations présentées, leur cohérence et la manière de les rendre plus précises.",
    forWho: ["Professionnels expérimentés", "Personnes en reconversion", "Candidats à l’international", "Candidats souhaitant faire relire leurs documents"],
    process: [
      { title: "Votre objectif", text: "Vous expliquez le contexte de votre candidature et le travail attendu." },
      { title: "Les documents à relire", text: "Vous ajoutez les fichiers utiles dans votre espace privé." },
      { title: "La relecture", text: "L’équipe examine la clarté, la cohérence et le choix des informations." },
      { title: "Les ajustements", text: "Vous retrouvez les retours et les versions de travail prévues dans la proposition." },
    ],
    benefits: ["Un regard extérieur sur votre candidature", "Des priorités d’amélioration expliquées", "Un travail relié à votre objectif", "Un suivi des échanges et des documents"],
    deliverables: ["Retours de relecture", "Recommandations d’ajustement", "Document retravaillé si prévu dans le devis"],
    related: [{ href: "/solutions/cv", label: "Découvrir l’accompagnement CV" }, { href: "/solutions/coaching", label: "Faire le point sur ma carrière" }, { href: "/support", label: "Obtenir de l’aide sur mon dossier" }],
  },
};
