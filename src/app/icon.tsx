import { ImageResponse } from "next/og";

// Generated PNG favicon (reliable across browsers, incl. Safari) — the
// TradeNotti chart-line mark, no wordmark.
export const size = { width: 64, height: 64 };
export const contentType = "image/png";

const LINE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none"><polyline points="12,76 25,60 38,68 51,52 65,60 78,56 91,60 104,44" stroke="#5b4ef5" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="78" cy="56" r="7" fill="#ffffff" stroke="#5b4ef5" stroke-width="5"/><circle cx="104" cy="44" r="13" fill="#5b4ef5" opacity="0.18"/><circle cx="104" cy="44" r="7" fill="#5b4ef5"/></svg>`;

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#ffffff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          width="64"
          height="64"
          src={`data:image/svg+xml;utf8,${encodeURIComponent(LINE_SVG)}`}
          alt=""
        />
      </div>
    ),
    size,
  );
}
