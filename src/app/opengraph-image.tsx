import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Daisy Weekly — Weekly student matchmaking in Montreal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
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
          backgroundColor: "#FFFDF7",
          fontFamily: "serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <svg width="56" height="56" viewBox="0 0 100 100" fill="none">
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <g key={angle} transform={`rotate(${angle} 50 50)`}>
                <ellipse cx="50" cy="27" rx="9" ry="18" fill="#6B7F5E" opacity="0.7" />
              </g>
            ))}
            <circle cx="50" cy="50" r="8" fill="#D4B978" />
          </svg>
          <span style={{ fontSize: "48px", color: "#2A2F2A", fontWeight: 400 }}>
            Daisy Weekly
          </span>
        </div>
        <p
          style={{
            fontSize: "28px",
            color: "#6B7F5E",
            textAlign: "center",
            maxWidth: "700px",
            lineHeight: 1.4,
          }}
        >
          One thoughtful match, every Wednesday.
        </p>
        <p
          style={{
            fontSize: "20px",
            color: "#8A8E87",
            marginTop: "12px",
          }}
        >
          Student matchmaking in Montreal
        </p>
      </div>
    ),
    { ...size },
  );
}
