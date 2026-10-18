"use client";
import { usePathname } from "next/navigation";
import { PublicAnalytics } from "@/components/layout/PublicAnalytics";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { StickyCta } from "@/components/layout/StickyCta";


export function SiteFrame({ children, footer }: { children: ReactNode; footer: ReactNode }) {
  const path = usePathname();
  const privateArea = path === "/admin" || path.startsWith("/admin/") || path === "/espace" || path.startsWith("/espace/") || path === "/compte" || path.startsWith("/compte/");
  return <>
    {!privateArea ? <SiteHeader /> : null}
    <main id="contenu">{children}</main>
    {!privateArea ? <>{footer}<StickyCta /></> : null}
    <PublicAnalytics path={path} privateArea={privateArea} />
  </>;
}
