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
          background: "#15101e",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 108,
            height: 108,
            alignItems: "center",
            justifyContent: "center",
            background: "#1e1729",
            border: "6px solid #ff6b35",
            borderRadius: 28,
            color: "#ff6b35",
            fontSize: 64,
            fontWeight: 800,
          }}
        >
          P
        </div>
      </div>
    ),
    { ...size },
  );
}
