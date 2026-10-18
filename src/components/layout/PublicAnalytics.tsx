"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { publicIntegrations } from "@/lib/site";

// Manual pageviews keep a script loaded on the public site from observing private SPA URLs.
// https://plausible.io/docs/custom-locations
export function PublicAnalytics({ path, privateArea }: { path: string; privateArea: boolean }) {
  const [ready, setReady] = useState(false);
  const lastPath = useRef<string | null>(null);
  useEffect(() => {
    if (privateArea) { lastPath.current = null; return; }
    if (!ready || !publicIntegrations.plausibleDomain || lastPath.current === path) return;
    const plausible = (window as Window & { plausible?: (event: string, options: { url: string }) => void }).plausible;
    if (!plausible || window.location.pathname !== path) return;
    // Query parameters can contain recovery tokens or user-entered search terms.
    plausible("pageview", { url: window.location.origin + path });
    lastPath.current = path;
  }, [path, privateArea, ready]);
  if (privateArea || !publicIntegrations.plausibleDomain) return null;
  return <Script data-domain={publicIntegrations.plausibleDomain} src="https://plausible.io/js/script.manual.js" strategy="afterInteractive" onReady={() => setReady(true)} />;
}
