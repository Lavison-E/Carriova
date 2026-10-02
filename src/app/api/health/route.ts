import { sql } from "drizzle-orm";
import { db } from "@/db";
import { envStatus } from "@/lib/env";

export const dynamic = "force-dynamic";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  const env = envStatus();
  try {
    await db.execute(sql`select 1`);
    return Response.json({ ok: true, database: "up", env }, { headers: noStore });
  } catch {
    return Response.json(
      { ok: false, database: "down", env },
      { status: 500, headers: noStore },
    );
  }
}
