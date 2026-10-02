import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CARRIOVA",
    short_name: "CARRIOVA",
    description: "Révélez votre potentiel. Boostez votre carrière.",
    start_url: "/",
    display: "standalone",
    background_color: "#001252",
    theme_color: "#001252",
    lang: "fr",
    icons: [{ src: "/brand/mark.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
