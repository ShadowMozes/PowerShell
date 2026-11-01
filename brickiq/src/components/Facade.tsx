import type { PropertyType } from "@/lib/types";

/**
 * Architectural illustrations used instead of photos. BrickIQ never shows
 * photos it does not have rights to, and does not fabricate "real" imagery.
 */
export type FacadeStyle = "canal" | "family" | "modern";

export function facadeFor(type: PropertyType, year: number): FacadeStyle {
  if (type === "apartment") return year < 1960 ? "canal" : "modern";
  return year >= 2005 ? "modern" : "family";
}

export function Facade({ style, className, title }: { style: FacadeStyle; className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 400 260" className={className} role="img" aria-label={title ?? "Architectural illustration"}>
      <defs>
        <linearGradient id={`sky-${style}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={style === "modern" ? "#dfe9e4" : "#efe5d3"} />
          <stop offset="1" stopColor="#f8f3ea" />
        </linearGradient>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#c9dcd5" />
          <stop offset="1" stopColor="#8fb3a6" />
        </linearGradient>
        <linearGradient id="glass-dark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5f7d74" />
          <stop offset="1" stopColor="#2f4a43" />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill={`url(#sky-${style})`} />
      <circle cx={style === "family" ? 330 : 70} cy="58" r="26" fill="#f3d9a7" opacity="0.55" />
      {style === "canal" && <Canal />}
      {style === "family" && <Family />}
      {style === "modern" && <Modern />}
    </svg>
  );
}

function Canal() {
  const win = (x: number, y: number, w = 22, h = 34) => (
    <g key={`${x}-${y}`}>
      <rect x={x} y={y} width={w} height={h} fill="#f7f1e4" />
      <rect x={x + 2.5} y={y + 2.5} width={w - 5} height={h - 5} fill="url(#glass-dark)" />
      <line x1={x + w / 2} y1={y + 2} x2={x + w / 2} y2={y + h - 2} stroke="#f7f1e4" strokeWidth="1.6" />
      <line x1={x + 2} y1={y + h / 2} x2={x + w - 2} y2={y + h / 2} stroke="#f7f1e4" strokeWidth="1.6" />
    </g>
  );
  return (
    <g>
      {/* neighbours */}
      <path d="M20 230V92l18-22 18 22v138z" fill="#c9b79b" />
      <path d="M300 230V70h20l10-20 10 20h20v160z" fill="#b9a07d" />
      <path d="M362 230V96l19-20 19 20v134z" fill="#d6c6aa" />
      {/* main house: bell gable */}
      <path
        d="M80 230V96c0-6 6-8 12-8h10c0-18 12-30 26-36 4-14 14-24 24-24s20 10 24 24c14 6 26 18 26 36h10c6 0 12 2 12 8v134z"
        fill="#7a3b2a"
      />
      <path d="M150 34c-6 0-10 4-10 10h20c0-6-4-10-10-10z" fill="#f7f1e4" />
      <rect x="146" y="20" width="8" height="10" fill="#4a2318" />
      {[0, 1, 2].map((c) => win(110 + c * 32, 104))}
      {[0, 1, 2].map((c) => win(110 + c * 32, 150))}
      <rect x="104" y="192" width="92" height="38" fill="#5d2a1d" />
      <rect x="138" y="198" width="24" height="32" rx="12" fill="#1f3b33" />
      {win(110, 200, 20, 26)}
      {win(170, 200, 20, 26)}
      <rect x="222" y="230" width="0" height="0" />
      {/* second house */}
      <path d="M222 230V82l20-30h36l20 30v148z" fill="#3f4b44" />
      {[0, 1].map((c) => win(236 + c * 32, 96))}
      {[0, 1].map((c) => win(236 + c * 32, 140))}
      {[0, 1].map((c) => win(236 + c * 32, 184))}
      {/* canal + quay */}
      <rect x="0" y="228" width="400" height="6" fill="#8d7a5f" />
      <rect x="0" y="234" width="400" height="26" fill="#6f8f88" />
      <path d="M0 244c40-4 60 4 100 0s60-4 100 0 60 4 100 0 60-4 100 0" stroke="#a8c3bc" strokeWidth="2" fill="none" opacity="0.7" />
      <path d="M40 252c40-3 60 3 100 0s60-3 100 0 60 3 100 0" stroke="#a8c3bc" strokeWidth="1.5" fill="none" opacity="0.5" />
      {/* tree */}
      <circle cx="44" cy="150" r="34" fill="#3f6b4f" opacity="0.9" />
      <circle cx="66" cy="170" r="24" fill="#4f7d5e" opacity="0.9" />
      <rect x="50" y="180" width="5" height="50" fill="#4a3a2a" />
    </g>
  );
}

function Family() {
  return (
    <g>
      <rect x="0" y="214" width="400" height="46" fill="#9cb58f" />
      <rect x="0" y="214" width="400" height="5" fill="#86a07a" />
      {/* hedge */}
      <rect x="20" y="198" width="70" height="20" rx="10" fill="#4f7d5e" />
      <rect x="300" y="200" width="84" height="18" rx="9" fill="#4f7d5e" />
      {/* house body */}
      <rect x="96" y="120" width="200" height="96" fill="#a5543a" />
      <path d="M84 124 196 54l112 70z" fill="#3a3f3c" />
      <path d="M84 124 196 54l112 70" fill="none" stroke="#2a2e2c" strokeWidth="3" />
      {/* dormer */}
      <rect x="170" y="88" width="52" height="30" fill="#f2ead9" />
      <rect x="176" y="94" width="40" height="20" fill="url(#glass)" />
      <path d="M164 90l32-16 32 16z" fill="#2f3431" />
      {/* bay window */}
      <path d="M112 216v-62l16-10h52l16 10v62z" fill="#f2ead9" />
      <rect x="122" y="156" width="20" height="44" fill="url(#glass)" />
      <rect x="146" y="156" width="20" height="44" fill="url(#glass)" />
      <rect x="170" y="156" width="20" height="44" fill="url(#glass)" />
      <rect x="112" y="146" width="84" height="5" fill="#2f3431" />
      {/* door */}
      <rect x="220" y="160" width="30" height="56" rx="2" fill="#1f4a3d" />
      <circle cx="244" cy="190" r="2" fill="#e8c77a" />
      <rect x="216" y="152" width="38" height="6" fill="#f2ead9" />
      {/* side window */}
      <rect x="262" y="160" width="24" height="34" fill="#f2ead9" />
      <rect x="265" y="163" width="18" height="28" fill="url(#glass)" />
      {/* chimney */}
      <rect x="250" y="64" width="16" height="36" fill="#8a432e" />
      {/* trees */}
      <circle cx="350" cy="140" r="38" fill="#3f6b4f" />
      <circle cx="326" cy="166" r="24" fill="#4f7d5e" />
      <rect x="348" y="168" width="6" height="48" fill="#4a3a2a" />
      <circle cx="42" cy="150" r="28" fill="#5d8a69" />
      <rect x="40" y="170" width="5" height="40" fill="#4a3a2a" />
      {/* path */}
      <path d="M226 216h22l14 44h-50z" fill="#d9cdb4" />
    </g>
  );
}

function Modern() {
  const floors = [0, 1, 2, 3, 4, 5, 6];
  return (
    <g>
      {/* background towers */}
      <rect x="18" y="80" width="70" height="160" fill="#c8d3cf" />
      <rect x="300" y="50" width="80" height="190" fill="#b9c7c2" />
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <rect key={i} x="308" y={62 + i * 22} width="64" height="10" fill="#d8e2de" />
      ))}
      {/* main tower */}
      <rect x="110" y="40" width="170" height="200" fill="#ece6da" />
      <rect x="110" y="40" width="170" height="8" fill="#2f3431" />
      {floors.map((i) => (
        <g key={i}>
          <rect x="122" y={56 + i * 26} width="146" height="18" fill="url(#glass)" />
          <rect x="116" y={74 + i * 26} width="158" height="4" fill="#2f3431" opacity="0.9" />
          <rect x="116" y={66 + i * 26} width="158" height="1.5" fill="#2f3431" opacity="0.35" />
          {[0, 1, 2, 3].map((j) => (
            <line key={j} x1={158 + j * 36} y1={56 + i * 26} x2={158 + j * 36} y2={74 + i * 26} stroke="#ece6da" strokeWidth="2" />
          ))}
        </g>
      ))}
      <rect x="110" y="40" width="34" height="200" fill="#c96f45" opacity="0.92" />
      {/* water */}
      <rect x="0" y="238" width="400" height="22" fill="#6f8f88" />
      <path d="M0 248c40-4 60 4 100 0s60-4 100 0 60 4 100 0 60-4 100 0" stroke="#a8c3bc" strokeWidth="2" fill="none" opacity="0.7" />
      <rect x="0" y="234" width="400" height="5" fill="#8d8a80" />
    </g>
  );
}
