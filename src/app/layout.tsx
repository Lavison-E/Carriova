import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Plus_Jakarta_Sans } from "next/font/google";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { StickyCta } from "@/components/layout/StickyCta";
import { JsonLd } from "@/components/ui/primitives";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import Script from "next/script";
import { serverEnv } from "@/lib/env";
import { publicIntegrations, siteConfig } from "@/lib/site";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

// Balises de validation Search Console / Bing Webmaster : rendues uniquement si configurées.
const verification: NonNullable<Metadata["verification"]> = {};
if (serverEnv.verification.google) verification.google = serverEnv.verification.google;
if (serverEnv.verification.bing) {
  verification.other = { "msvalidate.01": serverEnv.verification.bing };
}

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: "CARRIOVA — Révélez votre potentiel. Boostez votre carrière.",
    template: "%s | CARRIOVA",
  },
  description: siteConfig.description,
  applicationName: "CARRIOVA",
  keywords: [
    "CARRIOVA",
    "CV professionnel",
    "lettre de motivation",
    "emploi Côte d'Ivoire",
    "coaching carrière",
    "employabilité",
    "matching emploi",
  ],
  authors: [{ name: "CARRIOVA" }],
  openGraph: {
    type: "website",
    locale: siteConfig.locale,
    siteName: "CARRIOVA",
    title: "CARRIOVA — Révélez votre potentiel. Boostez votre carrière.",
    description: siteConfig.description,
    images: [{ url: "/images/og-default.jpg", width: 1200, height: 630, alt: "CARRIOVA" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CARRIOVA",
    description: siteConfig.description,
    images: ["/images/og-default.jpg"],
  },
  robots: { index: true, follow: true },
  icons: { icon: "/brand/mark.svg" },
  ...(Object.keys(verification).length > 0 ? { verification } : {}),
};

export const viewport: Viewport = {
  themeColor: "#001252",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr" className={plusJakarta.variable}>
      <body className="bg-white font-sans text-ink antialiased">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <a className="skip-link" href="#contenu">
          Aller au contenu
        </a>
        <SiteHeader />
        <main id="contenu" className="pb-16 md:pb-0">
          {children}
        </main>
        <SiteFooter />
        <StickyCta />
        {publicIntegrations.plausibleDomain ? (
          <Script
            defer
            data-domain={publicIntegrations.plausibleDomain}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        ) : null}
      </body>
    </html>
  );
}
