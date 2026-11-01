"use client";

import { useMemo, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Segmented, cn } from "./ui";

/**
 * Lightweight slippy-map tile mosaic using official PDOK services:
 *  - BRT Achtergrondkaart (grijs) for the base map
 *  - Luchtfoto Actueel Ortho HR for aerial imagery
 * No map library is needed; works with touch and keeps bundles small.
 */
const LAYERS = {
  map: (z: number, x: number, y: number) =>
    `https://service.pdok.nl/brt/achtergrondkaart/wmts/v2_0/grijs/EPSG:3857/${z}/${x}/${y}.png`,
  aerial: (z: number, x: number, y: number) =>
    `https://service.pdok.nl/hwh/luchtfotorgb/wmts/v1_0/Actueel_orthoHR/EPSG:3857/${z}/${x}/${y}.jpeg`,
};

function lonLatToTile(lon: number, lat: number, z: number) {
  const n = 2 ** z;
  const x = ((lon + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

export function TileMap({
  lat,
  lon,
  label,
  approximate,
  className,
}: {
  lat: number;
  lon: number;
  label: string;
  approximate?: boolean;
  className?: string;
}) {
  const [zoom, setZoom] = useState(16);
  const [layer, setLayer] = useState<"map" | "aerial">("map");
  const [failed, setFailed] = useState(0);
  const TILE = 256;
  const COLS = 5;
  const ROWS = 4;

  const { tiles, offsetX, offsetY } = useMemo(() => {
    const t = lonLatToTile(lon, lat, zoom);
    const cx = Math.floor(t.x);
    const cy = Math.floor(t.y);
    const startX = cx - Math.floor(COLS / 2);
    const startY = cy - Math.floor(ROWS / 2);
    const list: { key: string; url: string; left: number; top: number }[] = [];
    for (let i = 0; i < COLS; i++)
      for (let j = 0; j < ROWS; j++) {
        const x = startX + i;
        const y = startY + j;
        list.push({ key: `${zoom}-${x}-${y}-${layer}`, url: LAYERS[layer](zoom, x, y), left: i * TILE, top: j * TILE });
      }
    // pixel position of the point within the mosaic
    const px = (t.x - startX) * TILE;
    const py = (t.y - startY) * TILE;
    return { tiles: list, offsetX: px, offsetY: py };
  }, [lat, lon, zoom, layer]);

  const unavailable = failed >= 6;

  return (
    <div className={cn("relative overflow-hidden rounded-3xl border border-line bg-ivory-2", className)}>
      <div
        className="absolute"
        style={{ left: `calc(50% - ${offsetX}px)`, top: `calc(50% - ${offsetY}px)`, width: COLS * TILE, height: ROWS * TILE }}
        aria-hidden
      >
        {!unavailable &&
          tiles.map((t) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={t.key}
              src={t.url}
              alt=""
              width={TILE}
              height={TILE}
              loading="lazy"
              draggable={false}
              onError={() => setFailed((f) => f + 1)}
              className="absolute select-none"
              style={{
                left: t.left,
                top: t.top,
                width: TILE,
                height: TILE,
                filter: layer === "map" ? "sepia(0.25) saturate(0.8) brightness(1.03)" : "saturate(0.9)",
              }}
            />
          ))}
      </div>
      {unavailable && (
        <div className="hairline absolute inset-0 grid place-items-center text-xs text-muted">Map tiles unavailable</div>
      )}
      {/* marker */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        {approximate ? (
          <div className="h-24 w-24 rounded-full border-2 border-dashed border-emerald/70 bg-emerald/10" />
        ) : (
          <div className="relative">
            <div className="absolute -inset-3 animate-ping rounded-full bg-emerald/25" />
            <div className="relative h-5 w-5 rounded-full border-[3px] border-paper bg-emerald shadow-lift" />
          </div>
        )}
      </div>
      <div className="absolute left-3 top-3 flex items-center gap-2">
        <Segmented
          label="Map layer"
          value={layer}
          onChange={(v) => {
            setFailed(0);
            setLayer(v);
          }}
          options={[
            { value: "map", label: "Map" },
            { value: "aerial", label: "Aerial" },
          ]}
          className="bg-paper/90 shadow-card backdrop-blur [&_button]:px-3 [&_button]:py-1 [&_button]:text-xs"
        />
      </div>
      <div className="absolute right-3 top-3 flex flex-col overflow-hidden rounded-2xl border border-line bg-paper/95 shadow-card">
        <button type="button" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(19, z + 1))} className="grid h-9 w-9 place-items-center hover:bg-ivory-2">
          <Plus className="h-4 w-4" />
        </button>
        <button type="button" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(11, z - 1))} className="grid h-9 w-9 place-items-center border-t border-line hover:bg-ivory-2">
          <Minus className="h-4 w-4" />
        </button>
      </div>
      <div className="absolute inset-x-3 bottom-3 flex items-end justify-between gap-2">
        <div className="rounded-xl bg-paper/95 px-3 py-1.5 text-xs font-medium shadow-card backdrop-blur">
          {label}
          {approximate && <span className="ml-1 text-muted">· approximate area</span>}
        </div>
        <div className="rounded-md bg-paper/80 px-1.5 py-0.5 text-[9px] text-muted">© Kadaster / PDOK</div>
      </div>
    </div>
  );
}
