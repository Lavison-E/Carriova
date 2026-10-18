import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerSignupForm } from "@/components/forms/CustomerAuthForms";
import { CustomerAuthFrame } from "@/components/workspace/CustomerAuthFrame";
import { getCustomerSession } from "@/lib/customer-auth";
export const dynamic = "force-dynamic";
export const metadata = { title: "Créer mon espace CARRIOVA", robots: { index: false, follow: false } };
export default async function CreateAccountPage() {
  const session = await getCustomerSession().catch(() => null);
  if (session) redirect("/espace");
  return <CustomerAuthFrame signup><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">Bienvenue chez vous</p><h2 className="mt-3 text-2xl font-semibold tracking-tight text-night">Créer mon compte</h2><p className="mb-7 mt-3 text-xs leading-6 text-muted">Un accès personnel pour suivre vos demandes et échanger avec l’équipe.</p><CustomerSignupForm /><p className="mt-6 border-t border-line pt-5 text-center text-xs leading-6 text-muted">Déjà un compte ? <Link href="/compte/connexion" className="font-semibold text-night underline underline-offset-4">Se connecter</Link></p></CustomerAuthFrame>;
}
