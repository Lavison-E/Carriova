import Link from "next/link";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { PageHero } from "@/components/layout/PageHero";
import { JsonLd, Section } from "@/components/ui/primitives";
import { serverEnv } from "@/lib/env";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Support et assistance",
  description: "Retrouvez votre accès CARRIOVA, suivez une demande ou contactez notre assistance.",
  path: "/support",
});

export default function SupportPage() {
  const supportEmail = serverEnv.SUPPORT_EMAIL || serverEnv.CONTACT_EMAIL;
  const crumbs = [{ href: "/", label: "Accueil" }, { href: "/support", label: "Support" }];
  return <>
    <JsonLd data={breadcrumbJsonLd(crumbs.map((crumb) => ({ name: crumb.label, path: crumb.href })))} />
    <PageHero eyebrow="À vos côtés" title="Un coup de main pour avancer." text="Un accès à retrouver, une demande à suivre ou une question à poser. Choisissez le chemin qui correspond à votre besoin." crumbs={crumbs} />
    <Section tone="paper" className="!pt-2 md:!pt-4">
      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <article className="flex min-w-0 flex-col rounded-xl border border-line bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-orange">01 / Mon accès</span><CareerIcon name="compass" className="h-6 w-6 text-night" /></div>
          <h2 className="mt-7 text-2xl font-semibold leading-tight tracking-tight text-night">Je n’arrive pas à me connecter.</h2>
          <p className="mb-7 mt-4 text-sm leading-7 text-muted">Mot de passe oublié ? Demandez un lien de réinitialisation à l’adresse e-mail de votre compte.</p>
          <Link href="/compte/recuperer" className="mt-auto inline-flex min-h-12 items-center justify-between gap-5 rounded-lg border border-night px-4 py-3 text-xs font-semibold text-night hover:bg-paper">Retrouver mon accès <CareerIcon name="arrow" className="h-4 w-4 shrink-0" /></Link>
        </article>
        <article className="flex min-w-0 flex-col rounded-xl border border-line bg-white p-6 sm:p-8">
          <div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-orange">02 / Ma demande</span><CareerIcon name="briefcase" className="h-6 w-6 text-night" /></div>
          <h2 className="mt-7 text-2xl font-semibold leading-tight tracking-tight text-night">Je souhaite faire le point sur mon dossier.</h2>
          <p className="mb-7 mt-4 text-sm leading-7 text-muted">Consultez l’avancement, retrouvez vos documents et écrivez à l’équipe depuis la conversation de votre demande.</p>
          <Link href="/espace/demandes" className="mt-auto inline-flex min-h-12 items-center justify-between gap-5 rounded-lg border border-night px-4 py-3 text-xs font-semibold text-night hover:bg-paper">Ouvrir mes demandes <CareerIcon name="arrow" className="h-4 w-4 shrink-0" /></Link>
        </article>
        <article className="flex min-w-0 flex-col rounded-xl bg-night p-6 text-white sm:p-8">
          <div className="flex items-center justify-between"><span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#f7bd92]">03 / Une autre question</span><CareerIcon name="letter" className="h-6 w-6" /></div>
          <h2 className="mt-7 text-2xl font-semibold leading-tight tracking-tight">J’ai besoin d’assistance.</h2>
          <p className="mt-4 text-sm leading-7 text-white/75">Une difficulté technique ou une information à corriger ? Expliquez-nous la situation par e-mail.</p>
          <p className="mb-7 mt-4 break-all text-xs leading-6 text-white/75">{supportEmail}</p>
          <a href={`mailto:${supportEmail}`} className="mt-auto inline-flex min-h-12 items-center justify-between gap-5 rounded-lg bg-orange px-4 py-3 text-xs font-semibold text-white hover:bg-[#9e3708]">Écrire au support <CareerIcon name="arrow" className="h-4 w-4 shrink-0" /></a>
        </article>
      </div>
      <div className="mt-8 flex flex-col gap-5 border-t border-night/15 pt-7 sm:mt-10 sm:flex-row sm:items-start sm:justify-between"><p className="max-w-2xl text-xs leading-7 text-muted">Pour nous aider à retrouver votre dossier, indiquez l’adresse e-mail de votre compte et, si vous en avez un, le numéro de votre demande.</p><Link href="/faq" className="inline-flex min-h-10 shrink-0 items-center gap-4 text-xs font-semibold text-night hover:text-orange">Consulter les questions fréquentes <CareerIcon name="arrow" className="h-4 w-4" /></Link></div>
    </Section>
  </>;
}
