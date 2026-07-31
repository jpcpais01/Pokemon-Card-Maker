import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            display: "flex",
            width: 130,
            height: 130,
            top: -50,
            right: -40,
            borderRadius: 9999,
            background: "#ffffff",
            opacity: 0.22,
            filter: "blur(50px)",
          }}
        />
        <span style={{ fontSize: 112, fontWeight: 900, color: "#ffffff", fontFamily: "sans-serif" }}>P</span>
      </div>
    ),
    { ...size }
  );
}
