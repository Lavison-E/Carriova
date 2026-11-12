const assert = require("node:assert/strict");
const test = require("node:test");
const { createHash, randomBytes } = require("node:crypto");
const { PGlite } = require("@electric-sql/pglite");
const { drizzle } = require("drizzle-orm/pglite");
const { CORE_LEADS_SQL, loadTypeScript: load, migrationClient } = require("./helpers/crm-fixture.cjs");

const hash = value => createHash("sha256").update(value).digest("hex");
const initial = { ok: false, message: "" };
const form = values => { const data = new FormData(); for (const [key, value] of Object.entries(values)) data.set(key, String(value)); return data; };
class UnauthorizedError extends Error { constructor() { super("Unauthorized"); this.name = "UnauthorizedError"; } }
class Redirect extends Error { constructor(path) { super(path); this.path = path; } }

// Every operation runs against a disposable PostgreSQL WASM database. No .env file
// is loaded, and the only outbound transport is replaced by this suite's mail fake.
test("Team administration persists permissions, invitations and account lifecycle safely", async t => {
  const pg = new PGlite(); t.after(() => pg.close());
  await pg.exec(CORE_LEADS_SQL);
  const { migrateCrm } = await import("../scripts/migrate-crm.mjs");
  await migrateCrm(migrationClient(pg));
  const db = drizzle(pg);
  const passwords = await import("../src/lib/staff-password.mjs");
  const renderer = await import("../src/lib/transactional-email.mjs");
  const storedPassword = await passwords.hashPassword("A-private-testing-passphrase-123");
  const staffSchema = load("src/db/staff-schema.ts");
  const inviteSchema = load("src/db/staff-invite-schema.ts", { "./staff-schema": staffSchema });
  const teamSchema = load("src/db/team-schema.ts", { "./staff-schema": staffSchema });
  const management = load("src/lib/team-management.ts", { "@/lib/security": load("src/lib/security.ts") });
  const env = {
    NEXT_PUBLIC_SITE_URL: "https://carriova.example.test", SUPPORT_EMAIL: "support@example.test", CONTACT_EMAIL: "contact@example.test",
    email: { enabled: true, transactionalEnabled: true, apiKey: "fake-mail-key", transactionalFrom: "CARRIOVA <noreply@example.test>", from: "CARRIOVA <noreply@example.test>", baseUrl: "https://api.resend.com", notify: [] },
  };
  const mails = [], invalidations = [], identityTokens = new Map();
  let mailMode = "success";
  t.mock.method(globalThis, "fetch", async (url, init) => {
    assert.equal(String(url), "https://api.resend.com/emails");
    mails.push({ body: JSON.parse(init.body), headers: init.headers });
    if (mailMode === "network") throw new Error("private-upstream-failure-with-sensitive-details");
    if (mailMode === "rejected") return new Response("private-upstream-error", { status: 403 });
    if (mailMode === "malformed") return new Response("{}", { status: 200 });
    return new Response(JSON.stringify({ id: `mail-${mails.length}` }), { status: 200 });
  });
  const common = {
    "server-only": {}, "@/db": { databaseConfigured: true, getDb: () => db },
    "@/db/staff-schema": staffSchema, "@/db/staff-invite-schema": inviteSchema,
    "@/db/team-schema": teamSchema, "@/lib/team-management": management,
    "@/lib/staff-password.mjs": passwords, "@/lib/transactional-email.mjs": renderer,
    "@/lib/env": { serverEnv: env }, "@/lib/security": load("src/lib/security.ts"),
    "next/cache": { revalidatePath: path => invalidations.push(path) },
    "next/headers": { headers: async () => new Headers({ "x-real-ip": "192.0.2.50" }), cookies: async () => ({ set() {} }) },
    "next/navigation": { redirect: path => { throw new Redirect(path); } },
  };
  const as = identity => {
    const mocks = { ...common,
      "next/headers": { ...common["next/headers"], cookies: async () => ({ get: () => identity && identityTokens.has(identity.id) ? { value: identityTokens.get(identity.id) } : undefined, set() {} }) },
      "@/lib/staff-auth": {
      STAFF_COOKIE: "carriova_staff", tokenHash: hash, UnauthorizedError,
      requireStaff: async () => { if (!identity) throw new UnauthorizedError(); return identity; },
      getStaffSession: async () => identity,
    } };
    return { ...load("src/lib/team-actions.ts", mocks), ...load("src/lib/team-queries.ts", mocks) };
  };
  const activation = load("src/lib/staff-invite-actions.ts", { ...common, "@/lib/staff-auth": { STAFF_COOKIE: "carriova_staff", tokenHash: hash } });
  const password = "A-new-private-test-passphrase-456";
  const activate = (token, extra = {}) => activation.activateStaffInvitation(initial, form({ token, password, confirmPassword: password, ...extra }));
  const one = async (sql, params = []) => (await pg.query(sql, params)).rows[0];
  const account = id => one("SELECT * FROM staff_users WHERE id=$1", [id]);
  let serial = 0;
  const seed = async (overrides = {}) => {
    const values = { email: `member-${++serial}@example.test`, name: `Équipe ${serial}`, role: "advisor", enabled: true, passwordHash: storedPassword, ...overrides };
    const member = await one("INSERT INTO staff_users(email,name,role,enabled,password_hash) VALUES($1,$2,$3,$4,$5) RETURNING id,email,name,role", [values.email, values.name, values.role, values.enabled, values.passwordHash]);
    const token = randomBytes(32).toString("base64url"); identityTokens.set(member.id, token);
    await pg.query("INSERT INTO staff_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')", [hash(token), member.id]);
    return member;
  };
  const sessions = id => one("SELECT count(*)::int AS n FROM staff_sessions WHERE user_id=$1", [id]);
  const session = async id => pg.query("INSERT INTO staff_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')", [hash(randomBytes(32)), id]);
  const manage = async (actions, memberId, operation, extra = {}) => {
    const row = await account(memberId);
    return actions.manageTeamMember(initial, form({ memberId, version: row.version, operation, confirmEmail: row.email, ...extra }));
  };
  const invite = (actions, extra = {}) => actions.inviteTeamMember(initial, form({ name: "Nouvelle conseillère", email: `invited-${++serial}@example.test`, role: "advisor", ...extra }));
  const mailToken = mail => {
    const match = (mail.body.text || mail.body.html).match(/https:\/\/[^\s"<>]+\/admin\/activer\?token=([A-Za-z0-9_-]+)/);
    assert.ok(match, "a private activation link must be present in the recipient's mail");
    return match[1];
  };
  const admin = await seed({ role: "admin", email: "owner@example.test" });
  const adminActions = as(admin);
  const advisor = await seed({ email: "advisor@example.test" });

  await t.test("unauthenticated visitors and advisors cannot read the team or forge admin writes", async () => {
    const before = await one("SELECT count(*)::int AS n FROM staff_users");
    for (const identity of [null, advisor]) {
      const actions = as(identity);
      await assert.rejects(actions.getTeamManagementData());
      assert.equal((await invite(actions, { actorId: admin.id, actorRole: "admin", role: "admin" })).ok, false);
      for (const operation of ["update", "disable", "enable", "revoke_sessions", "delete", "restore", "resend_invitation"]) {
        assert.equal((await manage(actions, advisor.id, operation, { name: "Forged", role: "admin", actorId: admin.id, actorRole: "admin" })).ok, false);
      }
    }
    assert.equal((await account(advisor.id)).role, "advisor");
    assert.equal((await one("SELECT count(*)::int AS n FROM staff_users")).n, before.n);
    assert.equal(mails.length, 0);
  });

  await t.test("authorization rechecks the database after a role or access change", async () => {
    for (const changed of ["role='advisor'", "enabled=false", "deleted_at=now(),enabled=false"]) {
      const actor = await seed({ role: "admin" });
      const actions = as(actor);
      await pg.query(`UPDATE staff_users SET ${changed} WHERE id=$1`, [actor.id]);
      await assert.rejects(actions.getTeamManagementData());
      assert.equal((await invite(actions)).ok, false);
      assert.equal((await manage(actions, advisor.id, "disable")).ok, false);
      assert.equal((await account(advisor.id)).enabled, true);
    }
  });

  await t.test("a revoked session cannot read or mutate even when its earlier identity is still administrator", async () => {
    const actor = await seed({ role: "admin" }), actions = as(actor);
    await pg.query("DELETE FROM staff_sessions WHERE user_id=$1", [actor.id]);
    await assert.rejects(actions.getTeamManagementData());
    assert.equal((await invite(actions)).ok, false);
    assert.equal((await manage(actions, advisor.id, "disable")).ok, false);
    assert.equal((await account(advisor.id)).enabled, true);
  });

  await t.test("invalid invitation fields and unexpected operations never mutate accounts", async () => {
    const before = (await one("SELECT count(*)::int AS n FROM staff_users")).n;
    for (const values of [{ name: "" }, { name: "x".repeat(121) }, { email: "invalid" }, { role: "owner" }, { role: "customer" }]) {
      const result = await invite(adminActions, values);
      assert.equal(result.ok, false); assert.ok(result.fieldErrors);
    }
    for (const values of [{ operation: "grant_all" }, { memberId: "-1" }, { version: "NaN" }, { version: "-1" }]) {
      const result = await manage(adminActions, advisor.id, "disable", values);
      assert.equal(result.ok, false);
    }
    assert.equal((await one("SELECT count(*)::int AS n FROM staff_users")).n, before);
    assert.equal((await account(advisor.id)).enabled, true);
  });

  let pending, pendingToken;
  await t.test("invitations store a single 24-hour digest and never return secrets to the browser", async () => {
    const result = await invite(adminActions, { name: "Invitée réelle", email: "  NEW@EXAMPLE.TEST  " });
    assert.equal(result.ok, true, result.message);
    pending = await one("SELECT * FROM staff_users WHERE email='new@example.test'");
    assert.ok(pending); assert.equal(pending.enabled, false); assert.equal(pending.password_hash, passwords.DUMMY_PASSWORD_HASH);
    pendingToken = mailToken(mails.at(-1));
    const row = await one("SELECT * FROM staff_invites WHERE user_id=$1", [pending.id]);
    assert.equal(row.token_hash, hash(pendingToken)); assert.notEqual(row.token_hash, pendingToken);
    assert.ok(Math.abs(new Date(row.expires_at).getTime() - Date.now() - 86_400_000) < 10_000);
    assert.equal(JSON.stringify(result).includes(pendingToken), false);
    assert.equal(JSON.stringify(result).includes(row.token_hash), false);
    assert.deepEqual(mails.at(-1).body.to, ["new@example.test"]);
    assert.equal(mails.at(-1).body.reply_to, "support@example.test");
    assert.equal(mails.at(-1).body.from, env.email.transactionalFrom);
    assert.equal(JSON.stringify(mails.at(-1).headers).includes(pendingToken), false);
    const before = mails.length;
    assert.equal((await invite(adminActions, { email: pending.email, role: "admin" })).ok, false);
    assert.equal(mails.length, before); assert.equal((await account(pending.id)).role, "advisor");
  });

  await t.test("resending is throttled, rotates the token and invalidates the previous invitation", async () => {
    const before = mails.length, row = await account(pending.id);
    const denied = await manage(adminActions, pending.id, "resend_invitation");
    assert.equal(denied.ok, false); assert.match(denied.message, /minute/);
    assert.equal(mails.length, before); assert.equal((await account(pending.id)).version, row.version);
    await pg.query("UPDATE staff_team_audit SET created_at=now()-interval '2 minutes' WHERE target_id=$1", [pending.id]);
    const old = pendingToken;
    const result = await manage(adminActions, pending.id, "resend_invitation");
    assert.equal(result.ok, true, result.message);
    pendingToken = mailToken(mails.at(-1)); assert.notEqual(pendingToken, old);
    assert.equal((await activate(old)).ok, false);
    const rows = (await pg.query("SELECT token_hash FROM staff_invites WHERE user_id=$1", [pending.id])).rows;
    assert.deepEqual(rows, [{ token_hash: hash(pendingToken) }]);
    assert.equal(JSON.stringify(result).includes(pendingToken), false);
  });

  await t.test("a pending account cannot be enabled without accepting its invitation", async () => {
    assert.equal((await manage(adminActions, pending.id, "enable")).ok, false);
    assert.equal((await account(pending.id)).enabled, false);
    await assert.rejects(activate(pendingToken, { role: "admin", email: admin.email, userId: admin.id }), error => error instanceof Redirect && error.path === "/admin/connexion");
    const active = await account(pending.id);
    assert.equal(active.enabled, true); assert.equal(active.role, "advisor"); assert.equal(active.email, pending.email);
    assert.equal(await passwords.verifyPassword(password, active.password_hash), true);
    assert.equal((await activate(pendingToken)).ok, false);
    assert.equal((await one("SELECT count(*)::int AS n FROM staff_invites WHERE user_id=$1", [pending.id])).n, 0);
  });

  await t.test("role updates revoke sessions, keep identity email fixed and reject stale edits", async () => {
    const target = await seed(); await session(target.id);
    const before = await account(target.id);
    const result = await manage(adminActions, target.id, "update", { name: "Responsable suivi", role: "admin", email: "hijack@example.test" });
    assert.equal(result.ok, true, result.message);
    const changed = await account(target.id);
    assert.equal(changed.name, "Responsable suivi"); assert.equal(changed.role, "admin"); assert.equal(changed.email, before.email);
    assert.ok(changed.version > before.version); assert.equal((await sessions(target.id)).n, 0);
    const stale = await manage(adminActions, target.id, "update", { name: "Écrasement obsolète", role: "advisor", version: before.version });
    assert.equal(stale.ok, false); assert.equal((await account(target.id)).name, changed.name);
    assert.equal((await manage(adminActions, target.id, "update", { name: "", role: "admin" })).ok, false);
    assert.equal((await manage(adminActions, target.id, "update", { name: "Valide", role: "owner" })).ok, false);
  });

  await t.test("disable, enable and session revocation persist and are audited", async () => {
    const target = await seed(); await session(target.id); await session(target.id);
    assert.equal((await manage(adminActions, target.id, "disable")).ok, true);
    assert.equal((await account(target.id)).enabled, false); assert.equal((await sessions(target.id)).n, 0);
    assert.equal((await manage(adminActions, target.id, "enable")).ok, true);
    assert.equal((await account(target.id)).enabled, true);
    await session(target.id);
    assert.equal((await manage(adminActions, target.id, "revoke_sessions")).ok, true);
    assert.equal((await sessions(target.id)).n, 0); assert.equal((await account(target.id)).enabled, true);
    const logs = (await pg.query("SELECT action,actor_id,target_id FROM staff_team_audit WHERE target_id=$1", [target.id])).rows;
    assert.ok(logs.length >= 3); assert.ok(logs.every(row => row.actor_id === admin.id && row.target_id === target.id));
  });

  await t.test("an administrator cannot remove their own access or delete their own account", async () => {
    for (const operation of ["disable", "delete"]) assert.equal((await manage(adminActions, admin.id, operation)).ok, false);
    assert.equal((await manage(adminActions, admin.id, "update", { name: admin.name, role: "advisor" })).ok, false);
    const row = await account(admin.id);
    assert.equal(row.role, "admin"); assert.equal(row.enabled, true); assert.equal(row.deleted_at, null);
  });

  await t.test("concurrent administrators cannot disable one another and leave the service without an administrator", async () => {
    // Temporarily isolate the two active administrators; restore the owner before
    // subsequent cases. PGlite serializes transactions, exercising the loser path.
    const active = (await pg.query("SELECT id FROM staff_users WHERE role='admin' AND enabled=true AND deleted_at IS NULL")).rows;
    await pg.exec("UPDATE staff_users SET enabled=false WHERE role='admin'");
    const first = await seed({ role: "admin" }), second = await seed({ role: "admin" });
    try {
      const results = await Promise.all([manage(as(first), second.id, "disable"), manage(as(second), first.id, "disable")]);
      assert.equal(results.filter(result => result.ok).length, 1);
      assert.equal((await one("SELECT count(*)::int AS n FROM staff_users WHERE role='admin' AND enabled=true AND deleted_at IS NULL")).n, 1);
    } finally {
      await pg.query("UPDATE staff_users SET enabled=false WHERE id=ANY($1::int[])", [[first.id, second.id]]);
      await pg.query("UPDATE staff_users SET enabled=true WHERE id=ANY($1::int[])", [active.map(row => row.id)]);
    }
  });

  await t.test("deleting a collaborator revokes access while preserving customer orders, delivered files and history", async () => {
    const target = await seed(); await session(target.id);
    const customer = await one("INSERT INTO customer_users(email,name,password_hash,consent_privacy,consent_version) VALUES('customer@example.test','Client test',$1,true,'test') RETURNING id", [storedPassword]);
    const order = await one("INSERT INTO service_requests(customer_id,title,service,brief) VALUES($1,'Cleaning CV','cv','Une vraie commande à conserver') RETURNING id", [customer.id]);
    await pg.query("INSERT INTO request_messages(request_id,author_type,author_id,author_name,body) VALUES($1,'staff',$2,$3,'Votre CV est livré.')", [order.id, target.id, target.name]);
    await pg.query("INSERT INTO request_files(request_id,filename,mime_type,size,kind,content,uploaded_by_type,uploaded_by_id,uploaded_by_name) VALUES($1,'cv.pdf','application/pdf',4,'delivery',$2,'staff',$3,$4)", [order.id, new Uint8Array([1,2,3,4]), target.id, target.name]);
    const rejected = await manage(adminActions, target.id, "delete", { confirmEmail: "incorrect@example.test" });
    assert.equal(rejected.ok, false); assert.equal((await account(target.id)).deleted_at, null);
    const result = await manage(adminActions, target.id, "delete");
    assert.equal(result.ok, true, result.message);
    const deleted = await account(target.id);
    assert.ok(deleted.deleted_at); assert.equal(deleted.enabled, false); assert.equal((await sessions(target.id)).n, 0);
    assert.equal((await one("SELECT count(*)::int AS n FROM customer_users WHERE id=$1", [customer.id])).n, 1);
    assert.equal((await one("SELECT count(*)::int AS n FROM service_requests WHERE id=$1", [order.id])).n, 1);
    assert.equal((await one("SELECT count(*)::int AS n FROM request_messages WHERE request_id=$1 AND author_id=$2", [order.id, target.id])).n, 1);
    assert.equal((await one("SELECT count(*)::int AS n FROM request_files WHERE request_id=$1 AND uploaded_by_id=$2", [order.id, target.id])).n, 1);
    assert.ok((await one("SELECT count(*)::int AS n FROM staff_team_audit WHERE target_id=$1", [target.id])).n >= 1);
    assert.equal((await manage(adminActions, target.id, "enable")).ok, false);
    assert.equal((await manage(adminActions, target.id, "restore")).ok, true);
    const restored = await account(target.id);
    assert.equal(restored.deleted_at, null); assert.equal(restored.enabled, false);
    assert.equal((await manage(adminActions, target.id, "enable")).ok, true);
  });

  await t.test("deleting a pending invitation prevents token activation and does not enable access on restore", async () => {
    const result = await invite(adminActions, { email: "cancelled@example.test" }); assert.equal(result.ok, true, result.message);
    const target = await one("SELECT * FROM staff_users WHERE email='cancelled@example.test'");
    const token = mailToken(mails.at(-1));
    assert.equal((await manage(adminActions, target.id, "delete")).ok, true);
    assert.equal((await one("SELECT count(*)::int AS n FROM staff_invites WHERE user_id=$1", [target.id])).n, 0);
    assert.equal((await activate(token)).ok, false);
    // Even a still-present token must not reactivate a tombstoned identity.
    await pg.query("INSERT INTO staff_invites(token_hash,user_id,expires_at) VALUES($1,$2,now()+interval '1 hour')", [hash(token), target.id]);
    assert.equal((await activate(token)).ok, false); assert.equal((await account(target.id)).enabled, false);
    await pg.query("DELETE FROM staff_invites WHERE user_id=$1", [target.id]);
    assert.equal((await manage(adminActions, target.id, "restore")).ok, true);
    assert.equal((await manage(adminActions, target.id, "enable")).ok, false);
  });

  await t.test("changing a pending role invalidates its old invitation before a new role can be accepted", async () => {
    const result = await invite(adminActions, { email: "pending-role@example.test" }); assert.equal(result.ok, true, result.message);
    const target = await one("SELECT * FROM staff_users WHERE email='pending-role@example.test'");
    const old = mailToken(mails.at(-1)), before = mails.length;
    assert.equal((await manage(adminActions, target.id, "update", { name: target.name, role: "admin" })).ok, true);
    assert.equal(mails.length, before); assert.equal((await activate(old)).ok, false);
    assert.equal((await account(target.id)).enabled, false);
    await pg.query("UPDATE staff_team_audit SET created_at=now()-interval '2 minutes' WHERE target_id=$1", [target.id]);
    assert.equal((await manage(adminActions, target.id, "resend_invitation")).ok, true);
    await assert.rejects(activate(mailToken(mails.at(-1)), { role: "advisor" }), Redirect);
    assert.equal((await account(target.id)).role, "admin");
    const after = mails.length;
    assert.equal((await manage(adminActions, target.id, "resend_invitation")).ok, false);
    assert.equal(mails.length, after);
  });

  await t.test("mail failures remain recoverable and never leak provider details or private tokens", async () => {
    const mailAdmin = await seed({ role: "admin" }), actions = as(mailAdmin);
    for (const mode of ["network", "rejected", "malformed"]) {
      mailMode = mode;
      const email = `failed-${mode}@example.test`;
      const result = await invite(actions, { email });
      assert.equal(result.ok, false); assert.match(result.message, /en attente/);
      const target = await one("SELECT * FROM staff_users WHERE email=$1", [email]);
      assert.ok(target); assert.equal(target.enabled, false); assert.equal(target.password_hash, passwords.DUMMY_PASSWORD_HASH);
      const oldToken = mailToken(mails.at(-1));
      const audit = (await pg.query("SELECT action,details FROM staff_team_audit WHERE target_id=$1", [target.id])).rows;
      assert.ok(audit.some(row => row.action === "invite_delivery_failed"));
      const exposed = JSON.stringify({ result, audit });
      for (const value of [oldToken, hash(oldToken), "private-upstream", "fake-mail-key"]) assert.equal(exposed.includes(value), false);
      mailMode = "success";
      await pg.query("UPDATE staff_team_audit SET created_at=now()-interval '2 minutes' WHERE target_id=$1", [target.id]);
      const retry = await manage(actions, target.id, "resend_invitation");
      assert.equal(retry.ok, true, retry.message);
      assert.notEqual(mailToken(mails.at(-1)), oldToken); assert.equal((await activate(oldToken)).ok, false);
      assert.equal((await one("SELECT count(*)::int AS n FROM staff_invites WHERE user_id=$1", [target.id])).n, 1);
      assert.equal((await one("SELECT count(*)::int AS n FROM staff_team_audit WHERE target_id=$1 AND action='invite_sent'", [target.id])).n, 1);
    }
  });

  await t.test("unconfigured invitation delivery creates no inaccessible account", async () => {
    env.email.transactionalEnabled = false;
    const before = mails.length;
    try {
      const result = await invite(adminActions, { email: "unconfigured@example.test" });
      assert.equal(result.ok, false); assert.match(result.message, /Resend/);
      assert.equal(await one("SELECT id FROM staff_users WHERE email='unconfigured@example.test'"), undefined);
      assert.equal(mails.length, before);
    } finally { env.email.transactionalEnabled = true; }
  });

  await t.test("a concurrent invitation burst respects the persistent ten-per-hour limit", async () => {
    const inviter = await seed({ role: "admin" }), actions = as(inviter);
    const results = await Promise.all(Array.from({ length: 12 }, (_, i) => invite(actions, { email: `burst-${i}@example.test` })));
    assert.equal(results.filter(result => result.ok).length, 10);
    assert.equal((await one("SELECT count(*)::int AS n FROM staff_users WHERE email LIKE 'burst-%@example.test'")).n, 10);
    assert.equal((await one("SELECT count(*)::int AS n FROM staff_team_audit WHERE actor_id=$1 AND action='invited'", [inviter.id])).n, 10);
    assert.ok(results.filter(result => !result.ok).every(result => /dix invitations/.test(result.message)));
  });

  await t.test("audit failure rolls back the account mutation and session revocation", async () => {
    const target = await seed(); await session(target.id);
    const before = await account(target.id), sessionsBefore = (await sessions(target.id)).n;
    await pg.exec(`ALTER TABLE staff_team_audit ADD CONSTRAINT test_reject_audit CHECK(target_id <> ${target.id}) NOT VALID`);
    try {
      const result = await manage(adminActions, target.id, "disable"); assert.equal(result.ok, false);
      assert.equal((await account(target.id)).enabled, true); assert.equal((await account(target.id)).version, before.version);
      assert.equal((await sessions(target.id)).n, sessionsBefore);
    } finally { await pg.exec("ALTER TABLE staff_team_audit DROP CONSTRAINT test_reject_audit"); }
  });

  await t.test("team data excludes password and token material while reflecting stored state", async () => {
    await pg.query("DELETE FROM staff_sessions WHERE user_id=$1", [advisor.id]);
    await session(advisor.id);
    await pg.query("INSERT INTO staff_sessions(token_hash,user_id,expires_at) VALUES($1,$2,now()-interval '1 hour')", [hash("expired-session"), advisor.id]);
    const data = await adminActions.getTeamManagementData();
    const displayedAdvisor = data.members.find(member => member.id === advisor.id);
    assert.equal(displayedAdvisor.activeSessions, 1); assert.equal(displayedAdvisor.hasPassword, true);
    const counts = await one("SELECT count(*) FILTER (WHERE deleted_at IS NULL)::int AS total, count(*) FILTER (WHERE enabled AND deleted_at IS NULL)::int AS active, count(*) FILTER (WHERE enabled AND deleted_at IS NULL AND role='admin')::int AS admins, count(*) FILTER (WHERE deleted_at IS NOT NULL)::int AS deleted FROM staff_users");
    for (const [name, count] of Object.entries(counts)) assert.equal(data.stats[name], count);
    const serialized = JSON.stringify(data);
    for (const secret of [storedPassword, passwords.DUMMY_PASSWORD_HASH, pendingToken, hash(pendingToken), "fake-mail-key"]) assert.equal(serialized.includes(secret), false);
    assert.doesNotMatch(serialized, /passwordHash|password_hash|tokenHash|token_hash/);
    assert.ok(serialized.includes("new@example.test")); assert.ok(serialized.includes("Responsable suivi"));
    assert.ok(invalidations.includes("/admin/equipe"));
  });
});
