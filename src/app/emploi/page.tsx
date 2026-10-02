import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { Badge, ButtonLink, Card, JsonLd, Section } from "@/components/ui/primitives";
import { getJobFacets, getPublishedJobs } from "@/lib/queries";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Emploi et opportunités",
  description:
    "Explorez les opportunités CARRIOVA par lieu, secteur, contrat et expérience. Reliez chaque offre à un CV ou une candidature adaptée.",
  path: "/emploi",
  keywords: ["offres d’emploi", "emploi Abidjan", "recherche d’emploi Côte d’Ivoire"],
});

type Search = {
  q?: string;
  location?: string;
  industry?: string;
  contractType?: string;
  experience?: string;
  workMode?: string;
};

export default async function EmploiPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const params = await searchParams;
  const [jobs, facets] = await Promise.all([getPublishedJobs(params), getJobFacets()]);
  const crumbs = [
    { href: "/", label: "Accueil" },
    { href: "/emploi", label: "Emploi & Opportunités" },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href })))} />
      <PageHero
        eyebrow="Emploi & opportunités"
        title="Des offres à lire avec méthode, pas à postuler en masse."
        text="Filtrez par lieu, secteur, expérience et type de contrat. Chaque fiche peut relier vers un CV adapté ou une candidature plus juste."
        primary={{ href: "/solutions/cv", label: "Créer mon CV" }}
        secondary={{ href: "/solutions/matching", label: "Comprendre le matching" }}
        crumbs={crumbs}
      />
      <Section>
        <p className="mb-6 text-sm text-muted">
          Les fiches publiées ici sont gérées dans CARRIOVA. Elles illustrent le parcours offre → CV →
          candidature. Vérifiez toujours la date de mise à jour avant de postuler.
        </p>
        <form className="grid gap-3 rounded-3xl border border-line bg-paper p-5 md:grid-cols-6" method="get">
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Mot-clé, métier, compétence"
            className="h-11 rounded-xl border border-line bg-white px-3 text-sm md:col-span-2"
            aria-label="Recherche"
          />
          <select name="location" defaultValue={params.location ?? ""} className="h-11 rounded-xl border border-line bg-white px-3 text-sm" aria-label="Lieu">
            <option value="">Lieu</option>
            {facets.locations.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select name="industry" defaultValue={params.industry ?? ""} className="h-11 rounded-xl border border-line bg-white px-3 text-sm" aria-label="Secteur">
            <option value="">Secteur</option>
            {facets.industries.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select name="contractType" defaultValue={params.contractType ?? ""} className="h-11 rounded-xl border border-line bg-white px-3 text-sm" aria-label="Contrat">
            <option value="">Contrat</option>
            {facets.contractTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <button type="submit" className="h-11 rounded-full bg-bright text-sm font-semibold text-white">
            Filtrer
          </button>
        </form>

        <div className="mt-8 grid gap-5">
          {jobs.length === 0 ? (
            <Card>
              <h2 className="text-xl font-bold text-night">Aucune offre ne correspond à ces filtres pour le moment.</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Les opportunités sont publiées lorsqu’elles sont validées. Vous pouvez créer votre CV, activer une
                alerte via le contact, ou explorer le coaching en attendant.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <ButtonLink href="/solutions/cv">Créer mon CV</ButtonLink>
                <ButtonLink href="/contact" variant="secondary">
                  Demander une alerte emploi
                </ButtonLink>
              </div>
            </Card>
          ) : (
            jobs.map((job) => (
              <Link key={job.slug} href={`/emploi/${job.slug}`}>
                <Card className="transition hover:border-bright">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{job.contractType}</Badge>
                    {job.workMode ? <Badge tone="orange">{job.workMode}</Badge> : null}
                    {job.industry ? <Badge tone="navy">{job.industry}</Badge> : null}
                  </div>
                  <h2 className="mt-4 text-2xl font-bold text-night">{job.title}</h2>
                  <p className="mt-1 text-sm text-muted">
                    {job.company} · {job.location} · {job.country}
                  </p>
                  <p className="mt-3 max-w-3xl text-sm leading-6 text-muted">{job.description}</p>
                  <p className="mt-4 text-xs text-bright">Voir l’offre →</p>
                </Card>
              </Link>
            ))
          )}
        </div>
      </Section>
    </>
  );
}
