import { getPublishedOffer, type PublishedOffer } from "@/lib/commercial-offers";

export const offerSituations = [
  { value: "starting", label: "Je suis étudiant ou jeune diplômé", detail: "Préparer un premier emploi ou un stage" },
  { value: "applying", label: "Je postule à une offre", detail: "Présenter une candidature cohérente" },
  { value: "interview", label: "J’ai un entretien à préparer", detail: "M’entraîner et structurer mes réponses" },
  { value: "visibility", label: "Je veux gagner en visibilité", detail: "Valoriser mon profil et évoluer" },
  { value: "change", label: "Je change de voie", detail: "Construire ma reconversion" },
  { value: "executive", label: "Je suis cadre ou dirigeant", detail: "Travailler mon positionnement senior" },
] as const;
export const offerBudgets = [
  { value: "small", label: "Moins de 10 000 FCFA", maximum: 9999 },
  { value: "medium", label: "10 000 à 25 000 FCFA", maximum: 25000 },
  { value: "large", label: "25 000 à 50 000 FCFA", maximum: 50000 },
  { value: "premium", label: "Plus de 50 000 FCFA", maximum: Infinity },
] as const;
export type OfferSituation = typeof offerSituations[number]["value"];
export type OfferBudget = typeof offerBudgets[number]["value"];
const choices: Record<OfferSituation, { main: string; smaller: string; reason: string }> = {
  starting: { main: "premier-pas", smaller: "diagnostic-cv", reason: "Un point de départ concret pour professionnaliser votre CV existant et organiser vos premières candidatures." },
  applying: { main: "candidature-signature", smaller: "cv-cible", reason: "Un CV et une lettre travaillés ensemble pour présenter un dossier cohérent." },
  interview: { main: "objectif-recrutement", smaller: "preparation-express", reason: "Des documents ciblés et une simulation pour préparer votre candidature et votre échange avec le recruteur." },
  visibility: { main: "visibilite-professionnelle", smaller: "linkedin-essentiel", reason: "Un CV, un profil LinkedIn et un échange de positionnement pour rendre votre parcours plus lisible." },
  change: { main: "cap-reconversion", smaller: "seance-declic", reason: "Un bilan, des documents repositionnés et un plan d’action pour préparer votre changement de voie." },
  executive: { main: "executive", smaller: "cv-executive", reason: "Un accompagnement complet pour valoriser votre expérience, votre positionnement et votre candidature." },
};
export function recommendOffer(situation: unknown, budget: unknown): { offer: PublishedOffer; alternative?: PublishedOffer; withinBudget: boolean; reason: string } | null {
  const selectedSituation = offerSituations.find(item => item.value === situation);
  const selectedBudget = offerBudgets.find(item => item.value === budget);
  if (!selectedSituation || !selectedBudget) return null;
  const choice = choices[selectedSituation.value];
  const main = getPublishedOffer(choice.main)!;
  const smaller = getPublishedOffer(choice.smaller)!;
  const offer = main.priceAmount! <= selectedBudget.maximum ? main : smaller;
  const alternative = offer.slug === main.slug ? smaller : main;
  return { offer, alternative, withinBudget: offer.priceAmount! <= selectedBudget.maximum,
    reason: offer.slug === main.slug ? choice.reason : `${offer.audience}. Une prestation plus ciblée pour commencer.` };
}
