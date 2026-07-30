import { ImageResponse } from "next/og";

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
          alignItems: "center",
          justifyContent: "center",
          background: "#05060f",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            display: "flex",
            width: 620,
            height: 620,
            top: -180,
            left: -140,
            borderRadius: 9999,
            background: "#fbbf24",
            opacity: 0.5,
            filter: "blur(120px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            display: "flex",
            width: 620,
            height: 620,
            top: -160,
            right: -180,
            borderRadius: 9999,
            background: "#8b5cf6",
            opacity: 0.45,
            filter: "blur(120px)",
          }}
        />
        <div
          style={{
            position: "absolute",
            display: "flex",
            width: 560,
            height: 560,
            bottom: -260,
            left: 300,
            borderRadius: 9999,
            background: "#2dd4bf",
            opacity: 0.4,
            filter: "blur(120px)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <div
            style={{
              display: "flex",
              width: 156,
              height: 156,
              borderRadius: 36,
              background: "linear-gradient(135deg, #fbbf24 0%, #f97316 100%)",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 24px 70px rgba(251,146,60,0.45)",
            }}
          >
            <span style={{ fontSize: 96, fontWeight: 900, color: "#0f172a", fontFamily: "sans-serif" }}>P</span>
          </div>
          <span style={{ fontSize: 108, fontWeight: 900, color: "#ffffff", fontFamily: "sans-serif" }}>PokeGen</span>
        </div>

        <span style={{ display: "flex", marginTop: 32, fontSize: 34, color: "#cbd5e1", fontFamily: "sans-serif" }}>
          Open a pack. Get one-of-a-kind AI Pokemon TCG artwork.
        </span>
      </div>
    ),
    { ...size }
  );
}
