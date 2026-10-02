import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { Badge, Card, JsonLd, Section } from "@/components/ui/primitives";
import { getPublishedPosts } from "@/lib/queries";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Blog carrière et employabilité",
  description:
    "Articles CARRIOVA sur le CV, la lettre de motivation, la recherche d’emploi, le coaching et le développement professionnel.",
  path: "/blog",
  keywords: ["blog carrière", "conseils CV", "recherche d’emploi"],
});

export default async function BlogPage() {
  const posts = await getPublishedPosts();
  const crumbs = [
    { href: "/", label: "Accueil" },
    { href: "/blog", label: "Blog" },
  ];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href })))} />
      <PageHero
        eyebrow="Blog"
        title="Des contenus utiles, classés par intention."
        text="CV, emploi, lettre, carrière, coaching : chaque article vise une question réelle, pas un mot-clé isolé."
        crumbs={crumbs}
      />
      <Section>
        <div className="grid gap-5 md:grid-cols-3">
          {posts.map((post) => (
            <Link key={post.slug} href={`/blog/${post.slug}`}>
              <Card className="h-full">
                <Badge tone="orange">{post.category}</Badge>
                <h2 className="mt-4 text-lg font-bold text-night">{post.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted">{post.excerpt}</p>
                <p className="mt-4 text-xs text-bright">{post.readingTime} min · {post.cluster}</p>
              </Card>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}
