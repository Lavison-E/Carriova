import { readFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { pathToFileURL } from "node:url";
import { createClient, safeDatabaseError } from "./database.mjs";

const migrations = ["20261018_staff.sql", "20261018_crm.sql"];
export async function migrateCrm(client) {
  await client.query("BEGIN");
  try {
    await client.query("SET LOCAL lock_timeout = '15s'");
    await client.query("SET LOCAL statement_timeout = '60s'");
    await client.query("SELECT pg_advisory_xact_lock(71422018)");
    // Refuse an unrelated/empty database. Never replace the site's original tables.
    await client.query("SELECT id, first_name, email, whatsapp, source, consent_privacy, consent_marketing, created_at FROM leads LIMIT 0");
    await client.query("CREATE TABLE IF NOT EXISTS carriova_migrations (name text PRIMARY KEY, checksum varchar(64) NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())");
    const applied = [];
    for (const name of migrations) {
      const source = (await readFile(new URL("../migrations/" + name, import.meta.url), "utf8")).replace(/\r\n/g, "\n");
      const checksum = createHash("sha256").update(source).digest("hex");
      const previous = await client.query("SELECT checksum FROM carriova_migrations WHERE name = $1", [name]);
      if (previous.rows[0]) {
        if (previous.rows[0].checksum !== checksum) throw Object.assign(new Error("Migration changed"), { code: "MIGRATION_CHANGED" });
        continue;
      }
      await client.query(source);
      await client.query("INSERT INTO carriova_migrations(name, checksum) VALUES ($1, $2)", [name, checksum]);
      applied.push(name);
    }
    await client.query("COMMIT");
    return applied;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  let client;
  try {
    client = createClient();
    await client.connect();
    const applied = await migrateCrm(client);
    console.log(applied.length ? "[CRM] Migrations appliquées : " + applied.join(", ") : "[CRM] Schéma déjà à jour.");
  } catch (error) {
    console.error("[CRM] Migration interrompue (" + safeDatabaseError(error) + "). Vérifiez la connexion Neon et le schéma Carriova existant. Aucun secret n’est journalisé.");
    process.exitCode = 1;
  } finally { if (client) await client.end(); }
}
