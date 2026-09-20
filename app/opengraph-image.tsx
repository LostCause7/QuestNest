import { ImageResponse } from "next/og";

export const alt = "QuestNest - Chores become quests";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "linear-gradient(135deg, #2a1a6e 0%, #5b3fd1 55%, #7b5cf0 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 40,
            }}
          >
            ⭐
          </div>
          <div style={{ display: "flex", fontSize: 44, fontWeight: 700 }}>
            <span>Quest</span>
            <span style={{ color: "#ffd166" }}>Nest</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: -2 }}>
            <span>Chores become quests.</span>
            <span style={{ color: "#ffd166" }}>Kids actually want to do them.</span>
          </div>
          <div style={{ fontSize: 30, opacity: 0.8 }}>Points · reward shop · streaks · trophies. Parents set every rule.</div>
        </div>
      </div>
    ),
    size
  );
}
