import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { serverEnv } from "@/lib/env";
import * as schema from "./schema";

export const databaseConfigured = Boolean(serverEnv.DATABASE_URL);

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
};

function createDatabase() {
  if (!databaseConfigured) {
    throw new Error("DATABASE_URL is required to access PostgreSQL.");
  }

  const pool =
    globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool({
      connectionString: serverEnv.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });

  if (!serverEnv.isProduction) {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
  }
  return drizzle(pool, { schema });
}

let database: ReturnType<typeof createDatabase> | undefined;

// Initialisation à la première requête : les pages statiques restent accessibles sans base.
export function getDb() {
  return (database ??= createDatabase());
}
