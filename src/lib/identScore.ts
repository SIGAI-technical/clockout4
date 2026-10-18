// Original sound for the opening, all synthesized in the browser:
//  • the gate: slow breathing behind a mask over a faint low drone
//  • the ident: a 10-second cue of war drums only (taiko, timpani, sub), nothing bright,
//    pre-rendered offline while the gate loads; its final hit lands at 7.2s.
import { isSfxMuted } from "./sfx";

let ctx: AudioContext | null = null;
/** The live audio context — or null where the browser has none (older iOS names it webkitAudioContext;
 *  some embedded browsers have neither). Sound is a nicety: without it the site must still run. */
const getCtx = (): AudioContext | null => {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  try { ctx = new AC(); } catch { return null; }
  return ctx;
};
const OAC = () => (typeof window === "undefined" ? undefined : window.OfflineAudioContext ?? (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext);
const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);
type Ctx = BaseAudioContext;

function noiseBuffer(c: Ctx, secs: number) {
  const buf = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * secs)), c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return buf;
}
function pinkBuffer(c: Ctx, secs: number) {
  const buf = c.createBuffer(1, Math.floor(c.sampleRate * secs), c.sampleRate);
  const d = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
    b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
    d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
  }
  return buf;
}
function reverb(c: Ctx, secs: number, decay = 3) {
  const len = Math.floor(c.sampleRate * secs);
  const buf = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
  }
  const v = c.createConvolver(); v.buffer = buf; return v;
}

export type Handle = { stop: (fade?: number) => void; time?: () => number };
const NOOP: Handle = { stop() {} };

/** A breather that can play into any context (live, or offline for checking). */
function makeBreather(c: Ctx, out: AudioNode, room: AudioNode) {
  // breath: pink noise through the resonances of an open mouth ("hhh"), then a mask's mild hollow box
  const mask = c.createGain();
  const hp = c.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 120;
  const box = c.createBiquadFilter(); box.type = "peaking"; box.frequency.value = 820; box.Q.value = 2.2; box.gain.value = 5;
  const lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 3200;
  mask.connect(hp).connect(box).connect(lp);
  const breathBus = c.createGain(); breathBus.gain.value = 0.95;
  lp.connect(breathBus); breathBus.connect(out); breathBus.connect(room);
  const air = pinkBuffer(c, 4);
  const flutter = noiseBuffer(c, 4);

  const breath = (at: number, dur: number, inhale: boolean) => {
    const n = c.createBufferSource(); n.buffer = air;
    const env = c.createGain();
    // vocal-tract formants: a tight "hee" drawn in, a relaxed "huh" let out
    const f = inhale ? [[420, 3, 1], [1900, 5, 0.5], [2700, 6, 0.25]] : [[560, 2.5, 1], [1150, 4, 0.55], [2450, 6, 0.2]];
    const sum = c.createGain();
    for (const [fr, q, g] of f) {
      const bp = c.createBiquadFilter(); bp.type = "bandpass"; bp.Q.value = q;
      bp.frequency.setValueAtTime(fr * (inhale ? 0.92 : 1.05), at); bp.frequency.linearRampToValueAtTime(fr * (inhale ? 1.06 : 0.94), at + dur);
      const gg = c.createGain(); gg.gain.value = g * 2.2; n.connect(bp).connect(gg).connect(sum);
    }
    const body = c.createBiquadFilter(); body.type = "lowpass"; body.frequency.value = 900;   // chest air underneath
    const bg = c.createGain(); bg.gain.value = inhale ? 0.25 : 0.5; n.connect(body).connect(bg).connect(sum);
    sum.connect(env).connect(mask);
    // turbulence: the airflow wavers a little
    const fl = c.createBufferSource(); fl.buffer = flutter;
    const fll = c.createBiquadFilter(); fll.type = "lowpass"; fll.frequency.value = 9;
    const fd = c.createGain(); fd.gain.value = inhale ? 0.12 : 0.18; fl.connect(fll).connect(fd).connect(env.gain);
    const peak = inhale ? 0.28 : 0.34;
    env.gain.setValueAtTime(0.0001, at);
    if (inhale) {   // a slow draw that builds, then stops abruptly
      env.gain.exponentialRampToValueAtTime(peak * 0.5, at + dur * 0.4);
      env.gain.exponentialRampToValueAtTime(peak, at + dur * 0.88);
      env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    } else {        // quick release, long tail
      env.gain.exponentialRampToValueAtTime(peak, at + 0.18);
      env.gain.exponentialRampToValueAtTime(peak * 0.45, at + dur * 0.55);
      env.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    }
    const off = Math.random() * 1.5;
    n.start(at, off); n.stop(at + dur + 0.05); fl.start(at, off); fl.stop(at + dur + 0.05);
  };
  return breath;
}

