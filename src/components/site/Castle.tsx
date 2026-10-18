"use client";

import { useEffect, useRef, useState } from "react";
import { EVENT } from "@/config/event";
import { drumHit } from "@/lib/identScore";
import { fetchTally, type Side, type Tally } from "@/lib/side";
import Sigil from "../takeover/Sigil";

/* ── Castle Doom ───────────────────────────────────────────────────────────────────────────────────
   One pinned stage; the scroll is the camera. Up the bridge to the gate (the event's name carved over
   it) and through it; down the great hall, past the banners that carry the day, the hour and the
   ground; into the throne room, where Doom asks his one question.                              */
type Leg = { id: string; clip: string; a: number; b: number };
export const LEGS: Leg[] = [
  { id: "gate", clip: "gate", a: 0, b: 0.32 },
  { id: "hall", clip: "hall", a: 0.32, b: 0.62 },
  { id: "throne", clip: "throne", a: 0.62, b: 0.86 },
];
export const CHOICE_AT = 0.86;   // the throne clip holds its last frame from here; the question is asked

const BANNERS = [
  { k: "The day", v: EVENT.date, sub: "By order of Victor von Doom" },
  { k: "The hour", v: EVENT.time, sub: `Report by ${EVENT.reporting}` },
  { k: "The ground", v: EVENT.venue, sub: "Under Latverian rule" },
];
const BANNER_AT = (i: number) => 0.335 + i * 0.088;
const THRONE_LINES: [number, number, string][] = [
  [0.68, 0.78, "You have come a long way to stand before Doom."],
  [0.76, 0.86, "Few are given a choice."],
];

const cl = (x: number) => Math.min(1, Math.max(0, x));
const sm = (x: number) => { x = cl(x); return x * x * (3 - 2 * x); };
const win = (p: number, a: number, b: number, f = 0.02) => sm((p - a) / f) * (1 - sm((p - b + f) / f));

