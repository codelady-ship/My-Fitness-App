import { ImageResponse } from "next/og";

export const alt = "Pulsa: your personal heart coach. Glass cards with a heart-rate gauge on a pale blue background.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Generated Open Graph card (no binary asset to keep in sync). */
export default function OgImage() {
  const ticks = Array.from({ length: 30 }, (_, i) => {
    const a = ((190 - (i * 200) / 29) * Math.PI) / 180;
    return { x1: 150 + 96 * Math.cos(a), y1: 150 - 96 * Math.sin(a), x2: 150 + 116 * Math.cos(a), y2: 150 - 116 * Math.sin(a), lit: i < 22 };
  });
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "70px 80px",
          background: "linear-gradient(135deg, #f6f8fd 0%, #e3eaf7 100%)",
          color: "#16213a",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 30, fontWeight: 800, letterSpacing: 4 }}>
            <div style={{ display: "flex", width: 54, height: 54, borderRadius: 16, background: "#ff6a55", color: "#fff", alignItems: "center", justifyContent: "center" }}>P</div>
            PULSA
          </div>
          <div style={{ display: "flex", flexDirection: "column", marginTop: 40, fontSize: 104, fontWeight: 900, lineHeight: 0.92, letterSpacing: -4 }}>
            <span>FIRST</span>
            <span>PERSONAL</span>
            <span style={{ color: "#ff6a55" }}>HEART</span>
            <span>COACH</span>
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: 380,
            padding: 30,
            borderRadius: 36,
            background: "linear-gradient(150deg, rgba(150,168,214,.55), rgba(96,116,170,.38))",
            border: "2px solid rgba(255,255,255,.7)",
          }}
        >
          <div style={{ display: "flex", fontSize: 24, fontWeight: 600, alignSelf: "flex-start" }}>Cardio Insights</div>
          <svg width="300" height="190" viewBox="0 0 300 190">
            {ticks.map((t, i) => (
              <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke={t.lit ? "#ff6a55" : "rgba(22,33,58,.18)"} strokeWidth="6" strokeLinecap="round" />
            ))}
          </svg>
          <div style={{ display: "flex", marginTop: -100, fontSize: 76, fontWeight: 900 }}>72</div>
          <div style={{ display: "flex", fontSize: 20, opacity: 0.65 }}>resting bpm</div>
        </div>
      </div>
    ),
    size,
  );
}
