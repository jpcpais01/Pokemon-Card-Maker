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
          background: "linear-gradient(135deg, #fbbf24 0%, #f97316 100%)",
          borderRadius: 40,
        }}
      >
        <span style={{ fontSize: 120, fontWeight: 900, color: "#0f172a", fontFamily: "sans-serif" }}>P</span>
      </div>
    ),
    { width: 192, height: 192 }
  );
}
