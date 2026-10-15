"use client";

import React, { useEffect, useRef, useState } from "react";
import { EVENT_CONFIG } from "@/config/event";
import { Clock, Terminal } from "lucide-react";

interface TimelinePhase {
  phase: string;
  codename: string;
  timeRange: string;
  title: string;
  summary: string;
  deliverables: string[];
  status: "SCHEDULED" | "UPCOMING" | "CLASSIFIED";
}

const PHASES: TimelinePhase[] = [
  {
    phase: "PHASE 01",
    codename: "INCURSION_PROTOCOL",
    timeRange: "2:00 PM — 2:45 PM",
    title: "The Sovereign Conclave & Gate Check",
    summary:
      "Gates open at the 4th Floor proving grounds. Participants register credentials, receive Latverian security badges, and attend the opening keynote.",
    deliverables: ["Credential Verification", "Track Problem Statements Unveiled", "Squad Assembly"],
    status: "SCHEDULED",
  },
  {
    phase: "PHASE 02",
    codename: "NEURAL_FORGE",
    timeRange: "2:45 PM — 6:00 PM",
    title: "The Crucible: Computational Warfare",
    summary:
      "Intensive sprint where squads architect, train, and deploy models against benchmark problem statements under real-time faculty inspection.",
    deliverables: ["Model Architecture", "Rapid Prototyping", "Interim Checkpoint Review"],
    status: "UPCOMING",
  },
  {
    phase: "PHASE 03",
    codename: "THRONE_JUDGMENT",
    timeRange: "6:00 PM Onwards",
    title: "Doomsday Evaluation & Sovereign Honors",
    summary:
      "Final project pitch before the jury. Top architectures are summoned to stand before the throne to receive honors and commendation.",
    deliverables: ["Live System Demonstration", "Jury Defense", "Ceremony of Accolades"],
    status: "CLASSIFIED",
  },
];

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "#10b981",
  UPCOMING: "#c5a059",
  CLASSIFIED: "#8a9490",
};

