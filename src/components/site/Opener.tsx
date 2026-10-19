"use client";

import { useEffect, useRef } from "react";
import { drumHit } from "@/lib/identScore";
import { cue, setBed, setMusic } from "@/lib/score";
import { createQuad } from "@/lib/gl";
import { EVENT } from "@/config/event";
import { TAKEOVER_FRAG } from "./takeoverShader";
import DoomFace from "./DoomFace";

/* ── The opener: Doom takes the channel ────────────────────────────────────────────────────────────
   About three screens, pinned. The department's channel dies; Doom's signal takes it; his hood comes
   out of the dark; his eyes open; he speaks. Then the page lets go and the site begins.        */
const EYES_AT = 0.29;
type Line = [number, number, string, "voice" | "big" | "huge"];
const SPEECH: Line[] = [
  [0.33, 0.43, "Do not look away.", "voice"],
  [0.46, 0.72, "Students of the AIML Department.", "voice"],
  [0.51, 0.72, "Your Clockout is over.", "voice"],
  [0.57, 0.72, "Doom’s begins.", "huge"],
];
// after his last word the camera goes into the dark of the hood until there is nothing but black;
// the castle comes up out of that black
const DIVE: [number, number] = [0.72, 0.97];

const cl = (x: number) => Math.min(1, Math.max(0, x));
const sm = (x: number) => { x = cl(x); return x * x * (3 - 2 * x); };
const win = (p: number, a: number, b: number, f = 0.03) => sm((p - a) / f) * (1 - sm((p - b + f) / f));

export default function Opener() {
  const root = useRef<HTMLElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const doomRef = useRef<HTMLDivElement>(null);
  const noRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const speech = useRef<(HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    const el = root.current!;
    const quad = createQuad(cv.current!, TAKEOVER_FRAG, 1.25);
    const onResize = () => quad?.resize();
    onResize(); addEventListener("resize", onResize);
    let raf = 0, cur = 0, last = "", eyesHit = false, diveHit = false, hijackHit = false;
    const t0 = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const t = (now - t0) / 1000;
      const box = el.getBoundingClientRect();
      const target = cl(-box.top / Math.max(1, el.offsetHeight - innerHeight));
      cur += (target - cur) * 0.3;
      if (Math.abs(target - cur) < 0.0002) cur = target;
      if (box.bottom < 0 || box.top > innerHeight) return;
      const p = cur, forward = target > cur - 0.001;
      let beat = "", shake = 0;

      // the channel dies, then Doom has it
      const statik = 1 - sm((p - 0.04) / 0.1);
      const no = noRef.current;
      if (no) { no.style.opacity = String(1 - sm((p - 0.16) / 0.04)); no.dataset.state = p > 0.08 ? "intercepted" : "lost"; }
      if (p > 0.08) beat = "intercept";

      // Doom: out of the dark, closer, and then the eyes
      // out of the dark — and, as the camera goes into his mouth, back into it
      const presence = sm((p - 0.12) / 0.14) * (1 - sm((p - DIVE[0] - 0.1) / 0.1));
      const dive = sm((p - DIVE[0]) / (DIVE[1] - DIVE[0]));
      const eyes = sm((p - EYES_AT) / 0.015) * (1 - sm((p - DIVE[0] - 0.08) / 0.07));
      const push = (1 + 0.12 * sm((p - 0.12) / (DIVE[0] - 0.12))) * (1 + dive * dive * 7);
      if (eyes > 0.5 && !eyesHit && forward) { eyesHit = true; cue("braam"); drumHit(0.8, true); }
      if (p < EYES_AT - 0.03) eyesHit = false;
      if (p > EYES_AT && p < EYES_AT + 0.03) shake = 0.8 * (1 - (p - EYES_AT) / 0.03);
      const dm = doomRef.current;
      if (dm) {
        dm.style.setProperty("--presence", String(presence));
        dm.style.setProperty("--eyes", String(eyes * (0.92 + 0.08 * Math.sin(t * 9 + Math.sin(t * 2.3) * 3))));
        dm.style.setProperty("--push", String(push));
      }

      SPEECH.forEach(([a, b, , w], i) => {
        const o = win(p, a, b);
        const n = speech.current[i];
        if (n) {
          n.style.opacity = String(o); n.style.filter = `blur(${(1 - o) * 10}px)`;
          n.style.transform = w === "huge" ? `scale(${1.12 - 0.12 * sm((p - a) / 0.03)})` : "";
        }
        if (p > a && p < b) beat = "say" + i;
        if (w === "huge" && p > a && p < a + 0.04) shake = Math.max(shake, 1 - (p - a) / 0.04);
      });
      if (hintRef.current) hintRef.current.style.opacity = String(1 - sm(p / 0.04));
      if (blackRef.current) blackRef.current.style.opacity = String(sm((p - DIVE[1] + 0.1) / 0.08));

      if (stageRef.current) {
        const s = Math.min(1.4, shake);
        stageRef.current.style.transform = s > 0.01 ? `translate(${(Math.random() - 0.5) * 14 * s}px, ${(Math.random() - 0.5) * 10 * s}px)` : "";
      }

      // sound: the hijack hits, his last word lands like a door, the dive rises into the dark
      if (beat !== last) {
        if (forward && beat === "say3") { cue("boom", 0.9); drumHit(1, true); }
        else if (forward && beat.startsWith("say") && beat !== "say0") drumHit(0.5);
        last = beat;
      }
      if (p > 0.08 && !hijackHit && forward) { hijackHit = true; cue("hit", 0.8); }
      if (p < 0.06) hijackHit = false;
      if (dive > 0.02 && !diveHit && forward) { diveHit = true; cue("riser"); }
      if (dive < 0.01) diveHit = false;
      setBed(0.35 + 0.4 * presence);
      setMusic(dive * 0.6);   // the music comes up out of the dive

      if (quad) {
        quad.resize();
        quad.render({
          uRes: [quad.gl.drawingBufferWidth, quad.gl.drawingBufferHeight], uTime: t, uStatic: statik,
          uGlass: (1 - statik) * 0.22 * (1 - dive), uPulse: 0.5 + 0.5 * Math.sin(t * 1.2), uTear: p > 0.06 && p < 0.1 ? 1 : 0, uStamp: 0,
        });
      }
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", onResize); quad?.destroy(); };
  }, []);

  return (
    <section ref={root} id="top" className="tk tk--opener" aria-label={`${EVENT.name} ${EVENT.edition}: ${EVENT.title}`}>
      <div ref={stageRef} className="tk__stage">
        <canvas ref={cv} className="tk__bg" aria-hidden="true" />
        <div ref={doomRef} className="tk__doom" aria-hidden="true">
          <DoomFace />
        </div>
        <div ref={noRef} className="tk__nosignal" data-state="lost" aria-hidden="true">
          <strong className="tk__lost">No signal</strong>
          <strong className="tk__got">Signal intercepted</strong>
        </div>
        <h1 className="sr-only">{EVENT.name} {EVENT.edition}: {EVENT.title}. {EVENT.host}.</h1>
        <div className="tk__speech" aria-hidden="true">
          {SPEECH.map(([, , text, w], i) => (
            <p key={i} ref={(n) => { speech.current[i] = n; }} className={`tk__say tk__say--${w}`} style={{ opacity: 0 }}>{text}</p>
          ))}
        </div>
        <div ref={hintRef} className="saga__hint" aria-hidden="true"><span>Scroll</span><i /></div>
        <div ref={blackRef} className="tk__black" aria-hidden="true" />
      </div>
    </section>
  );
}
