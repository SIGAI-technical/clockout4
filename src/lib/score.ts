// The site's sound, after the intro: a low ambient bed under the whole journey, and one-shot cues tied
// to the story (the hijack, Doom waking, his last word, the dive, the gate, the doors, the throne).
// Browsers only allow sound after a tap or key press — scrolling doesn't count — so everything waits
// for the first gesture; until then `needsGesture()` is true and the page can ask for one.
import { isSfxMuted } from "./sfx";

export type Cue = "hit" | "braam" | "boom" | "riser" | "thunder" | "rumble";
const LEVEL: Record<Cue, number> = { hit: 1.1, braam: 1.6, boom: 0.75, riser: 0.9, thunder: 0.8, rumble: 0.9 };
const BED_LEVEL = 1.5;   // the ambience file is mastered very quietly
// The music (public/audio/5a.mp3) under the castle and what follows. Set to false to go without it.
// Its first LINE_END seconds are Doom's "For I am Doom", played once in the throne room; the rest is
// the theme, which is what loops.
export const MUSIC_ON = true;
const MUSIC_LEVEL = 0.32, MUSIC_XFADE = 4, LINE_END = 11, LINE_LEVEL = 0.6;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let bed: GainNode | null = null;
let bedSrc: AudioBufferSourceNode | null = null;
let bedTarget = 0;
let music: GainNode | null = null;
let musicTarget = 0;
let duck: GainNode | null = null;
let linePlayed = false;
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

function load(name: string, url = `/sfx/${name}.mp3`): Promise<AudioBuffer | null> {
  const c = audioCtx();
  if (!c) return Promise.resolve(null);
  if (buffers.has(name)) return Promise.resolve(buffers.get(name)!);
  if (!loading.has(name)) {
    loading.set(name, fetch(url).then((r) => r.arrayBuffer()).then((a) => c.decodeAudioData(a))
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

/* The theme fades out at its end, so it is looped with overlapping copies: each new one starts
   MUSIC_XFADE seconds before the last finishes, ramping up as the other ramps down. */
function startMusic() {
  const c = audioCtx();
  if (!c || music || !MUSIC_ON) return;
  load("music", "/audio/5a.mp3").then((b) => {
    if (!b || music || !master) return;
    duck = c.createGain(); duck.connect(master);
    music = c.createGain(); music.gain.value = 0; music.connect(duck);
    const len = b.duration - LINE_END;
    const play = (at: number) => {
      const g = c.createGain(); g.connect(music!);
      g.gain.setValueAtTime(0, at); g.gain.linearRampToValueAtTime(1, at + MUSIC_XFADE);
      g.gain.setValueAtTime(1, at + len - MUSIC_XFADE); g.gain.linearRampToValueAtTime(0, at + len);
      const s = c.createBufferSource(); s.buffer = b; s.connect(g); s.start(at, LINE_END, len); s.onended = () => g.disconnect();
      const next = at + len - MUSIC_XFADE;
      window.setTimeout(() => play(next), (next - c.currentTime - 1) * 1000);
    };
    play(c.currentTime + 0.05);
    music.gain.setTargetAtTime(musicTarget, c.currentTime, 1.5);
  });
}

/** How present the music is, 0…1 (it eases there). */
export function setMusic(level: number) {
  musicTarget = Math.max(0, level) * MUSIC_LEVEL;
  if (ctx && music) music.gain.setTargetAtTime(musicTarget, ctx.currentTime, 1.2);
}

/** "For I am Doom": once per visit, with the theme ducked underneath it. */
export function doomLine() {
  if (linePlayed || !unlocked || isSfxMuted() || !ctx || !master || !duck || ctx.state !== "running") return;
  const b = buffers.get("music");
  if (!b) return;
  linePlayed = true;
  const t = ctx.currentTime;
  const g = ctx.createGain(); g.gain.value = LINE_LEVEL; g.connect(master);
  g.gain.setValueAtTime(LINE_LEVEL, t + LINE_END - 0.6); g.gain.linearRampToValueAtTime(0, t + LINE_END);
  const s = ctx.createBufferSource(); s.buffer = b; s.connect(g); s.start(t, 0, LINE_END); s.onended = () => g.disconnect();
  duck.gain.setTargetAtTime(0.2, t, 0.3);
  duck.gain.setTargetAtTime(1, t + LINE_END - 1.5, 1);
}

/** Called on the first tap/key: from here on the page can make sound. */
export function unlockScore() {
  const c = audioCtx();
  if (!c) return;
  if (c.state === "suspended") c.resume().catch(() => {});
  if (!unlocked) {
    unlocked = true;
    (["hit", "braam", "boom", "thunder", "rumble"] as Cue[]).forEach((n) => load(n));
    startBed();
    startMusic();
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
  const why = !unlocked ? "locked" : isSfxMuted() ? "muted" : !ctx || !master ? "no-ctx" : ctx.state !== "running" ? ctx.state : !buffers.get(name) ? "not-loaded" : "";
  trace(name + (why ? ` (skipped: ${why})` : ""));
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

// development only: a trail of cues, for checking the score without listening to it
function trace(s: string) {
  if (process.env.NODE_ENV === "production" || typeof window === "undefined") return;
  const w = window as unknown as { __cues?: string[] };
  (w.__cues ??= []).push(s);
}