export default function Castle({ side, onChoose }: { side: Side | null; onChoose: (s: Side) => void }) {
  const root = useRef<HTMLElement>(null);
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const titleRef = useRef<HTMLDivElement>(null);
  const banners = useRef<(HTMLDivElement | null)[]>([]);
  const lines = useRef<(HTMLParagraphElement | null)[]>([]);
  const choiceRef = useRef<HTMLDivElement>(null);
  const [tally, setTally] = useState<Tally | null>(null);

  useEffect(() => { fetchTally().then(setTally); }, []);

  useEffect(() => {
    const el = root.current!;
    let raf = 0, cur = 0, lastLeg = -1, lastBanner = -1;
    const vt = LEGS.map(() => 0);
    const frame = () => {
      raf = requestAnimationFrame(frame);
      const r = el.getBoundingClientRect();
      const target = cl(-r.top / Math.max(1, el.offsetHeight - innerHeight));
      cur += (target - cur) * 0.1;
      if (Math.abs(target - cur) < 0.0002) cur = target;
      if (r.bottom < 0 || r.top > innerHeight) return;
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
        if (i === leg && v.duration) {
          const want = Math.min(v.duration - 0.05, k * v.duration);
          vt[i] += (want - vt[i]) * 0.3;
          if (Math.abs(v.currentTime - vt[i]) > 0.015 && !v.seeking) v.currentTime = vt[i];
        }
      });
      if (leg !== lastLeg) { if (lastLeg >= 0 && forward) drumHit(0.8, true); lastLeg = leg; }

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
        const s = narrow ? 0.7 + q * 0.45 : 0.5 + q * 0.95, dir = i % 2 === 0 ? -1 : 1;
        n.style.opacity = String(q > 0 && q < 1 ? o : 0);
        n.style.transform = `translate(calc(-50% + ${dir * (narrow ? q * 6 : 8 + q * 26)}vw), calc(-50% + ${(1 - q) * -2}vh)) scale(${s})`;
        if (q > 0.15 && q < 0.85) activeBanner = i;
      });
      if (activeBanner !== lastBanner) { if (activeBanner >= 0 && forward) drumHit(0.5); lastBanner = activeBanner; }

      THRONE_LINES.forEach(([a, b], i) => {
        const n = lines.current[i];
        if (!n) return;
        const o = win(p, a, b);
        n.style.opacity = String(o); n.style.filter = `blur(${(1 - o) * 8}px)`;
      });
      const ch = choiceRef.current;
      if (ch) {
        const o = sm((p - CHOICE_AT) / 0.03);
        ch.style.opacity = String(o);
        ch.style.visibility = o > 0.01 ? "visible" : "hidden";
        ch.style.transform = `translateY(${(1 - o) * 30}px)`;
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const choose = (s: Side) => {
    drumHit(s === "kneel" ? 0.9 : 1, true);
    setTally((t) => {
      if (!t || side === s) return t;
      const n = { ...t };
      if (side) n[side] = Math.max(0, n[side] - 1);
      n[s] += 1;
      return n;
    });
    onChoose(s);
  };
  const total = tally ? tally.kneel + tally.resist : 0;
  const kp = total ? Math.round((tally!.kneel / total) * 100) : 50;

  return (
    <section ref={root} id="castle" className="castle" aria-label="Castle Doom">
      <div className="castle__stage">
        {LEGS.map((l, i) => (
          <video key={l.id} ref={(n) => { vids.current[i] = n; }} className="castle__film" src={`/castle/${l.clip}.mp4`} poster={`/castle/${l.clip}.jpg`}
            muted playsInline preload="auto" aria-hidden="true" style={{ opacity: i === 0 ? 1 : 0 }} />
        ))}
        <div className="castle__shade" aria-hidden="true" />

        <div ref={titleRef} className="castle__title" style={{ opacity: 0 }}>
          <span className="saga__kicker">{EVENT.host}</span>
          <h2 className="decree-type">{EVENT.name} <em>{EVENT.edition}</em></h2>
          <span className="castle__sub">{EVENT.title}</span>
        </div>

        {BANNERS.map((b, i) => (
          <div key={b.k} ref={(n) => { banners.current[i] = n; }} className="banner" style={{ opacity: 0 }}>
            <Sigil className="banner__sigil" />
            <span className="banner__k">{b.k}</span>
            <strong className="banner__v">{b.v}</strong>
            <span className="banner__sub">{b.sub}</span>
          </div>
        ))}
        {/* the same details, plainly, for screen readers */}
        <dl className="sr-only">{BANNERS.map((b) => <div key={b.k}><dt>{b.k}</dt><dd>{b.v}. {b.sub}.</dd></div>)}</dl>

        <div className="castle__lines" aria-hidden="true">
          {THRONE_LINES.map(([, , t], i) => <p key={i} ref={(n) => { lines.current[i] = n; }} style={{ opacity: 0 }}>{t}</p>)}
        </div>

        <div ref={choiceRef} id="choose" className="throne-choice" style={{ opacity: 0, visibility: "hidden" }}>
          <p className="saga__kicker">Doom asks one question</p>
          <h2 className="decree-type throne-choice__q">Kneel, or resist?</h2>
          <div className="choice__opts" role="radiogroup" aria-label="Choose your side">
            <button type="button" role="radio" aria-checked={side === "kneel"} className={`opt opt--kneel ${side === "kneel" ? "is-on" : ""}`} onClick={() => choose("kneel")}>
              <span className="opt__mark" aria-hidden="true"><Sigil /></span>
              <strong className="decree-type">Kneel</strong>
              <span>Serve Latveria. Doom rewards the loyal.</span>
            </button>
            <button type="button" role="radio" aria-checked={side === "resist"} className={`opt opt--resist ${side === "resist" ? "is-on" : ""}`} onClick={() => choose("resist")}>
              <span className="opt__mark opt__mark--resist" aria-hidden="true" />
              <strong className="decree-type">Resist</strong>
              <span>Stand against him. Doom remembers his enemies.</span>
            </button>
          </div>
          <p className="choice__reply" aria-live="polite">
            {side === "kneel" && "“Wise. Latveria remembers the loyal.”"}
            {side === "resist" && "“Then you will be the first to fall.”"}
          </p>
          {tally && total > 0 && (
            <div className="tally" aria-label={`${tally.kneel} knelt, ${tally.resist} resist`}>
              <div className="tally__bar"><i style={{ width: `${kp}%` }} /></div>
              <div className="tally__nums"><span>Latveria <b>{tally.kneel}</b></span><span><b>{tally.resist}</b> Resistance</span></div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
