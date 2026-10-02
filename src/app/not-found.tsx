import { ButtonLink } from "@/components/ui/primitives";

export default function NotFound() {
  return (
    <section className="mx-auto max-w-2xl px-5 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-bright">404</p>
      <h1 className="mt-4 text-4xl font-extrabold text-night">Cette page n’existe pas.</h1>
      <p className="mt-4 text-muted">
        Le contenu a peut-être été déplacé. Revenez à l’accueil ou explorez les solutions CARRIOVA.
      </p>
      <div className="mt-8 flex justify-center gap-3">
        <ButtonLink href="/">Accueil</ButtonLink>
        <ButtonLink href="/solutions" variant="secondary">
          Solutions
        </ButtonLink>
      </div>
    </section>
  );
}
