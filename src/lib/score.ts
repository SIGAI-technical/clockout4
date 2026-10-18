// The site's sound, after the intro: a low ambient bed under the whole journey, and one-shot cues tied
// to the story (the hijack, Doom waking, his last word, the dive, the gate, the doors, the throne).
// Browsers only allow sound after a tap or key press — scrolling doesn't count — so everything waits
// for the first gesture; until then `needsGesture()` is true and the page can ask for one.
import { isSfxMuted } from "./sfx";

export type Cue = "hit" | "braam" | "boom" | "riser" | "thunder" | "rumble";
const LEVEL: Record<Cue, number> = { hit: 1.1, braam: 1.6, boom: 0.75, riser: 0.9, thunder: 0.8, rumble: 0.9 };
const BED_LEVEL = 1.5;   // the ambience file is mastered very quietly

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let bed: GainNode | null = null;
let bedSrc: AudioBufferSourceNode | null = null;
let bedTarget = 0;
const buffers = new Map<string, AudioBuffer>();
const loading = new Map<string, Promise<AudioBuffer | null>>();
let unlocked = false;
const listeners = new Set<() => void>();

function audioCtx(): AudioContext | null {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try { ctx = new AC(); } catch { return null; }
  master = ctx.createGain(); master.gain.value = isSfxMuted() ? 0 : 1; master.connect(ctx.destination);
  return ctx;
}

function load(name: string): Promise<AudioBuffer | null> {
  const c = audioCtx();
  if (!c) return Promise.resolve(null);
  if (buffers.has(name)) return Promise.resolve(buffers.get(name)!);
  if (!loading.has(name)) {
    loading.set(name, fetch(`/sfx/${name}.mp3`).then((r) => r.arrayBuffer()).then((a) => c.decodeAudioData(a))
      .then((b) => { buffers.set(name, b); return b; }).catch(() => null));
  }
  return loading.get(name)!;
}

function startBed() {
  const c = audioCtx();
  if (!c || bedSrc) return;
  load("ambience").then((b) => {
    if (!b || bedSrc || !master) return;
    bed = c.createGain(); bed.gain.value = 0; bed.connect(master);
    bedSrc = c.createBufferSource(); bedSrc.buffer = b; bedSrc.loop = true; bedSrc.connect(bed); bedSrc.start();
    bed.gain.setTargetAtTime(bedTarget, c.currentTime, 1.2);
  });
}

/** Called on the first tap/key: from here on the page can make sound. */
export function unlockScore() {
  const c = audioCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  if (!unlocked) {
    unlocked = true;
    (["hit", "braam", "boom", "riser", "thunder", "rumble"] as Cue[]).forEach(load);
    startBed();
    listeners.forEach((f) => f());
  }
}
if (typeof window !== "undefined") {
  const g = () => unlockScore();
  ["pointerdown", "keydown", "touchend"].forEach((e) => addEventListener(e, g, { passive: true }));
}

export const needsGesture = () => !unlocked;
export const onUnlock = (f: () => void) => { listeners.add(f); return () => { listeners.delete(f); }; };

/** How present the bed is, 0…1 (it eases there). */
export function setBed(level: number) {
  bedTarget = Math.max(0, level) * BED_LEVEL;
  if (ctx && bed) bed.gain.setTargetAtTime(bedTarget, ctx.currentTime, 0.8);
}

/** One cue, once. `v` scales its level. */
export function cue(name: Cue, v = 1) {
  if (!unlocked || isSfxMuted() || !ctx || !master || ctx.state !== "running") return;
  const b = buffers.get(name);
  if (!b) { load(name); return; }
  const g = ctx.createGain(); g.gain.value = LEVEL[name] * v; g.connect(master);
  const s = ctx.createBufferSource(); s.buffer = b; s.connect(g); s.start();
  s.onended = () => g.disconnect();
}

/** Follows the mute button. */
export function setScoreMuted(m: boolean) {
  if (ctx && master) master.gain.setTargetAtTime(m ? 0 : 1, ctx.currentTime, 0.15);
}
