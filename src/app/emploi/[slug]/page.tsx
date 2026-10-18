import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/PageHero";
import { Badge, ButtonLink, Card, JsonLd, Section, SectionHeader } from "@/components/ui/primitives";
import { getJobBySlug, getRelatedJobs } from "@/lib/job-catalog";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";
const date = (value: string) => new Date(value).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Abidjan" });
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  return buildMetadata({ title: job ? `${job.title} — ${job.company}` : "Offre indisponible", description: job?.description ?? "Cette offre n’est plus disponible dans notre sélection.", path: `/emploi/${slug}`, noindex: !job });
}
export default async function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) notFound();
  const related = await getRelatedJobs(job.slug, job.industry);
  const crumbs = [{ href: "/", label: "Accueil" }, { href: "/emploi", label: "Emploi" }, { href: `/emploi/${job.slug}`, label: job.title }];
  return <>
    <JsonLd data={breadcrumbJsonLd(crumbs.map(item => ({name: item.label, path: item.href})))} />
    <PageHero eyebrow={`${job.company} · ${job.location}`} title={job.title} text={job.description}
      primary={{ href: job.sourceUrl, label: "Postuler chez le recruteur" }} secondary={{ href: "/emploi", label: "Toutes les offres" }} crumbs={crumbs}>
      <div className="flex flex-wrap gap-2"><Badge>{job.contractType}</Badge>{job.industry ? <Badge tone="orange">{job.industry}</Badge> : null}{job.workMode ? <Badge>{job.workMode}</Badge> : null}</div>
      <p className="mt-5 text-xs leading-6 text-muted">Publication : {job.publishedAt ? date(job.publishedAt) : "date non communiquée"} · Vérification de la source : {date(job.verifiedAt)}</p>
    </PageHero>
    <Section>
      <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange">L’essentiel de l’offre</p>
          <h2 className="mt-3 text-2xl font-semibold text-night">Votre prochain poste, en un coup d’œil.</h2>
          <dl className="mt-7 grid gap-x-8 sm:grid-cols-2">
            {[["Employeur",job.company],["Lieu",`${job.location}, ${job.country}`],["Contrat",job.contractType],["Niveau",job.experience ?? "À consulter dans l’annonce"],["Référence",job.reference],["Clôture",job.expiresAt ? new Date(job.expiresAt).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short", timeZone: "Africa/Abidjan" }) + " (Abidjan)" : "Non communiquée par le recruteur"]].map(([label,value]) => <div key={label} className="border-b border-line py-4"><dt className="text-xs text-muted">{label}</dt><dd className="mt-1.5 text-sm font-medium leading-6 text-night">{value}</dd></div>)}
          </dl>
          <div className="mt-8 rounded-xl border border-line bg-paper p-6">
            <h3 className="text-lg font-semibold text-night">Les missions et le profil recherché</h3>
            <p className="mt-3 text-sm leading-7 text-muted">Consultez la fiche complète publiée par {job.company} pour connaître les missions, les compétences attendues, les documents demandés et les conditions du poste. L’annonce du recruteur fait référence si une information évolue.</p>
            <a href={job.sourceUrl} className="mt-5 inline-flex items-center gap-3 text-sm font-semibold text-night underline underline-offset-4">Lire l’annonce officielle <span aria-hidden="true">↗</span></a>
            <p className="mt-4 text-xs leading-6 text-muted">Source : {job.sourceName}. Carriova référence cette offre et ne représente pas cet employeur. La candidature s’effectue directement sur son site.</p>
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-night">Pour préparer votre candidature</h3>
            <ol className="mt-4 space-y-3 text-sm leading-7 text-muted"><li>1. Vérifiez les missions et les conditions sur la page du recruteur.</li><li>2. Adaptez votre CV aux compétences que vous pouvez démontrer.</li><li>3. Envoyez votre candidature par le canal officiel et conservez sa référence.</li></ol>
          </div>
        </div>
        <Card className="lg:sticky lg:top-28">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-orange">À vous de jouer</p>
          <h2 className="mt-3 text-xl font-semibold text-night">Cette offre vous intéresse ?</h2>
          <p className="mt-3 text-sm leading-7 text-muted">Accédez à la candidature officielle. Aucun compte Carriova ni achat de service n’est nécessaire.</p>
          <ButtonLink href={job.sourceUrl} className="mt-6 w-full" variant="orange">Postuler chez le recruteur ↗</ButtonLink>
          <div className="mt-7 border-t border-line pt-6"><h3 className="text-sm font-semibold text-night">Besoin d’un regard sur votre CV ?</h3><p className="mt-2 text-sm leading-7 text-muted">L’équipe Carriova peut vous accompagner sur demande. Cet accompagnement est facultatif et fait l’objet d’un devis.</p><ButtonLink href="/qualification?need=targeted_cv" variant="secondary" className="mt-4 w-full">Faire adapter mon CV</ButtonLink></div>
        </Card>
      </div>
    </Section>
    {related.length ? <Section tone="paper"><SectionHeader eyebrow="À explorer aussi" title="D’autres opportunités" /><div className="mt-8 grid gap-4 md:grid-cols-3">{related.map(item => <Link key={item.slug} href={`/emploi/${item.slug}`} className="rounded-xl border border-line bg-white p-6 transition-colors hover:border-night"><p className="text-xs text-muted">{item.company}</p><h3 className="mt-3 font-semibold leading-7 text-night">{item.title}</h3><p className="mt-3 text-sm text-muted">{item.location} · {item.contractType}</p><p className="mt-5 text-sm font-semibold text-orange">Voir l’offre →</p></Link>)}</div></Section> : null}
  </>;
}
