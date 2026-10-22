const assert = require("node:assert/strict");
const { randomUUID } = require("node:crypto");
const test = require("node:test");
const { loadTypeScript } = require("./helpers/crm-fixture.cjs");
const cv = loadTypeScript("src/lib/cv.ts");
class CustomerUnauthorizedError extends Error {}
class CvStoreError extends Error {
  constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
const facts = "J’ai effectué un stage de trois mois en accueil client. Je préparais les dossiers et répondais aux demandes des visiteurs.";
const context = (id = 17) => ({ params: Promise.resolve({ id: String(id) }) });
const assistantRequest = (overrides = {}, origin = "https://carriova.example") => new Request("https://carriova.example/api/espace/cv/17/assistant", {
  method: "POST", headers: { "content-type": "application/json", origin },
  body: JSON.stringify({ version: 0, consent: true, facts, target: "", requestId: randomUUID(), ...overrides }),
});
const pdfRequest = version => new Request(`https://carriova.example/api/espace/cv/17/pdf${version === undefined ? "" : `?version=${version}`}`);

function fixture(options = {}) {
  const calls = [];
  const customer = options.customer === undefined ? { id: 7, name: "Awa", email: "awa@example.test" } : options.customer;
  const document = { id: 17, title: options.title ?? "CV Awa", content: cv.createEmptyCv("Awa", "awa@example.test"), templateId: "essentiel", accent: "terracotta", version: options.version ?? 0, updatedAt: "2026-10-18T12:00:00.000Z" };
  let readCount = 0;
  const config = { enabled: options.enabled ?? true, dailyLimit: 200, model: "test-model", apiKey: "synthetic-not-a-real-key" };
  const realAi = loadTypeScript("src/lib/cv-ai.ts", { "server-only": {}, "@/lib/cv": cv, "@/lib/cv-ai-config": { getCvAiConfig: () => config } });
  const mocks = {
    "server-only": {}, "@/lib/cv": cv,
    "@/lib/customer-auth": { CustomerUnauthorizedError, requireCustomer: async () => {
      calls.push(["auth"]); if (!customer) throw new CustomerUnauthorizedError(); return customer;
    } },
    "@/lib/cv-store": {
      CvStoreError,
      getCustomerCv: async (id, customerId) => {
        calls.push(["read", id, customerId]); readCount++;
        if (id !== 17 || customerId !== 7) return null;
        if (readCount > 1 && options.deleteAfterProvider) return null;
        return structuredClone({ ...document, version: readCount > 1 && options.changeAfterProvider ? document.version + 1 : document.version });
      },
      reserveCvAiRun: async (...args) => {
        calls.push(["reserve", ...args]); if (options.reserveError) throw options.reserveError; return { runId: 61 };
      },
      finishCvAiRun: async (...args) => {
        calls.push(["finish", ...args]); if (options.finishError) throw new Error("simulated private database error"); return true;
      },
      updateCustomerCv: async () => { calls.push(["update"]); throw new Error("AI must never save without customer acceptance"); },
    },
    "@/lib/cv-ai-config": { getCvAiConfig: () => config },
    "@/lib/cv-ai": {
      CvAiError: realAi.CvAiError,
      validateCvAiInput: (...args) => { calls.push(["validate"]); return realAi.validateCvAiInput(...args); },
      generateCvSuggestion: async (...args) => {
        calls.push(["provider", ...args]);
        if (options.providerError) throw new realAi.CvAiError("PROVIDER_UNAVAILABLE", "Le fournisseur est indisponible.");
        return { suggestion: { ...document.content, summary: "Proposition à vérifier." }, model: "test-model", inputTokens: 25, outputTokens: 35 };
      },
    },
    "@/lib/cv-pdf": { renderCvPdf: async value => {
      calls.push(["render", value]);
      if (options.renderError) throw new Error("private renderer details");
      return options.largePdf ? Buffer.alloc(3 * 1024 * 1024 + 1) : Buffer.from("%PDF-1.7\nsynthetic test document\n%%EOF");
    } },
    "@/lib/security": { rateLimit: (...args) => { calls.push(["rate", ...args]); return { ok: options.rateAllowed !== false }; } },
  };
  mocks["@/lib/cv-http"] = loadTypeScript("src/lib/cv-http.ts", mocks);
  return {
    calls, document, realAi,
    assistant: loadTypeScript("src/app/api/espace/cv/[id]/assistant/route.ts", mocks),
    pdf: loadTypeScript("src/app/api/espace/cv/[id]/pdf/route.ts", mocks),
    count(name) { return calls.filter(call => call[0] === name).length; },
  };
}

// Every provider, account lookup, persistence operation and PDF renderer is mocked.
// The real HTTP helper and real professional-input validator run on synthetic data.
test("AI route accepts version zero and returns a suggestion without saving it", async () => {
  const f = fixture(); const requestId = randomUUID();
  const response = await f.assistant.POST(assistantRequest({ requestId }), context());
  assert.equal(response.status, 200);
  assert.match(response.headers.get("cache-control"), /private.*no-store/);
  assert.equal(response.headers.get("vary"), "Cookie");
  const body = await response.json();
  assert.equal(body.sourceVersion, 0); assert.equal(body.requestId, requestId);
  assert.equal(body.suggestion.summary, "Proposition à vérifier.");
  assert.deepEqual(f.calls.find(call => call[0] === "reserve"), ["reserve", 7, 17, 0, requestId, { globalDailyLimit: 200 }]);
  assert.deepEqual(f.calls.find(call => call[0] === "finish"), ["finish", 61, 7, { status: "succeeded", model: "test-model", inputTokens: 25, outputTokens: 35 }]);
  assert.ok(f.calls.findIndex(call => call[0] === "validate") < f.calls.findIndex(call => call[0] === "reserve"));
  assert.equal(f.count("provider"), 1); assert.equal(f.count("update"), 0); assert.equal(f.document.content.summary, "");
});

test("AI and PDF routes refuse missing session before reading private CVs", async () => {
  for (const route of ["assistant", "pdf"]) {
    const f = fixture({ customer: null });
    const response = route === "assistant" ? await f.assistant.POST(assistantRequest(), context()) : await f.pdf.GET(pdfRequest(0), context());
    assert.equal(response.status, 401); assert.equal((await response.json()).code, "UNAUTHORIZED");
    assert.equal(f.count("read"), 0); assert.equal(f.count("provider"), 0); assert.equal(f.count("render"), 0);
  }
});

test("AI rejects cross-origin requests before authentication or reservation", async () => {
  const f = fixture();
  const response = await f.assistant.POST(assistantRequest({}, "https://evil.example"), context());
  assert.equal(response.status, 403); assert.equal((await response.json()).code, "INVALID_ORIGIN");
  assert.deepEqual(f.calls, []);
});

test("another customer's CV is 404 and cannot reach Groq or PDF rendering", async () => {
  for (const route of ["assistant", "pdf"]) {
    const f = fixture({ customer: { id: 8, name: "Other", email: "other@example.test" } });
    const response = route === "assistant" ? await f.assistant.POST(assistantRequest(), context()) : await f.pdf.GET(pdfRequest(0), context());
    assert.equal(response.status, 404);
    assert.deepEqual(f.calls.find(call => call[0] === "read"), ["read", 17, 8]);
    assert.equal(f.count("reserve"), 0); assert.equal(f.count("provider"), 0); assert.equal(f.count("render"), 0);
  }
});

test("AI requires consent, valid UUID and integer version before reservation", async () => {
  for (const invalid of [{ consent: false }, { consent: "true" }, { requestId: "not-a-uuid" }, { version: -1 }, { version: "0" }]) {
    const f = fixture(); const response = await f.assistant.POST(assistantRequest(invalid), context());
    assert.equal(response.status, 400); assert.equal((await response.json()).code, "INVALID_INPUT");
    assert.equal(f.count("reserve"), 0); assert.equal(f.count("provider"), 0); assert.equal(f.count("read"), 0);
  }
});

test("AI professional input limits are validated before consuming a reservation", async () => {
  for (const [invalid, code] of [[{ facts: "Too short" }, "NEEDS_FACTS"], [{ facts: "x".repeat(4001) }, "INPUT_TOO_LONG"], [{ target: "x".repeat(4001) }, "INPUT_TOO_LONG"]]) {
    const f = fixture(); const response = await f.assistant.POST(assistantRequest(invalid), context());
    assert.equal(response.status, 400); assert.equal((await response.json()).code, code);
    assert.equal(f.count("validate"), 1); assert.equal(f.count("reserve"), 0); assert.equal(f.count("provider"), 0);
  }
});

test("AI refuses a stale version before the provider and preserves quota errors", async () => {
  const stale = fixture({ version: 1 });
  const response = await stale.assistant.POST(assistantRequest(), context());
  assert.equal(response.status, 409); assert.equal((await response.json()).code, "VERSION_CONFLICT");
  assert.equal(stale.count("reserve"), 0); assert.equal(stale.count("provider"), 0);
  const limited = fixture({ reserveError: new CvStoreError(429, "AI_DAILY_LIMIT", "Limite atteinte.") });
  const rejected = await limited.assistant.POST(assistantRequest(), context());
  assert.equal(rejected.status, 429); assert.equal((await rejected.json()).code, "AI_DAILY_LIMIT");
  assert.equal(limited.count("provider"), 0); assert.equal(limited.count("finish"), 0);
});

test("AI provider error finishes the reserved attempt as failed without provider retry", async () => {
  const f = fixture({ providerError: true });
  const response = await f.assistant.POST(assistantRequest(), context());
  assert.equal(response.status, 503); assert.equal((await response.json()).code, "PROVIDER_UNAVAILABLE");
  assert.deepEqual(f.calls.find(call => call[0] === "finish"), ["finish", 61, 7, { status: "failed", errorCode: "PROVIDER_UNAVAILABLE" }]);
  assert.equal(f.count("provider"), 1); assert.equal(f.count("finish"), 1); assert.equal(f.count("update"), 0);
});

test("post-provider edits or deletion discard the suggestion without overwriting a CV", async () => {
  for (const option of [{ changeAfterProvider: true }, { deleteAfterProvider: true }]) {
    const f = fixture(option); const response = await f.assistant.POST(assistantRequest(), context());
    assert.equal(response.status, 409); const body = await response.json();
    assert.equal(body.code, "VERSION_CONFLICT"); assert.equal(Object.hasOwn(body, "suggestion"), false);
    assert.equal(f.count("provider"), 1); assert.equal(f.count("finish"), 1); assert.equal(f.count("update"), 0);
    assert.equal(f.calls.find(call => call[0] === "finish")[3].status, "succeeded");
  }
});

test("missing AI configuration does not reserve or call the provider", async () => {
  const f = fixture({ enabled: false }); const response = await f.assistant.POST(assistantRequest(), context());
  assert.equal(response.status, 503); assert.equal((await response.json()).code, "AI_UNAVAILABLE");
  assert.equal(f.count("reserve"), 0); assert.equal(f.count("provider"), 0);
});

test("PDF version zero exports owned CV with private download and safe filename headers", async () => {
  const f = fixture({ title: "CV d’Awa\r\n/test\\(final)" }); const response = await f.pdf.GET(pdfRequest(0), context());
  assert.equal(response.status, 200); assert.equal(response.headers.get("content-type"), "application/pdf");
  assert.match(response.headers.get("cache-control"), /private.*no-store/);
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("content-security-policy"), "sandbox; default-src 'none'");
  assert.match(response.headers.get("content-disposition"), /^attachment; filename="CV.pdf"; filename\*=UTF-8''/);
  assert.doesNotMatch(response.headers.get("content-disposition"), /[\r\n]/);
  assert.match(response.headers.get("content-disposition"), /%28final%29/);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(Number(response.headers.get("content-length")), bytes.byteLength);
  assert.match(bytes.toString(), /^%PDF-/); assert.equal(f.count("render"), 1);
  assert.deepEqual(f.calls.find(call => call[0] === "rate"), ["rate", "cv-pdf:7", 12, 60000]);
});

