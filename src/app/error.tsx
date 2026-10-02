"use client";

import { ButtonLink } from "@/components/ui/primitives";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="mx-auto max-w-2xl px-5 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bright">Erreur</p>
      <h1 className="mt-4 text-4xl font-extrabold text-night">Impossible d’afficher cette page.</h1>
      <p className="mt-4 text-muted">
        Un incident temporaire est survenu. Réessayez, ou revenez à l’accueil.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center rounded-full bg-bright px-5 text-sm font-semibold text-white"
        >
          Réessayer
        </button>
        <ButtonLink href="/" variant="secondary">
          Accueil
        </ButtonLink>
      </div>
    </section>
  );
}
