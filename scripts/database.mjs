import dotenv from "dotenv";
import pg from "pg";
dotenv.config({ path: [".env.local", ".env"], quiet: true });
export function createClient() {
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL ou DATABASE_URL_UNPOOLED est nécessaire.");
  return new pg.Client({ connectionString, connectionTimeoutMillis: 15000 });
}
export function safeDatabaseError(error) {
  // Never log the connection URL, query parameters, passwords or database detail.
  return typeof error?.code === "string" && /^[A-Z0-9_]{2,40}$/.test(error.code) ? error.code : "DATABASE_UNAVAILABLE";
}
