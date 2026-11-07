const test = require("node:test");
const assert = require("node:assert/strict");
const { loadTypeScript } = require("./helpers/crm-fixture.cjs");
const {
  publishedOffers,
  commercialSolutionLabels,
  commercialOptions,
  getPublishedOffer,
  formatOfferPrice,
  offerRequestHref,
  getApplicableCommercialOptions,
} = loadTypeScript("src/lib/commercial-offers.ts");

const approvedPrices = {
  "premier-pas": 7500,
  "candidature-signature": 15000,
  "visibilite-professionnelle": 25000,
  "objectif-recrutement": 30000,
  "cap-reconversion": 40000,
  executive: 60000,
  "diagnostic-cv": 3000,
  "cv-cleaning": 6000,
  "cv-signature": 12000,
  "cv-executive": 25000,
  "correction-lettre": 3000,
  "lettre-ciblee": 6000,
  "lettre-premium": 9000,
  "analyse-adequation": 5000,
  "cv-cible": 7500,
  "candidature-ciblee-complete": 15000,
  "linkedin-essentiel": 6000,
  "linkedin-complet": 12000,
  "preparation-express": 8000,
  "simulation-complete": 12000,
  "preparation-intensive": 25000,
  "seance-declic": 10000,
  "seance-bilan": 20000,
  "parcours-cap-carriere": 40000,
  "strategie-recherche": 10000,
  "accompagnement-un-mois": 35000,
  "relecture-dossier": 5000,
  "dossier-special": 15000,
  "atelier-cv-candidature": 100000,
  "programme-employabilite": null,
  "salaries-en-transition": null,
};

// Business fixtures from the user-approved October 29 price grid protect billed
// amounts and recommendation URLs when catalogue copy changes.
test("the full approved price grid has 6 packs, 22 services and 3 organisation offers", () => {
  assert.equal(publishedOffers.length, 31);
  assert.equal(new Set(publishedOffers.map((offer) => offer.slug)).size, 31);
  assert.deepEqual(Object.fromEntries(publishedOffers.map((offer) => [offer.slug, offer.priceAmount])), approvedPrices);
  assert.deepEqual(["pack", "service", "organisation"].map((kind) => publishedOffers.filter((offer) => offer.kind === kind).length), [6, 22, 3]);
  assert.equal(publishedOffers.filter((offer) => offer.kind === "service").reduce((total, offer) => total + offer.priceAmount, 0), 289500);
  const solutions = new Set(publishedOffers.filter((offer) => offer.kind === "service").map((offer) => offer.solution));
  assert.equal(solutions.size, 8);
  for (const offer of publishedOffers) {
    assert.match(offer.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(commercialSolutionLabels[offer.solution], offer.slug);
    assert.ok(offer.name && offer.audience && offer.delivery && offer.benefits.length, offer.slug);
    assert.equal(offer.priceAmount === null, offer.priceMode === "quote", offer.slug);
    if (offer.priceAmount !== null) assert.ok(Number.isInteger(offer.priceAmount) && offer.priceAmount > 0);
  }
});

test("pack reference values and savings match the validated grid without an unapproved launch discount", () => {
  const expected = {
    "premier-pas": [9000, 1500],
    "candidature-signature": [18000, 3000],
    "visibilite-professionnelle": [30000, 5000],
    "objectif-recrutement": [35000, 5000],
    "cap-reconversion": [48000, 8000],
    executive: [71000, 11000],
  };
  for (const [slug, [reference, savings]] of Object.entries(expected)) {
    const offer = getPublishedOffer(slug);
    assert.equal(offer.referenceAmount, reference, slug);
    assert.equal(offer.referenceAmount - offer.priceAmount, savings, slug);
  }
  assert.deepEqual(publishedOffers.filter((offer) => offer.featured).map((offer) => offer.slug), ["candidature-signature"]);
  assert.equal(getPublishedOffer("candidature-signature").badge, "Recommandé");
});

test("lookup accepts only a known exact slug from untrusted request parameters", () => {
  for (const input of [undefined, null, {}, [], ["cv-cleaning"], "", "__proto__", " CV-cleaning", "cv-cleaning ", "unknown"]) {
    assert.equal(getPublishedOffer(input), undefined);
  }
  assert.equal(getPublishedOffer("cv-cleaning").priceAmount, 6000);
});

test("prices distinguish fixed rates, starting rates and quotes", () => {
  const normalize = (text) => text.replace(/[\u00a0\u202f]/g, " ");
  assert.equal(normalize(formatOfferPrice(getPublishedOffer("premier-pas"))), "7 500 FCFA");
  assert.equal(normalize(formatOfferPrice(getPublishedOffer("atelier-cv-candidature"))), "À partir de 100 000 FCFA");
  assert.equal(formatOfferPrice(getPublishedOffer("programme-employabilite")), "Sur devis");
});

test("each offer reaches the public and client forms with its exact offer and need", () => {
  for (const offer of publishedOffers) {
    const publicUrl = new URL(offerRequestHref(offer), "https://www.carriovaci.com");
    const workspaceUrl = new URL(offerRequestHref(offer, "workspace"), "https://www.carriovaci.com");
    assert.equal(publicUrl.pathname, "/qualification");
    assert.equal(workspaceUrl.pathname, "/espace/nouvelle-demande");
    assert.equal(publicUrl.searchParams.get("need"), offer.need);
    assert.equal(workspaceUrl.searchParams.get("service"), offer.need);
    assert.equal(publicUrl.searchParams.get("offer"), offer.slug);
    assert.equal(workspaceUrl.searchParams.get("offer"), offer.slug);
  }
  assert.equal(getPublishedOffer("cv-executive").need, "executive");
  assert.equal(getPublishedOffer("linkedin-complet").need, "linkedin");
  assert.equal(getPublishedOffer("dossier-special").need, "special_file");
  assert.equal(getPublishedOffer("atelier-cv-candidature").need, "organisation");
});

test("supplements have approved prices and remain limited to applicable deliverables", () => {
  assert.deepEqual(Object.fromEntries(commercialOptions.map((option) => [option.id, option.priceAmount])), {
    "express-24h": 3000, "english-cv": 6000, "extra-letter": 4000, "extra-corrections": 2000,
  });
  for (const option of commercialOptions) {
    assert.equal(new Set(option.eligibleSlugs).size, option.eligibleSlugs.length);
    for (const slug of option.eligibleSlugs) assert.ok(getPublishedOffer(slug), slug);
  }
  const ids = (slug) => getApplicableCommercialOptions(getPublishedOffer(slug)).map((option) => option.id);
  assert.deepEqual(ids("candidature-signature"), ["express-24h", "english-cv", "extra-letter", "extra-corrections"]);
  assert.ok(!ids("premier-pas").includes("extra-letter"));
  assert.ok(!ids("diagnostic-cv").includes("english-cv"));
  assert.deepEqual(ids("preparation-express"), []);
  assert.deepEqual(ids("programme-employabilite"), []);
  assert.equal(commercialOptions.find((option) => option.id === "express-24h").requiresConfirmation, true);
});
