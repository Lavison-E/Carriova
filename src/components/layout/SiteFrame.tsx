"use client";
import { usePathname } from "next/navigation";
import Script from "next/script";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { StickyCta } from "@/components/layout/StickyCta";
import { publicIntegrations } from "@/lib/site";

export function SiteFrame({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  const path = usePathname();
  const privateArea = path === "/admin" || path.startsWith("/admin/");
  return <>
    {!privateArea ? <SiteHeader /> : null}
    <main id="contenu">{children}</main>
    {!privateArea ? <>{footer}<StickyCta /></> : null}
    {!privateArea && publicIntegrations.plausibleDomain ? <Script defer data-domain={publicIntegrations.plausibleDomain} data-exclude="/admin/**" src="https://plausible.io/js/script.js" strategy="afterInteractive" /> : null}
  </>;
}
