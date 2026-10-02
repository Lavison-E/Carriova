import Link from "next/link";

type LogoProps = {
  variant?: "light" | "dark";
  withTagline?: boolean;
  href?: string;
  className?: string;
  markId?: string;
};

export function Mark({
  className = "h-10 w-10",
  idPrefix = "mark",
}: {
  className?: string;
  idPrefix?: string;
}) {
  const blue = `${idPrefix}-blue`;
  const orange = `${idPrefix}-orange`;
  return (
    <svg
      className={className}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M62.4 22.8C57.2 12.6 46.6 6.2 34.8 6.2 17.6 6.2 4 20.1 4 40c0 19.9 13.6 33.8 30.8 33.8 11.8 0 22.4-6.4 27.6-16.6l-11.2-5.4c-3 5.6-9 9.2-16.4 9.2-11.1 0-18.6-8.2-18.6-21 0-12.8 7.5-21 18.6-21 7.3 0 13.3 3.6 16.4 9.1l11.2-5.3z"
        fill={`url(#${blue})`}
      />
      <path
        d="M28.5 27.2c6.8-8.4 20.2-7.2 26.4 1.4 3.4 4.7 4.1 10.6 2.4 16.1-1.6 5.2-5.6 9.2-10.8 11.2-7.8 3-16.2.2-20.6-6.6 5.4 1.8 11.6.2 15.4-4.2 3.6-4.1 3.6-10.2-.2-14.1-2.6-2.6-6.6-3.4-10.2-2.1-1 .4-2.4-1-2.4-1.7z"
        fill={`url(#${orange})`}
      />
      <defs>
        <linearGradient id={blue} x1="8" y1="6" x2="62" y2="74" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4DA3FF" />
          <stop offset="0.38" stopColor="#0348D6" />
          <stop offset="1" stopColor="#031AA3" />
        </linearGradient>
        <linearGradient id={orange} x1="18" y1="28" x2="58" y2="62" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFB000" />
          <stop offset="0.45" stopColor="#FE9C0C" />
          <stop offset="1" stopColor="#EE5E08" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function Wordmark({ light, large }: { light: boolean; large: boolean }) {
  return (
    <span
      className={`relative inline-flex items-baseline font-extrabold leading-none tracking-tight ${
        large ? "text-[1.7rem] sm:text-[1.85rem]" : "text-[1.45rem]"
      } ${light ? "text-white" : "text-night"}`}
      style={{ letterSpacing: "-0.045em" }}
    >
      <span>CARRIOV</span>
      <span className="relative inline-block pr-[0.02em]">
        A
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-[14%] right-0 h-[72%] w-[46%]"
          style={{
            background: "linear-gradient(180deg, #FFB000 0%, #FE9C0C 45%, #EE5E08 100%)",
            clipPath: "polygon(22% 0, 100% 0, 100% 100%, 0 100%)",
          }}
        />
      </span>
    </span>
  );
}

export function Logo({
  variant = "dark",
  withTagline = false,
  href = "/",
  className = "",
  markId,
}: LogoProps) {
  const light = variant === "light";
  const idPrefix = markId ?? variant;
  const content = (
    <span className={`inline-flex shrink-0 items-center gap-2.5 ${className}`}>
      <Mark className={withTagline ? "h-12 w-12 shrink-0" : "h-10 w-10 shrink-0"} idPrefix={idPrefix} />
      <span className="flex min-w-0 flex-col leading-none">
        <Wordmark light={light} large={withTagline} />
        {withTagline ? (
          <span
            className={`mt-1.5 max-w-[17rem] text-[0.62rem] font-medium tracking-wide sm:text-[0.68rem] ${
              light ? "text-white/80" : "text-royal"
            }`}
          >
            Révélez votre potentiel. Boostez votre carrière.
          </span>
        ) : null}
      </span>
    </span>
  );

  if (!href) return content;
  return (
    <Link href={href} className="inline-flex shrink-0 rounded-md" aria-label="CARRIOVA — Accueil">
      {content}
    </Link>
  );
}
