"use client";

import { useEffect, useRef } from "react";
import { drumHit } from "@/lib/identScore";
import { EVENT, formEmbedUrl } from "@/config/event";
import { Field, type Cam, type FigDef } from "./Field";
import Bolt, { type BoltHandle } from "./Bolt";
import META from "../../../public/battle/meta.json";

/* ── A film, not a march ───────────────────────────────────────────────────────────────────────────
   The scroll is cut into shots. Inside a shot the figures hold still and the camera does the work:
   a push, a tilt, a few degrees of orbit (each figure has a depth map, so near parts slide past far
   parts). Between shots: a hard cut on a drum hit. Doom's lines arrive as title cards; the event
   details as his decrees, one per shot. The viewer holds the light.                              */
export const P = { CLASH: 0.86, FORM: 0.93 };
export const FORM_AT = 0.975;

const G = (r: number, g: number, b: number): [number, number, number] => [r, g, b];
const DEFS: FigDef[] = [
  { key: "sent1", id: "sentinel", rank: 0, fx: [{ kind: "eyes", x: 0.33, y: 0.05, size: 0.1, color: G(1, 0.12, 0.08) }] },
  { key: "sent2", id: "sentinel", rank: 0, mirror: true, fx: [{ kind: "eyes", x: 0.33, y: 0.05, size: 0.1, color: G(1, 0.12, 0.08) }] },
  { key: "profx", id: "profx", rank: 0, fx: [{ kind: "halo", x: 0.5, y: 0.17, size: 0.55, color: G(0.6, 0.38, 1) }] },
  { key: "shangchi", id: "shangchi", rank: 0, fx: [{ kind: "rings", x: 0.62, y: 0.14, size: 0.42, color: G(1, 0.68, 0.22) }, { kind: "rings", x: 0.22, y: 0.42, size: 0.36, color: G(1, 0.6, 0.18) }] },
  { key: "gambit", id: "gambit", rank: 0, fx: [{ kind: "cards", x: 0.48, y: 0.55, size: 0.45, color: G(1, 0.25, 0.75) }] },
  { key: "hulk", id: "hulk", rank: 1, fx: [{ kind: "glow", x: 0.45, y: 0.32, size: 0.6, color: G(0.08, 0.35, 0.12) }] },
  { key: "strange", id: "strange", rank: 1, fx: [{ kind: "mandala", x: 0.58, y: 0.33, size: 0.42, color: G(1, 0.5, 0.12) }] },
  { key: "cyclops", id: "cyclops", rank: 1, fx: [{ kind: "eyes", x: 0.5, y: 0.075, size: 0.14, color: G(1, 0.1, 0.05) }] },
  { key: "ff", id: "ff", rank: 1, fx: [{ kind: "flames", x: 0.86, y: 0.42, size: 0.95, color: G(1, 0.62, 0.15), color2: G(1, 0.18, 0) }] },
  { key: "cap", id: "cap", rank: 1 },
  { key: "doom", id: "doom", rank: 2, fx: [{ kind: "arcs", x: 0.27, y: 0.27, size: 0.34, color: G(0.25, 1, 0.55) }, { kind: "arcs", x: 0.73, y: 0.27, size: 0.34, color: G(0.25, 1, 0.55) }] },
  { key: "thor", id: "thor", rank: 2, fx: [{ kind: "arcs", x: 0.86, y: 0.6, size: 0.36, color: G(0.5, 0.78, 1) }] },
  { key: "closeDoom", id: "doom", rank: 3, fx: [{ kind: "arcs", x: 0.27, y: 0.27, size: 0.4, color: G(0.25, 1, 0.55) }, { kind: "arcs", x: 0.73, y: 0.27, size: 0.4, color: G(0.25, 1, 0.55) }] },
  { key: "closeThor", id: "thor", rank: 3, fx: [{ kind: "arcs", x: 0.86, y: 0.6, size: 0.45, color: G(0.5, 0.78, 1) }] },
];
const RIMS: Record<string, [number, number, number]> = {
  doom: G(0.35, 0.95, 0.5), strange: G(1, 0.55, 0.2), hulk: G(0.45, 0.95, 0.4), sentinel: G(1, 0.25, 0.2), thor: G(0.6, 0.82, 1), cap: G(0.85, 0.9, 1),
  ff: G(0.65, 0.8, 1), cyclops: G(1, 0.25, 0.2), gambit: G(1, 0.35, 0.85), profx: G(0.7, 0.5, 1), shangchi: G(1, 0.7, 0.3),
};

