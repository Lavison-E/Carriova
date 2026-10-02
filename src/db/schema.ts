import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";

export const leads = pgTable("leads", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 120 }).notNull(),
  lastName: varchar("last_name", { length: 120 }),
  email: varchar("email", { length: 255 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 40 }),
  objective: varchar("objective", { length: 160 }),
  interest: varchar("interest", { length: 160 }),
  source: varchar("source", { length: 120 }),
  landingPage: varchar("landing_page", { length: 255 }),
  message: text("message"),
  type: varchar("type", { length: 60 }).notNull(),
  consentMarketing: boolean("consent_marketing").notNull().default(false),
  consentPrivacy: boolean("consent_privacy").notNull().default(false),
  status: varchar("status", { length: 40 }).notNull().default("prospect"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const jobs = pgTable("jobs", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  country: varchar("country", { length: 120 }).notNull().default("Côte d'Ivoire"),
  contractType: varchar("contract_type", { length: 80 }).notNull(),
  experience: varchar("experience", { length: 80 }),
  industry: varchar("industry", { length: 120 }),
  workMode: varchar("work_mode", { length: 80 }),
  description: text("description").notNull(),
  responsibilities: text("responsibilities").notNull(),
  qualifications: text("qualifications").notNull(),
  applicationMethod: text("application_method"),
  keywords: text("keywords"),
  isPublished: boolean("is_published").notNull().default(true),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 220 }).notNull().unique(),
  title: varchar("title", { length: 255 }).notNull(),
  excerpt: text("excerpt").notNull(),
  content: text("content").notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  cluster: varchar("cluster", { length: 80 }).notNull(),
  readingTime: integer("reading_time").notNull().default(6),
  seoTitle: varchar("seo_title", { length: 255 }),
  seoDescription: varchar("seo_description", { length: 320 }),
  relatedSolution: varchar("related_solution", { length: 80 }),
  relatedHref: varchar("related_href", { length: 160 }),
  isPublished: boolean("is_published").notNull().default(true),
  publishedAt: timestamp("published_at").defaultNow().notNull(),
});

export const faqs = pgTable("faqs", {
  id: serial("id").primaryKey(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  page: varchar("page", { length: 80 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  quote: text("quote").notNull(),
  authorName: varchar("author_name", { length: 120 }).notNull(),
  authorRole: varchar("author_role", { length: 160 }),
  isPublished: boolean("is_published").notNull().default(false),
});

export const pricingOffers = pgTable("pricing_offers", {
  id: serial("id").primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  name: varchar("name", { length: 160 }).notNull(),
  category: varchar("category", { length: 80 }).notNull(),
  tagline: text("tagline"),
  benefits: text("benefits").notNull(),
  ctaLabel: varchar("cta_label", { length: 80 }).notNull(),
  ctaHref: varchar("cta_href", { length: 160 }).notNull(),
  priceLabel: varchar("price_label", { length: 80 }).notNull().default("Sur devis"),
  currency: varchar("currency", { length: 10 }).default("XOF"),
  priceAmount: integer("price_amount"),
  promotionalStatus: varchar("promotional_status", { length: 40 }).default("standard"),
  isAvailable: boolean("is_available").notNull().default(true),
  featured: boolean("featured").notNull().default(false),
  sortOrder: integer("sort_order").notNull().default(0),
});

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 120 }).notNull(),
  lastName: varchar("last_name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  objective: varchar("objective", { length: 160 }),
  consentMarketing: boolean("consent_marketing").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const coachingRequests = pgTable("coaching_requests", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 120 }).notNull(),
  lastName: varchar("last_name", { length: 120 }).notNull(),
  email: varchar("email", { length: 255 }).notNull(),
  whatsapp: varchar("whatsapp", { length: 40 }),
  coachingType: varchar("coaching_type", { length: 120 }).notNull(),
  availability: text("availability"),
  message: text("message"),
  consentPrivacy: boolean("consent_privacy").notNull().default(false),
  status: varchar("status", { length: 40 }).notNull().default("new"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  eventName: varchar("event_name", { length: 80 }).notNull(),
  path: varchar("path", { length: 255 }),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

/** Trace des envois sortants (e-mail, WhatsApp, CRM) — jamais de secret, détail tronqué. */
export const integrationLogs = pgTable("integration_logs", {
  id: serial("id").primaryKey(),
  channel: varchar("channel", { length: 30 }).notNull(),
  event: varchar("event", { length: 60 }).notNull(),
  status: varchar("status", { length: 20 }).notNull(),
  leadId: integer("lead_id"),
  detail: varchar("detail", { length: 300 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Lead = typeof leads.$inferSelect;
export type Job = typeof jobs.$inferSelect;
export type BlogPost = typeof blogPosts.$inferSelect;
export type Faq = typeof faqs.$inferSelect;
export type PricingOffer = typeof pricingOffers.$inferSelect;
export type Account = typeof accounts.$inferSelect;
