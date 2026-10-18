const assert = require("node:assert/strict");
const { test } = require("node:test");
const renderer = import("../src/lib/transactional-email.mjs");
const options = {
  title: "Bienvenue dans votre espace",
  body: "Bonjour,\n\nVotre espace est prêt.",
  actionLabel: "Ouvrir mon espace",
  actionUrl: "https://example.test/espace?token=abc&source=email",
  supportEmail: "support@example.test",
};

test("transactional emails provide a responsive, image-free HTML message and a fallback link", async () => {
  const { renderTransactionalEmail } = await renderer;
  const html = renderTransactionalEmail(options);
  assert.match(html, /<html lang="fr">/);
  assert.match(html, /max-width:600px/);
  assert.match(html, /href="https:\/\/example\.test\/espace\?token=abc&amp;source=email"/);
  assert.match(html, /href="mailto:support%40example\.test"/);
  assert.equal((html.match(/href="https:/g) || []).length, 2);
  assert.doesNotMatch(html, /<img|<script|<iframe|undefined/);
});

test("transactional emails escape every text field rather than interpret HTML", async () => {
  const { renderTransactionalEmail } = await renderer;
  const html = renderTransactionalEmail({ ...options,
    title: '<script>alert("x")</script>',
    body: '<img src=x onerror="alert(1)"> & bienvenue\nLigne suivante',
    actionLabel: "Ouvrir <mon espace> & 'voir'",
    note: '<a href="javascript:evil()">Important</a>',
  });
  assert.match(html, /&lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt;/);
  assert.match(html, /&lt;img src=x onerror=&quot;alert\(1\)&quot;&gt; &amp; bienvenue<br>Ligne suivante/);
  assert.match(html, /Ouvrir &lt;mon espace&gt; &amp; &#39;voir&#39;/);
  assert.match(html, /&lt;a href=&quot;javascript:evil\(\)&quot;&gt;Important&lt;\/a&gt;/);
  assert.doesNotMatch(html, /<script|<img|href="javascript:/);
});

test("transactional emails reject unsafe action links and invalid support addresses", async () => {
  const { renderTransactionalEmail } = await renderer;
  for (const actionUrl of ["javascript:alert(1)", "data:text/html,test", "http://example.test", "http://localhost:3000", "/espace", "https://user:password@example.test"]) {
    assert.throws(() => renderTransactionalEmail({ ...options, actionUrl }), TypeError);
  }
  for (const supportEmail of ["", "not-an-email", 'support@example.test" onclick="evil()', "a@example.test\r\nBcc: b@example.test"]) {
    assert.throws(() => renderTransactionalEmail({ ...options, supportEmail }), TypeError);
  }
});
