"use client";

import { usePathname } from "next/navigation";
import { ButtonLink } from "@/components/ui/primitives";
import { CareerIcon } from "@/components/brand/CareerIcon";

export function StickyCta() {
  const pathname = usePathname();
  if (pathname.startsWith("/compte") || pathname.startsWith("/contact") || pathname.startsWith("/admin") || pathname.startsWith("/solutions")) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur md:hidden">
      <ButtonLink href="/solutions" variant="orange" className="w-full" eventName="cta_click">Trouver ma solution <CareerIcon name="arrow" className="h-4 w-4" /></ButtonLink>
    </div>
  );
}
