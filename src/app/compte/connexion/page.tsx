import Link from "next/link";
import { redirect } from "next/navigation";
import { CustomerLoginForm } from "@/components/forms/CustomerAuthForms";
import { CustomerAuthFrame } from "@/components/workspace/CustomerAuthFrame";
import { getCustomerSession } from "@/lib/customer-auth";
export const dynamic = "force-dynamic";
export const metadata = { title: "Connexion à mon espace CARRIOVA", robots: { index: false, follow: false } };
export default async function LoginPage() {
  const session = await getCustomerSession().catch(() => null);
  if (session) redirect("/espace");
  return <CustomerAuthFrame><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">Heureux de vous retrouver</p><h2 className="mt-3 text-2xl font-semibold tracking-tight text-night">Se connecter</h2><p className="mb-7 mt-3 text-xs leading-6 text-muted">Utilisez l’adresse e-mail et le mot de passe de votre compte.</p><CustomerLoginForm /><p className="mt-6 border-t border-line pt-5 text-center text-xs leading-6 text-muted">Votre première visite ? <Link href="/compte/creer" className="font-semibold text-night underline underline-offset-4">Créer mon espace</Link></p></CustomerAuthFrame>;
}
