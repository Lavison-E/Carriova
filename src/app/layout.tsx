import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteFrame } from "@/components/layout/SiteFrame";
import { StickyCta } from "@/components/layout/StickyCta";
import { JsonLd } from "@/components/ui/primitives";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo";
import Script from "next/script";
import { serverEnv } from "@/lib/env";
import { siteConfig } from "@/lib/site";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "latin-ext"],
  variable: "--font-plus-jakarta",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const instrumentSerif = Instrument_Serif({ subsets: ['latin'], weight: '400', style: ['normal', 'italic'], variable: '--font-instrument-serif', display: 'swap' });

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
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "CARRIOVA" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "CARRIOVA",
    description: siteConfig.description,
    images: ["/opengraph-image"],
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
    <html lang="fr" data-scroll-behavior="smooth" className={`${plusJakarta.variable} ${instrumentSerif.variable}`}>
      <body className="bg-white font-sans text-ink antialiased">
        <JsonLd data={organizationJsonLd()} />
        <JsonLd data={websiteJsonLd()} />
        <a className="skip-link" href="#contenu">
          Aller au contenu
        </a>
        <SiteFrame footer={<SiteFooter />}>{children}</SiteFrame>
      </body>
    </html>
  );
}
