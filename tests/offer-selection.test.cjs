const test = require("node:test");
const assert = require("node:assert/strict");
const commercial = require("./helpers/commercial-fixture.cjs");
const { publishedOffers } = commercial["@/lib/commercial-offers"];
const { selectOffer } = commercial["@/lib/offer-selection"];
const { normalizeCustomerReturnTo, customerAuthHref } = commercial["@/lib/customer-navigation"];

test("offer snapshots use the server catalogue, reject mismatched choices and own their content array", () => {
  for (const offer of publishedOffers) {
    const result = selectOffer(offer.slug, offer.need);
    assert.equal(result.error, undefined);
    assert.equal(result.snapshot.priceAmount, offer.priceAmount);
    assert.equal(result.snapshot.currency, "XOF");
    assert.deepEqual(result.snapshot.benefits, offer.benefits);
    assert.notEqual(result.snapshot.benefits, offer.benefits);
    result.snapshot.benefits.push("Changed after submission");
    assert.ok(!offer.benefits.includes("Changed after submission"));
    assert.ok(selectOffer(offer.slug, "forged-service").error);
  }
  for (const value of ["unknown", "__proto__", {}, ["cv-cleaning"], new File(["cv-cleaning"], "offer")]) assert.ok(selectOffer(value, "improve_cv").error);
  assert.deepEqual(selectOffer("", "improve_cv"), { snapshot: null });
});

test("auth continuation preserves only known offers and exact internal new-request destinations", () => {
  for (const offer of publishedOffers) {
    const expected = `/espace/nouvelle-demande?service=${offer.need}&offer=${offer.slug}`;
    assert.equal(normalizeCustomerReturnTo(`/espace/nouvelle-demande?offer=${offer.slug}`), expected);
    for (const mode of ["login", "signup"]) {
      const url = new URL(customerAuthHref(expected, mode), "https://carriova.test");
      assert.equal(url.pathname, mode === "login" ? "/compte/connexion" : "/compte/creer");
      assert.equal(url.searchParams.get("returnTo"), expected);
    }
  }
  for (const candidate of [undefined, {}, ["/espace/nouvelle-demande"], "https://evil.test", "//evil.test/espace/nouvelle-demande", "/\\evil.test", "/espace", "/admin", "/espace/nouvelle-demande#anything", "/espace/nouvelle-demande?returnTo=https://evil.test", "/espace/nouvelle-demande?offer=unknown", "/espace/nouvelle-demande?service=first_cv&offer=cv-cleaning", "/espace/nouvelle-demande?service=improve_cv&service=first_cv", "/espace/nouvelle-demande?offer=cv-cleaning&offer=cv-cleaning", "/espace/nouvelle-demande?service=__proto__", "/espace/nouvelle-demande?offer=cv-cleaning%0a"]) {
    assert.equal(normalizeCustomerReturnTo(candidate), null, String(candidate));
    assert.equal(customerAuthHref(candidate), "/compte/connexion");
  }
  assert.equal(normalizeCustomerReturnTo("/espace/nouvelle-demande"), "/espace/nouvelle-demande");
});
