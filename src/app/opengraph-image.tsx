import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "FindBack PH — Reunite lost & found items across the Philippines";
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
          background: "linear-gradient(180deg, #fbf6ef 0%, #ffffff 55%, #f1e5d3 100%)",
          color: "#2e2417",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              width: 84,
              height: 84,
              borderRadius: 20,
              background: "linear-gradient(180deg, #20948f, #0f7b72)",
              color: "#ffffff",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 48,
              fontWeight: 800,
            }}
          >
            F
          </div>
          <div style={{ fontSize: 46, fontWeight: 800, color: "#2e2417" }}>FindBack PH</div>
        </div>

        <div
          style={{
            marginTop: 28,
            fontSize: 64,
            fontWeight: 800,
            color: "#2e2417",
            textAlign: "center",
            lineHeight: 1.15,
          }}
        >
          Find what you lost.{"\n"}
          Return what you found.
        </div>

        <div
          style={{
            marginTop: 20,
            fontSize: 28,
            color: "#6b5636",
            textAlign: "center",
          }}
        >
          The community-powered lost &amp; found platform for the Philippines.
        </div>
      </div>
    ),
    size
  );
}