"use client";

import React, { useMemo } from "react";
import { EVENT_CONFIG } from "@/config/event";
import { MapPin, Calendar, Clock } from "lucide-react";

interface CinematicTitleRevealProps {
  t: number | null;
  isCompleted: boolean;
  onRegisterClick: () => void;
  reducedMotion?: boolean;
}

// ─── Key Sequence Timestamps (seconds into V3/Audio) ────────────────────────
const T_V3_END        = 9.333; // Doom throne reaches final frame
const T_GLOW_START    = 9.7;   // Faint emerald backlight introduces
const T_TITLE_START   = 10.2;  // CLOCKOUT 4.0 begins smooth scale-up & fade-in
const T_TITLE_REST    = 13.2;  // Title settles in its final position
const T_SWEEP_START   = 13.4;  // Specular light sweep starts across letters
const T_SWEEP_END     = 14.8;  // Specular light sweep finishes cleanly just ahead of 4.0
const T_TAGLINE_START = 15.2;  // THE DOOM TAKEOVER fades in beneath title
const T_TAGLINE_REST  = 16.8;  // Tagline fully visible; finished title holds
const T_DETAILS_START = 18.8;  // Event meta cards fade in beneath title

// Subtle drifting atmospheric particles behind the title
const PARTICLES = [
  { id: 1, left: "20%", top: "42%", size: 3, delay: "0s", dur: "7s", drift: "-20px" },
  { id: 2, left: "32%", top: "58%", size: 2, delay: "1.2s", dur: "6.5s", drift: "18px" },
  { id: 3, left: "50%", top: "35%", size: 3, delay: "2.5s", dur: "8s", drift: "-12px" },
  { id: 4, left: "68%", top: "60%", size: 2, delay: "0.8s", dur: "7.2s", drift: "20px" },
  { id: 5, left: "80%", top: "45%", size: 3, delay: "2.0s", dur: "6.8s", drift: "-16px" },
];

