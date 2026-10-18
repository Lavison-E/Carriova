import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";
import { WorkspaceUnavailable } from "@/components/workspace/WorkspaceUi";
import { getCustomerSession } from "@/lib/customer-auth";
export const dynamic = "force-dynamic";
export const metadata = { title: "Mon espace CARRIOVA", robots: { index: false, follow: false } };
export default async function CustomerLayout({ children }: { children: ReactNode }) {
  let customer;
  try { customer = await getCustomerSession(); }
  catch { return <WorkspaceShell customer={null}><WorkspaceUnavailable /></WorkspaceShell>; }
  if (!customer) redirect("/compte/connexion");
  return <WorkspaceShell customer={customer}>{children}</WorkspaceShell>;
}
