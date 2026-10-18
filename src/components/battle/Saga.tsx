"use client";

import { useEffect, useRef } from "react";
import { drumHit } from "@/lib/identScore";
import { EVENT, formEmbedUrl } from "@/config/event";

/* ── The battle, as footage ────────────────────────────────────────────────────────────────────────
   The scroll is a reel of real shots from the war, each one scrubbed by the scroll (so the viewer
   drives the action, and it holds when they stop). Hard cuts between shots, a drum on each cut.
   Doom narrates over them; his decrees carry the event details. The last shot is Thor against Doom;
   it breaks to white, and the form is what's left.                                              */
export const P = { FORM: 0.93 };
export const FORM_AT = 0.975;

type Shot = { clip: string; at: number; line?: string; kicker?: string; decree?: number[] };
const SHOTS: Shot[] = [
  { clip: "doom", at: 0 },
  { clip: "xavier", at: 0.12, kicker: "The first move", line: "Doom comes for their minds first.", decree: [0] },
  { clip: "waste", at: 0.25, kicker: "The field", line: "Even the sky answers to Doom.", decree: [1] },
  { clip: "mansion", at: 0.38, kicker: "The mutants", line: "Their house burns. Their gifts burn with it.", decree: [2] },
  { clip: "rings", at: 0.51, kicker: "Shang-Chi", line: "Ten rings. He barely understands them.", decree: [3] },
  { clip: "blast", at: 0.6, kicker: "The heroes", line: "Fire, light, walls of glass. Doom has seen it all before.", decree: [4] },
  { clip: "storm", at: 0.72, kicker: "Thor", line: "Thunder strikes. Doom does not fall.", decree: [5, 6] },
];
const END = (i: number) => (i + 1 < SHOTS.length ? SHOTS[i + 1].at : P.FORM);

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

