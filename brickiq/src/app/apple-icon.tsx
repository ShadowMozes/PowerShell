import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div style={{ width: 180, height: 180, background: "#0d5642", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="120" height="120" viewBox="0 0 64 64">
          <path d="M14 46V28l18-12 18 12v18" fill="none" stroke="#f6f2e9" strokeWidth="4" strokeLinejoin="round" />
          <rect x="22" y="32" width="8" height="6" rx="1" fill="#f6f2e9" />
          <rect x="34" y="32" width="8" height="6" rx="1" fill="#f6f2e9" />
          <rect x="22" y="40" width="20" height="6" rx="1" fill="#2e9e78" />
        </svg>
      </div>
    ),
    size,
  );
}
