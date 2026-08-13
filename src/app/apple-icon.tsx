import { ImageResponse } from "next/og";

// Home Screen icon (iOS picks this up automatically as apple-touch-icon).
// Rendered at build time — a white credit card and gold dollar coin on a
// blue→violet gradient. iOS applies its own corner rounding.

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
          background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
        }}
      >
        {/* credit card */}
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 22,
            width: 122,
            height: 82,
            borderRadius: 14,
            background: "#ffffff",
            transform: "rotate(-9deg)",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
          }}
        >
          {/* magnetic stripe */}
          <div
            style={{
              marginTop: 16,
              width: "100%",
              height: 16,
              background: "#c7d2fe",
              display: "flex",
            }}
          />
          {/* card number dashes */}
          <div style={{ display: "flex", marginTop: 14, marginLeft: 14, gap: 7 }}>
            <div style={{ width: 18, height: 7, borderRadius: 4, background: "#94a3b8", display: "flex" }} />
            <div style={{ width: 18, height: 7, borderRadius: 4, background: "#94a3b8", display: "flex" }} />
            <div style={{ width: 18, height: 7, borderRadius: 4, background: "#94a3b8", display: "flex" }} />
          </div>
        </div>
        {/* dollar coin */}
        <div
          style={{
            position: "absolute",
            right: 24,
            bottom: 22,
            width: 68,
            height: 68,
            borderRadius: 34,
            background: "#fbbf24",
            border: "6px solid #ffffff",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#92400e",
            fontSize: 42,
            fontWeight: 700,
            boxShadow: "0 6px 14px rgba(0,0,0,0.3)",
          }}
        >
          $
        </div>
      </div>
    ),
    { ...size }
  );
}