export default function Saga() {
  const root = useRef<HTMLElement>(null);
  const vids = useRef<(HTMLVideoElement | null)[]>([]);
  const lines = useRef<(HTMLDivElement | null)[]>([]);
  const decrees = useRef<(HTMLDivElement | null)[]>([]);
  const titleRef = useRef<HTMLDivElement>(null);
  const flash = useRef<HTMLDivElement>(null);
  const form = useRef<HTMLDivElement>(null);
  const hint = useRef<HTMLDivElement>(null);
  const embed = formEmbedUrl();

  useEffect(() => {
    const el = root.current!;
    let raf = 0, cur = 0, lastShot = -1, lastDecree = -1, clashHit = false;
    const vt = SHOTS.map(() => 0);   // each clip's eased playhead

    const frame = () => {
      raf = requestAnimationFrame(frame);
      const r = el.getBoundingClientRect();
      const target = cl(-r.top / Math.max(1, el.offsetHeight - innerHeight));
      cur += (target - cur) * 0.14;
      if (Math.abs(target - cur) < 0.0002) cur = target;
      if (r.bottom < 0 || r.top > innerHeight) return;
      const p = cur, forward = target > cur - 0.001;

      let si = 0;
      for (let i = 0; i < SHOTS.length; i++) if (p >= SHOTS[i].at) si = i;
      const S = SHOTS[si];
      const k = cl((p - S.at) / (END(si) - S.at));
      const formIn = sm((p - P.FORM) / 0.03);

      // the footage: only the live shot is shown; its playhead follows the scroll, eased
      SHOTS.forEach((_, i) => {
        const v = vids.current[i];
        if (!v) return;
        const live = i === si;
        v.style.opacity = live ? String(1 - formIn * 0.7) : "0";
        if (live && v.duration) {
          const want = Math.min(v.duration - 0.05, k * v.duration);
          vt[i] += (want - vt[i]) * 0.25;
          if (Math.abs(v.currentTime - vt[i]) > 0.02 && !v.seeking) v.currentTime = vt[i];
        }
        // load the next shot ahead of the cut
        if (i === si + 1 && v.preload !== "auto") v.preload = "auto";
      });

      // words
      const tt = titleRef.current;
      if (tt) { const o = si === 0 ? sm((k - 0.12) / 0.15) * (1 - sm((k - 0.82) / 0.12)) : 0; tt.style.opacity = String(o); tt.style.filter = `blur(${(1 - o) * 8}px)`; }
      if (hint.current) hint.current.style.opacity = String(1 - sm(p / 0.02));
      SHOTS.forEach((_, i) => {
        const n = lines.current[i];
        if (!n) return;
        const o = i === si ? sm((k - 0.05) / 0.1) * (1 - sm((k - 0.42) / 0.08)) : 0;
        n.style.opacity = String(o); n.style.filter = `blur(${(1 - o) * 6}px)`;
      });
      let active = -1;
      DECREES.forEach((_, d) => {
        const n = decrees.current[d];
        if (!n) return;
        const list = S.decree ?? [], j = list.indexOf(d);
        let o = 0;
        if (j >= 0) { const span = 0.46 / list.length, s0 = 0.5 + j * span; o = sm((k - s0) / 0.05) * (1 - sm((k - s0 - span + 0.04) / 0.04)); }
        if (o > 0.5) active = d;
        n.style.opacity = String(o); n.style.transform = `translateY(${(1 - o) * 16}px)`;
        n.style.pointerEvents = o > 0.5 ? "auto" : "none";
      });
      const fl = Math.exp(-Math.pow((p - P.FORM + 0.004) / 0.006, 2));
      if (flash.current) flash.current.style.opacity = String(fl);
      if (form.current) {
        form.current.style.opacity = String(formIn);
        form.current.style.transform = `translate(-50%, -50%) scale(${0.94 + formIn * 0.06})`;
        form.current.style.pointerEvents = formIn > 0.6 ? "auto" : "none";
      }

      // sound: a hit on each cut and each decree, the big one at the break
      if (si !== lastShot) { if (lastShot >= 0 && forward) drumHit(0.85, true); lastShot = si; }
      if (active !== lastDecree) { if (active >= 0 && forward) drumHit(0.45); lastDecree = active; }
      if (fl > 0.6 && !clashHit) { clashHit = true; drumHit(1, true); drumHit(0.9); }
      if (p < P.FORM - 0.02) clashHit = false;
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <section ref={root} id="saga" className="saga saga--reel" aria-label="Clockout 4.0: the battle">
      <div className="saga__stage">
        {SHOTS.map((s, i) => (
          <video key={s.clip} ref={(n) => { vids.current[i] = n; }} className="reel" src={`/reel/${s.clip}.mp4`} poster={`/reel/${s.clip}.jpg`}
            muted playsInline preload={i < 2 ? "auto" : "metadata"} aria-hidden="true" style={{ opacity: i === 0 ? 1 : 0 }} />
        ))}
        <div className="reel__shade" aria-hidden="true" />

        <div ref={titleRef} className="saga__title" style={{ opacity: 0 }}>
          <p className="saga__kicker">{EVENT.host} presents</p>
          <h1 className="decree-type saga__name">{EVENT.name} <span>{EVENT.edition}</span></h1>
          <p className="saga__tag">{EVENT.title}</p>
          <p className="saga__voice">“Doom has waited long enough.”</p>
        </div>
        <div ref={hint} className="saga__hint" aria-hidden="true"><span>Scroll</span><i /></div>

        {SHOTS.map((s, i) => s.line ? (
          <div key={i} ref={(n) => { lines.current[i] = n; }} className="voice" style={{ opacity: 0 }}>
            <span className="saga__kicker">{s.kicker}</span>
            <p className="decree-type">{s.line}</p>
          </div>
        ) : null)}

        <div className="saga__decrees">
          {DECREES.map((d, i) => (
            <div key={i} ref={(n) => { decrees.current[i] = n; }} className="plaque plaque--l" style={{ opacity: 0 }}>
              <span className="plaque__seal" aria-hidden="true">{ROMAN[i]}</span>
              <span className="saga__kicker">Decree {ROMAN[i]} · {d.kicker}</span>
              <h2 className="decree-type plaque__title">{d.title}</h2>
              {d.voice && <p className="plaque__voice">“{d.voice}”</p>}
              <ul>{d.lines.map((l, j) => <li key={j}>{l}</li>)}</ul>
            </div>
          ))}
        </div>

        <div className="saga__bars" aria-hidden="true" />
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
