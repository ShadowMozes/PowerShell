import type { BidInputs } from "./engine/bidding";

/** Per-viewer convenience: remember the last bidding scenario for a property in this browser. */
const key = (id: string) => `brickiq:scenario:${id}`;

export function saveScenario(id: string, inputs: BidInputs) {
  try {
    sessionStorage.setItem(key(id), JSON.stringify(inputs));
  } catch {
    /* storage unavailable (private mode) — non-critical */
  }
}

export function loadScenario(id: string): BidInputs | null {
  try {
    const raw = sessionStorage.getItem(key(id));
    if (!raw) return null;
    const v = JSON.parse(raw) as BidInputs;
    return typeof v.offer === "number" && typeof v.askingPrice === "number" ? v : null;
  } catch {
    return null;
  }
}

export function markPurchased(id: string) {
  try {
    sessionStorage.setItem(`brickiq:unlocked:${id}`, "1");
  } catch {
    /* ignore */
  }
}

export function isPurchased(id: string) {
  try {
    return sessionStorage.getItem(`brickiq:unlocked:${id}`) === "1";
  } catch {
    return false;
  }
}
