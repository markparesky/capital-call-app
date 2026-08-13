import { ImageResponse } from "next/og";

// Browser-tab favicon — a simplified version of the Home Screen icon.

export const size = { width: 64, height: 64 };
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
          borderRadius: 14,
          background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
          color: "#ffffff",
          fontSize: 40,
          fontWeight: 700,
        }}
      >
        $
      </div>
    ),
    { ...size }
  );
}
