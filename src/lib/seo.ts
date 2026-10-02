import type { Metadata } from "next";
import { serverEnv } from "./env";
import { siteConfig } from "./site";

type BuildMeta = {
  title: string;
  description: string;
  path: string;
  keywords?: string[];
  noindex?: boolean;
  image?: string;
};

export function absoluteUrl(path = "/") {
  const base = siteConfig.url.replace(/\/$/, "");
  if (!path || path === "/") return base;
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function buildMetadata({
  title,
  description,
  path,
  keywords = [],
  noindex = false,
  image = "/images/og-default.jpg",
}: BuildMeta): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = title.includes("CARRIOVA") ? title : title;

  return {
    title: fullTitle,
    description,
    keywords: [
      "CARRIOVA",
      "carrière",
      "employabilité",
      "CV",
      "lettre de motivation",
      "coaching carrière",
      "emploi Côte d'Ivoire",
      ...keywords,
    ],
    alternates: { canonical: url },
    robots: noindex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url,
      siteName: siteConfig.name,
      title: fullTitle.includes("CARRIOVA") ? fullTitle : `${fullTitle} | CARRIOVA`,
      description,
      images: [{ url: absoluteUrl(image), width: 1200, height: 630, alt: "CARRIOVA" }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle.includes("CARRIOVA") ? fullTitle : `${fullTitle} | CARRIOVA`,
      description,
      images: [absoluteUrl(image)],
    },
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "CARRIOVA",
    url: siteConfig.url,
    logo: absoluteUrl("/brand/mark.svg"),
    slogan: siteConfig.tagline,
    email: serverEnv.CONTACT_EMAIL,
    areaServed: ["CI", "West Africa", "Africa"],
    sameAs: [siteConfig.social.linkedin, siteConfig.social.facebook],
    description: siteConfig.description,
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "CARRIOVA",
    url: siteConfig.url,
    inLanguage: "fr-CI",
    potentialAction: {
      "@type": "SearchAction",
      target: `${siteConfig.url}/emploi?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(faqs: { question: string; answer: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export function jobPostingJsonLd(job: {
  title: string;
  company: string;
  location: string;
  country: string;
  contractType: string;
  description: string;
  publishedAt: Date | string;
  updatedAt?: Date | string;
  workMode?: string | null;
}) {
  const datePosted = new Date(job.publishedAt).toISOString();
  const validThrough = new Date(
    new Date(job.publishedAt).getTime() + 1000 * 60 * 60 * 24 * 60,
  ).toISOString();

  return {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.title,
    description: job.description,
    datePosted,
    validThrough,
    employmentType: job.contractType,
    hiringOrganization: {
      "@type": "Organization",
      name: job.company,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressCountry: job.country,
      },
    },
    jobLocationType:
      job.workMode === "Télétravail" ? "TELECOMMUTE" : undefined,
  };
}

export function articleJsonLd(post: {
  title: string;
  excerpt: string;
  slug: string;
  publishedAt: Date | string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt,
    datePublished: new Date(post.publishedAt).toISOString(),
    author: { "@type": "Organization", name: "CARRIOVA" },
    publisher: { "@type": "Organization", name: "CARRIOVA" },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
    inLanguage: "fr-CI",
  };
}
