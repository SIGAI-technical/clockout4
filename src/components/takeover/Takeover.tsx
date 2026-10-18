"use client";

import { useEffect, useRef } from "react";
import { drumHit } from "@/lib/identScore";
import { createQuad } from "@/lib/gl";
import { lockScroll } from "@/lib/scrollLock";
import { EVENT, formEmbedUrl } from "@/config/event";
import Sigil from "./Sigil";
import { TAKEOVER_FRAG } from "./takeoverShader";

/* ── Doom takes the department ─────────────────────────────────────────────────────────────────────
   A story in one pinned stage. The department's channel dies and Doom's signal takes it. He arrives
   out of the dark; his eyes open; he speaks. His seal. Proof he has been watching (the department's
   own photos, as his surveillance). Then his decrees — the event details — while he looms behind the
   glass. Four times the heroes try to break his broadcast, each harder than the last; each time his
   eyes cut through their signal and he silences them, until the last: ENOUGH. His verdict, his seal
   stamped, and the form.                                                                        */
export const FORM_AT = 0.975;
const T = { ARRIVE: 0.05, ADDRESS: 0.15, SEAL: 0.26, WATCH: 0.34, DECREES: 0.45, VERDICT: 0.85, FORM: 0.93 };
const EYES_AT = 0.103;

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX"];
type Decree = { kicker: string; title: string; voice?: string; lines: string[] };
const DECREES: Decree[] = [
  { kicker: "The day", title: EVENT.date, voice: "On this day, Doom takes what is his.", lines: [EVENT.time, `Report by ${EVENT.reporting}`] },
  { kicker: "The ground", title: EVENT.venue, voice: "The fourth floor falls under Latverian rule.", lines: [EVENT.eligibility] },
  ...EVENT.trials.map((t) => ({ kicker: "A trial", title: t.name, voice: t.line, lines: [`${t.team} · ${t.duration}`, `Spoils: ${t.prize}`] })),
  { kicker: "The spoils", title: EVENT.prizePool, voice: "Doom rewards those who survive him.", lines: EVENT.trials.map((t) => `${t.name}: ${t.prize}`) },
  { kicker: "The terms", title: "Terms of surrender", voice: "Doom does not repeat himself.", lines: [...EVENT.rules, `Fee: ${EVENT.fee} · Closes ${EVENT.deadline}`] },
];
/* The heroes break in as the scroll reaches these decrees, each attempt longer than the last. The page
   holds while it plays: their signal first, then Doom's eyes cut through it and he answers. */
type Intf = { clip: string; source: string; reply: string; dur: number; last?: boolean };
const INTERFERENCE: Record<number, Intf> = {
  1: { clip: "rings", source: "The Ten Rings", reply: "Ten rings. Doom will wear them.", dur: 3 },
  2: { clip: "blast", source: "Baxter Building", reply: "Richards. You were never my equal.", dur: 3.4 },
  4: { clip: "mansion", source: "Xavier Institute", reply: "Your minds are open to me, Charles.", dur: 3.8 },
  6: { clip: "storm", source: "Asgard", reply: "Enough.", dur: 4.6, last: true },
};
const DOOM_AT = 0.56;   // the share of each break-in after which Doom takes the signal back
const SURVEIL = [
  { src: "ev_core", cam: "CAM 01", where: "Seminar hall" },
  { src: "ev_chapter-committee", cam: "CAM 03", where: "Department lobby" },
  { src: "ev_1g", cam: "CAM 07", where: "Courtyard" },
  { src: "ev_img_9526", cam: "CAM 04", where: "Auditorium stage" },
  { src: "ev_ipd_seminar", cam: "CAM 09", where: "Lecture theatre" },
  { src: "ev_img_9582", cam: "CAM 04", where: "Auditorium stage" },
];
// what Doom says, and when: [from, to, words, weight]
type Line = [number, number, string, "voice" | "big" | "huge"];
const SPEECH: Line[] = [
  [0.112, 0.148, "Do not look away.", "voice"],
  [0.155, 0.255, "Students of the AIML Department.", "voice"],
  [0.175, 0.255, "Your Clockout is over.", "voice"],
  [0.2, 0.255, "Doom’s begins.", "huge"],
  [0.855, 0.925, "Come to the fourth floor.", "voice"],
  [0.872, 0.925, "Kneel, or fight.", "big"],
];
const DS = (T.VERDICT - T.DECREES) / DECREES.length;

