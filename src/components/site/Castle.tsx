"use client";

import { useEffect, useRef } from "react";
import { EVENT } from "@/config/event";
import { drumHit } from "@/lib/identScore";
import { cue, doomLine, setBed, setMusic } from "@/lib/score";
import { clipPath, clipUrl } from "@/lib/castleClips";

/* ── Castle Doom ───────────────────────────────────────────────────────────────────────────────────
   One pinned stage; the scroll is the camera. Up the bridge to the gate (the event's name carved over
   it) and through it; down the great hall, past the banners that carry the day, the hour and the
   ground; into the throne room, where he is waiting.                                           */
type Leg = { id: string; clip: string; a: number; b: number };
export const LEGS: Leg[] = [
  { id: "gate", clip: "gate", a: 0, b: 0.34 },
  { id: "hall", clip: "hall", a: 0.34, b: 0.66 },
  { id: "throne", clip: "throne", a: 0.66, b: 0.94 },
];
export const THRONE_AT = 0.7;
// where the story's sounds fall along the way: lightning over the gate, the doors giving way
const THUNDER_AT = 0.06, DOORS_AT = 0.22;
// how present the theme stays under the rest of the site, after the castle
const THEME_BELOW = 0.5;

const BANNERS = [
  { k: "The day", v: EVENT.date, sub: "The countdown begins" },
  { k: "The hour", v: EVENT.time, sub: `Reporting time ${EVENT.reporting}` },
  { k: "The arena", v: EVENT.venue, sub: "" },
];
const BANNER_AT = (i: number) => 0.355 + i * 0.09;
const THRONE_LINES: [number, number, string][] = [
  [0.76, 0.88, "The throne is mine."],
  [0.87, 0.985, "Your fate is yours to challenge."],
];

const cl = (x: number) => Math.min(1, Math.max(0, x));
const sm = (x: number) => { x = cl(x); return x * x * (3 - 2 * x); };
const win = (p: number, a: number, b: number, f = 0.02) => sm((p - a) / f) * (1 - sm((p - b + f) / f));