test("PDF rejects missing, malformed and stale versions before rendering", async () => {
  for (const version of [undefined, "-1", "00", "1", "0.0", "nope"]) {
    const f = fixture(); const response = await f.pdf.GET(pdfRequest(version), context());
    assert.equal(response.status, 409); assert.equal((await response.json()).code, "VERSION_CONFLICT");
    assert.equal(f.count("render"), 0); assert.equal(f.count("rate"), 0);
  }
});

test("PDF guards export frequency and response size and hides renderer details", async () => {
  const limited = fixture({ rateAllowed: false });
  assert.equal((await limited.pdf.GET(pdfRequest(0), context())).status, 429); assert.equal(limited.count("render"), 0);
  const large = fixture({ largePdf: true }); assert.equal((await large.pdf.GET(pdfRequest(0), context())).status, 422);
  const broken = fixture({ renderError: true }); const response = await broken.pdf.GET(pdfRequest(0), context());
  assert.equal(response.status, 503); assert.doesNotMatch(await response.text(), /private renderer details/);
});


test("CV origin validation respects public Host behind Next and rejects forged origins", () => {
  const { assertCvOrigin } = loadTypeScript("src/lib/cv-http.ts", {
    "server-only": {}, "@/lib/customer-auth": { CustomerUnauthorizedError },
    "@/lib/cv": cv, "@/lib/cv-store": { CvStoreError },
  });
  const request = headers => new Request("http://localhost:3100/api/espace/cv", { method: "POST", headers });
  assert.doesNotThrow(() => assertCvOrigin(request({ host: "127.0.0.1:3100", origin: "http://127.0.0.1:3100" })));
  assert.doesNotThrow(() => assertCvOrigin(request({ host: "www.carriovaci.com", origin: "https://www.carriovaci.com", "x-forwarded-proto": "https" })));
  for (const headers of [
    { host: "www.carriovaci.com", origin: "https://evil.example", "x-forwarded-host": "evil.example", "x-forwarded-proto": "https" },
    { host: "www.carriovaci.com", origin: "http://www.carriovaci.com", "x-forwarded-proto": "https" },
    { host: "127.0.0.1:3100", origin: "http://127.0.0.1:3100", "sec-fetch-site": "cross-site" },
    { host: "127.0.0.1:3100", origin: "http://127.0.0.1:3100/path" },
    { host: "127.0.0.1:3100", origin: "null" }, {},
  ]) assert.throws(() => assertCvOrigin(request(headers)), error => error.status === 403);
});

test("PDF filename preserves emoji at the truncation boundary and handles isolated surrogates", async () => {
  const cases = [
    {title:"a".repeat(99)+"😀z", expected:"a".repeat(99)+"😀.pdf"},
    {title:"😀".repeat(100), expected:"😀".repeat(100)+".pdf"},
    {title:"CV \uD800 et \uDC00", expected:"CV \uFFFD et \uFFFD.pdf"},
  ];
  for (const {title,expected} of cases) {
    const f=fixture({title}); const response=await f.pdf.GET(pdfRequest(0),context());
    assert.equal(response.status,200); assert.equal(f.count("render"),1);
    const header=response.headers.get("content-disposition");
    assert.match(header,/^attachment; filename="CV.pdf"; filename\*=UTF-8''/);
    const name=decodeURIComponent(header.split("UTF-8''")[1]);
    assert.equal(name,expected); assert.doesNotMatch(name,/[\uD800-\uDFFF]/u);
    assert.ok(Array.from(name).length<=104);
  }
});