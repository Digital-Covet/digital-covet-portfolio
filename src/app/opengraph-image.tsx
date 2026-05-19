import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Digital Covet Portfolio";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    <div
      style={{
        fontSize: 64,
        background: "linear-gradient(to bottom right, #1a1a2e, #16213e)",
        color: "white",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "40px",
      }}
    >
      <div
        style={{
          fontSize: 120,
          fontWeight: 700,
          marginBottom: "20px",
          fontFamily: "var(--font-jost)",
        }}
      >
        DC
      </div>
      <div
        style={{
          fontSize: 32,
          fontFamily: "var(--font-rubik)",
          opacity: 0.9,
        }}
      >
        Digital Covet Portfolio
      </div>
    </div>,
    {
      ...size,
    }
  );
}