/* ── The gate: breathing through a mask ──────────────────────────────────── */

/** Armed immediately; audible once the browser allows sound (first click or key press). */
export function startOmen(): Handle {
  if (isSfxMuted() || typeof window === "undefined") return NOOP;
  const c = getCtx();
  if (!c) return NOOP;
  if (c.state === "suspended") c.resume().catch(() => {});
  const out = c.createGain(); out.gain.value = 0;
  out.gain.setTargetAtTime(0.42, c.currentTime + 0.1, 1.5);
  out.connect(c.destination);
  const room = reverb(c, 2.2, 4); const wet = c.createGain(); wet.gain.value = 0.22;
  room.connect(wet).connect(out);
  const nodes: AudioScheduledSourceNode[] = [];

  // faint drone, felt more than heard
  const dl = c.createBiquadFilter(); dl.type = "lowpass"; dl.frequency.value = 180;
  const dg = c.createGain(); dg.gain.value = 0.16; dl.connect(dg).connect(out);
  for (const [m, d] of [[26, -4], [26, 4], [38, 0], [39, 3]] as const) {
    const o = c.createOscillator(); o.type = "sawtooth"; o.frequency.value = hz(m); o.detune.value = d;
    const g = c.createGain(); g.gain.value = m === 39 ? 0.12 : 0.3; o.connect(g).connect(dl); o.start(); nodes.push(o);
  }

  const breath = makeBreather(c, out, room);
  // 5.2s cycle (matches the CSS breathing of the hood): inhale 1.7s, hold, exhale 2.1s, rest
  let next = c.currentTime + 0.6;
  const sched = () => {
    while (next < c.currentTime + 6) {
      breath(next, 1.6, true);
      breath(next + 1.95, 2.3, false);
      next += 5.2;
    }
  };
  sched();
  const iv = window.setInterval(sched, 1000);

  let alive = true;
  return {
    stop(fade = 1) {
      if (!alive) return; alive = false; clearInterval(iv);
      const now = c.currentTime;
      out.gain.cancelScheduledValues(now); out.gain.setValueAtTime(out.gain.value, now); out.gain.linearRampToValueAtTime(0, now + fade);
      setTimeout(() => { nodes.forEach((x) => { try { x.stop(); } catch { /* stopped */ } }); out.disconnect(); }, fade * 1000 + 300);
    },
  };
}

/* ── The ident cue ───────────────────────────────────────────────────────── */

const HIT = 7.2, LEN = 10.4;