/* A figure in a shot: x = centre, foot = where the feet are, h = height (all fractions of the screen);
   d = depth layer, 0 far … 1 near (how much it moves against the camera); dx = how far it travels
   across the shot (the standoff closing); rise = how far it climbs into frame. */
type Pl = { key: string; x: number; foot: number; h: number; d: number; b?: number; haze?: number; pow?: number; dx?: number; rise?: number };
type Shot = {
  at: number; figs: Pl[];
  zoom: [number, number]; cx: number; cy: number; pan: number; tilt: number; yaw: [number, number];
  light: [number, number]; lightAmt: number; dark?: number; fog?: number;
  card?: { kicker: string; title: string; line?: string; side: "l" | "r" | "c" | "top" }; decree?: number; side?: "l" | "r";
};

const HERO_PAN = 0.32;
const solo = (key: string, h = 0.94, x = 0.64): Pl[] => [{ key, x, foot: 1.03, h, d: 1, pow: 1 }];
const SHOTS: Shot[] = [
  // 0 · darkness: his mask, and the light is yours
  { at: 0, figs: [{ key: "doom", x: 0.5, foot: 2.42, h: 2.25, d: 1, b: 0.9, pow: 0.4 }],
    zoom: [1, 1.05], cx: 0.5, cy: 0.4, pan: 0, tilt: 0.1, yaw: [-0.4, 0.4], light: [0.42, 0.2], lightAmt: 1.6, dark: 0.8, fog: 0 },
  // 1 · the throne: low, looking up, a slow push
  { at: 0.06, figs: [{ key: "doom", x: 0.5, foot: 1.04, h: 0.98, d: 1, pow: 1 }],
    zoom: [1, 1.14], cx: 0.5, cy: 0.32, pan: 0, tilt: -0.2, yaw: [0.6, -0.6], light: [0.3, 0.1], lightAmt: 0.9, fog: 0.5 },
  // 2 · the Sentinels rise out of the fog
  { at: 0.15, figs: [{ key: "sent1", x: 0.47, foot: 1.3, h: 0.74, d: 0.3, rise: 0.32, b: 0.8 }, { key: "sent2", x: 0.77, foot: 1.42, h: 1.0, d: 0.7, rise: 0.4, b: 0.75 }],
    zoom: [1.05, 1], cx: 0.5, cy: 0.3, pan: -0.05, tilt: -0.24, yaw: [0, 0], light: [0.5, 0.05], lightAmt: 0.7, fog: 1.2,
    card: { kicker: "Doom's iron", title: "The Sentinels", line: "Iron does not doubt.", side: "top" }, decree: 0, side: "l" },
  // 3 · Doom's host, all of it, the camera circling
  { at: 0.235, figs: [
      { key: "sent1", x: 0.06, foot: 0.86, h: 0.92, d: 0, b: 0.35, haze: 0.35 }, { key: "sent2", x: 0.95, foot: 0.86, h: 1, d: 0, b: 0.32, haze: 0.35 },
      { key: "strange", x: 0.25, foot: 0.97, h: 0.66, d: 0.45, pow: 1 }, { key: "hulk", x: 0.76, foot: 0.98, h: 0.74, d: 0.45, pow: 0.8 },
      { key: "doom", x: 0.5, foot: 1.16, h: 0.84, d: 1, pow: 1 }],
    zoom: [1.08, 1], cx: 0.5, cy: 0.6, pan: 0, tilt: -0.08, yaw: [-1, 1], light: [0.5, 0.1], lightAmt: 0.7, fog: 1,
    card: { kicker: "Behind the throne", title: "Doom's Host", line: "Sorcery. Fury. Iron. All of it answers to Doom.", side: "top" } },
  // 4–9 · those who dare: one shot each, cold sky, the hero alone
  { at: 0.325, figs: solo("thor", 0.96), zoom: [1, 1.1], cx: 0.62, cy: 0.35, pan: HERO_PAN, tilt: -0.1, yaw: [-0.8, 0.8], light: [0.85, 0.08], lightAmt: 0.8, fog: 0.4,
    card: { kicker: "Who dares oppose Doom", title: "Thor", line: "A god who mistakes thunder for power.", side: "l" }, decree: 1, side: "l" },
  { at: 0.395, figs: solo("cap", 0.84), zoom: [1.1, 1], cx: 0.62, cy: 0.4, pan: HERO_PAN + 0.05, tilt: 0, yaw: [0.8, -0.6], light: [0.2, 0.1], lightAmt: 0.8, fog: 0.4,
    card: { kicker: "Who dares oppose Doom", title: "Captain America", line: "A soldier. Doom has buried armies.", side: "l" }, decree: 2, side: "l" },
  { at: 0.455, figs: solo("ff", 0.78, 0.6), zoom: [1, 1.08], cx: 0.6, cy: 0.45, pan: HERO_PAN, tilt: 0, yaw: [-0.6, 0.6], light: [0.7, 0.1], lightAmt: 0.75, fog: 0.4,
    card: { kicker: "Who dares oppose Doom", title: "The Fantastic Four", line: "Richards. Doom has waited a lifetime for this.", side: "l" }, decree: 3, side: "l" },
  { at: 0.52, figs: [{ key: "profx", x: 0.52, foot: 0.97, h: 0.66, d: 0.3, pow: 1 }, { key: "cyclops", x: 0.78, foot: 1.03, h: 0.86, d: 1, pow: 1 }],
    zoom: [1.08, 1], cx: 0.65, cy: 0.3, pan: HERO_PAN + 0.04, tilt: -0.06, yaw: [0.7, -0.7], light: [0.6, 0.05], lightAmt: 0.8, fog: 0.15,
    card: { kicker: "Who dares oppose Doom", title: "The X-Men", line: "Minds that believe they can resist Doom.", side: "l" }, decree: 4, side: "l" },
  { at: 0.585, figs: solo("gambit", 0.86), zoom: [1, 1.1], cx: 0.62, cy: 0.5, pan: HERO_PAN, tilt: 0, yaw: [-0.7, 0.7], light: [0.4, 0.15], lightAmt: 0.85, fog: 0,
    card: { kicker: "Who dares oppose Doom", title: "Gambit", line: "A thief with a deck of cards. How amusing.", side: "l" }, decree: 5, side: "l" },
  { at: 0.645, figs: solo("shangchi", 0.92), zoom: [1.1, 1], cx: 0.62, cy: 0.35, pan: HERO_PAN + 0.06, tilt: -0.05, yaw: [0.7, -0.7], light: [0.8, 0.1], lightAmt: 0.85, fog: 0,
    card: { kicker: "Who dares oppose Doom", title: "Shang-Chi", line: "Ten rings he barely understands.", side: "l" }, decree: 6, side: "l" },
  // 10 · the standoff: both sides in one frame, closing
  { at: 0.7, figs: [
      { key: "gambit", x: 0.58, foot: 0.8, h: 0.4, d: 0.1, b: 0.45, haze: 0.4, dx: -0.06 }, { key: "shangchi", x: 0.72, foot: 0.79, h: 0.42, d: 0.1, b: 0.45, haze: 0.4, dx: -0.06 },
      { key: "profx", x: 0.86, foot: 0.79, h: 0.36, d: 0.1, b: 0.45, haze: 0.4, dx: -0.06 },
      { key: "ff", x: 0.68, foot: 0.88, h: 0.44, d: 0.4, b: 0.7, haze: 0.18, dx: -0.09 }, { key: "cyclops", x: 0.97, foot: 0.88, h: 0.52, d: 0.4, b: 0.7, haze: 0.18, dx: -0.09 },
      { key: "cap", x: 0.88, foot: 0.95, h: 0.56, d: 0.65, b: 0.85, dx: -0.11 },
      { key: "sent1", x: 0.03, foot: 0.8, h: 0.75, d: 0.1, b: 0.4, haze: 0.4, dx: 0.06 }, { key: "sent2", x: 0.3, foot: 0.78, h: 0.62, d: 0.1, b: 0.35, haze: 0.45, dx: 0.06 },
      { key: "strange", x: 0.1, foot: 0.9, h: 0.5, d: 0.4, b: 0.8, haze: 0.15, dx: 0.09 }, { key: "hulk", x: 0.32, foot: 0.92, h: 0.54, d: 0.45, b: 0.8, haze: 0.12, dx: 0.09 },
      { key: "doom", x: 0.2, foot: 1.0, h: 0.68, d: 1, pow: 1, dx: 0.12 }, { key: "thor", x: 0.79, foot: 1.0, h: 0.68, d: 1, pow: 1, dx: -0.12 }],
    zoom: [1, 1.12], cx: 0.5, cy: 0.62, pan: 0, tilt: 0, yaw: [0, 0], light: [0.5, 0.05], lightAmt: 0.5, fog: 1,
    card: { kicker: "Doom speaks", title: "Choose your side", line: "There is only one that survives.", side: "top" } },
  // 11 · the clash, then the form
  { at: P.CLASH, figs: [], zoom: [1, 1], cx: 0.5, cy: 0.5, pan: 0, tilt: 0, yaw: [0, 0], light: [0.5, 0.2], lightAmt: 0.6, fog: 1 },
];
const SHOT_END = (i: number) => (i + 1 < SHOTS.length ? SHOTS[i + 1].at : 1);

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
type Decree = { kicker: string; title: string; voice?: string; lines: string[] };
const DECREES: Decree[] = [
  { kicker: "The day", title: EVENT.date, voice: "On this day, Doom takes what is his.", lines: [EVENT.time, `Report by ${EVENT.reporting}`] },
  { kicker: "The ground", title: EVENT.venue, voice: "The fourth floor falls under Latverian rule.", lines: [EVENT.eligibility] },
  ...EVENT.trials.map((t) => ({ kicker: "A trial", title: t.name, voice: t.line, lines: [`${t.team} · ${t.duration}`, `Spoils: ${t.prize}`] })),
  { kicker: "The spoils", title: EVENT.prizePool, voice: "Doom rewards those who survive him.", lines: EVENT.trials.map((t) => `${t.name}: ${t.prize}`) },
  { kicker: "The terms", title: "Terms of surrender", voice: "Doom does not repeat himself.", lines: [...EVENT.rules, `Fee: ${EVENT.fee} · Closes ${EVENT.deadline}`] },
];

