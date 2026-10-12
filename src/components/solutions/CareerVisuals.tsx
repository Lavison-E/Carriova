import { cn } from "@/components/ui/primitives";

const documentSections = {
  cv: [
    { title: "Profil", text: "Votre métier, votre expertise et le poste que vous visez." },
    { title: "Expériences", text: "Des missions précises, des réalisations concrètes." },
    { title: "Compétences", text: "Les savoir-faire utiles à votre prochain poste." },
  ],
  letter: [
    { title: "Votre motivation", text: "Pourquoi cette entreprise et cette opportunité ?" },
    { title: "Votre contribution", text: "Une expérience qui répond à un besoin du poste." },
    { title: "La prochaine étape", text: "Une invitation claire à poursuivre l’échange." },
  ],
};

export function DocumentPreview({ variant }: { variant: "cv" | "letter" }) {
  const isCv = variant === "cv";
  return (
    <figure className="relative overflow-hidden rounded-[2rem] border border-line bg-[#e9effb] px-6 pb-6 pt-8 sm:px-10 sm:pt-10">
      <div aria-hidden="true" className="absolute -right-12 -top-12 h-48 w-48 rounded-full border-[36px] border-bright/10" />
      <div className="relative mx-auto max-w-sm rounded-t-2xl border border-line bg-white p-6 shadow-lift sm:p-8">
        <div className="flex items-center justify-between gap-4 border-b border-line pb-5">
          <span className="text-[0.65rem] font-extrabold tracking-[0.16em] text-night">CARRIOVA</span>
          <span className="rounded-full bg-soft px-2.5 py-1 text-[0.65rem] font-semibold text-royal">
            {isCv ? "CV" : "LETTRE"}
          </span>
        </div>
        <p className="mt-6 text-xl font-extrabold tracking-tight text-night">
          {isCv ? "Votre prochain chapitre." : "Une candidature qui vous ressemble."}
        </p>
        <p className="mt-2 text-xs leading-5 text-muted">
          {isCv ? "Un parcours lisible. Des preuves à l’appui." : "Votre profil, relié à une opportunité précise."}
        </p>
        <div className="mt-6 space-y-5">
          {documentSections[variant].map((section, index) => (
            <div key={section.title} className={cn("border-l-2 pl-3", index === 1 ? "border-orange" : "border-bright/25")}>
              <p className="text-xs font-bold text-night">{section.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{section.text}</p>
            </div>
          ))}
        </div>
        <div className="mt-7 flex items-center gap-2 border-t border-line pt-4 text-[0.65rem] font-semibold text-royal">
          <span aria-hidden="true" className="flex h-5 w-5 items-center justify-center rounded-full bg-soft">✓</span>
          Clair, personnel et adapté à votre objectif
        </div>
      </div>
      <figcaption className="relative mt-4 text-center text-xs font-medium text-muted">
        {isCv ? "Exemple de structure de CV" : "Les trois intentions d’une lettre utile"}
      </figcaption>
    </figure>
  );
}

const careerStages = [
  { title: "Comprendre votre profil", text: "Vos forces, vos envies, votre direction." },
  { title: "Préparer votre candidature", text: "Un CV précis et une lettre personnelle." },
  { title: "Avancer avec confiance", text: "Des opportunités ciblées et un regard expert." },
];

export function CareerPathVisual() {
  return (
    <figure className="relative overflow-hidden rounded-[2rem] bg-night p-7 text-white sm:p-10">
      <div aria-hidden="true" className="absolute -right-20 -top-20 h-72 w-72 rounded-full border-[50px] border-white/5" />
      <p className="relative text-xs font-semibold uppercase tracking-[0.18em] text-gold">Votre avenir prend forme</p>
      <p className="relative mt-4 max-w-xs text-3xl font-extrabold leading-tight tracking-tight">Un potentiel.<br />Un chemin à construire.</p>
      <ol className="relative mt-9 space-y-6">
        {careerStages.map((stage, index) => (
          <li key={stage.title} className="relative flex gap-4">
            {index < careerStages.length - 1 ? <span aria-hidden="true" className="absolute left-[19px] top-11 h-full w-px bg-white/20" /> : null}
            <span aria-hidden="true" className={cn("relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold", index === 2 ? "bg-gold text-night" : "border border-white/25 bg-white/10 text-white")}>
              0{index + 1}
            </span>
            <div className="pt-0.5">
              <p className="text-sm font-bold">{stage.title}</p>
              <p className="mt-1 text-xs leading-5 text-white/70">{stage.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <figcaption className="relative mt-8 border-t border-white/15 pt-5 text-xs leading-5 text-white/70">
        La méthode CARRIOVA, à chaque étape de votre carrière.
      </figcaption>
    </figure>
  );
}