function compose(c: OfflineAudioContext) {
  // nothing bright: the whole cue runs through a low-pass — war drums only
  const master = c.createGain(); master.gain.value = 0.8;
  const dark = c.createBiquadFilter(); dark.type = "lowpass"; dark.frequency.value = 1400; dark.Q.value = 0.4;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -12; comp.ratio.value = 4; comp.attack.value = 0.005; comp.release.value = 0.3;
  master.connect(dark).connect(comp).connect(c.destination);
  const hall = reverb(c, 3.8, 2.4); const wet = c.createGain(); wet.gain.value = 0.38;
  hall.connect(wet).connect(master);
  const send = (n: AudioNode, dry = 1, rev = 1) => {
    const d = c.createGain(); d.gain.value = dry; n.connect(d).connect(master);
    const r = c.createGain(); r.gain.value = rev; n.connect(r).connect(hall);
  };
  const noise = noiseBuffer(c, 3);

  const drum = (at: number, f0: number, f1: number, len: number, v: number, body = 260) => {
    const o = c.createOscillator(); o.frequency.setValueAtTime(f0, at); o.frequency.exponentialRampToValueAtTime(f1, at + len * 0.4);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(v, at + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    o.connect(g); send(g, 1, 0.55); o.start(at); o.stop(at + len + 0.05);
    const n = c.createBufferSource(); n.buffer = noise; const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = body;
    const ng = c.createGain(); ng.gain.setValueAtTime(v * 0.9, at); ng.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
    n.connect(f).connect(ng); send(ng, 1, 0.7); n.start(at, Math.random() * 2); n.stop(at + 0.25);
  };
  const taiko = (at: number, v: number) => drum(at, 120, 48, 0.9, v, 380);
  const bigDrum = (at: number, v: number) => drum(at, 80, 30, 1.8, v, 220);
  const timp = (at: number, midi: number, v: number) => drum(at, hz(midi) * 1.03, hz(midi), 1.4, v, 600);

  const sub = (at: number, v: number, len = 2.5) => {
    const o = c.createOscillator(); o.frequency.setValueAtTime(55, at); o.frequency.exponentialRampToValueAtTime(27, at + len);
    const g = c.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(v, at + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, at + len);
    o.connect(g).connect(master); o.start(at); o.stop(at + len + 0.05);
  };

  // 0–2.4: silence, then distant drums, far apart, getting closer
  bigDrum(0.3, 0.25); bigDrum(1.3, 0.38); bigDrum(1.95, 0.3);
  // 2.4–6.1: war drums at 92 bpm — a heavy, uneven pattern that tightens
  const B = 60 / 92;
  bigDrum(2.4, 0.9); sub(2.4, 0.45, 1.4);
  const pattern = [1, 0, 0, 0.6, 0, 0.5, 1, 0];
  let k = 0;
  for (let t = 2.4; t < 6.1; t += B / 2, k++) {
    const p = (t - 2.4) / (6.1 - 2.4);
    const hit = pattern[k % 8];
    if (hit) taiko(t, (0.35 + 0.35 * p) * hit);
    if (k % 8 === 0) { bigDrum(t, 0.55 + 0.3 * p); timp(t, 26, 0.35); }
    if (p > 0.5 && k % 2 === 1) taiko(t, 0.15 + 0.25 * p);   // the gaps fill in as it nears
  }
  // 6.1–7.2: the drums close in — sixteenths accelerating, a timpani roll underneath
  for (let t = 6.1, d = B / 4; t < HIT - 0.04; t += d, d = Math.max(0.055, d * 0.93)) {
    const p = (t - 6.1) / (HIT - 6.1);
    taiko(t, 0.25 + 0.5 * p);
  }
  for (let t = 6.1; t < HIT - 0.03; t += 0.05) timp(t, 26, 0.05 + 0.35 * Math.pow((t - 6.1) / (HIT - 6.1), 2));
  // 7.2: every drum at once, a sub drop, then silence broken by two last blows
  bigDrum(HIT, 1); taiko(HIT, 1); timp(HIT, 26, 0.9); sub(HIT, 0.95, 3.2);
  bigDrum(HIT + B * 2, 0.55); bigDrum(HIT + B * 3, 0.7); sub(HIT + B * 3, 0.5, 2);
}

let rendered: Promise<AudioBuffer | null> | null = null;

/** Renders the cue offline (~10s of audio) — call while the gate is up. */
export function preloadIdentScore() {
  if (typeof window === "undefined" || rendered) return;
  try {
    const Off = OAC();
    if (!Off) { rendered = Promise.resolve(null); return; }
    const off = new Off(2, Math.ceil(44100 * LEN), 44100);
    compose(off);
    rendered = off.startRendering().catch(() => null);
  } catch { rendered = Promise.resolve(null); }
}

/** Resolves once the cue has finished rendering (immediately if it already has). */
export function identScoreReady(): Promise<void> {
  preloadIdentScore();
  return (rendered ?? Promise.resolve(null)).then(() => {});
}

/** Plays the cue. `time()` is the cue's own clock (−1 until it is actually sounding). */
export function playIdentScore(): Handle {
  if (isSfxMuted() || typeof window === "undefined") return NOOP;
  preloadIdentScore();
  const c = getCtx();
  if (!c) return NOOP;
  if (c.state === "suspended") c.resume().catch(() => {});
  let start = -1, src: AudioBufferSourceNode | null = null, cancelled = false;
  const g = c.createGain(); g.connect(c.destination);
  rendered!.then((buf) => {
    if (!buf || cancelled) return;
    src = c.createBufferSource(); src.buffer = buf; src.connect(g);
    start = c.currentTime + 0.03; src.start(start);
  });
  return {
    time: () => (start < 0 || c.state !== "running" ? -1 : Math.max(0, c.currentTime - start)),
    stop(fade = 0.5) {
      cancelled = true;
      const now = c.currentTime;
      g.gain.cancelScheduledValues(now); g.gain.setValueAtTime(g.gain.value, now); g.gain.linearRampToValueAtTime(0, now + fade);
      setTimeout(() => { try { src?.stop(); } catch { /* stopped */ } g.disconnect(); }, fade * 1000 + 100);
    },
  };
}

/** Called on any gesture: lets a context created before interaction start sounding. */
export function resumeAudio() {
  if (ctx && ctx.state === "suspended") ctx.resume().catch(() => {});
}
// the live drums must work even if the intro was skipped: any tap or key wakes the context
if (typeof window !== "undefined") {
  const wake = () => { getCtx(); resumeAudio(); };
  ["pointerdown", "keydown", "touchend"].forEach((e) => addEventListener(e, wake, { passive: true }));
}

// dev-only hooks to render both sounds offline for inspection
if (typeof window !== "undefined" && process.env.NODE_ENV !== "production") {
  const w = window as unknown as Record<string, unknown>;
  w.__identWav = () => { preloadIdentScore(); return rendered; };
  w.__breathWav = () => {
    const off = new OfflineAudioContext(1, 44100 * 6, 44100);
    const out = off.createGain(); out.gain.value = 0.42; out.connect(off.destination);
    const room = reverb(off, 2.2, 4); const wet = off.createGain(); wet.gain.value = 0.22; room.connect(wet).connect(out);
    const b = makeBreather(off, out, room); b(0.2, 1.6, true); b(2.15, 2.3, false);
    return off.startRendering();
  };
}

/** One live war-drum hit (march steps, banners, the clash). `v` 0..1; `deep` lowers the pitch. */
export function drumHit(v = 0.5, deep = false) {
  if (isSfxMuted() || typeof window === "undefined") return;
  if (!ctx && !getCtx()) return;
  if (!ctx || ctx.state !== "running") return;
  const c = ctx, at = c.currentTime + 0.005;
  const out = c.createGain(); out.gain.value = 0.55 * v; out.connect(c.destination);
  const o = c.createOscillator();
  o.frequency.setValueAtTime(deep ? 80 : 120, at); o.frequency.exponentialRampToValueAtTime(deep ? 30 : 46, at + (deep ? 0.6 : 0.35));
  const g = c.createGain(); g.gain.setValueAtTime(0.0001, at); g.gain.exponentialRampToValueAtTime(1, at + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, at + (deep ? 1.6 : 0.8));
  o.connect(g).connect(out); o.start(at); o.stop(at + (deep ? 1.7 : 0.9));
  const n = c.createBufferSource(); n.buffer = noiseBuffer(c, 0.3);
  const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = deep ? 220 : 380;
  const ng = c.createGain(); ng.gain.setValueAtTime(0.9, at); ng.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
  n.connect(f).connect(ng).connect(out); n.start(at);
  setTimeout(() => out.disconnect(), 2000);
}
