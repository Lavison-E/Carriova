import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/PageHero";
import { Badge, ButtonLink, Card, JsonLd, Section, SectionHeader } from "@/components/ui/primitives";
import { getJobBySlug, getRelatedJobs } from "@/lib/queries";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) {
    return buildMetadata({
      title: "Offre introuvable",
      description: "Cette opportunité n’est plus disponible.",
      path: `/emploi/${slug}`,
      noindex: true,
    });
  }
  return buildMetadata({
    title: `${job.title} — ${job.company}`,
    description: job.description.slice(0, 160),
    path: `/emploi/${job.slug}`,
    keywords: [job.title, job.location, job.industry ?? "emploi"],
  });
}

function splitLines(value: string) {
  return value
    .split("\n")
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);
}

export default async function JobPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) notFound();
  const related = await getRelatedJobs(job.slug, job.industry);
  const crumbs = [
    { href: "/", label: "Accueil" },
    { href: "/emploi", label: "Emploi" },
    { href: `/emploi/${job.slug}`, label: job.title },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href })))} />
      <PageHero
        eyebrow={`${job.company} · ${job.location}`}
        title={job.title}
        text={job.description}
        primary={{ href: "/solutions/cv", label: "Créer mon CV pour cette offre" }}
        secondary={{ href: "/solutions/lettre-de-motivation", label: "Adapter ma candidature" }}
        crumbs={crumbs}
      >
        <div className="mt-6 flex flex-wrap gap-2">
          <Badge>{job.contractType}</Badge>
          {job.workMode ? <Badge tone="orange">{job.workMode}</Badge> : null}
          {job.experience ? <Badge tone="navy">{job.experience}</Badge> : null}
        </div>
        <p className="mt-4 text-xs text-white/60">
          Publiée le {new Date(job.publishedAt).toLocaleDateString("fr-FR")} · Mise à jour le{" "}
          {new Date(job.updatedAt).toLocaleDateString("fr-FR")}
        </p>
      </PageHero>

      <Section>
        <div className="grid gap-10 md:grid-cols-3">
          <div className="md:col-span-2">
            <h2 className="text-2xl font-bold text-night">Missions</h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-muted">
              {splitLines(job.responsibilities).map((item) => (
                <li key={item}>→ {item}</li>
              ))}
            </ul>
            <h2 className="mt-10 text-2xl font-bold text-night">Profil recherché</h2>
            <ul className="mt-4 space-y-2 text-sm leading-6 text-muted">
              {splitLines(job.qualifications).map((item) => (
                <li key={item}>→ {item}</li>
              ))}
            </ul>
            {job.applicationMethod ? (
              <>
                <h2 className="mt-10 text-2xl font-bold text-night">Candidature</h2>
                <p className="mt-4 text-sm leading-6 text-muted">{job.applicationMethod}</p>
              </>
            ) : null}
          </div>
          <Card>
            <p className="text-sm font-semibold text-night">Préparez une candidature plus juste</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              Reliez cette offre à un CV ciblé, une lettre et, si besoin, un regard expert.
            </p>
            <div className="mt-5 grid gap-2">
              <ButtonLink href="/solutions/cv" size="sm">
                Créer mon CV pour cette offre
              </ButtonLink>
              <ButtonLink href="/solutions/lettre-de-motivation" variant="secondary" size="sm">
                Adapter ma candidature
              </ButtonLink>
              <ButtonLink href="/solutions/matching" variant="secondary" size="sm">
                Comprendre le matching
              </ButtonLink>
            </div>
          </Card>
        </div>
      </Section>

      <Section tone="paper">
        <SectionHeader eyebrow="Similaires" title="Voir les opportunités similaires" />
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {related.map((item) => (
            <Link key={item.slug} href={`/emploi/${item.slug}`}>
              <Card>
                <h3 className="font-bold text-night">{item.title}</h3>
                <p className="mt-1 text-sm text-muted">
                  {item.company} · {item.location}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
