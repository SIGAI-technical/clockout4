"use client";

import { useEffect, useRef } from "react";
import { drumHit } from "@/lib/identScore";
import { createQuad } from "@/lib/gl";
import { EVENT } from "@/config/event";
import { TAKEOVER_FRAG } from "../takeover/takeoverShader";
import DoomFace from "./DoomFace";

/* ── The opener: Doom takes the channel ────────────────────────────────────────────────────────────
   About three screens, pinned. The department's channel dies; Doom's signal takes it; his hood comes
   out of the dark; his eyes open; he speaks. Then the page lets go and the site begins.        */
const EYES_AT = 0.36;
type Line = [number, number, string, "voice" | "big" | "huge"];
const SPEECH: Line[] = [
  [0.4, 0.55, "Do not look away.", "voice"],
  [0.6, 0.97, "Students of the AIML Department.", "voice"],
  [0.67, 0.97, "Your Clockout is over.", "voice"],
  [0.76, 0.97, "Doom’s begins.", "huge"],
];

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
  const chRef = useRef<HTMLSpanElement>(null);
  const clockRef = useRef<HTMLSpanElement>(null);
  const speech = useRef<(HTMLParagraphElement | null)[]>([]);

  useEffect(() => {
    const el = root.current!;
    const quad = createQuad(cv.current!, TAKEOVER_FRAG, 1.25);
    const onResize = () => quad?.resize();
    onResize(); addEventListener("resize", onResize);
    const look = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => { look.tx = e.clientX / innerWidth - 0.5; look.ty = e.clientY / innerHeight - 0.5; };
    addEventListener("pointermove", onMove);
    let raf = 0, cur = 0, last = "", eyesHit = false;
    const t0 = performance.now();

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const t = (now - t0) / 1000;
      const box = el.getBoundingClientRect();
      const target = cl(-box.top / Math.max(1, el.offsetHeight - innerHeight));
      cur += (target - cur) * 0.12;
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
      const presence = sm((p - 0.14) / 0.16);
      const eyes = sm((p - EYES_AT) / 0.015);
      const push = 1 + 0.16 * sm((p - 0.14) / 0.86);
      if (eyes > 0.5 && !eyesHit && forward) { eyesHit = true; drumHit(1, true); }
      if (p < EYES_AT - 0.03) eyesHit = false;
      if (p > EYES_AT && p < EYES_AT + 0.03) shake = 0.8 * (1 - (p - EYES_AT) / 0.03);
      look.x += (look.tx - look.x) * 0.06; look.y += (look.ty - look.y) * 0.06;
      const dm = doomRef.current;
      if (dm) {
        dm.style.setProperty("--presence", String(presence));
        dm.style.setProperty("--eyes", String(eyes * (0.92 + 0.08 * Math.sin(t * 9 + Math.sin(t * 2.3) * 3))));
        dm.style.setProperty("--push", String(push));
        dm.style.setProperty("--lx", String(look.x)); dm.style.setProperty("--ly", String(look.y));
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

      if (stageRef.current) {
        const s = Math.min(1.4, shake);
        stageRef.current.style.transform = s > 0.01 ? `translate(${(Math.random() - 0.5) * 14 * s}px, ${(Math.random() - 0.5) * 10 * s}px)` : "";
      }
      if (clockRef.current) {
        const s = Math.floor(t), f = Math.floor((t % 1) * 24);
        clockRef.current.textContent = `${String(Math.floor(s / 3600)).padStart(2, "0")}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}:${String(f).padStart(2, "0")}`;
      }
      if (chRef.current) chRef.current.textContent = p < 0.08 ? "CH 04 · AIML DEPT" : "LATVERIA · STATE BROADCAST";

      if (beat !== last) { if (forward && beat && !beat.startsWith("say0")) drumHit(beat === "say3" ? 1 : 0.6, beat === "say3"); last = beat; }

      if (quad) {
        quad.resize();
        quad.render({
          uRes: [quad.gl.drawingBufferWidth, quad.gl.drawingBufferHeight], uTime: t, uStatic: statik,
          uGlass: (1 - statik) * 0.22, uPulse: 0.5 + 0.5 * Math.sin(t * 1.2), uTear: p > 0.06 && p < 0.1 ? 1 : 0, uStamp: 0,
        });
      }
    };
    raf = requestAnimationFrame(frame);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", onResize); removeEventListener("pointermove", onMove); quad?.destroy(); };
  }, []);

  return (
    <section ref={root} id="top" className="tk tk--opener" aria-label={`${EVENT.name} ${EVENT.edition}: ${EVENT.title}`}>
      <div ref={stageRef} className="tk__stage">
        <canvas ref={cv} className="tk__bg" aria-hidden="true" />
        <div ref={doomRef} className="tk__doom" aria-hidden="true">
          <DoomFace className="tk__doom-frame" />
        </div>
        <div className="tk__hud" aria-hidden="true">
          <span ref={chRef}>CH 04 · AIML DEPT</span>
          <span className="tk__rec"><i />REC</span>
          <span ref={clockRef}>00:00:00:00</span>
          <span>{EVENT.name} {EVENT.edition}</span>
        </div>
        <div ref={noRef} className="tk__nosignal" data-state="lost" aria-hidden="true">
          <strong className="tk__lost">No signal</strong>
          <strong className="tk__got">Signal intercepted</strong>
        </div>
        <h1 className="sr-only">{EVENT.name} {EVENT.edition}: {EVENT.title}. {EVENT.host}.</h1>
        <div className="tk__speech" aria-hidden="true">
          {SPEECH.map(([, , text, w], i) => (
            <p key={i} ref={(n) => { speech.current[i] = n; }} className={`tk__say tk__say--${w} ${w !== "voice" ? "decree-type" : ""}`} style={{ opacity: 0 }}>{text}</p>
          ))}
        </div>
        <div ref={hintRef} className="saga__hint" aria-hidden="true"><span>Scroll</span><i /></div>
      </div>
    </section>
  );
}
