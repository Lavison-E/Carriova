import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/PageHero";
import { ButtonLink, Card, JsonLd, Section } from "@/components/ui/primitives";
import { getPostBySlug, getRelatedPosts } from "@/lib/queries";
import { articleJsonLd, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return buildMetadata({
      title: "Article introuvable",
      description: "Ce contenu n’est plus disponible.",
      path: `/blog/${slug}`,
      noindex: true,
    });
  }
  return buildMetadata({
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt,
    path: `/blog/${post.slug}`,
    keywords: [post.category, post.cluster],
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  const related = await getRelatedPosts(post.slug, post.cluster);
  const crumbs = [
    { href: "/", label: "Accueil" },
    { href: "/blog", label: "Blog" },
    { href: `/blog/${post.slug}`, label: post.title },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href })))} />
      <JsonLd data={articleJsonLd(post)} />
      <PageHero
        eyebrow={post.category}
        title={post.title}
        text={post.excerpt}
        crumbs={crumbs}
      />
      <Section>
        <article className="mx-auto max-w-3xl">
          <p className="text-sm text-muted">
            {post.readingTime} min de lecture ·{" "}
            {new Date(post.publishedAt).toLocaleDateString("fr-FR")}
          </p>
          <div className="mt-8 space-y-5 text-base leading-8 text-ink">
            {post.content.split("\n\n").map((paragraph) => {
              if (paragraph.startsWith("## ")) {
                return (
                  <h2 key={paragraph} className="pt-4 text-2xl font-bold text-night">
                    {paragraph.replace("## ", "")}
                  </h2>
                );
              }
              if (paragraph.startsWith("- ")) {
                return (
                  <ul key={paragraph} className="list-disc space-y-2 pl-5 text-muted">
                    {paragraph.split("\n").map((line) => (
                      <li key={line}>{line.replace("- ", "")}</li>
                    ))}
                  </ul>
                );
              }
              return <p key={paragraph}>{paragraph}</p>;
            })}
          </div>
          {post.relatedHref ? (
            <Card className="mt-12">
              <p className="text-sm font-semibold text-night">Passer à l’action</p>
              <p className="mt-2 text-sm text-muted">
                Ce sujet se relie naturellement à une solution CARRIOVA.
              </p>
              <ButtonLink href={post.relatedHref} className="mt-4" size="sm">
                {post.relatedSolution || "Découvrir la solution"}
              </ButtonLink>
            </Card>
          ) : null}
        </article>
        {related.length ? (
          <div className="mx-auto mt-16 max-w-3xl">
            <h2 className="text-xl font-bold text-night">Dans le même cluster</h2>
            <div className="mt-4 grid gap-3">
              {related.map((item) => (
                <Link key={item.slug} href={`/blog/${item.slug}`} className="text-sm font-semibold text-bright">
                  {item.title} →
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </Section>
    </>
  );
}
