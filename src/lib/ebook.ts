/**
 * Ebook vendu sur la boutique Chariow de CARRIOVA. Le paiement et la livraison du PDF
 * sont gérés par Chariow : le site ne stocke ni fichier ni donnée de paiement.
 * Mettez à jour prix et contenus ici uniquement, toutes les pages s’y alimentent.
 */
export const ebook = {
  slug: "employable-indispensable",
  path: "/ebook/employable-indispensable",
  name: "Employable & Indispensable",
  subtitle: "Devenir un professionnel recherché dans un monde compétitif",
  author: "Ézékiel ADÉLÉKÉ",
  authorRole: "Coach en développement de carrière, fondateur de CARRIOVA",
  checkoutUrl: "https://carriova.mychariow.online/employable-indispensable",
  price: "22,47 $US",
  compareAtPrice: "34,84 $US",
  cover: "/images/ebook/book.webp",
  ogImage: "/images/ebook/employable-indispensable-og.jpg",
  format: "PDF · lecture sur téléphone, tablette et ordinateur",
  stats: [
    { value: "157", label: "pages" },
    { value: "7", label: "parties" },
    { value: "20", label: "chapitres" },
    { value: "10", label: "annexes prêtes à l’emploi" },
  ],
  promises: [
    { title: "Un CV qui prouve", text: "Passer d’une liste de tâches à des résultats concrets que le recruteur retient." },
    { title: "Des entretiens maîtrisés", text: "Préparer vos réponses avec la méthode STAR et arriver serein le jour J." },
    { title: "Une visibilité choisie", text: "Vous positionner et vous rendre visible là où se décident les opportunités." },
    { title: "Des résultats mesurables", text: "Produire et rendre lisible votre valeur une fois en poste." },
    { title: "Un plan sur 12 mois", text: "Avancer avec un cap, des étapes et un plan 30-60-90 jours pour un nouveau poste." },
  ],
  inside: [
    "Cas pratiques, encadrés de révision et exercices dans chaque chapitre",
    "Audit d’employabilité pour savoir où vous en êtes",
    "Banque de réalisations pour nourrir votre CV et vos entretiens",
    "Modèles de messages prêts à adapter",
    "Fiche de préparation d’entretien",
    "Plan 30-60-90 jours pour réussir vos débuts",
  ],
  bonuses: [
    { title: "Manuel d’entretien", detail: "29 pages · 30 questions fréquentes, avec une check-list pour la veille et le jour de l’entretien." },
    { title: "3 modèles de CV Word", detail: "« Le Stratège », « Le Profil moderne » et « Le Premier Pas », modifiables, avec un exemple fictif rempli." },
    { title: "Mode d’emploi des modèles", detail: "Le guide pour choisir le modèle adapté à votre profil et le personnaliser." },
  ],
  audience: [
    "Étudiants, jeunes diplômés et débutants qui cherchent un premier emploi",
    "Professionnels qui veulent gagner en assurance, en responsabilités ou en influence",
    "Personnes en reconversion qui veulent valoriser leur parcours",
  ],
  notFor: "Ce livre propose une méthode, des exemples et des outils. Il ne garantit ni emploi, ni promotion, ni augmentation, et ne contient ni offres d’emploi ni conseil juridique personnalisé.",
  faqs: [
    { question: "Comment vais-je recevoir l’ebook ?", answer: "Le téléchargement est immédiat après le paiement, sur la page sécurisée de notre boutique Chariow. Vous recevez le PDF et les bonus." },
    { question: "Comment puis-je payer ?", answer: "Par Mobile Money ou par carte bancaire, sur la page de paiement sécurisée de Chariow." },
    { question: "Puis-je le lire sur mon téléphone ?", answer: "Oui. Le PDF se lit sur téléphone, tablette et ordinateur. Les modèles de CV sont au format Word, modifiables." },
    { question: "Et si l’ebook ne me convient pas ?", answer: "Un remboursement est possible pendant 7 jours : écrivez-nous par e-mail ou sur WhatsApp." },
  ],
} as const;

/** Lien de paiement Chariow avec la source, pour savoir d’où viennent les ventes. */
export function ebookCheckoutHref(source: "site" | "espace" | "equipe" = "site") {
  const url = new URL(ebook.checkoutUrl);
  url.searchParams.set("utm_source", "carriova");
  url.searchParams.set("utm_medium", source);
  url.searchParams.set("utm_campaign", ebook.slug);
  return url.href;
}
