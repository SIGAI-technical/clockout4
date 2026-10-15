"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
} from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import CinematicTitleReveal from "@/components/CinematicTitleReveal";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

// ─── Durations ────────────────────────────────────────────────────────────────
const V1_DUR    = 6.966;
const V2_DUR    = 6.166;
const V3_DUR    = 9.333;
const AUDIO_DUR = 31.03; // Full Avengers theme duration

// ─── Subtitle timing (seconds into V3+audio sequence) ────────────────────────
const T_HELL_END   = 5.5;
const T_FORIAM_END = 7.5;
const T_DOOM_END   = V3_DUR;

export interface CinematicScrollHandle {
  skipIntro: () => void;
  replayIntro: () => void;
}

interface CinematicScrollProps {
  onRegisterClick: () => void;
  onCinematicComplete?: (isCompleted: boolean) => void;
  isMuted?: boolean;
}

// ─── Embers ───────────────────────────────────────────────────────────────────
const EMBERS = Array.from({ length: 16 }, (_, i) => ({
  x: 6 + (i / 16) * 88, delay: (i * 0.38) % 4,
  dur: 3.5 + (i % 4) * 0.8, size: 2 + (i % 2), gold: i % 3 === 2,
}));
function Ember({ x, delay, dur, size, gold }: { x: number; delay: number; dur: number; size: number; gold: boolean }) {
  return (
    <div className="absolute bottom-0 rounded-full pointer-events-none"
      style={{ left: `${x}%`, width: size, height: size, background: gold ? "rgba(201,162,39,.7)" : "rgba(61,220,132,.7)", animation: `ember-float ${dur}s ease-out ${delay}s infinite`, ["--drift" as string]: `${(x - 50) * .8}px` }}
    />
  );
}