export default function DoomsdayTimeline() {
  const sectionRef = useRef<HTMLElement>(null);
  const [activePhaseIndex, setActivePhaseIndex] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.querySelectorAll("[data-animate]").forEach((el, i) => {
              setTimeout(() => {
                (el as HTMLElement).style.opacity = "1";
                (el as HTMLElement).style.transform = "translateY(0)";
              }, i * 80);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="event-timeline"
      className="relative z-10 w-full py-24 sm:py-32 px-4 sm:px-6 lg:px-8"
      aria-label="Event Timeline"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div
          className="text-center mb-16 sm:mb-20"
          data-animate
          style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}
        >
          <div className="flex justify-center mb-5">
            <span className="section-badge">
              <Clock className="w-3 h-3" />
              MISSION CHRONOLOGY
            </span>
          </div>

          <h2 className="font-cinzel font-black text-4xl sm:text-6xl tracking-[0.08em] uppercase text-[#f2f2f0] leading-tight">
            The Takeover Protocol
          </h2>

          <div className="doom-divider mt-5 max-w-xs mx-auto">
            <span className="doom-divider-text">{EVENT_CONFIG.location} • {EVENT_CONFIG.time}</span>
          </div>
        </div>

        {/* Interactive Phase Selector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Phase Navigation Tabs */}
          <div className="lg:col-span-5 flex flex-col gap-3">
            {PHASES.map((p, idx) => {
              const isActive = activePhaseIndex === idx;
              const statusColor = STATUS_COLORS[p.status] || "#8a9490";
              return (
                <button
                  key={p.codename}
                  onClick={() => setActivePhaseIndex(idx)}
                  type="button"
                  data-animate
                  className={`text-left relative overflow-hidden cursor-pointer transition-all duration-300 ${
                    isActive
                      ? "shadow-xl"
                      : "hover:bg-[#090c0a]"
                  }`}
                  style={{
                    opacity: 0,
                    padding: "1.25rem 1.4rem",
                    transform: "translateY(20px)",
                    transition: `opacity 0.6s ease ${idx * 0.1}s, transform 0.6s ease ${idx * 0.1}s, border-color 0.2s, background 0.2s`,
                    border: isActive ? "1px solid rgba(61,220,132,0.45)" : "1px solid rgba(255,255,255,0.08)",
                    background: isActive ? "rgba(12,20,14,0.95)" : "rgba(9,12,10,0.65)",
                    boxShadow: isActive ? "0 0 40px -15px rgba(61,220,132,0.35)" : "none",
                  }}
                >
                  {/* Left accent indicator */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-[#10b981] to-[#c5a059]" />
                  )}

                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[9px] font-mono tracking-[0.32em] uppercase text-[#8ca396]">
                      {p.phase} {"//"} {p.codename}
                    </span>
                    <span
                      className="text-[9px] font-mono px-2 py-0.5 uppercase tracking-wider border"
                      style={{
                        color: statusColor,
                        borderColor: `${statusColor}40`,
                        background: `${statusColor}10`,
                      }}
                    >
                      {p.status}
                    </span>
                  </div>

                  <h3 className="font-cinzel font-bold text-base sm:text-lg text-[#f2f2f0] mb-2 leading-snug">
                    {p.title}
                  </h3>

                  <div className="flex items-center gap-2 text-xs font-mono text-[#5a7066]">
                    <Clock className="w-3.5 h-3.5 text-[#c9a227]" />
                    <span>{p.timeRange}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Phase Deep Dive Card */}
          <div
            className="lg:col-span-7 relative overflow-hidden"
            style={{
              background: "rgba(10,15,11,0.88)",
              border: "1px solid rgba(61,220,132,0.2)",
              boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
              backdropFilter: "blur(20px)",
              padding: "2rem 2.25rem",
            }}
          >
            {/* Top accent */}
            <div
              className="absolute top-0 inset-x-0 h-px"
              style={{
                background: "linear-gradient(90deg, transparent, #10b981, #c5a059, transparent)",
              }}
            />

            {/* Tactical watermark */}
            <div className="absolute right-4 bottom-4 text-[4rem] sm:text-[6rem] font-black font-cinzel text-white/[0.02] select-none pointer-events-none">
              0{activePhaseIndex + 1}
            </div>

            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-10 h-10 border border-[#10b981]/38 flex items-center justify-center text-[#10b981]"
                style={{ background: "rgba(16,185,129,0.08)" }}
              >
                <Terminal className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] font-mono tracking-[0.32em] uppercase text-[#8ca396] block">
                  DIRECTIVE DOSSIER
                </span>
                <h4 className="font-cinzel font-black text-xl sm:text-2xl text-[#f2f2f0] mt-0.5">
                  {PHASES[activePhaseIndex].title}
                </h4>
              </div>
            </div>

            <div className="p-4 border border-white/5 bg-black/40 mb-6 font-mono text-xs text-[#8ca396] flex items-center gap-3">
              <span className="text-[#c5a059] font-bold">TIMING:</span>
              <span>{PHASES[activePhaseIndex].timeRange}</span>
              <span className="text-white/20">•</span>
              <span className="text-[#10b981] font-bold">STAGE:</span>
              <span>{PHASES[activePhaseIndex].phase}</span>
            </div>

            <p className="text-sm sm:text-base text-[#a3a8a4] leading-relaxed mb-8">
              {PHASES[activePhaseIndex].summary}
            </p>

            {/* Deliverables */}
            <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.5rem" }}>
              <span className="text-[9px] font-mono tracking-[0.32em] uppercase text-[#c9a227] block mb-4">
                CORE PROTOCOL OBJECTIVES
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {PHASES[activePhaseIndex].deliverables.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 border border-white/6 bg-white/[0.02] flex items-center gap-2 text-xs font-mono text-[#d1d5db]"
                  >
                    <span className="w-1.5 h-1.5 bg-[#10b981] flex-shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
