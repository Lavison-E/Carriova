import Link from "next/link";
import { PageHero } from "@/components/layout/PageHero";
import { JsonLd, Section } from "@/components/ui/primitives";
import { getPublishedPosts } from "@/lib/queries";
import { breadcrumbJsonLd, buildMetadata } from "@/lib/seo";

export const dynamic = "force-dynamic";

export const metadata = buildMetadata({
  title: "Blog carrière et employabilité",
  description: "Articles CARRIOVA sur le CV, la lettre de motivation, la recherche d’emploi, le coaching et le développement professionnel.",
  path: "/blog",
  keywords: ["blog carrière", "conseils CV", "recherche d’emploi"],
});

export default async function BlogPage() {
  const posts = await getPublishedPosts();
  const crumbs = [{ href: "/", label: "Accueil" }, { href: "/blog", label: "Blog" }];
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs.map((c) => ({ name: c.label, path: c.href })))} />
      <PageHero eyebrow="Le blog" title="Des repères pour votre prochain pas." text="Préparer une candidature, organiser votre recherche, prendre du recul sur votre carrière. Nos articles vous accompagnent avec des conseils concrets." crumbs={crumbs} />
      <Section>
        <div className="grid gap-x-16 md:grid-cols-2">
          {posts.map((post) => (
            <article key={post.slug} className="border-t border-night/20 py-8">
              <p className="text-[0.65rem] font-semibold uppercase tracking-[0.15em] text-[#bd470d]">{post.category}</p>
              <h2 className="mt-4 text-2xl font-semibold leading-snug tracking-tight text-night"><Link href={`/blog/${post.slug}`} className="hover:text-[#bd470d]">{post.title}</Link></h2>
              <p className="mt-5 text-sm leading-7 text-muted">{post.excerpt}</p>
              <p className="mt-5 text-xs text-muted">{post.readingTime} min de lecture · {new Date(post.publishedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Abidjan" })}</p>
              <Link href={`/blog/${post.slug}`} className="mt-5 inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-night underline decoration-night/25 underline-offset-4 hover:text-[#bd470d]">Lire l’article<span aria-hidden="true">↗</span></Link>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
