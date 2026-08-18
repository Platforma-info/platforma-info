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
          background: "#171717",
          borderRadius: 40,
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div
            style={{
              fontSize: 92,
              fontWeight: 700,
              color: "#ffffff",
              lineHeight: 1,
              fontFamily: "sans-serif",
            }}
          >
            P
          </div>
          <div
            style={{
              width: 46,
              height: 10,
              background: "#4f7cff",
              borderRadius: 5,
              marginTop: -6,
            }}
          />
        </div>
      </div>
    ),
    { ...size },
  );
}
