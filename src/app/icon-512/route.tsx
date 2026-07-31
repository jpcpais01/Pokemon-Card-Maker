import { ImageResponse } from "next/og";

export async function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #7c3aed 0%, #d946ef 55%, #06b6d4 100%)",
          borderRadius: 106,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            display: "flex",
            width: 380,
            height: 380,
            top: -130,
            right: -110,
            borderRadius: 9999,
            background: "#ffffff",
            opacity: 0.22,
            filter: "blur(140px)",
          }}
        />
        <span style={{ fontSize: 300, fontWeight: 900, color: "#ffffff", fontFamily: "sans-serif" }}>P</span>
      </div>
    ),
    { width: 512, height: 512 }
  );
}
