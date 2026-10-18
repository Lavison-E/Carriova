import "server-only";
import { redirect } from "next/navigation";
import { CustomerUnauthorizedError } from "@/lib/customer-auth";

export async function loadWorkspaceData<T>(load: () => Promise<T>): Promise<{ data: T } | null> {
  try { return { data: await load() }; }
  catch (error) {
    if (error instanceof CustomerUnauthorizedError) redirect("/compte/connexion");
    return null;
  }
}
