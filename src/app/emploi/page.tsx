import { JobFilters } from "@/components/jobs/JobFilters";
import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { ButtonLink, JsonLd, Section } from "@/components/ui/primitives";
import { getJobFacets, getOpportunityCatalog, getPublishedJobs } from "@/lib/job-catalog";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Emploi et opportunités",
  description:
    "Explorez les opportunités CARRIOVA par lieu, secteur, contrat et expérience. Reliez chaque offre à un CV ou une candidature adaptée.",
  path: "/emploi",
  keywords: ["offres d’emploi", "emploi Abidjan", "recherche d’emploi Côte d’Ivoire"],
});

type FilterKey = "q" | "location" | "country" | "industry" | "contractType" | "experience" | "workMode";
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
    country: firstValue(raw.country),
    industry: firstValue(raw.industry),
    contractType: firstValue(raw.contractType),
    experience: firstValue(raw.experience),
    workMode: firstValue(raw.workMode),
  };
  const hasFilters = Object.values(params).some(Boolean);
  const [jobs, facets, catalog] = await Promise.all([getPublishedJobs(params), getJobFacets(), getOpportunityCatalog()]);
  const filters = [
    { name: "country", label: "Pays", placeholder: "Tous les pays", options: facets.countries },
    { name: "location", label: "Lieu", placeholder: "Tous les lieux", options: facets.locations },
    { name: "industry", label: "Secteur", placeholder: "Tous les secteurs", options: facets.industries },
    { name: "contractType", label: "Contrat", placeholder: "Tous les contrats", options: facets.contractTypes },
    { name: "experience", label: "Expérience", placeholder: "Toute expérience", options: facets.experiences },
    { name: "workMode", label: "Mode de travail", placeholder: "Tous les modes", options: facets.workModes },
  ] as const;
  const activeFilters = Object.entries(params).filter(([, value]) => value);
  function withoutFilter(name: string) {
    const remaining = new URLSearchParams(activeFilters.filter(([key]) => key !== name));
    return remaining.size ? `/emploi?${remaining.toString()}` : "/emploi";
  }
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
        primary={{ href: `/emploi${activeFilters.length ? "?" + new URLSearchParams(activeFilters).toString() : ""}#offres`, label: "Explorer les offres" }}
        secondary={{ href: "/qualification?need=targeted_cv", label: "Faire adapter mon CV" }}
        crumbs={crumbs}
      />
      <Section id="offres" tone="paper" className="!pt-10 md:!pt-14 scroll-mt-24">
        <div className="grid items-start gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-10">
          <aside className="lg:sticky lg:top-28"><JobFilters activeCount={activeFilters.length}>
            <form key={JSON.stringify(params)}
              className="rounded-xl border border-line bg-white p-5 sm:p-6"
              method="get"
              action="/emploi"
              role="search"
              aria-label="Filtrer les offres d’emploi"
            >
              <div className="mb-6 flex items-center gap-3 border-b border-line pb-5">
                <svg className="h-5 w-5 text-[#bd470d]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="M4 7h16M4 17h16M9 4v6M15 14v6" />
                </svg>
                <h2 className="text-base font-semibold text-night">Votre recherche</h2>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label htmlFor="job-search" className="mb-2 block text-sm font-medium text-night">Métier ou mot-clé</label>
                  <div className="relative">
                    <svg className="pointer-events-none absolute left-3.5 top-3.5 h-5 w-5 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                      <circle cx="10.5" cy="10.5" r="6.5" /><path d="m16 16 4.5 4.5" />
                    </svg>
                    <input
                      id="job-search"
                      name="q"
                      defaultValue={params.q}
                      placeholder="Ex. commercial, finance…"
                      className="h-12 w-full min-w-0 rounded-lg border border-line bg-[#fcfbf8] pl-11 pr-3 text-sm text-night outline-none transition-colors placeholder:text-muted focus:border-night focus:ring-2 focus:ring-night/10"
                      maxLength={160}
                    />
                  </div>
                </div>
                {filters.map((filter) => (
                  <div key={filter.name}>
                    <label htmlFor={`job-${filter.name}`} className="mb-2 block text-sm font-medium text-night">{filter.label}</label>
                    <select
                      id={`job-${filter.name}`}
                      name={filter.name}
                      defaultValue={params[filter.name]}
                      className="h-12 w-full min-w-0 rounded-lg border border-line bg-[#fcfbf8] px-3 text-sm text-night outline-none transition-colors focus:border-night focus:ring-2 focus:ring-night/10"
                    >
                      <option value="">{filter.placeholder}</option>
                      {params[filter.name] && !filter.options.includes(params[filter.name]) ? (
                        <option value={params[filter.name]}>{params[filter.name]} (filtre actif)</option>
                      ) : null}
                      {filter.options.map((item) => <option key={item} value={item}>{item}</option>)}
                    </select>
                  </div>
                ))}
              </div>
              <button type="submit" className="mt-6 flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-night px-4 text-sm font-semibold text-white transition-colors hover:bg-[#162a61] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-night">
                Afficher les offres <span aria-hidden="true">→</span>
              </button>
              {hasFilters ? (
                <Link href="/emploi" className="mt-4 block py-1 text-center text-sm text-muted underline decoration-line underline-offset-4 hover:text-night">Réinitialiser les filtres</Link>
              ) : null}
            </form>
          </JobFilters></aside>

          <div className="min-w-0">
            <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#bd470d]">Les opportunités</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-night sm:text-3xl">
                  {jobs.length} offre{jobs.length > 1 ? "s" : ""}{hasFilters ? " trouvée" + (jobs.length > 1 ? "s" : "") : " disponible" + (jobs.length > 1 ? "s" : "")}
                </h2>
              </div>
              {jobs.length > 0 ? <p className="text-xs text-muted">Les plus récentes en premier</p> : null}
            </div>

            <div className="mt-5 rounded-lg border border-line bg-white p-4 text-xs leading-6 text-muted">
              <p>Offres issues des pages officielles des recruteurs. Candidature directe, sans achat de service Carriova.</p>
              {catalog.verifiedAt ? <p>Flux Accor consulté le {new Date(catalog.verifiedAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short", timeZone: "Africa/Abidjan" })} (Abidjan). Les dates de vérification des autres offres figurent sur leurs fiches. Une offre peut être retirée entre deux consultations.</p> : null}
              {catalog.unavailable ? <p role="status" className="mt-2 font-medium text-night">Une source est momentanément indisponible. La sélection affichée peut être incomplète ; réessayez plus tard.</p> : null}
            </div>

            {hasFilters ? (
              <div className="mt-5 flex flex-wrap gap-2" aria-label="Filtres actifs">
                {activeFilters.map(([name, value]) => (
                  <Link
                    key={name}
                    href={withoutFilter(name)}
                    aria-label={`Retirer le filtre ${name === "q" ? "mot-clé" : filters.find((filter) => filter.name === name)?.label} : ${value}`}
                    className="inline-flex max-w-full items-center gap-3 rounded-lg border border-line bg-white px-3 py-2 text-xs font-medium text-night transition-colors hover:border-night"
                  >
                    <span className="truncate">{value}</span><span className="text-muted" aria-hidden="true">×</span>
                  </Link>
                ))}
              </div>
            ) : null}

            {jobs.length === 0 ? (
              <div className="mt-6 rounded-xl border border-line bg-white px-6 py-12 sm:px-10 sm:py-16">
                <div className="mb-7 flex h-14 w-14 items-center justify-center rounded-xl border border-line bg-[#f7f5ef] text-night">
                  <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden="true">
                    <rect x="3" y="7" width="18" height="13" rx="2" /><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12a21 21 0 0 0 18 0M10 13h4" />
                  </svg>
                </div>
                <h3 className="max-w-md text-2xl font-semibold leading-tight tracking-tight text-night sm:text-3xl">
                  {hasFilters ? "La bonne opportunité reste à trouver." : "Votre prochaine opportunité se prépare."}
                </h3>
                <p className="mt-4 max-w-lg text-sm leading-7 text-muted">
                  {hasFilters
                    ? "Aucune offre ne correspond à ces critères pour le moment. Essayez un autre mot-clé ou élargissez votre recherche."
                    : "Aucune offre n’est publiée pour le moment. Profitez-en pour préparer votre candidature ou partager votre recherche avec notre équipe."}
                </p>
                <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:flex-wrap">
                  <ButtonLink href={hasFilters ? "/emploi" : "/solutions/cv"}>
                    {hasFilters ? "Élargir ma recherche" : "Préparer mon CV"}
                  </ButtonLink>
                  <ButtonLink href="/contact?objet=emploi" variant="secondary">Parler de ma recherche</ButtonLink>
                </div>
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {jobs.map((job) => (
                  <article key={job.slug}>
                    <Link href={`/emploi/${job.slug}`} className="group block rounded-xl border border-line bg-white p-6 transition-colors hover:border-night/40 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-night sm:p-7">
                      <div className="flex items-start justify-between gap-5">
                        <div className="min-w-0">
                          <p className="text-xs font-medium leading-5 text-muted">{job.company}</p><p className="mt-1 text-[0.65rem] uppercase tracking-wider text-[#bd470d]">Source : {job.sourceName}</p>
                          <h3 className="mt-2 text-xl font-semibold leading-snug tracking-tight text-night transition-colors group-hover:text-[#bd470d] sm:text-2xl">{job.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-muted">{job.location}, {job.country}{job.experience ? ` · ${job.experience}` : ""}</p>
                        </div>
                        <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-line text-night transition-colors group-hover:border-night group-hover:bg-night group-hover:text-white sm:flex" aria-hidden="true">↗</span>
                      </div>
                      <p className="mt-4 line-clamp-2 max-w-2xl text-sm leading-7 text-muted">{job.description}</p><p className="mt-2 text-xs text-muted">{job.publishedAt ? `Publiée le ${new Date(job.publishedAt).toLocaleDateString("fr-FR", {timeZone: "Africa/Abidjan"})}` : "Date de publication non précisée"}{job.expiresAt ? ` · Clôture le ${new Date(job.expiresAt).toLocaleDateString("fr-FR", {timeZone: "Africa/Abidjan"})}` : ""}</p>
                      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-5">
                        {[job.contractType, job.workMode, job.industry].filter(Boolean).map((label, index) => (
                          <span key={`${label}-${index}`} className="rounded-md bg-[#f7f5ef] px-2.5 py-1.5 text-xs font-medium text-night">{label}</span>
                        ))}
                        <span className="ml-auto py-1.5 text-xs font-semibold text-[#bd470d]">Voir l’offre <span aria-hidden="true">→</span></span>
                      </div>
                    </Link>
                  </article>
                ))}
              </div>
            )}

            <div className="mt-8 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-start sm:justify-between">
              <p className="max-w-md text-xs leading-6 text-muted">Une candidature ciblée fait la différence. Adaptez votre CV à l’offre et vérifiez les informations avant de postuler.</p>
              <Link href="/solutions/coaching" className="shrink-0 text-sm font-semibold text-night underline decoration-line underline-offset-4 hover:text-[#bd470d]">Être accompagné <span aria-hidden="true">↗</span></Link>
            </div>
          </div>
        </div>
      </Section>
    </>
  );
}
