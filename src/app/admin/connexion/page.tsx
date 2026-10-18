import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import { StaffLoginForm } from "@/components/admin/StaffLoginForm";
import { getStaffSession } from "@/lib/staff-auth";
export default async function StaffLoginPage() {
  const user = await getStaffSession().catch(() => null);
  if (user) redirect("/admin/crm");
  return <div className="grid min-h-screen bg-paper lg:grid-cols-[1fr_1.1fr]">
    <div className="flex flex-col justify-between bg-night p-8 text-white sm:p-12 lg:p-16"><Logo variant="light" /><div className="my-12 max-w-md"><p className="text-xs uppercase tracking-[0.2em] text-gold">Carriova · Espace équipe</p><h1 className="mt-6 text-4xl font-semibold leading-tight tracking-tight lg:text-5xl">Chaque échange<br />est un <span className="font-editorial font-normal italic text-gold">point de départ.</span></h1><p className="mt-6 text-sm leading-7 text-white/70">Retrouvez les demandes, préparez vos prochaines actions et accompagnez chaque parcours avec attention.</p></div><Link href="/" className="text-sm text-white/75 hover:text-white">← Revenir au site Carriova</Link></div>
    <div className="flex items-center justify-center px-5 py-12 sm:px-10"><div className="w-full max-w-sm"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-orange">Votre espace de travail</p><h2 className="mt-4 text-3xl font-semibold tracking-tight text-night">Content de vous retrouver.</h2><p className="mt-4 text-sm leading-7 text-muted">Connectez-vous pour retrouver le suivi des prospects et vos relances.</p><StaffLoginForm /></div></div>
  </div>;
}
