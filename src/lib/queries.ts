import { and, desc, eq } from "drizzle-orm";
import { databaseConfigured, getDb } from "@/db";
import { blogPosts, faqs, pricingOffers, testimonials, type BlogPost } from "@/db/schema";
import { editorialPosts } from "@/lib/editorial";



export async function getPublishedPosts(cluster?: string): Promise<BlogPost[]> {
  const localPosts = editorialPosts.filter((post) => !cluster || post.cluster === cluster);
  if (!databaseConfigured) return [...localPosts];
  const clauses = [eq(blogPosts.isPublished, true)];
  if (cluster) clauses.push(eq(blogPosts.cluster, cluster));
  const rows = await getDb()
    .select()
    .from(blogPosts)
    .where(and(...clauses))
    .orderBy(desc(blogPosts.publishedAt));
  // Une version publiée en base prend la priorité sur le contenu livré avec le site.
  const merged = new Map(localPosts.map((post) => [post.slug, post]));
  for (const post of rows) merged.set(post.slug, post);
  return [...merged.values()].sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const localPost = editorialPosts.find((post) => post.slug === slug) ?? null;
  if (!databaseConfigured) return localPost;
  const rows = await getDb()
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.isPublished, true)))
    .limit(1);
  return rows[0] ?? localPost;
}

export async function getRelatedPosts(slug: string, cluster: string): Promise<BlogPost[]> {
  return (await getPublishedPosts(cluster)).filter((post) => post.slug !== slug).slice(0, 3);
}

export async function getFaqs(page: string) {
  if (!databaseConfigured) return [];
  return getDb()
    .select()
    .from(faqs)
    .where(eq(faqs.page, page))
    .orderBy(faqs.sortOrder);
}

export async function getPricingOffers() {
  if (!databaseConfigured) return [];
  return getDb()
    .select()
    .from(pricingOffers)
    .where(eq(pricingOffers.isAvailable, true))
    .orderBy(pricingOffers.sortOrder);
}

export async function getPublishedTestimonials() {
  if (!databaseConfigured) return [];
  return getDb()
    .select()
    .from(testimonials)
    .where(eq(testimonials.isPublished, true));
}