// ─── Dialogue subtitles ───────────────────────────────────────────────────────
function Subtitles({ t }: { t: number | null }) {
  if (t === null || t >= T_DOOM_END) return null;
  return (
    <div className="absolute inset-x-0 flex flex-col items-center justify-center pointer-events-none select-none" style={{ bottom: "clamp(3rem,8vh,5rem)", zIndex: 30 }}>
      <div className="absolute inset-x-0 -inset-y-12 -z-10 pointer-events-none" style={{ background: "radial-gradient(ellipse 90% 80% at 50% 70%,rgba(0,0,0,.8) 0%,rgba(0,0,0,.4) 60%,transparent 100%)" }} />
      {t < T_HELL_END && (
        <div className="flex flex-wrap items-baseline justify-center gap-x-4 uppercase animate-rise-fade-in" style={{ fontFamily: "var(--font-bebas),'Arial Narrow',sans-serif", fontSize: "clamp(2rem,6vw,4.5rem)", letterSpacing: ".18em" }}>
          <span style={{ color: "#3ddc84", textShadow: "0 0 30px rgba(61,220,132,.9),0 4px 16px rgba(0,0,0,.95)" }}>Hell</span>
          <span style={{ color: "#fff", textShadow: "0 0 25px rgba(255,255,255,.8),0 4px 16px rgba(0,0,0,.95)" }}>Answers</span>
          <span style={{ color: "#fbbf24", textShadow: "0 0 30px rgba(251,191,36,.9),0 4px 16px rgba(0,0,0,.95)" }}>to me</span>
        </div>
      )}
      {t >= T_HELL_END && t < T_FORIAM_END && (
        <div className="animate-rise-fade-in" style={{ fontFamily: "var(--font-oswald),sans-serif", fontSize: "clamp(1.5rem,4vw,3.5rem)", fontWeight: 700, letterSpacing: ".35em", textTransform: "uppercase", color: "#e5e7eb", textShadow: "0 0 30px rgba(255,255,255,.8),0 4px 16px rgba(0,0,0,.95)" }}>
          FOR I AM
        </div>
      )}
      {t >= T_FORIAM_END && t < T_DOOM_END && (
        <div className="flex flex-col items-center">
          <span style={{ fontFamily: "var(--font-oswald),sans-serif", fontSize: "clamp(.8rem,2vw,1.3rem)", fontWeight: 500, letterSpacing: ".45em", textTransform: "uppercase", color: "#7bb898", marginBottom: ".25rem", textShadow: "0 0 20px rgba(61,220,132,.5)" }}>FOR I AM</span>
          <h2 className="animate-doom-pop animate-avengers-glow" style={{ fontFamily: "var(--font-bebas),'Arial Narrow',sans-serif", fontSize: "clamp(5rem,17vw,13rem)", lineHeight: 1, letterSpacing: ".1em", textTransform: "uppercase", background: "linear-gradient(180deg,#fff 0%,#3ddc84 55%,#157338 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", filter: "drop-shadow(0 0 35px rgba(61,220,132,.95)) drop-shadow(0 0 75px rgba(61,220,132,.6)) drop-shadow(0 8px 24px rgba(0,0,0,.95))" }}>
            DOOM
          </h2>
        </div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────
const CinematicScroll = forwardRef<CinematicScrollHandle, CinematicScrollProps>(
  ({ onRegisterClick, onCinematicComplete, isMuted = false }, ref) => {
    const containerRef    = useRef<HTMLDivElement>(null);
    const stageRef        = useRef<HTMLDivElement>(null);
    const v1Ref           = useRef<HTMLVideoElement>(null);
    const v2Ref           = useRef<HTMLVideoElement>(null);
    const v3Ref           = useRef<HTMLVideoElement>(null);
    const audioRef        = useRef<HTMLAudioElement>(null);
    const v1LayerRef      = useRef<HTMLDivElement>(null);
    const t1LayerRef      = useRef<HTMLDivElement>(null);
    const v2LayerRef      = useRef<HTMLDivElement>(null);
    const t2LayerRef      = useRef<HTMLDivElement>(null);
    const v3LayerRef      = useRef<HTMLDivElement>(null);
    const freezeLayerRef  = useRef<HTMLDivElement>(null);
    const progressWrapRef = useRef<HTMLDivElement>(null);
    // Invisible click-catcher that triggers V3 on Safari (where play() must be from a click)
    const clickCatcherRef = useRef<HTMLDivElement>(null);

    const [isMobile, setIsMobile]         = useState(false);
    const [seqTime, setSeqTime]           = useState<number | null>(null);
    const [isCompleted, setIsCompleted]   = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);
    const [waitingClick, setWaitingClick] = useState(false); // show "tap to continue" on Safari

    const isMutedRef = useRef(isMuted);
    useEffect(() => {
      isMutedRef.current = isMuted;
      if (audioRef.current) {
        audioRef.current.muted = isMuted;
      }
    }, [isMuted]);

    const onCinematicCompleteRef = useRef(onCinematicComplete);
    useEffect(() => { onCinematicCompleteRef.current = onCinematicComplete; }, [onCinematicComplete]);

    const completedRef      = useRef(false);
    const v3StartedRef      = useRef(false);
    const v3PendingRef      = useRef(false);
    const userScrolledRef   = useRef(false);
    const scrollUnlockedRef = useRef(false);
    const rafRef            = useRef<number | null>(null);
    const unlockScrollRef   = useRef<(() => void) | null>(null);

    // ── Seek manager ──────────────────────────────────────────────────────────
    const seekingRef = useRef<Record<string, boolean>>({ v1: false, v2: false, v3: false });
    const pendingRef = useRef<Record<string, number | null>>({ v1: null, v2: null, v3: null });
    const fbRef      = useRef<Record<string, NodeJS.Timeout | null>>({ v1: null, v2: null, v3: null });
    const seekFnRef  = useRef<(k: "v1" | "v2" | "v3", t: number) => void>(() => {});

    const seek = useCallback((key: "v1" | "v2" | "v3", target: number) => {
      const el  = key === "v1" ? v1Ref.current : key === "v2" ? v2Ref.current : v3Ref.current;
      if (!el) return;
      const dur = el.duration || (key === "v1" ? V1_DUR : key === "v2" ? V2_DUR : V3_DUR);
      const c   = Math.max(0, Math.min(dur - .08, target));
      if (el.readyState < 1) { pendingRef.current[key] = c; try { el.load(); } catch { /**/ } return; }
      if (Math.abs(el.currentTime - c) < .02) return;
      if (seekingRef.current[key]) { pendingRef.current[key] = c; return; }
      seekingRef.current[key] = true;
      if (fbRef.current[key]) clearTimeout(fbRef.current[key]!);
      fbRef.current[key] = setTimeout(() => {
        seekingRef.current[key] = false;
        const nx = pendingRef.current[key];
        if (nx !== null) { pendingRef.current[key] = null; seekFnRef.current(key, nx); }
      }, 50);
      try { el.currentTime = c; } catch { seekingRef.current[key] = false; }
    }, []);
    useEffect(() => { seekFnRef.current = seek; }, [seek]);

    useEffect(() => {
      const pairs: { key: "v1" | "v2" | "v3"; el: HTMLVideoElement | null }[] = [
        { key: "v1", el: v1Ref.current }, { key: "v2", el: v2Ref.current }, { key: "v3", el: v3Ref.current },
      ];
      const fns = pairs.map(({ key, el }) => {
        if (!el) return () => {};
        const onS = () => {
          if (fbRef.current[key]) { clearTimeout(fbRef.current[key]!); fbRef.current[key] = null; }
          seekingRef.current[key] = false;
          const nx = pendingRef.current[key];
          if (nx !== null) { pendingRef.current[key] = null; seekFnRef.current(key, nx); }
        };
        const onR = () => {
          const nx = pendingRef.current[key];
          if (nx !== null) { pendingRef.current[key] = null; seekFnRef.current(key, nx); }
        };
        el.addEventListener("seeked", onS, { passive: true });
        el.addEventListener("loadedmetadata", onR, { passive: true });
        el.addEventListener("canplay", onR, { passive: true });
        return () => {
          el.removeEventListener("seeked", onS);
          el.removeEventListener("loadedmetadata", onR);
          el.removeEventListener("canplay", onR);
        };
      });
      const currentFb = fbRef.current;
      return () => {
        fns.forEach(f => f());
        Object.values(currentFb).forEach(t => { if (t) clearTimeout(t); });
      };
    }, []);

    // ── Scroll lock ───────────────────────────────────────────────────────────
    const lockScroll = useCallback(() => {
      if (unlockScrollRef.current) return;
      const stop = (e: Event) => { e.preventDefault(); e.stopPropagation(); };
      const stopK = (e: KeyboardEvent) => {
        if (["ArrowUp","ArrowDown","PageUp","PageDown","Home","End"," "].includes(e.key)) e.preventDefault();
      };
      window.addEventListener("wheel", stop, { passive: false });
      window.addEventListener("touchmove", stop, { passive: false });
      window.addEventListener("keydown", stopK, { passive: false });
      document.body.style.overflow = document.documentElement.style.overflow = "hidden";
      unlockScrollRef.current = () => {
        document.body.style.overflow = document.documentElement.style.overflow = "";
        window.removeEventListener("wheel", stop);
        window.removeEventListener("touchmove", stop);
        window.removeEventListener("keydown", stopK);
        unlockScrollRef.current = null;
      };
    }, []);

    useEffect(() => () => {
      unlockScrollRef.current?.();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    }, []);

    // ── Complete ──────────────────────────────────────────────────────────────
    const handleComplete = useCallback(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      setIsCompleted(true);
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      setSeqTime(null);
      setWaitingClick(false);
      try { audioRef.current?.pause(); } catch { /**/ }
      try { v3Ref.current?.pause();    } catch { /**/ }
      if (freezeLayerRef.current) freezeLayerRef.current.style.opacity = "1";
      if (v3LayerRef.current)     v3LayerRef.current.style.opacity     = "1";
      unlockScrollRef.current?.();

      const trig   = ScrollTrigger.getById("cinematic-trigger");
      const endPos = trig
        ? trig.end
        : containerRef.current
        ? containerRef.current.offsetTop + containerRef.current.offsetHeight
        : document.body.scrollHeight;
      window.scrollTo({ top: endPos, behavior: "auto" });

      onCinematicCompleteRef.current?.(true);
    }, []);

    // ── CORE: actually play V3 + audio — must be called from a click/tap ─────
    const doPlay = useCallback(() => {
      if (v3StartedRef.current || completedRef.current) return;
      v3StartedRef.current = true;
      v3PendingRef.current = false;
      setWaitingClick(false);
      lockScroll();

      if (v1LayerRef.current) v1LayerRef.current.style.opacity = "0";
      if (t1LayerRef.current) { t1LayerRef.current.style.opacity = "0"; t1LayerRef.current.style.visibility = "hidden"; }
      if (v2LayerRef.current) v2LayerRef.current.style.opacity = "0";
      if (t2LayerRef.current) { t2LayerRef.current.style.opacity = "0"; t2LayerRef.current.style.visibility = "hidden"; }
      if (v3LayerRef.current)     v3LayerRef.current.style.opacity     = "1";
      if (freezeLayerRef.current) freezeLayerRef.current.style.opacity = "0";
      if (progressWrapRef.current) progressWrapRef.current.style.opacity = "0";

      const v3    = v3Ref.current;
      const audio = audioRef.current;

      if (v3) {
        v3.muted = true; v3.defaultMuted = true; v3.playsInline = true;
        v3.setAttribute("muted", ""); v3.setAttribute("playsinline", "");
        if (v3.currentTime > .05) v3.currentTime = 0;
      }
      if (audio) {
        if (audio.currentTime > .05) audio.currentTime = 0;
        audio.volume = 1.0;
        audio.muted = isMutedRef.current;
      }

      const t0 = performance.now();

      // V3 is muted → play always succeeds on any browser
      v3?.play().catch(() => {
        if (v3) { try { v3.load(); v3.play().catch(() => {}); } catch { /**/ } }
      });

      // Audio: try unmuted. If blocked, show tap prompt as fallback.
      if (audio) {
        audio.muted = isMutedRef.current;
        audio.play()
          .then(() => { /* playing unmuted ✓ */ })
          .catch(() => {
            // Fallback: try muted-then-unmute
            audio.muted = true;
            audio.play()
              .then(() => { audio.muted = isMutedRef.current; })
              .catch(() => {
                setWaitingClick(true);
                const btn = document.getElementById("unmute-btn");
                if (btn) btn.style.display = "flex";
              });
          });
      }

      setSeqTime(0);

      const loop = () => {
        const aud = audioRef.current;
        const v   = v3Ref.current;
        let   t   = 0;

        if (aud && !aud.paused && aud.currentTime > 0) {
          t = aud.currentTime;
          if (v && !v.paused) {
            const d = aud.currentTime - v.currentTime;
            if      (Math.abs(d) > .15) v.playbackRate = d > 0 ? 1.08 : .93;
            else if (Math.abs(d) > .05) v.playbackRate = d > 0 ? 1.03 : .97;
            else if (v.playbackRate !== 1) v.playbackRate = 1;
          }
        } else if (v && !v.paused && v.currentTime > 0) {
          t = v.currentTime;
        } else {
          t = (performance.now() - t0) / 1000;
        }

        // Fade freeze frame as V3 ends
        if (t >= V3_DUR - .3 && freezeLayerRef.current)
          freezeLayerRef.current.style.opacity = `${Math.min(1, (t - (V3_DUR - .3)) / .3)}`;

        // When title & event details are fully revealed, unlock scrolling so user can scroll if they want
        if (t >= 20.5 && !scrollUnlockedRef.current) {
          scrollUnlockedRef.current = true;
          unlockScrollRef.current?.();
          onCinematicCompleteRef.current?.(true);
        }

        if (aud?.ended || t >= AUDIO_DUR + .2) { handleComplete(); return; }

        setSeqTime(t);
        rafRef.current = requestAnimationFrame(loop);
      };
      rafRef.current = requestAnimationFrame(loop);

      if (audio) audio.onended = handleComplete;
    }, [lockScroll, handleComplete]);

    const doPlayRef = useRef(doPlay);
    useEffect(() => { doPlayRef.current = doPlay; }, [doPlay]);

    // ── Skip / Replay ─────────────────────────────────────────────────────────
    const handleSkip = useCallback(() => {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      try { if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; } } catch { /**/ }
      try { v3Ref.current?.pause(); } catch { /**/ }
      setSeqTime(null); setWaitingClick(false);
      unlockScrollRef.current?.();
      v3StartedRef.current = true; v3PendingRef.current = false; completedRef.current = true;
      setIsCompleted(true);
      pendingRef.current = { v1: null, v2: null, v3: null };

      if (v1LayerRef.current) v1LayerRef.current.style.opacity = "0";
      if (t1LayerRef.current) { t1LayerRef.current.style.opacity = "0"; t1LayerRef.current.style.visibility = "hidden"; }
      if (v2LayerRef.current) v2LayerRef.current.style.opacity = "0";
      if (t2LayerRef.current) { t2LayerRef.current.style.opacity = "0"; t2LayerRef.current.style.visibility = "hidden"; }
      if (v3LayerRef.current) v3LayerRef.current.style.opacity = "1";
      if (freezeLayerRef.current) freezeLayerRef.current.style.opacity = "1";
      if (progressWrapRef.current) progressWrapRef.current.style.opacity = "0";

      const trig   = ScrollTrigger.getById("cinematic-trigger");
      const endPos = trig ? trig.end : containerRef.current ? containerRef.current.offsetTop + containerRef.current.offsetHeight : document.body.scrollHeight;
      window.scrollTo({ top: endPos, behavior: "auto" });
      onCinematicCompleteRef.current?.(true);
    }, []);

    const handleReplay = useCallback(() => {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      try { if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; } } catch { /**/ }
      unlockScrollRef.current?.();
      v3StartedRef.current = false; v3PendingRef.current = false; completedRef.current = false;
      setIsCompleted(false);
      scrollUnlockedRef.current = false;
      setSeqTime(null); setWaitingClick(false);
      window.scrollTo({ top: 0, behavior: "auto" });
      [v1Ref, v2Ref, v3Ref].forEach(r => { try { r.current?.pause(); if (r.current) r.current.currentTime = 0; } catch { /**/ } });
      if (v1LayerRef.current) v1LayerRef.current.style.opacity = "1";
      if (t1LayerRef.current) { t1LayerRef.current.style.opacity = "0"; t1LayerRef.current.style.visibility = "hidden"; }
      if (v2LayerRef.current) v2LayerRef.current.style.opacity = "0";
      if (t2LayerRef.current) { t2LayerRef.current.style.opacity = "0"; t2LayerRef.current.style.visibility = "hidden"; }
      if (v3LayerRef.current) v3LayerRef.current.style.opacity = "0";
      if (freezeLayerRef.current) freezeLayerRef.current.style.opacity = "0";
      if (progressWrapRef.current) progressWrapRef.current.style.opacity = "1";
      onCinematicCompleteRef.current?.(false);
    }, []);

    useImperativeHandle(ref, () => ({ skipIntro: handleSkip, replayIntro: handleReplay }));

    // Mobile detection
    useEffect(() => {
      const check = () => setIsMobile(window.innerWidth < 768);
      check();
      window.addEventListener("resize", check, { passive: true });
      return () => window.removeEventListener("resize", check);
    }, []);

    // Preload videos (seek-based, no play needed for V1/V2)
    useEffect(() => {
      [v1Ref, v2Ref, v3Ref].forEach(r => {
        const v = r.current;
        if (!v) return;
        v.muted = true; v.defaultMuted = true; v.playsInline = true;
        v.setAttribute("muted",""); v.setAttribute("playsinline",""); v.setAttribute("webkit-playsinline","true");
        v.preload = "auto";
        v.load();
      });
      const audio = audioRef.current;
      if (audio) { audio.preload = "auto"; audio.load(); }
    }, []);

    // Scroll to top on mount
    useEffect(() => {
      if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
      window.scrollTo(0, 0);
      const mark = () => { userScrolledRef.current = true; };
      ["wheel","touchmove","scroll","keydown"].forEach(e => window.addEventListener(e, mark, { passive: true, once: true }));
      return () => ["wheel","touchmove","scroll","keydown"].forEach(e => window.removeEventListener(e, mark));
    }, []);

    // GSAP ScrollTrigger — drives V1/V2 scrubbing, triggers V3 on scroll
    useEffect(() => {
      const container = containerRef.current;
      const stage     = stageRef.current;
      if (!container || !stage) return;
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        requestAnimationFrame(() => {
          completedRef.current = true;
          setIsCompleted(true);
          setReducedMotion(true);
          onCinematicCompleteRef.current?.(true);
        });
        return;
      }
      const mult = isMobile ? 5.0 : 6.5;
      const ctx  = gsap.context(() => {
        ScrollTrigger.create({
          id: "cinematic-trigger",
          trigger: container, start: "top top", end: `+=${mult * 100}%`,
          pin: stage, scrub: .4, anticipatePin: 1,
          onUpdate: (self) => {
            const p = self.progress;
            if (!userScrolledRef.current && p > .05) { window.scrollTo(0, 0); return; }

            if (completedRef.current && p < .65) {
              completedRef.current = false;
              v3StartedRef.current = false;
              v3PendingRef.current = false;
              setIsCompleted(false);
              scrollUnlockedRef.current = false;
              if (freezeLayerRef.current)  freezeLayerRef.current.style.opacity  = "0";
              if (v3LayerRef.current)      v3LayerRef.current.style.opacity      = "0";
              onCinematicCompleteRef.current?.(false);
            }
            if (completedRef.current) {
              if (freezeLayerRef.current)  freezeLayerRef.current.style.opacity  = "1";
              if (v3LayerRef.current)      v3LayerRef.current.style.opacity      = "1";
              if (progressWrapRef.current) progressWrapRef.current.style.opacity = "0";
              return;
            }

            // V1
            if (p <= .23) {
              seekFnRef.current("v1", Math.min(1, Math.max(0, p / .20)) * V1_DUR);
              if (v1LayerRef.current) v1LayerRef.current.style.opacity = `${p > .16 ? Math.max(0, (.21 - p) / .05) : 1}`;
            } else if (v1LayerRef.current) v1LayerRef.current.style.opacity = "0";

            // T1
            if (t1LayerRef.current) {
              if (p >= .19 && p <= .39) {
                let op = 0;
                if (p >= .20 && p < .25) op = (p - .20) / .05;
                else if (p >= .25 && p <= .33) op = 1;
                else if (p > .33 && p <= .38) op = (.38 - p) / .05;
                op = Math.max(0, Math.min(1, op));
                t1LayerRef.current.style.opacity    = `${op}`;
                t1LayerRef.current.style.visibility = op > 0 ? "visible" : "hidden";
              } else { t1LayerRef.current.style.opacity = "0"; t1LayerRef.current.style.visibility = "hidden"; }
            }

            // V2
            if (p >= .36 && p <= .60) {
              seekFnRef.current("v2", Math.min(1, Math.max(0, (p - .38) / .18)) * V2_DUR);
              if (v2LayerRef.current) {
                let op = 1;
                if (p < .40) op = (p - .36) / .04;
                else if (p > .53) op = (.58 - p) / .05;
                v2LayerRef.current.style.opacity = `${Math.max(0, Math.min(1, op))}`;
              }
            } else if (v2LayerRef.current) v2LayerRef.current.style.opacity = "0";

            // T2
            if (t2LayerRef.current) {
              if (p >= .56 && p <= .71) {
                if (!v3StartedRef.current && !v3PendingRef.current) {
                  if (v3Ref.current && v3Ref.current.currentTime > .05) v3Ref.current.currentTime = 0;
                  if (audioRef.current && audioRef.current.currentTime > .05) audioRef.current.currentTime = 0;
                }
                let op = 0;
                if (p >= .57 && p < .62) op = (p - .57) / .05;
                else if (p >= .62 && p <= .67) op = 1;
                else if (p > .67 && p <= .71) op = (.71 - p) / .04;
                op = Math.max(0, Math.min(1, op));
                t2LayerRef.current.style.opacity    = `${op}`;
                t2LayerRef.current.style.visibility = op > 0 ? "visible" : "hidden";
              } else { t2LayerRef.current.style.opacity = "0"; t2LayerRef.current.style.visibility = "hidden"; }
            }

            // At p >= 0.70: show tap/touch prompt to authorize audio and start V3
            if (p >= .70 && !v3StartedRef.current && !v3PendingRef.current && !completedRef.current) {
              v3PendingRef.current = true;
              setWaitingClick(true);
            }

            if (progressWrapRef.current)
              progressWrapRef.current.style.opacity = p >= .70 || completedRef.current ? "0" : "1";
          },
        });
      }, container);
      return () => { ctx.revert(); };
    }, [isMobile]);

    return (
      <section ref={containerRef} id="cinematic-container" className="relative w-full"
        style={{ minHeight: isMobile ? "500vh" : "650vh" }} aria-label="Clockout 4.0 Cinematic Experience"
      >
        <div ref={stageRef} id="cinematic-stage" className="sticky top-0 w-full overflow-hidden select-none bg-black" style={{ height: "100svh" }}>

          {/* Film grain (subtle cinematic texture that doesn't obscure sharpness) */}
          <div className="absolute inset-0 pointer-events-none opacity-10 mix-blend-overlay" style={{ zIndex: 15, backgroundImage: "radial-gradient(rgba(61,220,132,.12) 1px,transparent 1px)", backgroundSize: "3px 3px" }} />

          {/* V1 */}
          <div ref={v1LayerRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 1 }}>
            <video ref={v1Ref} src="/videos/v1_hd.mp4" muted playsInline preload="auto" onEnded={e => e.currentTarget.pause()} className="w-full h-full object-cover" style={{ filter: "contrast(1.05) brightness(1.0) saturate(1.08)", transform: "translateZ(0)" }} />
          </div>

          {/* T1 */}
          <div ref={t1LayerRef} className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none" style={{ zIndex: 20, opacity: 0, visibility: "hidden", background: "#000" }}>
            <h2 style={{ fontFamily: "var(--font-bebas),sans-serif", fontSize: "clamp(2.5rem,7vw,5rem)", letterSpacing: ".12em", textTransform: "uppercase", color: "#f2f2f0", lineHeight: 1.1, marginBottom: "1rem" }}>THE GATES HAVE OPENED</h2>
            <p style={{ fontFamily: "var(--font-oswald),sans-serif", fontSize: "clamp(.7rem,1.8vw,1.1rem)", letterSpacing: ".3em", textTransform: "uppercase", color: "#3ddc84", fontWeight: 500 }}>ARE YOU READY TO FACE WHAT LIES AHEAD</p>
          </div>

          {/* V2 */}
          <div ref={v2LayerRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0 }}>
            <video ref={v2Ref} src="/videos/v2_hd.mp4" muted playsInline preload="auto" onEnded={e => e.currentTarget.pause()} className="w-full h-full object-cover" style={{ filter: "contrast(1.05) brightness(1.0) saturate(1.08)", transform: "translateZ(0)" }} />
          </div>

          {/* T2 */}
          <div ref={t2LayerRef} className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pointer-events-none" style={{ zIndex: 20, opacity: 0, visibility: "hidden", background: "#000" }}>
            <h2 style={{ fontFamily: "var(--font-bebas),sans-serif", fontSize: "clamp(2.5rem,7vw,5rem)", letterSpacing: ".12em", textTransform: "uppercase", color: "#f2f2f0", lineHeight: 1.1, marginBottom: "1rem" }}>THE RULER AWAITS</h2>
            <p style={{ fontFamily: "var(--font-oswald),sans-serif", fontSize: "clamp(.7rem,1.8vw,1.1rem)", letterSpacing: ".3em", textTransform: "uppercase", color: "#c9a227", fontWeight: 500 }}>ENTER THE SANCTUM OF DOOM</p>
          </div>

          {/* V3 */}
          <div ref={v3LayerRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0 }}>
            <video ref={v3Ref} src="/videos/v3_hd.mp4" muted playsInline preload="auto" onEnded={e => e.currentTarget.pause()} className="w-full h-full object-cover" style={{ filter: "contrast(1.05) brightness(1.0) saturate(1.08)", transform: "translateZ(0)" }} />
          </div>

          {/* Audio */}
          <audio ref={audioRef} src="/audio/5a.mp3" preload="auto" playsInline onEnded={handleComplete} />

          {/* Freeze frame */}
          <div ref={freezeLayerRef} className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/v3_freeze_frame.jpg" alt="Doom on the Throne" className="w-full h-full object-cover" style={{ filter: "contrast(1.05) brightness(1.0) saturate(1.08)", transform: "translateZ(0)" }} />
          </div>

          {/* Vignette */}
          <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10, background: "radial-gradient(ellipse 90% 80% at 50% 50%,transparent 35%,rgba(0,0,0,.6) 80%,rgba(0,0,0,.95) 100%)" }} />

          {/* Embers */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 10 }}>
            {EMBERS.map((e, i) => <Ember key={i} x={e.x} delay={e.delay} dur={e.dur} size={e.size} gold={e.gold} />)}
          </div>

          {/* ── Click catcher ── Shown when scroll hits 70% (V3 ready).          */}
          {/* Safari requires play() to originate from a direct user click.        */}
          {/* This full-screen invisible div catches the user's next click/tap.    */}
          {waitingClick && (
            <div
              ref={clickCatcherRef}
              className="absolute inset-0 flex items-end justify-center cursor-pointer"
              style={{ zIndex: 38, paddingBottom: "clamp(2rem,6vh,4rem)" }}
              onClick={doPlay}
              onTouchEnd={e => { e.preventDefault(); doPlay(); }}
            >
              {/* Pulsing tap prompt */}
              <div
                className="animate-pulse"
                style={{
                  fontFamily: "var(--font-oswald),sans-serif",
                  fontSize: "clamp(.7rem,1.8vw,.95rem)",
                  letterSpacing: ".4em",
                  textTransform: "uppercase",
                  color: "rgba(61,220,132,.75)",
                  padding: ".5rem 1.5rem",
                  border: "1px solid rgba(61,220,132,.3)",
                  background: "rgba(0,0,0,.6)",
                  backdropFilter: "blur(8px)",
                }}
              >
                ▶ TAP TO CONTINUE
              </div>
            </div>
          )}

          {/* Unmute fallback (id-based so doPlay can reference it) */}
          <div id="unmute-btn" className="absolute inset-x-0 mx-auto w-fit" style={{ top: "5rem", zIndex: 40, display: "none", pointerEvents: "auto" }}>
            <button type="button"
              onClick={() => { const a = audioRef.current; if (!a) return; a.muted = false; a.play().catch(() => {}); (document.getElementById("unmute-btn") as HTMLDivElement).style.display = "none"; }}
              className="px-6 py-3 border border-[#3ddc84]/50 bg-black/90 backdrop-blur-md text-[#3ddc84] text-sm tracking-[.2em] uppercase flex items-center gap-2.5 hover:scale-105 transition-all cursor-pointer"
              style={{ fontFamily: "var(--font-oswald),sans-serif" }}
            >
              ▶ TAP TO ENABLE SOUND
            </button>
          </div>

          {/* Dialogue Subtitles (Hell Answers to me... FOR I AM DOOM) */}
          <Subtitles t={seqTime} />

          {/* Cinematic Avengers-Style Monumental Metallic Title Reveal */}
          <CinematicTitleReveal
            t={seqTime}
            isCompleted={isCompleted}
            onRegisterClick={onRegisterClick}
            reducedMotion={reducedMotion}
          />

          {/* Scroll prompt */}
          <div ref={progressWrapRef} className="absolute bottom-6 inset-x-0 flex flex-col items-center pointer-events-none transition-opacity duration-500" style={{ zIndex: 30 }}>
            <span className="text-[10px] sm:text-xs tracking-[.35em] uppercase text-white/50 animate-pulse" style={{ fontFamily: "var(--font-inter),monospace" }}>scroll ↓</span>
          </div>
        </div>
      </section>
    );
  }
);

CinematicScroll.displayName = "CinematicScroll";
export default CinematicScroll;
