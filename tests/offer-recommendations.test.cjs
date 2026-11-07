const test = require("node:test");
const assert = require("node:assert/strict");
const { loadTypeScript } = require("./helpers/crm-fixture.cjs");
const catalog = loadTypeScript("src/lib/commercial-offers.ts");
const quiz = loadTypeScript("src/lib/offer-recommendations.ts", { "@/lib/commercial-offers": catalog });
test("all 24 situations and budgets return a real offer with a truthful price and budget fit", () => {
  for (const situation of quiz.offerSituations) for (const budget of quiz.offerBudgets) {
    const result = quiz.recommendOffer(situation.value, budget.value);
    assert.ok(result.offer);
    assert.equal(result.offer, catalog.getPublishedOffer(result.offer.slug));
    assert.equal(result.withinBudget, result.offer.priceAmount <= budget.maximum);
    assert.notEqual(result.offer.slug, result.alternative?.slug);
    assert.match(catalog.offerRequestHref(result.offer), new RegExp(`offer=${result.offer.slug}`));
  }
});
test("recommendations never present an unaffordable executive or career session as within budget", () => {
  assert.equal(quiz.recommendOffer("executive", "small").withinBudget, false);
  assert.equal(quiz.recommendOffer("change", "small").withinBudget, false);
  assert.equal(quiz.recommendOffer("executive", "premium").offer.slug, "executive");
  assert.equal(quiz.recommendOffer("interview", "small").offer.slug, "preparation-express");
});
test("missing or invalid quiz answers do not invent a recommendation", () => {
  for (const pair of [[null, null], ["starting", "invalid"], ["invalid", "small"], [["starting"], "small"]]) assert.equal(quiz.recommendOffer(...pair), null);
});
