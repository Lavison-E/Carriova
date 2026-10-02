import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { Card, JsonLd, Section } from "@/components/ui/primitives";
import { getPublishedPosts } from "@/lib/queries";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Guides carrière",
  description:
    "Guides CARRIOVA pour construire un CV, chercher un emploi, rédiger une lettre et préparer un entretien.",
  path: "/guides",
});

export default async function GuidesPage() {
  const posts = (await getPublishedPosts()).filter((p) => p.cluster === "guides");
  const crumbs = [
    { href: "/", label: "Accueil" },
    { href: "/guides", label: "Guides" },
  ];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href })))} />
      <PageHero
        eyebrow="Guides"
        title="Des guides pour avancer étape par étape."
        text="Des ressources longues, pratiques, relibles à une solution CARRIOVA."
        crumbs={crumbs}
      />
      <Section>
        <div className="grid gap-5 md:grid-cols-2">
          {(posts.length ? posts : []).map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card>
                <h2 className="text-xl font-bold text-night">{post.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{post.excerpt}</p>
              </Card>
            </Link>
          ))}
          <Link href="/conseils-cv">
            <Card>
              <h2 className="text-xl font-bold text-night">Guide CV</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Comment structurer, rédiger et adapter un CV professionnel.
              </p>
            </Card>
          </Link>
          <Link href="/cv-professionnel">
            <Card>
              <h2 className="text-xl font-bold text-night">CV professionnel</h2>
              <p className="mt-2 text-sm leading-6 text-muted">
                Le positionnement avant le modèle.
              </p>
            </Card>
          </Link>
        </div>
      </Section>
    </>
  );
}
