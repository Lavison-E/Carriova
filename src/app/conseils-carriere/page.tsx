import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { Card, JsonLd, Section } from "@/components/ui/primitives";
import { getPublishedPosts } from "@/lib/queries";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Conseils carrière",
  description:
    "Conseils CARRIOVA sur l’évolution professionnelle, la reconversion, l’employabilité et le développement de compétences.",
  path: "/conseils-carriere",
  keywords: ["évolution professionnelle", "reconversion", "employabilité"],
});

export default async function CareerAdvicePage() {
  const posts = (await getPublishedPosts()).filter(
    (p) => p.cluster === "carriere" || p.category === "Carrière",
  );
  const crumbs = [
    { href: "/", label: "Accueil" },
    { href: "/conseils-carriere", label: "Conseils carrière" },
  ];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href })))} />
      <PageHero
        eyebrow="Conseils carrière"
        title="De la direction à la progression."
        text="Des articles pour clarifier un projet, préparer une mobilité ou renforcer son employabilité."
        primary={{ href: "/solutions/coaching", label: "Réserver une séance" }}
        crumbs={crumbs}
      />
      <Section>
        <div className="grid gap-5 md:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card>
                <h2 className="font-bold text-night">{post.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{post.excerpt}</p>
              </Card>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
