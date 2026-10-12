import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { databaseConfigured, getDb } from "@/db";
import { blogPosts, faqs, jobs, pricingOffers, testimonials } from "@/db/schema";

export async function getPublishedJobs(filters?: {
  q?: string;
  location?: string;
  industry?: string;
  contractType?: string;
  experience?: string;
  workMode?: string;
}) {
  if (!databaseConfigured) return [];
  const clauses = [eq(jobs.isPublished, true)];

  if (filters?.q) {
    const q = `%${filters.q}%`;
    clauses.push(
      or(
        ilike(jobs.title, q),
        ilike(jobs.company, q),
        ilike(jobs.keywords, q),
        ilike(jobs.description, q),
      )!,
    );
  }
  if (filters?.location) clauses.push(ilike(jobs.location, `%${filters.location}%`));
  if (filters?.industry) clauses.push(eq(jobs.industry, filters.industry));
  if (filters?.contractType) clauses.push(eq(jobs.contractType, filters.contractType));
  if (filters?.experience) clauses.push(eq(jobs.experience, filters.experience));
  if (filters?.workMode) clauses.push(eq(jobs.workMode, filters.workMode));

  return getDb()
    .select()
    .from(jobs)
    .where(and(...clauses))
    .orderBy(desc(jobs.publishedAt));
}

export async function getJobBySlug(slug: string) {
  if (!databaseConfigured) return null;
  const rows = await getDb()
    .select()
    .from(jobs)
    .where(and(eq(jobs.slug, slug), eq(jobs.isPublished, true)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getRelatedJobs(slug: string, industry?: string | null) {
  if (!databaseConfigured) return [];
  const clauses = [eq(jobs.isPublished, true), sql`${jobs.slug} <> ${slug}`];
  if (industry) clauses.push(eq(jobs.industry, industry));
  return getDb()
    .select()
    .from(jobs)
    .where(and(...clauses))
    .orderBy(desc(jobs.publishedAt))
    .limit(3);
}

export async function getJobFacets() {
  if (!databaseConfigured) {
    return { locations: [], industries: [], contractTypes: [], experiences: [], workModes: [] };
  }
  const rows = await getDb()
    .select({
      location: jobs.location,
      industry: jobs.industry,
      contractType: jobs.contractType,
      experience: jobs.experience,
      workMode: jobs.workMode,
    })
    .from(jobs)
    .where(eq(jobs.isPublished, true));

  const unique = (key: keyof (typeof rows)[number]) =>
    Array.from(new Set(rows.map((r) => r[key]).filter(Boolean) as string[])).sort();

  return {
    locations: unique("location"),
    industries: unique("industry"),
    contractTypes: unique("contractType"),
    experiences: unique("experience"),
    workModes: unique("workMode"),
  };
}

export async function getPublishedPosts(cluster?: string) {
  if (!databaseConfigured) return [];
  const clauses = [eq(blogPosts.isPublished, true)];
  if (cluster) clauses.push(eq(blogPosts.cluster, cluster));
  return getDb()
    .select()
    .from(blogPosts)
    .where(and(...clauses))
    .orderBy(desc(blogPosts.publishedAt));
}

export async function getPostBySlug(slug: string) {
  if (!databaseConfigured) return null;
  const rows = await getDb()
    .select()
    .from(blogPosts)
    .where(and(eq(blogPosts.slug, slug), eq(blogPosts.isPublished, true)))
    .limit(1);
  return rows[0] ?? null;
}

export async function getRelatedPosts(slug: string, cluster: string) {
  if (!databaseConfigured) return [];
  return getDb()
    .select()
    .from(blogPosts)
    .where(
      and(
        eq(blogPosts.isPublished, true),
        eq(blogPosts.cluster, cluster),
        sql`${blogPosts.slug} <> ${slug}`,
      ),
    )
    .limit(3);
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