export default function Castle() {
  const root = useRef<HTMLElement>(null);
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const titleRef = useRef<HTMLDivElement>(null);
  const banners = useRef<(HTMLDivElement | null)[]>([]);
  const lines = useRef<(HTMLParagraphElement | null)[]>([]);
  const blackRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  /* The footage comes from the shared loader (lib/castleClips), which the intro gate already started:
     phone-sized cuts on phones, whole clips played from memory, in the order they're seen. Until a
     clip is in, its poster stands in. The first tap also primes the videos, for iOS. */
  useEffect(() => {
    const vs = vids.current;
    let alive = true;
    LEGS.forEach((l, i) => {
      const v = vs[i];
      if (!v) return;
      v.poster = `${clipPath(l.clip)}.jpg`;
      clipUrl(i).then((u) => { if (alive && u) { v.src = u; v.load(); } });
    });
    const prime = () => vs.forEach((v) => { if (v?.src && v.paused) v.play().then(() => v.pause()).catch(() => {}); });
    addEventListener("pointerdown", prime, { once: true });
    return () => { alive = false; removeEventListener("pointerdown", prime); };
  }, []);

  useEffect(() => {
    const el = root.current!;
    let raf = 0, cur = 0, lastLeg = -1, lastBanner = -1, lastLine = -1, prev = 0;
    const vt = LEGS.map(() => 0);
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const r = el.getBoundingClientRect();
      const target = cl(-r.top / Math.max(1, el.offsetHeight - innerHeight));
      cur += (target - cur) * 0.3;
      if (Math.abs(target - cur) < 0.0002) cur = target;
      // below the castle the page is for reading: the ambience goes, the theme stays, softer
      if (r.bottom < 0) { setBed(0); setMusic(THEME_BELOW); return; }
      // the castle overlaps the opener's last screen: until it is pinned it stays invisible, so it never
      // slides up over Doom; by the time it pins, the opener has gone to black and the swap can't be seen
      if (stageRef.current && r.top > 0.5) stageRef.current.style.opacity = "0";
      if (r.top > 0.5) return;
      const p = cur, forward = target > cur - 0.001;

      // the camera: whichever leg we are on scrubs its clip; the cut between legs passes through dark
      let leg = 0;
      LEGS.forEach((l, i) => { if (p >= l.a) leg = i; });
      LEGS.forEach((l, i) => {
        const v = vids.current[i];
        if (!v) return;
        const k = cl((p - l.a) / (l.b - l.a));
        const fadeIn = i === 0 ? 1 : sm((p - l.a) / 0.012), fadeOut = i === LEGS.length - 1 ? 1 : 1 - sm((p - l.b + 0.012) / 0.012);
        v.style.opacity = i === leg ? String(fadeIn * fadeOut) : "0";
        if (i === leg && v.duration && v.readyState >= 1) {
          const want = Math.min(v.duration - 0.05, k * v.duration);
          vt[i] += (want - vt[i]) * 0.3;
          if (Math.abs(v.currentTime - vt[i]) > 0.015 && !v.seeking) v.currentTime = vt[i];
        }
      });
      if (leg !== lastLeg) {
        if (lastLeg >= 0 && forward) { drumHit(0.8, true); if (leg === 2) doomLine(); }
        lastLeg = leg;
      }
      // sound: the bed throughout; thunder as the lightning breaks over the gate; the doors' weight
      const hush = 1 - sm((p - 0.9) / 0.1);
      setBed(hush);
      setMusic(THEME_BELOW + (1 - THEME_BELOW) * hush);
      if (forward && prev < THUNDER_AT && p >= THUNDER_AT) cue("thunder");
      if (forward && prev < DOORS_AT && p >= DOORS_AT) cue("rumble");
      prev = p;

      // the gate comes up out of the black of Doom's mask; at the end the throne room dims to the
      // level it keeps behind the rest of the site, so there is no seam
      if (blackRef.current) blackRef.current.style.opacity = String(Math.max(1 - sm(p / 0.035), 0.78 * sm((p - 0.94) / 0.035)));
      // …and then the castle itself gives way to that same frame, already pinned behind it
      if (stageRef.current) stageRef.current.style.opacity = String(1 - sm((p - 0.975) / 0.02));

      // the name over the gate, pushed toward us with the camera
      const tt = titleRef.current;
      if (tt) {
        const o = win(p, 0.025, 0.22, 0.03);
        tt.style.opacity = String(o);
        tt.style.transform = `translate(-50%, -50%) scale(${1 + sm(p / 0.25) * (innerWidth < 700 ? 0.08 : 0.35)})`;
        tt.style.filter = `blur(${(1 - o) * 6}px)`;
      }

      // banners in the hall: each comes out of the distance on its side and passes us
      let activeBanner = -1;
      BANNERS.forEach((_, i) => {
        const n = banners.current[i];
        if (!n) return;
        const narrow = innerWidth < 700;
        const q = (p - BANNER_AT(i)) / (narrow ? 0.085 : 0.12);   // one at a time on a phone
        const o = sm(q / 0.18) * (1 - sm((q - 0.78) / 0.22));
        // on narrow screens the banners come straight at us instead of passing to the sides
        const s = 0.94 + q * 0.12, dir = i % 2 === 0 ? -1 : 1;
        n.style.opacity = String(q > 0 && q < 1 ? o : 0);
        n.style.transform = `translate(${dir * (narrow ? q * 3 : q * 6)}vw, -50%) scale(${s})`;
        if (q > 0.15 && q < 0.85) activeBanner = i;
      });
      if (activeBanner !== lastBanner) { if (activeBanner >= 0 && forward) drumHit(0.5); lastBanner = activeBanner; }

      let line = -1;
      THRONE_LINES.forEach(([a, b], i) => {
        const n = lines.current[i];
        if (!n) return;
        const o = win(p, a, b);
        n.style.opacity = String(o); n.style.filter = `blur(${(1 - o) * 8}px)`;
        if (o > 0.5) line = i;
      });
      if (line !== lastLine) { if (forward && line === 0) { cue("boom", 0.6); drumHit(1, true); } lastLine = line; }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section ref={root} id="castle" className="castle" aria-label="Castle Doom">
      <div ref={stageRef} className="castle__stage" style={{ opacity: 0 }}>
        {LEGS.map((l, i) => (
          <video key={l.id} ref={(n) => { vids.current[i] = n; }} className="castle__film"
            muted playsInline preload="none" disablePictureInPicture aria-hidden="true" style={{ opacity: i === 0 ? 1 : 0 }} />
        ))}
        <div className="castle__shade" aria-hidden="true" />
        <div ref={blackRef} className="castle__black" aria-hidden="true" />

        <div ref={titleRef} className="castle__title" style={{ opacity: 0 }}>
          <h2>{EVENT.name} <span>{EVENT.edition}</span></h2>
          <p>{EVENT.host}</p>
        </div>

        {BANNERS.map((b, i) => (
          <div key={b.k} ref={(n) => { banners.current[i] = n; }} className={`passing passing--${i % 2 ? "r" : "l"}`} style={{ opacity: 0 }}>
            <span className="label">{b.k}</span>
            <strong>{b.v}</strong>
            {b.sub && <span className="passing__sub">{b.sub}</span>}
          </div>
        ))}
        {/* the same details, plainly, for screen readers */}
        <dl className="sr-only">{BANNERS.map((b) => <div key={b.k}><dt>{b.k}</dt><dd>{b.v}. {b.sub}.</dd></div>)}</dl>

        <div className="castle__lines" aria-hidden="true">
          {THRONE_LINES.map(([, , t], i) => <p key={i} ref={(n) => { lines.current[i] = n; }} className={i === 0 ? "castle__line--big" : ""} style={{ opacity: 0 }}>{t}</p>)}
        </div>

      </div>
    </section>
  );
}
