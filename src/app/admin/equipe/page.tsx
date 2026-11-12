import Link from "next/link";
import { redirect } from "next/navigation";
import { CrmShell } from "@/components/admin/CrmShell";
import { TeamManager } from "@/components/admin/TeamManager";
import { RefreshButton } from "@/components/workspace/RefreshButton";
import { requireStaff, UnauthorizedError } from "@/lib/staff-auth";
import { getTeamManagementData } from "@/lib/team-queries";

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const metadata = { title: "Gestion de l’équipe — Carriova", robots: { index: false, follow: false } };

function Unavailable() {
  return <section role="alert" className="rounded-xl border border-line bg-white p-6 sm:p-9">
    <h2 className="text-xl font-semibold">Les comptes ne peuvent pas être chargés.</h2>
    <p className="mt-3 max-w-xl text-sm leading-7 text-muted">Réessayez dans un instant. Aucune modification n’a été effectuée sur les accès de l’équipe.</p>
    <a href="/admin/equipe" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-night px-5 text-sm font-semibold text-white hover:bg-royal">Réessayer</a>
  </section>;
}

export default async function TeamPage() {
  let user;
  try { user = await requireStaff(); }
  catch (error) {
    if (error instanceof UnauthorizedError) redirect("/admin/connexion");
    return <CrmShell user={null} title="Votre équipe" section="team"><Unavailable /></CrmShell>;
  }
  if (user.role !== "admin") return <CrmShell user={user} title="Gestion des accès" section="team">
    <section className="rounded-xl border border-line bg-white p-6 sm:p-9">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-orange">Accès administrateur</p>
      <h2 className="mt-3 text-xl font-semibold">Cette page est réservée aux administrateurs.</h2>
      <p className="mt-3 max-w-xl text-sm leading-7 text-muted">Votre espace de travail reste disponible pour suivre les prospects, les commandes et les échanges clients. Contactez un administrateur pour modifier votre compte.</p>
      <Link href="/admin/crm" className="mt-6 inline-flex min-h-11 items-center rounded-lg bg-night px-5 text-sm font-semibold text-white hover:bg-royal">Retour à mon espace équipe</Link>
    </section>
  </CrmShell>;
  let data;
  try { data = await getTeamManagementData(); }
  catch (error) {
    if (error instanceof UnauthorizedError) redirect("/admin/connexion");
    return <CrmShell user={user} title="Votre équipe" section="team"><Unavailable /></CrmShell>;
  }
  return <CrmShell user={user} title="Les bonnes personnes. Les bons accès." section="team" description="Invitez vos collaborateurs, gérez leurs responsabilités et gardez la maîtrise des accès à Carriova." action={<RefreshButton />}>
    <TeamManager data={data} currentUserId={user.id} />
  </CrmShell>;
}
