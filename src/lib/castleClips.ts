// The castle footage, fetched once for the whole page, in the order it is seen. The intro gate waits
// for the first clip (its "Preparing" counter includes it) and the rest arrive while the intro plays,
// so nobody reaches the castle and finds a still frame. Clips are kept whole in memory and played from
// there — a video the scroll scrubs never "plays", so browsers stop streaming it and seeks stall.
// Safari won't play those in-memory copies, so there the fetch only warms the cache for the real file.

export const CLIPS = ["gate", "hall", "throne"] as const;
type Entry = { url: Promise<string>; loaded: number; total: number };

let started = false;
const entries: Entry[] = [];
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((f) => f());

export const isPhone = () => matchMedia("(max-aspect-ratio: 1/1), (max-width: 700px)").matches;
const isSafari = () => /^((?!chrome|chromium|android|crios|fxios|edg).)*safari/i.test(navigator.userAgent);
export const clipPath = (name: string) => `/castle/${name}${isPhone() ? "_m" : ""}`;

async function fetchClip(e: Entry, path: string): Promise<string> {
  try {
    const r = await fetch(path);
    e.total = Number(r.headers.get("content-length")) || e.total;
    const reader = r.body?.getReader();
    if (!reader) { const b = await r.blob(); e.loaded = e.total = b.size; notify(); return isSafari() ? path : URL.createObjectURL(b); }
    const parts: BlobPart[] = [];
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value); e.loaded += value.length; notify();
    }
    e.loaded = e.total = Math.max(e.loaded, 1); notify();
    return isSafari() ? path : URL.createObjectURL(new Blob(parts, { type: "video/mp4" }));
  } catch {
    e.loaded = e.total = 1; notify();
    return path;   // stream it the ordinary way
  }
}

/** Starts the downloads (once). */
export function loadCastle() {
  if (started || typeof window === "undefined") return;
  started = true;
  let chain: Promise<unknown> = Promise.resolve();
  CLIPS.forEach((name) => {
    const e: Entry = { url: Promise.resolve(""), loaded: 0, total: 1 };
    // one after another: the gate first, so it is never fighting the others for the line
    e.url = chain.then(() => fetchClip(e, `${clipPath(name)}.mp4`));
    chain = e.url;
    entries.push(e);
  });
}

/** Where to play clip i from, once it is in. */
export const clipUrl = (i: number) => { loadCastle(); return entries[i].url; };
/** 0…1 for clip i. */
export const clipProgress = (i: number) => (entries[i] ? Math.min(1, entries[i].loaded / Math.max(1, entries[i].total)) : 0);
export const onClipProgress = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f); }; };
