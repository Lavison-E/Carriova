"use client";

export default function GlobalError({ reset }: { reset: () => void }) {
  return (
    <html lang="fr">
      <body className="bg-white px-5 py-24 text-center text-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#0348D6]">Erreur</p>
        <h1 className="mt-4 text-3xl font-extrabold">CARRIOVA est temporairement indisponible.</h1>
        <p className="mt-4 text-slate-600">Veuillez réessayer dans un instant.</p>
        <button
          type="button"
          onClick={reset}
          className="mt-8 inline-flex h-11 items-center rounded-full bg-[#0348D6] px-5 text-sm font-semibold text-white"
        >
          Réessayer
        </button>
      </body>
    </html>
  );
}
