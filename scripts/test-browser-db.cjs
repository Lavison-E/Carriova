// Explicitly opt-in, in-memory PostgreSQL for local browser checks. Never connects to Neon.
if (process.env.CARRIOVA_LOCAL_TEST_DB !== "1" || process.env.VERCEL) throw new Error("Local test database only; set CARRIOVA_LOCAL_TEST_DB=1.");
const { PGlite } = require("@electric-sql/pglite");
const { PGLiteSocketServer } = require("@electric-sql/pglite-socket");
const { generateDrizzleJson, generateMigration } = require("drizzle-kit/api");
const { loadTypeScript, migrationClient } = require("../tests/helpers/crm-fixture.cjs");

(async () => {
 const db = new PGlite();
 const empty = generateDrizzleJson({});
 const schema = generateDrizzleJson(loadTypeScript("src/db/schema.ts"), empty.id);
 for (const statement of await generateMigration(empty, schema)) await db.exec(statement);
 const { migrateCrm } = await import("./migrate-crm.mjs");
 await migrateCrm(migrationClient(db));
 const { hashPassword } = await import("../src/lib/staff-password.mjs");
 const passwordHash = await hashPassword("Local-Carriova-Test-2026");
 await db.query("INSERT INTO staff_users(email,name,password_hash,role) VALUES($1,$2,$3,$4)", ["demo@example.test","Conseiller de test",passwordHash,"advisor"]);
 const server = new PGLiteSocketServer({db,host:"127.0.0.1",port:55432,maxConnections:10});
 await server.start();
 console.log("Local ephemeral database ready at 127.0.0.1:55432. Test account: demo@example.test. Password in this local test script only.");
 async function stop(){await server.stop();await db.close();process.exit(0);}
 process.on("SIGINT", stop);process.on("SIGTERM",stop);
})().catch(() => { console.error("Local test database failed to start."); process.exitCode=1; });
