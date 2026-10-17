// Sound layer. All sounds are FFmpeg-generated files in /public/sfx.
// Plays only after the first user gesture and never while muted.
export type SfxName = "tick" | "whoosh" | "boom" | "confirm" | "braam" | "hit" | "thunder" | "rumble" | "riser";

const VOLUME: Record<SfxName, number> = {
  tick: 0.25, whoosh: 0.35, boom: 0.55, confirm: 0.4,
  braam: 0.7, hit: 0.6, thunder: 0.45, rumble: 0.6, riser: 0.45,
};
const cache = new Map<SfxName, HTMLAudioElement>();
let muted = false;
let unlocked = false;
let lastTick = 0;
let ambience: HTMLAudioElement | null = null;
let ambienceWanted = false;

if (typeof window !== "undefined") {
  const unlock = () => { unlocked = true; if (ambienceWanted) startAmbience(); };
  window.addEventListener("pointerdown", unlock, { once: true, passive: true });
  window.addEventListener("keydown", unlock, { once: true, passive: true });
}

export function isSfxMuted() {
  return muted;
}

export function setSfxMuted(m: boolean) {
  muted = m;
  if (ambience) {
    if (m) ambience.pause();
    else if (ambienceWanted && unlocked) ambience.play().catch(() => {});
  }
}

export function unlockAudio() {
  unlocked = true;
}

export function startAmbience() {
  ambienceWanted = true;
  if (typeof window === "undefined" || !unlocked) return;
  if (!ambience) {
    ambience = new Audio("/sfx/ambience.mp3");
    ambience.loop = true;
    ambience.volume = 0.35;
  }
  if (!muted) ambience.play().catch(() => {});
}

export function stopAmbience() {
  ambienceWanted = false;
  ambience?.pause();
}

export function playSfx(name: SfxName) {
  if (muted || !unlocked || typeof window === "undefined") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches && name !== "confirm") return;
  if (name === "tick") {
    const now = performance.now();
    if (now - lastTick < 70) return;
    lastTick = now;
  }
  let base = cache.get(name);
  if (!base) {
    base = new Audio(`/sfx/${name}.mp3`);
    base.preload = "auto";
    cache.set(name, base);
  }
  const a = base.cloneNode(true) as HTMLAudioElement;
  a.volume = VOLUME[name];
  a.play().catch(() => {});
}