export default function CinematicTitleReveal({
  t,
  isCompleted,
  onRegisterClick,
  reducedMotion = false,
}: CinematicTitleRevealProps) {
  // Reveal activates when video 3 reaches final frame or when intro is skipped/completed
  const isRevealed = isCompleted || (t !== null && t >= T_V3_END);

  const state = useMemo(() => {
    if (!isRevealed) {
      return {
        visible: false,
        backlightOpacity: 0,
        titleOpacity: 0,
        titleScale: 0.92,
        titleY: 12,
        showSweep: false,
        sweepPos: -12,
        sweepOpacity: 0,
        tagOpacity: 0,
        tagY: 6,
        detailsOpacity: 0,
        detailsY: 14,
        detailsInteractive: false,
      };
    }

    if (reducedMotion || isCompleted) {
      return {
        visible: true,
        backlightOpacity: 1,
        titleOpacity: 1,
        titleScale: 1,
        titleY: 0,
        showSweep: false,
        sweepPos: 104,
        sweepOpacity: 0,
        tagOpacity: 1,
        tagY: 0,
        detailsOpacity: 1,
        detailsY: 0,
        detailsInteractive: true,
      };
    }

    const curT = t ?? 0;

    // 1. Faint emerald backlight introducing behind screen center
    let backlightOpacity = 0;
    if (curT >= T_GLOW_START) {
      backlightOpacity = Math.min(1, (curT - T_GLOW_START) / 1.2);
    }

    // 2. Single CLOCKOUT 4.0 title reveal: smooth scale-up & fade-in from darkness
    let titleOpacity = 0;
    let titleScale = 0.92;
    let titleY = 12;

    if (curT >= T_TITLE_START) {
      const rawP = Math.min(1, Math.max(0, (curT - T_TITLE_START) / (T_TITLE_REST - T_TITLE_START)));
      // Controlled deceleration ease (cubic ease-out)
      const ease = 1 - Math.pow(1 - rawP, 3);
      titleOpacity = Math.min(1, rawP * 2.2);
      titleScale = 0.92 + 0.08 * ease;
      titleY = 12 * (1 - ease);
    }

    // 3. Specular diamond-silver light sweep across letters — travels just ahead of 4.0 then gracefully dissolves
    let showSweep = false;
    let sweepPos = -10;
    let sweepOpacity = 0;
    if (curT >= T_SWEEP_START && curT <= T_SWEEP_END) {
      showSweep = true;
      const swP = (curT - T_SWEEP_START) / (T_SWEEP_END - T_SWEEP_START);
      // Sweeps from -10% to 104% (just slightly ahead of 4.0)
      sweepPos = -10 + swP * 114;
      // As it passes 4.0 (swP >= 0.78), cleanly fade opacity to 0
      sweepOpacity = swP < 0.78 ? 1 : Math.max(0, 1 - (swP - 0.78) / 0.22);
    } else {
      sweepPos = 104;
      sweepOpacity = 0;
    }

    // 4. Tagline: THE DOOM TAKEOVER appears beneath the title with an elegant fade
    let tagOpacity = 0;
    let tagY = 6;
    if (curT >= T_TAGLINE_START) {
      const p = Math.min(1, (curT - T_TAGLINE_START) / (T_TAGLINE_REST - T_TAGLINE_START));
      const easeTag = 1 - Math.pow(1 - p, 3);
      tagOpacity = Math.min(1, p * 1.5);
      tagY = 6 * (1 - easeTag);
    }

    // 5. Event Details appear beneath title during normal scrolling
    let detailsOpacity = 0;
    let detailsY = 14;
    let detailsInteractive = false;
    if (curT >= T_DETAILS_START) {
      const p = Math.min(1, (curT - T_DETAILS_START) / 1.4);
      const easeDet = 1 - Math.pow(1 - p, 3);
      detailsOpacity = Math.min(1, p * 1.3);
      detailsY = 14 * (1 - easeDet);
      detailsInteractive = p > 0.6;
    }

    return {
      visible: true,
      backlightOpacity,
      titleOpacity,
      titleScale,
      titleY,
      showSweep,
      sweepPos,
      sweepOpacity,
      tagOpacity,
      tagY,
      detailsOpacity,
      detailsY,
      detailsInteractive,
    };
  }, [isRevealed, isCompleted, reducedMotion, t]);

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 sm:px-6 pointer-events-none select-none overflow-hidden transition-opacity duration-300"
      style={{
        zIndex: 35,
        opacity: state.visible ? 1 : 0,
        visibility: state.visible ? "visible" : "hidden",
      }}
      aria-label="Clockout 4.0 — The Doom Takeover Title"
    >
      {/* ── Subtle Black Overlay keeping Doctor Doom on the Throne visible behind ── */}
      <div
        className="absolute inset-0 bg-black pointer-events-none transition-opacity duration-500"
        style={{ opacity: state.visible ? 0.48 : 0 }}
      />

      {/* ── Faint Emerald Atmospheric Backlight ── */}
      <div
        className="avengers-backlight"
        style={{
          opacity: state.backlightOpacity,
          transition: isCompleted ? "none" : "opacity 0.6s ease-out",
        }}
      />
      <div
        className="avengers-core-glint"
        style={{
          opacity: state.backlightOpacity * 0.7,
          transition: isCompleted ? "none" : "opacity 0.6s ease-out",
        }}
      />

      {/* ── Drifting Atmospheric Micro-Particles ── */}
      {state.backlightOpacity > 0.1 && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {PARTICLES.map((p) => (
            <div
              key={p.id}
              className="metal-particle"
              style={{
                left: p.left,
                top: p.top,
                width: `${p.size}px`,
                height: `${p.size}px`,
                ["--delay" as string]: p.delay,
                ["--dur" as string]: p.dur,
                ["--drift" as string]: p.drift,
              }}
            />
          ))}
        </div>
      )}

      {/* ── EXACT TITLE LAYOUT (Rendered Once In The DOM) ── */}
      <div
        className="cinematic-title-card"
        style={{
          opacity: state.titleOpacity,
          transform: `scale(${state.titleScale}) translateY(${state.titleY}px)`,
          ["--sweep-pos" as string]: `${state.sweepPos}%`,
          ["--sweep-opacity" as string]: `${state.sweepOpacity}`,
        }}
      >
        {/* Single Monumental Heading */}
        <h1 className="cinematic-title">
          CLOCKOUT <span className="title-number">4.0</span>
          {/* Anamorphic light sweep flare — travels just ahead of 4.0 then gracefully dissolves */}
          {state.showSweep && (
            <span
              className="title-sweep-flare"
              style={{
                left: `${state.sweepPos}%`,
                opacity: state.sweepOpacity,
              }}
              aria-hidden="true"
            />
          )}
        </h1>

        {/* Tagline directly underneath in smaller uppercase lettering */}
        <p
          className="cinematic-tagline"
          style={{
            opacity: state.tagOpacity,
            transform: `translateY(${state.tagY}px)`,
          }}
        >
          {EVENT_CONFIG.subtitle}
        </p>
      </div>

      {/* ── Event Details & Registration Appearing Beneath During Normal Scrolling ── */}
      <div
        className="relative z-20 flex flex-col items-center mt-3 sm:mt-5 md:mt-7 max-w-2xl w-full px-2"
        style={{
          opacity: state.detailsOpacity,
          transform: `translateY(${state.detailsY}px)`,
          pointerEvents: state.detailsInteractive ? "auto" : "none",
          transition: isCompleted ? "none" : "opacity 0.4s ease-out, transform 0.4s ease-out",
        }}
      >
        {/* AIML Department Badge — Sovereign Obsidian Glass */}
        <div
          className="inline-flex items-center gap-2 mb-2 sm:mb-3 px-3.5 py-1.5 backdrop-blur-xl"
          style={{
            borderLeft: "2px solid #10b981",
            borderTop: "1px solid rgba(255, 255, 255, 0.08)",
            borderRight: "1px solid rgba(255, 255, 255, 0.05)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
            background: "rgba(10, 14, 12, 0.85)",
            color: "#c7d6cf",
            fontSize: "clamp(0.58rem, 1.6vw, 0.68rem)",
            fontFamily: "var(--font-inter), monospace",
            fontWeight: 600,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            boxShadow: "0 8px 24px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <span className="w-1.5 h-1.5 bg-[#10b981] animate-status-pulse flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
          AIML DEPARTMENT PRESENTS
        </div>

        {/* Event Meta Cards: Venue, Date, Time */}
        <div
          className="w-full backdrop-blur-2xl"
          style={{
            background: "rgba(8, 12, 10, 0.88)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.9), inset 0 1px 0 rgba(255,255,255,0.06)",
          }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-white/8">
            <div className="flex items-center gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3.5 text-left">
              <MapPin className="w-3.5 h-3.5 text-[#6ee7b7] shrink-0 opacity-80" />
              <div>
                <div className="text-[8px] font-mono text-[#8ca396] tracking-[.36em] uppercase">
                  VENUE
                </div>
                <div className="text-[11px] sm:text-xs font-mono text-[#f3f5f4] mt-0.5 font-medium leading-tight">
                  {EVENT_CONFIG.location}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3.5 text-left">
              <Calendar className="w-3.5 h-3.5 text-[#dfc17b] shrink-0 opacity-80" />
              <div>
                <div className="text-[8px] font-mono text-[#8ca396] tracking-[.36em] uppercase">
                  DATE
                </div>
                <div className="text-[11px] sm:text-xs font-mono text-[#f3f5f4] mt-0.5 font-medium leading-tight">
                  {EVENT_CONFIG.date}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 px-3.5 py-2.5 sm:px-4 sm:py-3.5 text-left">
              <Clock className="w-3.5 h-3.5 text-[#6ee7b7] shrink-0 opacity-80" />
              <div>
                <div className="text-[8px] font-mono text-[#8ca396] tracking-[.36em] uppercase">
                  TIME
                </div>
                <div className="text-[11px] sm:text-xs font-mono text-[#f3f5f4] mt-0.5 font-medium leading-tight">
                  {EVENT_CONFIG.time}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Call-to-Action — Sovereign Emerald Plaque */}
        <div className="mt-4 sm:mt-6 pointer-events-auto">
          <button
            onClick={onRegisterClick}
            type="button"
            className="group relative px-9 sm:px-16 py-3.5 sm:py-4 text-white font-bold text-xs sm:text-sm tracking-[.32em] uppercase transition-all duration-300 hover:scale-[1.03] active:scale-[.98] cursor-pointer flex items-center gap-3 overflow-hidden"
            style={{
              fontFamily: "var(--font-oswald), sans-serif",
              background: "linear-gradient(180deg, #10b981 0%, #059669 50%, #047857 100%)",
              borderTop: "1px solid rgba(255, 255, 255, 0.4)",
              borderLeft: "1px solid rgba(255, 255, 255, 0.15)",
              borderRight: "1px solid rgba(255, 255, 255, 0.15)",
              borderBottom: "1px solid rgba(0, 0, 0, 0.5)",
              boxShadow: "0 12px 32px -4px rgba(5, 150, 105, 0.45), 0 4px 12px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
            }}
          >
            {/* Specular glint on button hover */}
            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out pointer-events-none" />
            <span className="relative z-10 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">REGISTER NOW</span>
            <span className="relative z-10 group-hover:translate-x-1.5 transition-transform duration-200 text-white/90">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
