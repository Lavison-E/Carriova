import { cache } from "react";
import { selectedOpportunities } from "@/lib/selected-opportunities";
import { unstable_cache } from "next/cache";
import { currentOpportunities, filterOpportunities, normalizeAccorPosting, opportunityFacets, type OpportunityFilters } from "@/lib/opportunities";

// cacheComponents is not enabled in this application; the Data Cache also works
// for the existing dynamic home page. Keep a hard freshness limit outside it.
const readAccor = unstable_cache(async () => {
  const response = await fetch("https://api.smartrecruiters.com/v1/companies/AccorHotel/postings?country=ci&limit=100", { cache: "no-store", signal: AbortSignal.timeout(6_000) });
  if (!response.ok) throw new Error("JOB_SOURCE_UNAVAILABLE");
  const body = await response.json();
  if (!Array.isArray(body.content)) throw new Error("JOB_SOURCE_INVALID");
  const now = Date.now(), verifiedAt = new Date(now).toISOString();
  const recent = body.content.filter((row: {id?: unknown; releasedDate?: string}) => /^\d{10,20}$/.test(String(row.id)) && Number.isFinite(Date.parse(row.releasedDate ?? "")) && now - Date.parse(row.releasedDate ?? "") <= 60 * 86400_000).slice(0, 30);
  const results = await Promise.allSettled(recent.map(async (row: {id: string}) => {
    const detail = await fetch(`https://api.smartrecruiters.com/v1/companies/AccorHotel/postings/${row.id}`, { cache: "no-store", signal: AbortSignal.timeout(6_000) });
    if (detail.status === 404 || detail.status === 410) return null;
    if (!detail.ok) throw new Error("JOB_DETAIL_UNAVAILABLE");
    return normalizeAccorPosting(await detail.json(), verifiedAt, now);
  }));
  return { jobs: results.flatMap(result => result.status === "fulfilled" && result.value ? [result.value] : []), verifiedAt, partial: results.some(result => result.status === "rejected") };
}, ["carriova-accor-ci-v1"], { revalidate: 900 });

export const getOpportunityCatalog = cache(async () => {
  try {
    const snapshot = await readAccor();
    const fresh = Date.now() - Date.parse(snapshot.verifiedAt) <= 24 * 3600_000;
    return { jobs: [...(fresh ? currentOpportunities(snapshot.jobs) : []), ...currentOpportunities(selectedOpportunities)], unavailable: !fresh || snapshot.partial, verifiedAt: snapshot.verifiedAt };
  } catch {
    return { jobs: currentOpportunities(selectedOpportunities), unavailable: true, verifiedAt: null };
  }
});
export async function getPublishedJobs(filters?: OpportunityFilters) { return filterOpportunities((await getOpportunityCatalog()).jobs, filters); }
export async function getJobBySlug(slug: string) { return (await getOpportunityCatalog()).jobs.find(job => job.slug === slug) ?? null; }
export async function getRelatedJobs(slug: string, industry?: string | null) { const jobs = (await getOpportunityCatalog()).jobs.filter(job => job.slug !== slug); return jobs.sort((a,b) => Number(b.industry === industry) - Number(a.industry === industry)).slice(0,3); }
export async function getJobFacets() { return opportunityFacets((await getOpportunityCatalog()).jobs); }
