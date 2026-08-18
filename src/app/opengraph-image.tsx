import { ImageResponse } from "next/og";

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
          background: "#171717",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <div
            style={{
              width: 108,
              height: 108,
              borderRadius: 24,
              background: "#232323",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderTop: "17px solid transparent",
                  borderBottom: "17px solid transparent",
                  borderLeft: "22px solid #4f7cff",
                }}
              />
            </div>
          </div>
          <div
            style={{
              fontSize: 96,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: -2,
            }}
          >
            PyInfo
          </div>
        </div>
        <div
          style={{
            marginTop: 32,
            fontSize: 32,
            color: "#a1a1a1",
            textAlign: "center",
            maxWidth: 820,
          }}
        >
          Exersează algoritmi în Python. Primește verdict instant.
        </div>
      </div>
    ),
    { ...size },
  );
}
