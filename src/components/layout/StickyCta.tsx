"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { ButtonLink } from "@/components/ui/primitives";
import { CareerIcon } from "@/components/brand/CareerIcon";
import { ebook, ebookCheckoutHref } from "@/lib/ebook";

export function StickyCta() {
  const pathname = usePathname();
  return <ContextualStickyCta key={pathname} pathname={pathname} />;
}

function ContextualStickyCta({ pathname }: { pathname: string }) {
  const [heroPassed, setHeroPassed] = useState(false);

  useEffect(() => {
    if (pathname !== "/") return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry) setHeroPassed(entry.boundingClientRect.bottom < 0);
    });

    const observeHero = () => {
      const heroActions = document.querySelector("[data-sticky-cta-observe]");
      if (!heroActions) return false;
      observer.observe(heroActions);
      return true;
    };

    // The page can arrive after the shared layout when Next.js streams it.
    const pageObserver = new MutationObserver(() => {
      if (observeHero()) pageObserver.disconnect();
    });
    if (!observeHero()) {
      pageObserver.observe(document.body, { childList: true, subtree: true });
    }

    return () => {
      observer.disconnect();
      pageObserver.disconnect();
    };
  }, [pathname]);

  if (pathname.startsWith("/qualification") || pathname.startsWith("/compte") || pathname.startsWith("/contact") || pathname.startsWith("/support") || pathname.startsWith("/admin") || pathname.startsWith("/solutions")) return null;
  if (pathname === "/" && !heroPassed) return null;
  if (pathname.startsWith("/ebook")) return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-night px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <a href={ebookCheckoutHref("site")} target="_blank" rel="noopener" className="flex min-h-12 w-full items-center justify-between rounded-lg bg-orange px-5 text-sm font-semibold text-white">
        <span>Obtenir l’ebook · {ebook.price}</span><CareerIcon name="arrow" className="h-4 w-4" />
      </a>
    </div>
  );

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-night/15 bg-[#f7f5ef] px-5 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      <ButtonLink href="/qualification" variant="orange" className="w-full justify-between rounded-lg" eventName="cta_click">
        Trouver ma solution <CareerIcon name="arrow" className="h-4 w-4" />
      </ButtonLink>
    </div>
  );
}
