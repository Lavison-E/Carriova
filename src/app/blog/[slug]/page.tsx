import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/layout/PageHero";
import { ButtonLink, JsonLd, Section } from "@/components/ui/primitives";
import { editorialPosts, jobSearchArticle, type EditorialBlock } from "@/lib/editorial";
import { getPostBySlug, getRelatedPosts } from "@/lib/queries";
import { articleJsonLd, breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) {
    return buildMetadata({ title: "Article introuvable", description: "Ce contenu n’est plus disponible.", path: `/blog/${slug}`, noindex: true });
  }
  return buildMetadata({ title: post.seoTitle || post.title, description: post.seoDescription || post.excerpt, path: `/blog/${post.slug}`, keywords: [post.category, post.cluster] });
}

function ArticleBlock({ block }: { block: EditorialBlock }) {
  switch (block.type) {
    case "paragraph":
      return <p>{block.text}</p>;
    case "callout":
      return <div className="border-l-2 border-[#bd470d] bg-[#f7f5ef] px-5 py-5 text-night"><p>{block.text}</p></div>;
    case "list":
      return <ul className="list-disc space-y-3 pl-5 marker:text-[#bd470d]">{block.items.map((item) => <li key={item}>{item}</li>)}</ul>;
    case "table":
      return (
        <div className="overflow-x-auto rounded-lg border border-night/15" role="region" aria-label="Exemple de tableau de suivi des candidatures" tabIndex={0}>
          <table className="w-full min-w-[24rem] border-collapse text-left text-sm leading-6">
            <caption className="sr-only">Champs à renseigner pour suivre vos candidatures</caption>
            <thead className="bg-night text-white"><tr>{block.headers.map((header) => <th key={header} scope="col" className="px-5 py-4 font-semibold">{header}</th>)}</tr></thead>
            <tbody>{block.rows.map((row) => <tr key={row[0]} className="border-t border-night/10">{row.map((cell, index) => index === 0 ? <th key={index} scope="row" className="bg-[#f7f5ef] px-5 py-4 font-semibold text-night">{cell}</th> : <td key={index} className="px-5 py-4">{cell}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
    case "routine":
      return <dl className="divide-y divide-night/15 border-y border-night/15">{block.items.map((item) => <div key={item.label} className="grid gap-2 py-4 sm:grid-cols-[7rem_1fr] sm:gap-5"><dt className="font-semibold text-night">{item.label}</dt><dd>{item.text}</dd></div>)}</dl>;
  }
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();
  const related = await getRelatedPosts(post.slug, post.cluster);
  const article = editorialPosts.some((item) => item.slug === post.slug && item.id === post.id) ? jobSearchArticle : null;
  const crumbs = [{ href: "/", label: "Accueil" }, { href: "/blog", label: "Blog" }, { href: `/blog/${post.slug}`, label: post.title }];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href })))} />
      <JsonLd data={articleJsonLd(post)} />
      <PageHero eyebrow={post.category} title={post.title} text={post.excerpt} crumbs={crumbs} />
      <Section>
        <div className={article ? "grid items-start gap-12 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-20" : "mx-auto max-w-3xl"}>
          {article ? (
            <nav aria-label="Sommaire de l’article" className="rounded-xl border border-night/15 bg-[#f7f5ef] p-5 lg:sticky lg:top-28">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-[#bd470d]">Dans cet article</p>
              <ol className="space-y-3">{article.sections.map((section, index) => <li key={section.id}><a href={`#${section.id}`} className="flex gap-3 text-xs leading-6 text-night hover:text-[#bd470d]"><span aria-hidden="true" className="tabular-nums text-[#bd470d]">{String(index + 1).padStart(2, "0")}</span><span>{section.id === "plan" ? "Synthèse et plan d’action" : section.title}</span></a></li>)}</ol>
            </nav>
          ) : null}
          <article className="min-w-0 max-w-3xl">
            <div className="border-b border-night/15 pb-6 text-sm leading-7 text-muted">
              {article ? <p className="font-medium text-night">{article.author}</p> : null}
              <p>{post.readingTime} min de lecture · <time dateTime={new Date(post.publishedAt).toISOString()}>{new Date(post.publishedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Abidjan" })}</time></p>
            </div>
            {article ? (
              <>
                <div className="mt-8 space-y-6 text-base leading-8 text-ink">{article.intro.map((block, index) => <ArticleBlock key={index} block={block} />)}</div>
                {article.sections.map((section) => (
                  <section key={section.id} id={section.id} className="mt-14 scroll-mt-28 border-t border-night/15 pt-9">
                    <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#bd470d]">{section.kicker}</p>
                    <h2 className="font-editorial mt-3 text-3xl italic leading-tight text-night sm:text-4xl">{section.title}</h2>
                    <div className="mt-6 space-y-6 text-base leading-8 text-ink">{section.blocks.map((block, index) => <ArticleBlock key={index} block={block} />)}</div>
                  </section>
                ))}
                <section className="mt-14 border-t border-night/15 pt-9">
                  <h2 className="text-2xl font-semibold tracking-tight text-night">Pour aller plus loin</h2>
                  <div className="mt-5 divide-y divide-night/15">{article.related.map((item) => <Link key={item.href} href={item.href} className="group flex items-center justify-between gap-5 py-5 text-night hover:text-[#bd470d]"><span><span className="block text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-[#bd470d]">{item.category}</span><span className="mt-1 block text-sm font-semibold">{item.title}</span></span><span aria-hidden="true">↗</span></Link>)}</div>
                  <p className="mt-6 text-sm text-muted">Explorez toutes nos rubriques : <Link href="/ressources" className="font-semibold text-night underline underline-offset-4">Retour aux Ressources Carriova →</Link></p>
                </section>
                <section className="mt-12 rounded-xl bg-[#f7f5ef] p-6 sm:p-8">
                  <h2 className="font-editorial text-3xl italic text-night">{article.cta.title}</h2>
                  <p className="mt-4 text-sm leading-7 text-muted">{article.cta.text}</p>
                  <ButtonLink href={article.cta.href} variant="orange" className="mt-6">{article.cta.label}</ButtonLink>
                </section>
              </>
            ) : (
              <div className="mt-8 space-y-5 text-base leading-8 text-ink">
                {post.content.split("\n\n").map((paragraph, index) => {
                  if (paragraph.startsWith("## ")) return <h2 key={index} className="pt-4 text-2xl font-semibold text-night">{paragraph.replace("## ", "")}</h2>;
                  if (paragraph.startsWith("- ")) return <ul key={index} className="list-disc space-y-2 pl-5 text-muted">{paragraph.split("\n").map((line, lineIndex) => <li key={lineIndex}>{line.replace("- ", "")}</li>)}</ul>;
                  return <p key={index}>{paragraph}</p>;
                })}
              </div>
            )}
            {post.relatedHref ? <div className="mt-12 border-t border-night/15 pt-8"><p className="text-sm font-semibold text-night">Passer à l’action</p><ButtonLink href={post.relatedHref} className="mt-4">{post.relatedSolution || "Découvrir la solution"}</ButtonLink></div> : null}
            {related.length ? <div className="mt-14 border-t border-night/15 pt-8"><h2 className="text-xl font-semibold text-night">À lire aussi</h2><div className="mt-4 grid gap-4">{related.map((item) => <Link key={item.slug} href={`/blog/${item.slug}`} className="text-sm font-semibold text-night hover:text-[#bd470d]">{item.title} →</Link>)}</div></div> : null}
          </article>
        </div>
      </Section>
    </>
  );
}
