import type { Metadata } from "next";
import Link from "next/link";
import { CustomerPasswordForm } from "@/components/forms/CustomerAuthForms";
import { WorkspaceHeading, WorkspaceUnavailable } from "@/components/workspace/WorkspaceUi";
import { loadWorkspaceData } from "@/components/workspace/WorkspaceData";
import { requireCustomer } from "@/lib/customer-auth";
import { customerLogout } from "@/lib/customer-actions";

export const metadata: Metadata = { title: "Mon compte" };

export default async function AccountPage() {
  const result = await loadWorkspaceData(requireCustomer);
  if (!result) return <WorkspaceUnavailable href="/espace/compte" />;
  const customer = result.data;
  return <><WorkspaceHeading eyebrow="Votre compte" title="Un espace à votre nom." text="Retrouvez les informations de votre compte et gérez votre mot de passe." /><div className="grid items-start gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"><section className="rounded-xl border border-line bg-white p-5 sm:p-7"><h2 className="text-lg font-semibold tracking-tight text-night">Vos informations</h2><dl className="mt-6 space-y-6"><div><dt className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted">Nom et prénom</dt><dd className="mt-2 break-words text-sm font-medium text-night">{customer.name}</dd></div><div><dt className="text-[10px] font-medium uppercase tracking-[0.1em] text-muted">Adresse e-mail</dt><dd className="mt-2 break-all text-sm font-medium text-night">{customer.email}</dd></div></dl><div className="mt-7 border-t border-line pt-6"><p className="text-xs leading-7 text-muted">Pour corriger une information ou exercer vos droits sur vos données, contactez notre équipe.</p><Link href="/support" className="mt-3 inline-flex min-h-10 items-center text-xs font-semibold text-orange">Ouvrir le support →</Link></div><form action={customerLogout} className="mt-6 border-t border-line pt-6"><button className="inline-flex min-h-11 items-center rounded-lg border border-line px-4 text-xs font-semibold text-night hover:bg-paper">Me déconnecter</button></form></section><section className="rounded-xl border border-line bg-white p-5 sm:p-7"><h2 className="text-lg font-semibold tracking-tight text-night">Changer de mot de passe</h2><p className="mb-6 mt-3 text-xs leading-7 text-muted">Choisissez un mot de passe personnel que vous n’utilisez pas sur un autre service.</p><CustomerPasswordForm /></section></div></>;
}
