"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { startAmbience, unlockAudio } from "@/lib/sfx";
import { prefersReducedMotion } from "@/lib/gl";
import { clipProgress, loadCastle, onClipProgress } from "@/lib/castleClips";
import { identScoreReady, playIdentScore, preloadIdentScore, resumeAudio, startOmen, type Handle } from "@/lib/identScore";
import DoomSilhouette from "./DoomSilhouette";
import type { IdentAssets, IdentScene } from "./ident/IdentScene";

type Phase = "gate" | "reel" | "done";

/** An inviting gate that quietly loads the reel, then the SIGAI ident in WebGL with its own score. */
export default function Overture({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<Phase>("gate");
  const [progress, setProgress] = useState(0);
  const assets = useRef<IdentAssets | null>(null);
  const cv = useRef<HTMLCanvasElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const score = useRef<Handle | null>(null);
  const omen = useRef<Handle | null>(null);

  // skipping cuts the score; a natural ending lets its tail ring into the site
  const finish = useCallback((skipped = false) => {
    if (skipped) score.current?.stop();
    score.current = null;
    omen.current?.stop(0.4); omen.current = null;
    setPhase("done");
    try { sessionStorage.setItem("co4-seen", "1"); } catch { /* storage blocked */ }
    startAmbience();
    onDone();
  }, [onDone]);

  useEffect(() => {
    document.documentElement.classList.toggle("is-locked", phase !== "done");
    return () => document.documentElement.classList.remove("is-locked");
  }, [phase]);

  // returning visitors in the same session skip straight in
  useEffect(() => {
    let seen = false;
    try { seen = sessionStorage.getItem("co4-seen") === "1"; } catch { /* ignore */ }
    if (!seen) return;
    const id = requestAnimationFrame(() => { setPhase("done"); onDone(); });
    return () => cancelAnimationFrame(id);
  }, [onDone]);

  // the gate's drone: armed now, audible from the first click or key press anywhere
  useEffect(() => {
    omen.current = startOmen();
    preloadIdentScore();
    const wake = () => resumeAudio();
    addEventListener("pointerdown", wake); addEventListener("keydown", wake); addEventListener("touchstart", wake);
    return () => {
      removeEventListener("pointerdown", wake); removeEventListener("keydown", wake); removeEventListener("touchstart", wake);
      omen.current?.stop(0.3); omen.current = null;
    };
  }, []);

  // the gate doubles as the preloader: the intro's own assets, and the first stretch of the castle
  // (the rest of the castle keeps arriving while the intro plays)
  useEffect(() => {
    let live = true, intro = 0, introDone = false;
    loadCastle();
    const update = () => {
      if (!live) return;
      const castle = clipProgress(0);
      setProgress(introDone && castle >= 1 ? 1 : Math.min(0.99, intro * 0.55 + castle * 0.45));
    };
    const off = onClipProgress(update);
    import("./ident/IdentScene").then(({ loadIdentAssets }) =>
      loadIdentAssets((p) => { intro = p; update(); }).then((a) => { if (live) { assets.current = a; intro = 1; introDone = true; update(); } }),
    );
    return () => { live = false; off(); };
  }, []);

  useEffect(() => {
    if (phase !== "reel" || !assets.current) return;
    let raf = 0, alive = true;
    let scene: IdentScene | null = null;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") finish(true); };
    const onResize = () => scene?.resize();
    addEventListener("keydown", onKey); addEventListener("resize", onResize);
    import("./ident/IdentScene").then(({ IdentScene: Scene, T }) => {
      if (!alive || !cv.current || !assets.current) return;
      scene = new Scene(cv.current, assets.current);
      // draw two frames first so shaders compile and textures upload, wait for the score to be
      // rendered, and only then start picture and sound together — on the same clock
      scene.render(0);
      requestAnimationFrame(() => {
        if (!alive) return;
        scene!.render(0);
        identScoreReady().then(() => {
          if (!alive) return;
          score.current = playIdentScore();
          const t0 = performance.now();
          raf = requestAnimationFrame(loop.bind(null, t0));
        });
      });
      const loop = (t0: number, now: number) => {
        // the score's clock when it is sounding, wall time otherwise — and never ahead of real time
        const wall = (now - t0) / 1000;
        const at = score.current?.time?.() ?? -1;
        const t = at >= 0 ? Math.min(at, wall + 0.05) : wall;
        scene!.render(t);
        const sub = subRef.current;
        if (sub) {
          const inn = Math.min(1, Math.max(0, (t - T.SUB) / 0.8));
          sub.style.opacity = String(inn * (1 - Math.min(1, Math.max(0, (t - T.FADE) / 0.6))));
          sub.style.transform = `translateY(${(1 - inn) * 8}px)`;
        }
        if (t >= T.END) { finish(); return; }
        raf = requestAnimationFrame(loop.bind(null, t0));
      };
    });
    return () => {
      alive = false; cancelAnimationFrame(raf);
      removeEventListener("keydown", onKey); removeEventListener("resize", onResize);
      scene?.dispose();
    };
  }, [phase, finish]);

  const ready = progress >= 1;
  const enter = () => {
    if (!ready) return;
    unlockAudio();
    if (prefersReducedMotion()) { finish(); return; }
    omen.current?.stop(0.8); omen.current = null;
    resumeAudio();
    setPhase("reel");
  };

  if (phase === "done") return null;
  return (
    <div className="overture" role="dialog" aria-modal="true" aria-label="Enter Clockout 4.0">
      {phase === "gate" && (
        <div className="gate">
          <DoomSilhouette />
          <div className="gate__inner">
            <p className="t-track gate__pre">SIGAI · AIML Department</p>
            <h1 className="gate__title">The multiverse <em>has a new ruler.</em></h1>
            <p className="gate__lede">The clock is ticking. The trials are waiting. And Doom has already made his move.</p>
            <p className="t-track gate__tag">Clockout 4.0 · The Doom Takeover</p>
            <button type="button" className={`gate__enter ${ready ? "is-ready" : ""}`} onClick={enter} aria-disabled={!ready} style={{ ["--p" as string]: progress }}>
              <span className="gate__fill" aria-hidden="true" />
              <span className="gate__label">{ready ? "Enter" : `Preparing · ${Math.round(progress * 100)}%`}</span>
            </button>
            <p className="gate__note"><i aria-hidden="true" />Best with headphones</p>
          </div>
        </div>
      )}
      {phase === "reel" && (
        <>
          <canvas ref={cv} className="overture__cv" aria-hidden="true" />
          <div ref={subRef} className="overture__sub" style={{ opacity: 0 }}>
            <span className="t-track">Special Interest Group · Artificial Intelligence</span>
            <span className="overture__ed">presents</span>
          </div>
        </>
      )}
      <button type="button" className="overture__skip t-track" onClick={() => finish(true)}>Skip intro</button>
    </div>
  );
}
