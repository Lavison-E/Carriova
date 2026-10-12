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

type FilterKey = "q" | "location" | "industry" | "contractType" | "experience" | "workMode";
type Search = Partial<Record<FilterKey, string | string[]>>;

function firstValue(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim().slice(0, 160) ?? "";
}

export default async function EmploiPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const raw = await searchParams;
  const params = {
    q: firstValue(raw.q),
    location: firstValue(raw.location),
    industry: firstValue(raw.industry),
    contractType: firstValue(raw.contractType),
    experience: firstValue(raw.experience),
    workMode: firstValue(raw.workMode),
  };
  const hasFilters = Object.values(params).some(Boolean);
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
        title="Trouvez une opportunité qui vous correspond."
        text="Un métier, un lieu, une nouvelle ambition. Affinez votre recherche et préparez une candidature adaptée à chaque opportunité."
        primary={{ href: "/solutions/cv", label: "Créer mon CV" }}
        secondary={{ href: "/solutions/matching", label: "Comprendre le matching" }}
        crumbs={crumbs}
      />
      <Section>
        <p className="mb-6 text-sm text-muted">
          Les fiches publiées ici sont gérées dans CARRIOVA. Elles illustrent le parcours offre → CV →
          candidature. Vérifiez toujours la date de mise à jour avant de postuler.
        </p>
        <form className="grid gap-3 rounded-3xl border border-line bg-paper p-5 sm:grid-cols-2 lg:grid-cols-3" method="get" action="/emploi" role="search" aria-label="Filtrer les offres d’emploi">
          <input
            name="q"
            defaultValue={params.q ?? ""}
            placeholder="Mot-clé, métier, compétence"
            className="h-11 min-w-0 rounded-xl border border-line bg-white px-3 text-sm md:col-span-2"
            aria-label="Recherche"
            maxLength={160}
          />
          <select name="location" defaultValue={params.location ?? ""} className="h-11 min-w-0 rounded-xl border border-line bg-white px-3 text-sm" aria-label="Lieu">
            <option value="">Lieu</option>
            {params.location && !facets.locations.includes(params.location) ? <option value={params.location}>{params.location} (filtre actif)</option> : null}
            {facets.locations.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select name="industry" defaultValue={params.industry ?? ""} className="h-11 min-w-0 rounded-xl border border-line bg-white px-3 text-sm" aria-label="Secteur">
            <option value="">Secteur</option>
            {params.industry && !facets.industries.includes(params.industry) ? <option value={params.industry}>{params.industry} (filtre actif)</option> : null}
            {facets.industries.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select name="contractType" defaultValue={params.contractType ?? ""} className="h-11 min-w-0 rounded-xl border border-line bg-white px-3 text-sm" aria-label="Contrat">
            <option value="">Contrat</option>
            {params.contractType && !facets.contractTypes.includes(params.contractType) ? <option value={params.contractType}>{params.contractType} (filtre actif)</option> : null}
            {facets.contractTypes.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <select name="experience" defaultValue={params.experience} className="h-11 min-w-0 rounded-xl border border-line bg-white px-3 text-sm" aria-label="Expérience">
            <option value="">Toute expérience</option>
            {params.experience && !facets.experiences.includes(params.experience) ? <option value={params.experience}>{params.experience} (filtre actif)</option> : null}
            {facets.experiences.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <select name="workMode" defaultValue={params.workMode} className="h-11 min-w-0 rounded-xl border border-line bg-white px-3 text-sm" aria-label="Mode de travail">
            <option value="">Tous les modes de travail</option>
            {params.workMode && !facets.workModes.includes(params.workMode) ? <option value={params.workMode}>{params.workMode} (filtre actif)</option> : null}
            {facets.workModes.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
          <button type="submit" className="h-11 rounded-full bg-bright text-sm font-semibold text-white">
            Rechercher
          </button>
        </form>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-night">{jobs.length} opportunité{jobs.length > 1 ? "s" : ""}{hasFilters ? " pour votre recherche" : " disponible" + (jobs.length > 1 ? "s" : "")}</h2>
          {hasFilters ? <Link href="/emploi" className="text-sm font-semibold text-bright underline underline-offset-4">Effacer les filtres</Link> : null}
        </div>
        <div className="mt-5 grid gap-5">
          {jobs.length === 0 ? (
            <Card>
              <h2 className="text-xl font-bold text-night">{hasFilters ? "Aucune offre ne correspond à votre recherche." : "Les prochaines opportunités arrivent ici."}</h2>
              <p className="mt-3 text-sm leading-6 text-muted">
                Les opportunités sont publiées lorsqu’elles sont validées. Vous pouvez créer votre CV, activer une
                alerte via le contact, ou explorer le coaching en attendant.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                {hasFilters ? <ButtonLink href="/emploi">Voir toutes les offres</ButtonLink> : <ButtonLink href="/solutions/cv">Préparer mon CV</ButtonLink>}
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
