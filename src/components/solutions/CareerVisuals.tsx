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
    <figure className="overflow-hidden rounded-xl border border-night/10 bg-[#ebe6dc] px-5 pb-5 pt-6 sm:px-9 sm:pt-9">
      <div className="mb-5 flex items-center justify-between gap-4 text-[0.6rem] font-semibold uppercase tracking-[0.16em] text-muted">
        <span>Le fond et la forme</span>
        <span>{isCv ? "Document 01" : "Document 02"}</span>
      </div>
      <div className="mx-auto max-w-sm border border-night/15 bg-[#fffefa] p-6 sm:p-8">
        <div className="flex items-center justify-between gap-4 border-b border-night/20 pb-5">
          <span className="text-[0.65rem] font-extrabold tracking-[0.16em] text-night">CARRIOVA</span>
          <span className="text-[0.6rem] font-semibold uppercase tracking-[0.12em] text-[#bd470d]">{isCv ? "Curriculum vitæ" : "Lettre de motivation"}</span>
        </div>
        <p className="font-editorial mt-7 text-3xl font-normal italic leading-tight text-night">
          {isCv ? "Votre prochain chapitre." : "Une candidature qui vous ressemble."}
        </p>
        <p className="mt-3 text-xs leading-5 text-muted">{isCv ? "Un parcours lisible. Des preuves à l’appui." : "Votre profil, relié à une opportunité précise."}</p>
        <div className="mt-7 space-y-5">
          {documentSections[variant].map((section, index) => (
            <div key={section.title} className="grid grid-cols-[1.25rem_1fr] gap-2 border-t border-night/10 pt-4">
              <span aria-hidden="true" className="pt-0.5 text-[0.6rem] text-[#bd470d]">0{index + 1}</span>
              <div>
                <p className="text-xs font-bold text-night">{section.title}</p>
                <p className="mt-1 text-xs leading-5 text-muted">{section.text}</p>
              </div>
            </div>
          ))}
        </div>
        <p className="mt-7 border-t border-night/20 pt-4 text-[0.6rem] font-medium leading-5 text-[#bd470d]">Clair, personnel et adapté à votre objectif.</p>
      </div>
      <figcaption className="mt-4 text-center text-[0.65rem] leading-5 text-muted">
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
    <figure className="rounded-xl border border-night/10 bg-[#ebe6dc] p-7 text-night sm:p-10">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.17em] text-[#bd470d]">Votre avenir prend forme</p>
      <p className="font-editorial mt-5 text-5xl font-normal italic leading-[1.05]">Un potentiel.<br />Un chemin à construire.</p>
      <ol className="mt-9">
        {careerStages.map((stage, index) => (
          <li key={stage.title} className="grid grid-cols-[2rem_1fr] gap-4 border-t border-night/20 py-5">
            <span aria-hidden="true" className="pt-0.5 text-xs font-semibold text-[#bd470d]">0{index + 1}</span>
            <div>
              <p className="text-sm font-semibold">{stage.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{stage.text}</p>
            </div>
          </li>
        ))}
      </ol>
      <figcaption className="mt-2 border-t border-night/20 pt-5 text-xs leading-6 text-muted">La méthode CARRIOVA, à chaque étape de votre carrière.</figcaption>
    </figure>
  );
}
