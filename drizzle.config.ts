import "dotenv/config";
import { defineConfig } from "drizzle-kit";

const databaseUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("Set DATABASE_URL or DATABASE_URL_UNPOOLED before running Drizzle Kit.");
}

export default defineConfig({
  dialect: "postgresql",
  schema: ["./src/db/schema.ts", "./src/db/crm-schema.ts", "./src/db/staff-schema.ts", "./src/db/customer-schema.ts", "./src/db/workspace-schema.ts", "./src/db/staff-invite-schema.ts", "./src/db/notification-schema.ts", "./src/db/cv-schema.ts", "./src/db/career-profile-schema.ts"],
  out: "./drizzle",
  dbCredentials: { url: databaseUrl },
});