const cl = (x: number) => Math.min(1, Math.max(0, x));
const sm = (x: number) => { x = cl(x); return x * x * (3 - 2 * x); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ALL_KEYS = DEFS.map((d) => d.key);
const OFF = { x: 0, foot: 0, h: 1, op: 0, bright: 0, haze: 0, power: 0 };

export default function Saga() {
  const root = useRef<HTMLElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const decrees = useRef<(HTMLDivElement | null)[]>([]);
  const cards = useRef<(HTMLDivElement | null)[]>([]);
  const titleRef = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const dark = useRef<HTMLDivElement>(null);
  const bars = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const bolt = useRef<BoltHandle>(null);
  const embed = formEmbedUrl();

  useEffect(() => {
    const el = root.current!, c = cv.current!;
    let field: Field;
    try { field = new Field(c, DEFS, META, RIMS); } catch { return; }
    const onResize = () => field.resize();
    addEventListener("resize", onResize);
    // the light follows the pointer; with no pointer it drifts on its own
    const ptr = { x: 0.5, y: 0.3, at: -99 };
    const onMove = (e: PointerEvent) => { if (e.pointerType === "mouse") { ptr.x = e.clientX / innerWidth; ptr.y = e.clientY / innerHeight; ptr.at = performance.now() / 1000; } };
    addEventListener("pointermove", onMove);
    const lt = { x: 0.5, y: 0.2 };
    let raf = 0, cur = 0, flashT = -9, nextFlash = 2, lastBeat = -1, lastShot = -1, lastDecree = -1, clashHit = false;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const t = now / 1000;
      const r = el.getBoundingClientRect();
      const target = cl(-r.top / Math.max(1, el.offsetHeight - innerHeight));
      cur += (target - cur) * 0.12;
      if (Math.abs(target - cur) < 0.0002) cur = target;
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = cur;
      const W = innerWidth, H = innerHeight, narrow = W < H * 0.9;

      let si = 0;
      for (let i = 0; i < SHOTS.length; i++) if (p >= SHOTS[i].at) si = i;
      const S = SHOTS[si], a = S.at, b = SHOT_END(si);
      const k = cl((p - a) / (b - a));          // progress through this shot
      const ke = sm(k);
      const yaw = lerp(S.yaw[0], S.yaw[1], k);

      // the figures in this shot; everyone else is off
      const on = new Set<string>();
      if (si < SHOTS.length - 1) {
        // a figure fades up out of black at the very start of a shot: the cut lands on a dark frame
        const fadeIn = sm(k / 0.06);
        S.figs.forEach((f) => {
          on.add(f.key);
          let x = f.x + (f.dx ?? 0) * ke, h = f.h, foot = f.foot - (f.rise ?? 0) * ke;
          if (narrow && S.figs.length === 1) { x = 0.5; h *= 0.8; foot = Math.min(foot, 0.98); }
          else if (narrow) { x = 0.5 + (x - 0.5) * 0.75; h *= 0.72; }
          // depth: near layers slide further against the orbit than far ones
          x += yaw * (f.d - 0.5) * 0.035;
          field.pose(f.key, {
            x: x * W, foot: foot * H, h: h * H, op: fadeIn, bright: f.b ?? 1, haze: f.haze ?? 0, power: (f.pow ?? 0.7) * fadeIn,
            par: -yaw * 0.022 * (0.4 + f.d * 0.6), key: 0.55,
          });
        });
      }

      // the clash: Doom from the left, Thor from the right, lightning between
      const cu = sm((p - P.CLASH) / 0.035);
      const formIn = sm((p - P.FORM) / 0.03);
      const clash = sm((p - P.CLASH) / (P.FORM - P.CLASH));
      if (cu > 0) {
        on.add("closeDoom"); on.add("closeThor");
        const ch = narrow ? 0.72 * H : 1.25 * H;
        const dW = ch * (META.doom.w / META.doom.h), tW = ch * (META.thor.w / META.thor.h);
        const cop = cu * (1 - formIn * 0.75);
        field.pose("closeDoom", { x: lerp(-0.4 * W, narrow ? 0.2 * W : dW * 0.5 + 0.02 * W, cu), foot: H * 1.18, h: ch, op: cop, bright: 1, haze: 0, power: 1, par: 0.01 * Math.sin(t * 0.3), key: 0.5 });
        field.pose("closeThor", { x: lerp(1.4 * W, narrow ? 0.8 * W : W - tW * 0.5 - 0.02 * W, cu), foot: H * 1.18, h: ch, op: cop, bright: 1, haze: 0, power: 1, par: -0.01 * Math.sin(t * 0.3), key: 0.5 });
      }
      ALL_KEYS.forEach((key) => { if (!on.has(key)) field.pose(key, OFF); });
      const power = sm((p - P.CLASH - 0.02) / 0.045) * (1 - formIn);
      bolt.current?.set([narrow ? 0.28 : 0.37, narrow ? 0.62 : 0.5], [narrow ? 0.72 : 0.63, narrow ? 0.62 : 0.5], power);

      // the light: the pointer if it moved lately, else the shot's own, drifting
      const live = t - ptr.at < 6;
      const tx = live ? ptr.x : S.light[0] + Math.sin(t * 0.37) * 0.12, ty = live ? ptr.y : S.light[1] + Math.sin(t * 0.23) * 0.06;
      lt.x += (tx - lt.x) * 0.08; lt.y += (ty - lt.y) * 0.08;

      // ── DOM: the dark, the bars, the cut, the cards, the decrees ──
      if (dark.current) {
        const d = (S.dark ?? 0) * (1 - sm((k - 0.75) / 0.25));
        dark.current.style.opacity = String(d);
        dark.current.style.setProperty("--lx", `${lt.x * 100}%`); dark.current.style.setProperty("--ly", `${lt.y * 100}%`);
      }
      if (bars.current) bars.current.style.setProperty("--bar", String(1 - sm((p - P.FORM + 0.01) / 0.03)));
      const tt = titleRef.current;
      if (tt) { const o = si === 1 ? sm((k - 0.15) / 0.2) * (1 - sm((k - 0.82) / 0.14)) : 0; tt.style.opacity = String(o); tt.style.filter = `blur(${(1 - o) * 8}px)`; tt.style.letterSpacing = `${(1 - o) * 0.04}em`; }
      if (hint.current) hint.current.style.opacity = String(1 - sm(p / 0.02));
      SHOTS.forEach((sh, i) => {
        const n = cards.current[i];
        if (!n) return;
        const hasDec = sh.decree !== undefined;
        const o = i === si ? sm((k - 0.08) / 0.14) * (1 - sm((k - (hasDec ? 0.42 : 0.8)) / 0.12)) : 0;
        n.style.opacity = String(o);
        n.style.filter = `blur(${(1 - o) * 10}px)`;
        n.style.transform = `scale(${1.04 - o * 0.04})`;
      });
      let activeDecree = -1;
      DECREES.forEach((_, d) => {
        const n = decrees.current[d];
        if (!n) return;
        const o = S.decree === d ? sm((k - 0.5) / 0.1) * (1 - sm((k - 0.88) / 0.1)) : 0;
        if (o > 0.5) activeDecree = d;
        n.style.opacity = String(o);
        n.style.transform = `translateY(${(1 - o) * 24}px)`;
        n.style.pointerEvents = o > 0.5 ? "auto" : "none";
      });
      const cutFlash = Math.exp(-Math.pow((p - P.FORM + 0.004) / 0.006, 2));
      if (flash.current) flash.current.style.opacity = String(cutFlash);
      if (form.current) {
        form.current.style.opacity = String(formIn);
        form.current.style.transform = `translate(-50%, -50%) scale(${0.94 + formIn * 0.06})`;
        form.current.style.pointerEvents = formIn > 0.6 ? "auto" : "none";
      }

      // sound: a hit on every cut and every decree, a slow drum through the standoff, the big one at the break
      const forward = target > cur - 0.001;
      if (si !== lastShot) { if (lastShot >= 0 && forward && si < SHOTS.length - 1) drumHit(0.8, true); lastShot = si; }
      if (activeDecree !== lastDecree) { if (activeDecree >= 0 && forward) drumHit(0.5); lastDecree = activeDecree; }
      if (si === 10) { const beat = Math.floor(k * 14); if (beat !== lastBeat && forward) { drumHit(0.3 + k * 0.4); lastBeat = beat; } }
      if (cutFlash > 0.6 && !clashHit) { clashHit = true; drumHit(1, true); drumHit(0.9); }
      if (p < P.FORM - 0.02) clashHit = false;

      // lightning: rare at first, constant at the clash; it lights the figures too
      if (t > nextFlash) { flashT = t; nextFlash = t + (clash > 0 ? 0.35 : 2.2) + Math.random() * (clash > 0 ? 0.7 : 4.5); }
      const fls = Math.max(0, 1 - (t - flashT) / 0.22) * (Math.random() > 0.3 ? 1 : 0.4) * (si === 0 ? 0.25 : 1);
      const cam: Cam = {
        zoom: lerp(S.zoom[0], S.zoom[1], ke), cx: S.cx, cy: S.cy, pan: S.pan + yaw * 0.02, tilt: S.tilt,
        light: [lt.x, lt.y], lightAmt: S.lightAmt, fog: S.fog ?? 1,
      };
      field.render(t, { march: si === 10 ? ke : 0.3 + si * 0.05 + k * 0.05, flash: fls, clash: Math.max(clash, formIn), shake: power * 0.8 + cutFlash, wind: 0.8 + (si === 10 ? ke : 0) * 0.6 + clash }, cam);
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", onResize); removeEventListener("pointermove", onMove); field.dispose(); };
  }, []);

  return (
    <section ref={root} id="saga" className="saga" aria-label="Clockout 4.0: the battle">
      <div className="saga__stage">
        <canvas ref={cv} className="saga__bg" aria-hidden="true" />
        <div ref={dark} className="saga__dark" aria-hidden="true" />

        <div ref={titleRef} className="saga__title" style={{ opacity: 0 }}>
          <p className="saga__kicker">{EVENT.host} presents</p>
          <h1 className="decree-type saga__name">{EVENT.name} <span>{EVENT.edition}</span></h1>
          <p className="saga__tag">{EVENT.title}</p>
          <p className="saga__voice">“Doom has waited long enough.”</p>
        </div>
        <div ref={hint} className="saga__hint" aria-hidden="true"><span>Move the light · Scroll</span><i /></div>

        {SHOTS.map((s, i) => s.card ? (
          <div key={i} ref={(n) => { cards.current[i] = n; }} className={`card card--${s.card.side}`} style={{ opacity: 0 }}>
            <span className="saga__kicker">{s.card.kicker}</span>
            <strong className="decree-type">{s.card.title}</strong>
            {s.card.line && <em>“{s.card.line}”</em>}
          </div>
        ) : null)}

        <div className="saga__decrees">
          {DECREES.map((d, i) => {
            const side = SHOTS.find((s) => s.decree === i)?.side ?? "l";
            return (
              <div key={i} ref={(n) => { decrees.current[i] = n; }} className={`plaque plaque--${side}`} style={{ opacity: 0 }}>
                <span className="plaque__seal" aria-hidden="true">{ROMAN[i]}</span>
                <span className="saga__kicker">Decree {ROMAN[i]} · {d.kicker}</span>
                <h2 className="decree-type plaque__title">{d.title}</h2>
                {d.voice && <p className="plaque__voice">“{d.voice}”</p>}
                <ul>{d.lines.map((l, j) => <li key={j}>{l}</li>)}</ul>
              </div>
            );
          })}
        </div>

        <Bolt ref={bolt} />
        <div ref={bars} className="saga__bars" aria-hidden="true" />
        <div ref={flash} className="saga__flash" aria-hidden="true" />

        <div ref={form} id="register" className="roll" style={{ opacity: 0 }}>
          <p className="saga__kicker">Kneel, or stand against Doom</p>
          <h2 className="decree-type roll__title">Sign your name</h2>
          <p className="roll__voice">“Either way, Doom will know it.”</p>
          <div className="roll__frame">
            {embed ? (
              <iframe src={embed} title="Clockout 4.0 registration form" loading="lazy">Loading…</iframe>
            ) : (
              <div className="roll__placeholder">
                <strong>Registration form</strong>
                <span>The Google Form appears here once its link is added to <code>src/config/event.ts</code>.</span>
              </div>
            )}
          </div>
          <p className="roll__note">Closes {EVENT.deadline}</p>
        </div>
      </div>
    </section>
  );
}
