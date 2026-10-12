import { ImageResponse } from "next/og";

export const alt = "CARRIOVA — Révélez votre potentiel. Boostez votre carrière.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "58px 72px",
          background: "linear-gradient(120deg, #001252 0%, #031a72 100%)",
          color: "#ffffff",
          fontFamily: "sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ display: "flex", position: "absolute", right: -100, top: -140, width: 540, height: 540, borderRadius: "50%", border: "70px solid rgba(255,255,255,0.05)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 36 }}>
            <div style={{ display: "flex", width: 10, height: 16, borderRadius: 3, background: "#fe9c0c" }} />
            <div style={{ display: "flex", width: 10, height: 25, borderRadius: 3, background: "#fe9c0c" }} />
            <div style={{ display: "flex", width: 10, height: 36, borderRadius: 3, background: "#fe9c0c" }} />
          </div>
          <span style={{ fontSize: 38, fontWeight: 700, letterSpacing: 5 }}>CARRIOVA</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <span style={{ fontSize: 64, fontWeight: 700, letterSpacing: -2, lineHeight: 1.14 }}>Révélez votre potentiel.</span>
          <span style={{ fontSize: 64, fontWeight: 700, letterSpacing: -2, lineHeight: 1.14, color: "#fe9c0c" }}>Boostez votre carrière.</span>
          <span style={{ fontSize: 25, color: "#d3ddf3", marginTop: 16 }}>Une direction claire. Une candidature qui vous ressemble.</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 25 }}>
          <span style={{ fontSize: 22, color: "#d3ddf3" }}>CV · Lettres · Opportunités · Coaching</span>
          <span style={{ fontSize: 20, color: "#fe9c0c" }}>Votre prochain chapitre →</span>
        </div>
      </div>
    ),
    size,
  );
}
