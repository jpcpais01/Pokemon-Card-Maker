import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
          borderRadius: 7,
        }}
      >
        <span style={{ fontSize: 20, fontWeight: 900, color: "#ffffff", fontFamily: "sans-serif" }}>P</span>
      </div>
    ),
    { ...size }
  );
}
