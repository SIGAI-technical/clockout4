import { EVENT } from "@/config/event";

/** Which side the visitor took: kneel to Doom, or resist him. */
export type Side = "kneel" | "resist";

const KEY = "co4-side";

export function loadSide(): Side | null {
  try { const v = localStorage.getItem(KEY); return v === "kneel" || v === "resist" ? v : null; } catch { return null; }
}
export function saveSide(s: Side | null) {
  try { if (s) localStorage.setItem(KEY, s); else localStorage.removeItem(KEY); } catch { /* ignore */ }
  // the whole site re-themes from this one attribute
  if (s) document.documentElement.dataset.side = s; else delete document.documentElement.dataset.side;
}

/* ── The live tally: a Google Apps Script web app (docs/side-tally.md) ──────────────────────────────
   GET  → {"kneel": n, "resist": n}
   POST → body "kneel" | "resist" (plain text, so the browser sends it without a preflight)       */
export type Tally = { kneel: number; resist: number };

export async function fetchTally(): Promise<Tally | null> {
  if (!EVENT.tallyUrl) return null;
  try {
    const r = await fetch(EVENT.tallyUrl, { cache: "no-store" });
    const j = await r.json();
    return typeof j.kneel === "number" && typeof j.resist === "number" ? { kneel: j.kneel, resist: j.resist } : null;
  } catch { return null; }
}

/** Count a visitor once per browser; switching sides moves their vote. */
export async function castVote(s: Side, previous: Side | null) {
  if (!EVENT.tallyUrl || s === previous) return;
  try {
    await fetch(EVENT.tallyUrl, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: previous ? `${s}:from:${previous}` : s });
  } catch { /* the tally is a nicety; never block on it */ }
}