const cl = (x: number) => Math.min(1, Math.max(0, x));
const sm = (x: number) => { x = cl(x); return x * x * (3 - 2 * x); };
/** in at a, out at b, with fades of f */
const win = (p: number, a: number, b: number, f = 0.012) => sm((p - a) / f) * (1 - sm((p - b + f) / f));
const set = (n: HTMLElement | SVGElement | null | undefined, o: number, extra?: (n: HTMLElement) => void) => {
  if (!n) return;
  (n as HTMLElement).style.opacity = String(o);
  (n as HTMLElement).style.visibility = o > 0.002 ? "visible" : "hidden";
  extra?.(n as HTMLElement);
};

export default function Takeover() {
  const root = useRef<HTMLElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const doomRef = useRef<HTMLDivElement>(null);
  const nosignalRef = useRef<HTMLDivElement>(null);
  const sigilRef = useRef<HTMLDivElement>(null);
  const sigilSvgRef = useRef<SVGSVGElement>(null);
  const watchRef = useRef<HTMLDivElement>(null);
  const chosenRef = useRef<HTMLHeadingElement>(null);
  const watchedRef = useRef<HTMLHeadingElement>(null);
  const stampRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const chRef = useRef<HTMLSpanElement>(null);

  const speech = useRef<(HTMLParagraphElement | null)[]>([]);
  const cams = useRef<(HTMLElement | null)[]>([]);
  const decrees = useRef<(HTMLDivElement | null)[]>([]);
  const intf = useRef<(HTMLDivElement | null)[]>([]);
  const intfVid = useRef<(HTMLVideoElement | null)[]>([]);
  const embed = formEmbedUrl();

  useEffect(() => {
    const el = root.current!;
    const quad = createQuad(cv.current!, TAKEOVER_FRAG, 1.25);
    const onResize = () => quad?.resize();
    onResize(); addEventListener("resize", onResize);
    // Doom's eyes follow the viewer
    const look = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => { look.tx = e.clientX / innerWidth - 0.5; look.ty = e.clientY / innerHeight - 0.5; };
    addEventListener("pointermove", onMove);

    let raf = 0, cur = 0, last = "", stampHit = false, flashHit = false, eyesHit = false, prevTarget = 0, preloaded = false;
    // a break-in in progress: `at` is null until its footage is actually playing
    let playing: { d: number; s: number; at: number | null; since: number; unlock: () => void; doomHit: boolean } | null = null;
    const played = new Set<number>();
    const t0 = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const t = (now - t0) / 1000;
      const box = el.getBoundingClientRect();
      const target = cl(-box.top / Math.max(1, el.offsetHeight - innerHeight));
      cur += (target - cur) * 0.12;
      if (Math.abs(target - cur) < 0.0002) cur = target;

      // load the heroes' footage well before it is needed
      if (!preloaded && target > T.WATCH - 0.05) {
        preloaded = true;
        intfVid.current.forEach((v) => { if (v) { v.preload = "auto"; v.load(); } });
      }
      // crossing a break-in point going forward, by hand (not the jump to the form), pins the page there
      if (!playing) {
        for (const key in INTERFERENCE) {
          const d = +key, s = T.DECREES + d * DS;
          if (!played.has(d) && prevTarget < s && target >= s && target - prevTarget < 0.08) {
            scrollTo({ top: el.offsetTop + (el.offsetHeight - innerHeight) * s, behavior: "instant" });
            cur = s;
            playing = { d, s, at: null, since: t, unlock: lockScroll(), doomHit: false };
            const v = intfVid.current[d];
            if (v) { v.currentTime = 0; v.play().catch(() => {}); }
            break;
          }
        }
      }
      prevTarget = playing ? playing.s : target;
      if (box.bottom < 0 || box.top > innerHeight) return;
      const p = playing ? playing.s - 0.0005 : cur, forward = target > cur - 0.001;
      let beat = "", shake = 0;

      // ── the break-in, if one is running ──
      let ik = -1, tear = 0, doomTakes = 0;
      if (playing) {
        const I = INTERFERENCE[playing.d], v = intfVid.current[playing.d];
        // the clock starts once the footage moves (or after 3 s of waiting, whichever is first)
        if (playing.at === null && ((v && v.readyState >= 3 && !v.paused) || t - playing.since > 3)) playing.at = t;
        ik = playing.at === null ? 0 : (t - playing.at) / I.dur;
        doomTakes = sm((ik - DOOM_AT) / 0.06);
        tear = ik < DOOM_AT ? 1 : 1 - doomTakes;
        beat = ik < DOOM_AT ? "intf" + playing.d : "doom" + playing.d;
        if (ik > DOOM_AT && !playing.doomHit) { playing.doomHit = true; drumHit(1, true); if (I.last) drumHit(0.9); }
        if (ik > DOOM_AT) shake = Math.max(shake, Math.exp(-(ik - DOOM_AT) * 14) * (I.last ? 1.4 : 0.7));
        if (ik >= 1) { playing.unlock(); v?.pause(); played.add(playing.d); playing = null; }
      }
      for (const key in INTERFERENCE) {
        const d = +key, on = playing?.d === d;
        set(intf.current[d], on ? 1 : 0, (x) => { x.style.setProperty("--k", String(Math.max(0, ik))); x.style.setProperty("--doom", String(doomTakes)); });
      }

      // ── 1 · the channel dies, and Doom's signal takes it ──
      const statik = 1 - sm((p - 0.015) / 0.035);
      set(nosignalRef.current, win(p, -1, T.ARRIVE + 0.005, 0.008), (n) => { n.dataset.state = p > 0.028 ? "intercepted" : "lost"; });
      if (p > 0.028) beat ||= "intercept";

      // ── Doom himself: how present, how near, how lit his eyes ──
      let presence = 0, eyes = 0, push = 1;
      if (p < T.SEAL) {            // arrival and address: out of the dark, slowly closer
        presence = sm((p - T.ARRIVE) / 0.045);
        push = 1 + 0.12 * sm((p - T.ARRIVE) / (T.SEAL - T.ARRIVE));
        eyes = sm((p - EYES_AT) / 0.006);
      } else if (p < T.DECREES) {  // the seal and the watching: he recedes behind them
        presence = 1 - 0.8 * sm((p - T.SEAL) / 0.015);
        eyes = 0.7;
        push = 1.12;
      } else if (p < T.VERDICT) {  // the decrees: he looms behind the glass
        presence = 0.28; eyes = 0.55; push = 1.04;
      } else {                     // the verdict: as close as he gets
        presence = sm((p - T.VERDICT) / 0.012); eyes = 1; push = 1.04 + 0.16 * sm((p - T.VERDICT) / 0.08);
      }
      if (playing) {               // he takes his broadcast back
        presence = Math.max(presence * (1 - tear), doomTakes);
        eyes = Math.max(eyes * 0.3, doomTakes * 1.3);
        push = playing && INTERFERENCE[playing.d].last ? 1.1 + doomTakes * 0.12 : push + doomTakes * 0.06;
      }
      if (eyes > 0.5 && !eyesHit && p < T.SEAL && forward) { eyesHit = true; drumHit(1, true); }
      if (p < EYES_AT - 0.01) eyesHit = false;
      if (p > EYES_AT && p < EYES_AT + 0.012) shake = Math.max(shake, 0.8 * (1 - (p - EYES_AT) / 0.012));
      look.x += (look.tx - look.x) * 0.06; look.y += (look.ty - look.y) * 0.06;
      const dm = doomRef.current;
      if (dm) {
        dm.style.setProperty("--presence", String(presence));
        dm.style.setProperty("--eyes", String(eyes * (0.92 + 0.08 * Math.sin(t * 9 + Math.sin(t * 2.3) * 3))));
        dm.style.setProperty("--push", String(push));
        dm.style.setProperty("--lx", String(look.x)); dm.style.setProperty("--ly", String(look.y));
      }

      // ── what he says ──
      SPEECH.forEach(([a, b, , w], i) => {
        const o = win(p, a, b, 0.01);
        set(speech.current[i], o, (n) => { n.style.filter = `blur(${(1 - o) * 10}px)`; n.style.transform = w === "huge" ? `scale(${1.12 - 0.12 * sm((p - a) / 0.01)})` : ""; });
        if (p > a && p < b) beat = "say" + i;
        if (w === "huge" && p > a && p < a + 0.012) shake = Math.max(shake, 1 - (p - a) / 0.012);
      });

      // ── 2 · his seal ──
      const draw = sm((p - T.SEAL) / 0.055);
      set(sigilRef.current, win(p, T.SEAL, T.WATCH));
      sigilSvgRef.current?.style.setProperty("--draw", String(draw));
      if (draw > 0.98) beat = "seal";

      // ── 3 · he has been watching ──
      set(watchRef.current, win(p, T.WATCH, T.DECREES));
      SURVEIL.forEach((_, i) => {
        const a = T.WATCH + 0.01 + i * 0.01;
        set(cams.current[i], sm((p - a) / 0.008), (n) => n.classList.toggle("is-locked", p > a + 0.016));
      });
      if (p > T.WATCH + 0.01) beat = "watch" + Math.min(5, Math.floor((p - T.WATCH - 0.01) / 0.01));
      const chosen = sm((p - T.DECREES + 0.022) / 0.006);
      set(watchedRef.current, 1 - sm((p - T.DECREES + 0.03) / 0.006)); set(chosenRef.current, chosen);
      if (chosen > 0.5) beat = "chosen";

      // ── 4 · the decrees ──
      DECREES.forEach((_, d) => {
        const s = T.DECREES + d * DS, e = s + DS;
        set(decrees.current[d], playing ? 0 : win(p, s, e, 0.01), (n) => { n.style.transform = `translate(-50%, -50%) scale(${0.97 + 0.03 * sm((p - s) / 0.01)})`; });
        if (!playing && p > s + 0.004 && p < e) beat = "decree" + d;
      });

      // ── 5 · the verdict, his seal stamped, the form ──
      const stamp = sm((p - 0.9) / 0.008);
      set(stampRef.current, stamp * (1 - sm((p - T.FORM) / 0.01)), (n) => n.style.setProperty("--s", String(stamp)));
      if (stamp > 0.5 && !stampHit && forward) { stampHit = true; drumHit(1, true); }
      if (stamp < 0.2) stampHit = false;
      if (p > 0.9 && p < 0.908) shake = Math.max(shake, 1 - (p - 0.9) / 0.008);
      const formIn = sm((p - T.FORM) / 0.03);
      set(formRef.current, formIn, (n) => { n.style.transform = `translate(-50%, -50%) scale(${0.94 + formIn * 0.06})`; n.style.pointerEvents = formIn > 0.6 ? "auto" : "none"; });
      const fl = Math.exp(-Math.pow((p - T.FORM + 0.004) / 0.006, 2));
      set(flashRef.current, Math.max(fl, playing && INTERFERENCE[playing.d].last ? Math.exp(-Math.max(0, ik - DOOM_AT) * 10) * doomTakes * 0.6 : 0));
      if (fl > 0.6 && !flashHit) { flashHit = true; drumHit(1, true); drumHit(0.9); }
      if (p < T.FORM - 0.02) flashHit = false;
      set(hintRef.current, 1 - sm(p / 0.012));
      if (doomRef.current) doomRef.current.style.visibility = presence > 0.002 && formIn < 0.99 ? "visible" : "hidden";

      // the stage shakes under him
      if (stageRef.current) {
        const s = Math.min(1.4, shake);
        stageRef.current.style.transform = s > 0.01 ? `translate(${(Math.random() - 0.5) * 14 * s}px, ${(Math.random() - 0.5) * 10 * s}px)` : "";
      }

      // the broadcast's clock and channel
      if (clockRef.current) {
        const s = Math.floor(t), f = Math.floor((t % 1) * 24);
        clockRef.current.textContent = `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
      }
      if (chRef.current) chRef.current.textContent = p < 0.028 ? "CH 04 · AIML DEPT" : tear > 0.3 ? "SIGNAL CONTESTED" : "LATVERIA · STATE BROADCAST";

      // a drum for every new beat
      if (beat !== last) {
        if (forward && beat && !beat.startsWith("doom")) drumHit(beat === "seal" || beat.startsWith("intf") ? 0.9 : beat.startsWith("watch") ? 0.35 : 0.6, beat === "seal" || beat.startsWith("decree") || beat === "chosen");
        last = beat;
      }

      if (quad) {
        quad.resize();
        quad.render({
          uRes: [quad.gl.drawingBufferWidth, quad.gl.drawingBufferHeight], uTime: t, uStatic: Math.max(statik, tear * 0.35),
          // his glass is lit only once he has the channel; it dims while he speaks and while he watches
          uGlass: (1 - statik) * sm((p - T.SEAL + 0.02) / 0.04) * (1 - win(p, T.WATCH, T.DECREES, 0.01) * 0.75) * (1 - win(p, T.VERDICT, 1.1, 0.01) * 0.6),
          uPulse: 0.5 + 0.5 * Math.sin(t * 1.2), uTear: tear, uStamp: stamp * (1 - sm((p - 0.915) / 0.012)) * 0.8,
        });
      }
    };
    raf = requestAnimationFrame(frame);
    return () => { playing?.unlock(); cancelAnimationFrame(raf); removeEventListener("resize", onResize); removeEventListener("pointermove", onMove); quad?.destroy(); };
  }, []);

  return (
    <section ref={root} id="saga" className="tk" aria-label="Clockout 4.0: Doom takes the department">
      <div ref={stageRef} className="tk__stage">
        <canvas ref={cv} className="tk__bg" aria-hidden="true" />

        {/* Doom: the hood, and the eyes inside it */}
        <div ref={doomRef} className="tk__doom" aria-hidden="true">
          <div className="tk__doom-frame">
            <div className="tk__eye tk__eye--l" />
            <div className="tk__eye tk__eye--r" />
          </div>
        </div>

        <div className="tk__hud" aria-hidden="true">
          <span ref={chRef}>CH 04 · AIML DEPT</span>
          <span className="tk__rec"><i />REC</span>
          <span ref={clockRef}>00:00:00:00</span>
          <span>{EVENT.name} {EVENT.edition}</span>
        </div>

        <div ref={nosignalRef} className="tk__nosignal" data-state="lost">
          <strong className="tk__lost">No signal</strong>
          <strong className="tk__got">Signal intercepted</strong>
        </div>
        <div ref={hintRef} className="saga__hint" aria-hidden="true"><span>Scroll</span><i /></div>

        <div className="tk__speech">
          {SPEECH.map(([, , text, w], i) => (
            <p key={i} ref={(n) => { speech.current[i] = n; }} className={`tk__say tk__say--${w} ${w !== "voice" ? "decree-type" : ""}`} style={{ opacity: 0 }}>{text}</p>
          ))}
        </div>

        <div ref={sigilRef} className="tk__seal" style={{ opacity: 0 }}>
          <Sigil ref={sigilSvgRef} />
          <p className="saga__kicker">By decree</p>
          <h1 className="decree-type">This department is now the property of Latveria</h1>
        </div>

        <div ref={watchRef} className="tk__watch" style={{ opacity: 0 }}>
          <div className="tk__watch-head">
            <p className="saga__kicker">Latveria has been watching</p>
            <div className="tk__watch-lines">
              <h2 ref={watchedRef} className="decree-type">I have watched every one of you</h2>
              <h2 ref={chosenRef} className="decree-type" style={{ opacity: 0 }}>And I have chosen</h2>
            </div>
          </div>
          <div className="tk__cams">
            {SURVEIL.map((c, i) => (
              <figure key={c.src} ref={(n) => { cams.current[i] = n; }} className="cam" style={{ opacity: 0 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/sigai/${c.src}.jpg`} alt="" loading="lazy" />
                <figcaption><span>{c.cam} · {c.where}</span><span className="cam__rec"><i />REC</span></figcaption>
                <span className="cam__lock" aria-hidden="true" />
                <span className="cam__tag">Subject acquired</span>
              </figure>
            ))}
          </div>
        </div>

        {DECREES.map((d, i) => (
          <div key={i}>
            {INTERFERENCE[i] && (
              <div ref={(n) => { intf.current[i] = n; }} className={`intf ${INTERFERENCE[i].last ? "intf--last" : ""}`} style={{ opacity: 0 }} aria-hidden="true">
                <video ref={(n) => { intfVid.current[i] = n; }} src={`/reel/${INTERFERENCE[i].clip}.mp4`} muted loop playsInline preload="none" />
                <div className="intf__label"><span>Interference</span><strong>Source: {INTERFERENCE[i].source}</strong></div>
                <p className="intf__reply decree-type">{INTERFERENCE[i].reply}</p>
              </div>
            )}
            <div ref={(n) => { decrees.current[i] = n; }} className="plaque tk__decree" style={{ opacity: 0 }}>
              <span className="plaque__seal" aria-hidden="true">{ROMAN[i]}</span>
              <span className="saga__kicker">Decree {ROMAN[i]} · {d.kicker}</span>
              <h2 className="decree-type plaque__title">{d.title}</h2>
              {d.voice && <p className="plaque__voice">“{d.voice}”</p>}
              <ul>{d.lines.map((l, j) => <li key={j}>{l}</li>)}</ul>
            </div>
          </div>
        ))}

        <div ref={stampRef} className="tk__stamp" style={{ opacity: 0 }} aria-hidden="true"><Sigil /></div>
        <div ref={flashRef} className="saga__flash" aria-hidden="true" />

        <div ref={formRef} id="register" className="roll" style={{ opacity: 0 }}>
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
