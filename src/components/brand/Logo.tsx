import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  variant?: "light" | "dark";
  withTagline?: boolean;
  href?: string;
  className?: string;
  markId?: string;
};

export function Logo({
  withTagline = false,
  href = "/",
  className = "",
}: LogoProps) {
  return (
    <Link href={href} className={`inline-flex shrink-0 rounded-md ${className}`} aria-label="CARRIOVA — Accueil">
      <Image
        src="/brand/carriova-logo-transparent.png"
        alt=""
        width={2172}
        height={724}
        priority={!withTagline}
        sizes={withTagline ? "(max-width: 768px) 224px, 256px" : "160px"}
        className={`block h-auto ${withTagline ? "w-56 sm:w-64" : "w-40 sm:w-44"}`}
      />
    </Link>
  );
}
