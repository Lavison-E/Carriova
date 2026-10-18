import { getPublishedJobs } from "@/lib/job-catalog";
import type { MetadataRoute } from "next";
import { getPublishedPosts } from "@/lib/queries";
import { absoluteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

const staticPaths = [
  "/",
  "/solutions",
  "/solutions/cv",
  "/solutions/lettre-de-motivation",
  "/solutions/opportunites",
  "/solutions/matching",
  "/solutions/coaching",
  "/solutions/expertise",
  "/emploi",
  "/a-propos",
  "/ressources",
  "/blog",
  "/guides",
  "/conseils-carriere",
  "/tarifs",
  "/contact",
  "/support",
  "/qualification",
  "/faq",
  "/cv-professionnel",
  "/cv-etudiant",
  "/cv-sans-experience",
  "/cv-international",
  "/lettre-de-motivation",
  "/coaching-carriere",
  "/recherche-emploi",
  "/conseils-cv",
  "/legal/confidentialite",
  "/legal/conditions",
  "/legal/cookies",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, jobs] = await Promise.all([getPublishedPosts(), getPublishedJobs()]);
  const now = new Date();

  return [
    ...staticPaths.map((path) => ({
      url: absoluteUrl(path),
      lastModified: now,
      changeFrequency: (path === "/" ? "weekly" : "monthly") as "weekly" | "monthly",
      priority: path === "/" ? 1 : 0.7,
    })),
    ...posts.map((post) => ({
      url: absoluteUrl(`/blog/${post.slug}`),
      lastModified: post.publishedAt,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
    ...jobs.map((job) => ({
      url: absoluteUrl(`/emploi/${job.slug}`),
      lastModified: job.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}
