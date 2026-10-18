import Link from "next/link";
import { Logo } from "@/components/brand/Logo";
import { StaffActivationForm } from "@/components/admin/StaffActivationForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Activer mon accès équipe | Carriova", robots: { index: false, follow: false }, referrer: "no-referrer" as const };
export default async function StaffActivationPage({ searchParams }: { searchParams: Promise<{ token?: string | string[] }> }) {
  const params = await searchParams;
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const validFormat = typeof token === "string" && /^[A-Za-z0-9_-]{43}$/.test(token);
  return <div className="grid min-h-screen bg-paper lg:grid-cols-[1fr_1.1fr]">
    <div className="flex flex-col justify-between bg-night p-8 text-white sm:p-12 lg:p-16"><Logo variant="light" /><div className="my-12 max-w-md"><p className="text-xs uppercase tracking-[0.2em] text-gold">Carriova · L’équipe</p><h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">Accompagner chaque<br /><span className="font-editorial font-normal italic text-gold">nouveau départ.</span></h1><p className="mt-6 text-sm leading-7 text-white/70">Rejoignez votre espace de travail pour suivre les demandes et accompagner les clients de Carriova.</p></div><Link href="/" className="text-sm text-white/75 hover:text-white">← Revenir au site</Link></div>
    <div className="flex items-center justify-center px-5 py-12 sm:px-10"><div className="w-full max-w-sm"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-orange">Votre invitation</p><h2 className="mt-4 text-3xl font-semibold tracking-tight text-night">Bienvenue dans l’équipe.</h2>{validFormat ? <><p className="mt-4 text-sm leading-7 text-muted">Choisissez votre mot de passe pour activer votre accès. Ce lien est valable 24 heures et s’utilise une seule fois.</p><StaffActivationForm token={token} /></> : <p role="alert" className="mt-6 rounded-lg border border-line bg-white p-5 text-sm leading-7 text-muted">Ouvrez le lien complet reçu par e-mail. Si votre invitation a expiré, demandez-en une nouvelle à votre administrateur.</p>}<Link href="/admin/connexion" className="mt-6 inline-flex min-h-10 items-center text-xs font-medium text-night underline underline-offset-4">Accéder à la connexion équipe</Link></div></div>
  </div>;
}
