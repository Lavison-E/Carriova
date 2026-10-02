import { and, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db } from "@/db";
import { blogPosts, faqs, jobs, pricingOffers, testimonials } from "@/db/schema";

export async function getPublishedJobs(filters?: {
  q?: string;
  location?: string;
  industry?: string;
  contractType?: string;
  experience?: string;
  workMode?: string;
}) {
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

  return db
    .select()
    .from(jobs)
    .where(and(...clauses))
    .orderBy(desc(jobs.publishedAt));
}

export async function getJobBySlug(slug: string) {
  const rows = await db.select().from(jobs).where(eq(jobs.slug, slug)).limit(1);
  return rows[0] ?? null;
}

export async function getRelatedJobs(slug: string, industry?: string | null) {
  const clauses = [eq(jobs.isPublished, true), sql`${jobs.slug} <> ${slug}`];
  if (industry) clauses.push(eq(jobs.industry, industry));
  return db
    .select()
    .from(jobs)
    .where(and(...clauses))
    .orderBy(desc(jobs.publishedAt))
    .limit(3);
}

export async function getJobFacets() {
  const rows = await db
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
  const clauses = [eq(blogPosts.isPublished, true)];
  if (cluster) clauses.push(eq(blogPosts.cluster, cluster));
  return db
    .select()
    .from(blogPosts)
    .where(and(...clauses))
    .orderBy(desc(blogPosts.publishedAt));
}

export async function getPostBySlug(slug: string) {
  const rows = await db
    .select()
    .from(blogPosts)
    .where(eq(blogPosts.slug, slug))
    .limit(1);
  return rows[0] ?? null;
}

export async function getRelatedPosts(slug: string, cluster: string) {
  return db
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
  return db
    .select()
    .from(faqs)
    .where(eq(faqs.page, page))
    .orderBy(faqs.sortOrder);
}

export async function getPricingOffers() {
  return db
    .select()
    .from(pricingOffers)
    .where(eq(pricingOffers.isAvailable, true))
    .orderBy(pricingOffers.sortOrder);
}

export async function getPublishedTestimonials() {
  return db
    .select()
    .from(testimonials)
    .where(eq(testimonials.isPublished, true));
}
