import Link from "next/link";
import { customerAuthHref, normalizeCustomerReturnTo } from "@/lib/customer-navigation";
import { redirect } from "next/navigation";
import { CustomerSignupForm } from "@/components/forms/CustomerAuthForms";
import { CustomerAuthFrame } from "@/components/workspace/CustomerAuthFrame";
import { getCustomerSession } from "@/lib/customer-auth";
export const dynamic = "force-dynamic";
export const metadata = { title: "Créer mon espace CARRIOVA", robots: { index: false, follow: false } };
function InvitationNotice({ value }: { value?: string | string[] }) {
  const state = Array.isArray(value) ? value[0] : value;
  if (state === "1") return <p role="status" className="mb-6 rounded-lg border border-[#c4d6c8] bg-[#edf4ee] px-4 py-3 text-xs leading-6 text-[#285236]">L’équipe CARRIOVA vous a invité à retrouver votre demande. Créez votre compte ou connectez-vous : votre dossier sera ajouté à votre espace pour échanger messages et documents.</p>;
  if (state === "invalide") return <p role="alert" className="mb-6 rounded-lg border border-orange/30 bg-[#fff7f0] px-4 py-3 text-xs leading-6 text-orange">Ce lien d’invitation n’est plus valide ou a déjà été utilisé. Créez votre compte ou connectez-vous, puis demandez un nouveau lien à l’équipe si votre dossier n’apparaît pas.</p>;
  if (state === "indisponible") return <p role="alert" className="mb-6 rounded-lg border border-orange/30 bg-[#fff7f0] px-4 py-3 text-xs leading-6 text-orange">Votre invitation n’a pas pu être vérifiée pour le moment. Réessayez d’ouvrir le lien dans un instant.</p>;
  return null;
}
export default async function CreateAccountPage({ searchParams }: { searchParams: Promise<{ returnTo?: string | string[]; invitation?: string | string[] }> }) {
  const query = await searchParams;
  const returnTo = normalizeCustomerReturnTo(query.returnTo);
  const session = await getCustomerSession().catch(() => null);
  if (session) redirect(returnTo ?? "/espace");
  return <CustomerAuthFrame signup><p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">Bienvenue chez vous</p><h2 className="mt-3 text-2xl font-semibold tracking-tight text-night">Créer mon compte</h2><p className="mb-7 mt-3 text-xs leading-6 text-muted">Un accès personnel pour suivre vos demandes et échanger avec l’équipe.</p><InvitationNotice value={query.invitation} /><CustomerSignupForm returnTo={returnTo} /><p className="mt-6 border-t border-line pt-5 text-center text-xs leading-6 text-muted">Déjà un compte ? <Link href={customerAuthHref(returnTo, "login")} className="font-semibold text-night underline underline-offset-4">Se connecter</Link></p></CustomerAuthFrame>;
}
