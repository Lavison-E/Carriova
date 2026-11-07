const { loadTypeScript } = require("./crm-fixture.cjs");
const catalog = loadTypeScript("src/lib/commercial-offers.ts");
const selection = loadTypeScript("src/lib/offer-selection.ts", { "@/lib/commercial-offers": catalog });
const navigation = loadTypeScript("src/lib/customer-navigation.ts", { "@/lib/commercial-offers": catalog });
module.exports = { "@/lib/customer-navigation": navigation, "@/lib/commercial-offers": catalog, "@/lib/offer-selection": selection };
