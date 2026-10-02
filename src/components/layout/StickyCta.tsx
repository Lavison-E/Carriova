"use client";

import { ButtonLink } from "@/components/ui/primitives";

export function StickyCta() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/95 p-3 backdrop-blur md:hidden">
      <ButtonLink href="/compte/creer" variant="orange" className="w-full" eventName="cta_click">
        Commencer maintenant
      </ButtonLink>
    </div>
  );
}
