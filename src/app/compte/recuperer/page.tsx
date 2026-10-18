import Link from "next/link";
import { CustomerRecoveryForm } from "@/components/forms/CustomerAuthForms";
import { CustomerAuthFrame } from "@/components/workspace/CustomerAuthFrame";
export const dynamic = "force-dynamic";
export const metadata = { title: "Récupérer mon accès CARRIOVA", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function RecoveryPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const params = await searchParams;
  const token = (Array.isArray(params.token) ? params.token[0] : params.token)?.slice(0, 2048);
  return <CustomerAuthFrame><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">Retrouver votre espace</p><h2 className="mt-3 text-2xl font-semibold tracking-tight text-night">{token ? "Un nouveau mot de passe" : "Mot de passe oublié ?"}</h2><p className="mb-7 mt-3 text-xs leading-6 text-muted">{token ? "Choisissez un nouveau mot de passe pour sécuriser votre accès." : "Indiquez l’adresse e-mail de votre compte pour demander un lien de réinitialisation."}</p><CustomerRecoveryForm token={token} /><Link href="/compte/connexion" className="mt-6 inline-flex min-h-10 items-center text-xs font-medium text-night underline underline-offset-4">Retour à la connexion</Link></CustomerAuthFrame>;
}
