import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Mirrors the RoomCode component's signature boxed-character motif — the
// favicon IS a single room-code box, not a generic wordmark letter.
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
          background: "#1e1729",
          border: "2px solid #ff6b35",
          borderRadius: 7,
          color: "#ff6b35",
          fontSize: 20,
          fontWeight: 800,
        }}
      >
        P
      </div>
    ),
    { ...size },
  );
}
