const test = require("node:test");
const assert = require("node:assert/strict");
const { loadTypeScript: load } = require("./helpers/crm-fixture.cjs");
const cv = load("src/lib/cv.ts");
let config = { enabled: true, apiKey: "fictional-local-key", model: "openai/gpt-oss-120b", dailyLimit: 200 };
const ai = load("src/lib/cv-ai.ts", { "server-only": {}, "@/lib/cv": cv, "@/lib/cv-ai-config": { getCvAiConfig: () => config } });
function sample() {
  const c = cv.createEmptyCv("Aminata Exemple", "aminata@example.test");
  c.basics.phone = "+2250701020304"; c.basics.headline = "Assistante administrative"; c.basics.website = "https://example.test";
  c.experiences = [{ id: "exp-1", role: "Assistante", company: "Association de démonstration", location: "Abidjan", startDate: "2022-06", endDate: "", current: true, description: "Accueil des adhérents, classement des dossiers et préparation des réunions." }];
  return c;
}
function completion(overrides = {}) {
  const { basics, ...rest } = sample();
  return new Response(JSON.stringify({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify({ headline: basics.headline, ...rest }), ...overrides.message }, ...overrides.choice }], usage: { prompt_tokens: 600, completion_tokens: 300 } }));
}
test("Groq sends only professional input, strict schema and no browser secret", async () => {
  let calls = 0;
  const result = await ai.generateCvSuggestion(sample(), "Contact Aminata Exemple : aminata@example.test, +2250701020304", "Offre assistant de direction", async (url, request) => {
    calls++; assert.equal(url, "https://api.groq.com/openai/v1/chat/completions");
    const body = JSON.parse(request.body); const source = body.messages[1].content;
    for (const value of ["Aminata Exemple", "aminata@example.test", "+2250701020304", "https://example.test"]) assert.equal(source.includes(value), false);
    assert.equal(source.includes("2022-06"), true); assert.equal(body.response_format.json_schema.strict, true);
    assert.equal(body.reasoning_effort, "low"); assert.equal(body.include_reasoning, false);
    assert.equal(request.headers.Authorization, "Bearer fictional-local-key"); assert.equal(request.redirect, "error");
    return completion();
  });
  assert.equal(calls, 1); assert.deepEqual(result.suggestion.basics, sample().basics);
  assert.equal(result.inputTokens, 600); assert.equal(result.outputTokens, 300);
});
test("disabled configuration never calls the provider", async () => {
  config.enabled = false;
  try { await assert.rejects(ai.generateCvSuggestion(sample(), "", "", () => assert.fail("Provider called")), e => e.code === "AI_UNAVAILABLE"); }
  finally { config.enabled = true; }
});
test("provider refusal, truncation and malformed content never replace a CV", async () => {
  for (const response of [completion({ choice: { finish_reason: "length" } }), completion({ message: { refusal: "refused" } }), completion({ message: { content: "not JSON" } }), completion({ message: { content: JSON.stringify({ headline: "Hacker", skills: "invalid" }) } })]) {
    const source = sample(), original = JSON.stringify(source);
    await assert.rejects(ai.generateCvSuggestion(source, "", "", async () => response), e => e.code === "INVALID_OUTPUT");
    assert.equal(JSON.stringify(source), original);
  }
});
test("rate limit, credentials, timeout and response bounds produce safe errors without retries", async () => {
  for (const [status, code] of [[429, "PROVIDER_LIMIT"], [401, "PROVIDER_UNAVAILABLE"], [500, "PROVIDER_UNAVAILABLE"]]) {
    let calls = 0;
    await assert.rejects(ai.generateCvSuggestion(sample(), "", "", async () => { calls++; return new Response("secret provider diagnostics", { status }); }), e => e.code === code && !e.message.includes("secret"));
    assert.equal(calls, 1);
  }
  await assert.rejects(ai.generateCvSuggestion(sample(), "", "", async () => { throw new DOMException("timeout", "TimeoutError"); }), e => e.code === "AI_TIMEOUT");
  await assert.rejects(ai.generateCvSuggestion(sample(), "", "", async () => new Response("x".repeat(128001))), e => e.code === "INVALID_OUTPUT");
});
test("empty facts, oversized notes and invalid fields fail before a paid request", async () => {
  const none = () => assert.fail("Unexpected provider request");
  await assert.rejects(ai.generateCvSuggestion(cv.createEmptyCv(), "", "", none), e => e.code === "NEEDS_FACTS");
  await assert.rejects(ai.generateCvSuggestion(sample(), "x".repeat(4001), "", none), e => e.code === "INPUT_TOO_LONG");
  const long = sample(); long.experiences[0].description = "x".repeat(15000);
  await assert.rejects(ai.generateCvSuggestion(long, "", "", none), e => e.code === "INPUT_TOO_LONG");
});

test("technical UUIDs and structured dates survive contact redaction", () => {
  const c = sample(); c.experiences[0].id = "12345678-1234-4123-8123-123456789012";
  const input = ai.cvProfessionalInput(c, "", "");
  assert.equal(input.cv.experiences[0].id, c.experiences[0].id);
  assert.equal(input.cv.experiences[0].startDate, "2022-06");
});
