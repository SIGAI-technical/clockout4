"use client";

import React, { useState, useEffect } from "react";
import { EVENT_CONFIG } from "@/config/event";
import { FastForward, RotateCcw, Volume2, VolumeX } from "lucide-react";

interface NavbarProps {
  onRegisterClick: () => void;
  onSkipIntro: () => void;
  onReplayIntro: () => void;
  showSkipIntro?: boolean;
  showReplayButton?: boolean;
  reachedRegistration?: boolean;
  isMuted?: boolean;
  onToggleMute?: () => void;
}

export default function Navbar({
  onRegisterClick,
  onSkipIntro,
  onReplayIntro,
  showSkipIntro = true,
  showReplayButton = false,
  reachedRegistration = false,
  isMuted,
  onToggleMute,
}: NavbarProps) {
  const [internalMuted, setInternalMuted] = useState(true);
  const effectiveMuted = isMuted !== undefined ? isMuted : internalMuted;
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);
  const [droneRef, setDroneRef] = useState<{ stop: () => void } | null>(null);

  const toggleAudio = () => {
    if (onToggleMute) {
      onToggleMute();
      return;
    }
    if (internalMuted) {
      try {
        const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0, ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 2);
        masterGain.connect(ctx.destination);

        const osc1 = ctx.createOscillator();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(40, ctx.currentTime);
        const g1 = ctx.createGain();
        g1.gain.setValueAtTime(0.6, ctx.currentTime);
        osc1.connect(g1);
        g1.connect(masterGain);
        osc1.start();

        const osc2 = ctx.createOscillator();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(60, ctx.currentTime);
        const g2 = ctx.createGain();
        g2.gain.setValueAtTime(0.3, ctx.currentTime);
        osc2.connect(g2);
        g2.connect(masterGain);
        osc2.start();

        const osc3 = ctx.createOscillator();
        osc3.type = "triangle";
        osc3.frequency.setValueAtTime(120, ctx.currentTime);
        const g3 = ctx.createGain();
        g3.gain.setValueAtTime(0.08, ctx.currentTime);
        osc3.connect(g3);
        g3.connect(masterGain);
        osc3.start();

        setAudioCtx(ctx);
        setDroneRef({
          stop: () => {
            masterGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 1.5);
            setTimeout(() => ctx.close(), 1600);
          },
        });
        setInternalMuted(false);
      } catch {
        // Audio not available
      }
    } else {
      droneRef?.stop();
      setDroneRef(null);
      setAudioCtx(null);
      setInternalMuted(true);
    }
  };

  useEffect(() => {
    return () => {
      if (audioCtx) audioCtx.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isDefined = reachedRegistration;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ease-in-out ${
        isDefined
          ? "py-3 backdrop-blur-xl shadow-lg"
          : "py-4 sm:py-5 bg-transparent backdrop-blur-none"
      }`}
      style={{
        background: isDefined ? "rgba(5,6,5,0.94)" : "transparent",
        borderBottom: isDefined ? "1px solid rgba(16,185,129,0.12)" : "1px solid transparent",
      }}
    >
      <div className="w-full flex items-center justify-between px-4 sm:px-6 md:px-8">
        {/* Brand */}
        <a
          href="#"
          className="flex items-center gap-3 group cursor-pointer select-none"
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
        >
          <div className="relative w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
            <div className="absolute inset-0 border border-[#10b981]/35 group-hover:border-[#10b981]/65 transition-colors" />
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="relative z-10">
              <path d="M9 1L17 15H1L9 1Z" stroke="#10b981" strokeWidth="1.5" fill="none"/>
              <path d="M9 5L14 14H4L9 5Z" fill="#10b981" opacity="0.25"/>
              <circle cx="9" cy="9" r="1.5" fill="#10b981"/>
            </svg>
          </div>

          <div className="flex flex-col leading-none">
            <span
              className="text-xs sm:text-sm tracking-[0.2em] text-[#f2f2f0] group-hover:text-[#a7f3d0] transition-colors uppercase"
              style={{ fontFamily: "var(--font-bebas), 'Arial Narrow', sans-serif", fontSize: "clamp(0.85rem, 2vw, 1.1rem)", letterSpacing: "0.2em" }}
            >
              {EVENT_CONFIG.name}
            </span>
            <span className="text-[9px] font-mono tracking-[0.28em] text-[#8ca396] uppercase mt-0.5">
              AIML DEPT
            </span>
          </div>
        </a>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-2.5">
          {showSkipIntro && (
            <button
              onClick={onSkipIntro}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 border border-white/12 hover:border-[#10b981]/45 text-[10px] sm:text-[11px] font-mono tracking-[0.18em] uppercase text-[#8ca396] hover:text-[#a7f3d0] transition-all backdrop-blur-md cursor-pointer"
              style={{ background: "rgba(0,0,0,0.5)" }}
            >
              <FastForward className="w-3 h-3" />
              <span className="hidden sm:inline font-bold">SKIP</span>
            </button>
          )}

          {showReplayButton && (
            <button
              onClick={onReplayIntro}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 border border-white/10 hover:border-white/22 text-[10px] font-mono tracking-wider uppercase text-[#8ca396] hover:text-[#f2f2f0] transition-all cursor-pointer"
              style={{ background: "rgba(0,0,0,0.4)" }}
            >
              <RotateCcw className="w-3 h-3" />
              <span className="hidden sm:inline">REPLAY</span>
            </button>
          )}

          {/* Audio toggle */}
          <button
            onClick={toggleAudio}
            type="button"
            title={effectiveMuted ? "Enable atmospheric audio" : "Disable audio"}
            className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center border border-white/10 hover:border-[#10b981]/38 text-[#8ca396] hover:text-[#a7f3d0] transition-all cursor-pointer"
            style={{ background: "rgba(0,0,0,0.4)" }}
          >
            {effectiveMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-[#10b981]" />}
          </button>

          {/* Register CTA */}
          <button
            onClick={onRegisterClick}
            type="button"
            className="px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-b from-[#10b981] to-[#047857] hover:from-[#34d399] hover:to-[#059669] text-white border border-[#34d399]/40 font-bold font-mono text-[10px] sm:text-[11px] tracking-[0.22em] uppercase transition-all shadow-[0_4px_16px_rgba(16,185,129,0.35)] hover:scale-[1.03] active:scale-[0.98] cursor-pointer"
          >
            REGISTER
          </button>
        </div>
      </div>
    </header>
  );
}
