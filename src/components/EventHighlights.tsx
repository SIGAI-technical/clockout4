"use client";

import React, { useEffect, useRef } from "react";
import { EVENT_CONFIG } from "@/config/event";
import { Cpu, Brain, Zap, Trophy } from "lucide-react";

const ICONS = [Cpu, Brain, Zap, Trophy];
const ACCENT_COLORS = [
  { border: "rgba(16,185,129,0.22)", glow: "rgba(16,185,129,0.1)", text: "#6ee7b7", track: "TRACK 01" },
  { border: "rgba(16,185,129,0.22)", glow: "rgba(16,185,129,0.1)", text: "#6ee7b7", track: "TRACK 02" },
  { border: "rgba(16,185,129,0.22)", glow: "rgba(16,185,129,0.1)", text: "#6ee7b7", track: "TRACK 03" },
  { border: "rgba(197,160,89,0.28)", glow: "rgba(197,160,89,0.1)", text: "#dfc17b", track: "FINALE" },
];

export default function EventHighlights() {
  const sectionRef = useRef<HTMLElement>(null);

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
                (el as HTMLElement).style.transform = "translateY(0) scale(1)";
              }, i * 90);
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
      id="event-highlights"
      className="relative z-10 w-full py-24 sm:py-32 px-4 sm:px-6 lg:px-8"
      aria-label="Event Highlights"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div
          className="text-center mb-16"
          data-animate
          style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}
        >
          <div className="flex justify-center mb-5">
            <span className="section-badge">
              <span className="status-dot animate-status-pulse" />
              ARENA PROGRAMME
            </span>
          </div>

          <h2 className="font-cinzel font-black text-4xl sm:text-6xl tracking-[0.08em] uppercase text-[#f2f2f0]">
            Event Highlights
          </h2>

          <div className="doom-divider mt-5 max-w-xs mx-auto">
            <span className="doom-divider-text">ACTIVITIES & PROVING GROUNDS</span>
          </div>
        </div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
          {EVENT_CONFIG.highlights.map((item, index) => {
            const Icon = ICONS[index] || Cpu;
            const accent = ACCENT_COLORS[index] || ACCENT_COLORS[0];

            return (
              <div
                key={item.id}
                data-animate
                className="relative overflow-hidden group cursor-default"
                style={{
                  opacity: 0,
                  transform: "translateY(32px) scale(0.97)",
                  transition: `opacity 0.7s ease ${index * 0.1}s, transform 0.7s ease ${index * 0.1}s, border-color 0.3s, box-shadow 0.3s`,
                  background: "rgba(10,14,11,0.8)",
                  border: `1px solid ${accent.border}`,
                  backdropFilter: "blur(20px)",
                  padding: "1.75rem 1.75rem",
                }}
              >
                {/* Ambient glow on hover */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{ background: `radial-gradient(ellipse at 30% 30%, ${accent.glow} 0%, transparent 70%)` }}
                />

                {/* Top accent line */}
                <div
                  className="absolute top-0 inset-x-0 h-px"
                  style={{ background: `linear-gradient(90deg, ${accent.text}50, transparent)` }}
                />

                {/* Track identifier + Status badge */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-9 h-9 flex items-center justify-center border transition-colors duration-300"
                      style={{ background: "rgba(255,255,255,0.04)", borderColor: accent.border }}
                    >
                      <Icon className="w-4 h-4" style={{ color: accent.text }} />
                    </div>
                    <span className="text-[9px] font-mono tracking-[0.38em] uppercase" style={{ color: accent.text }}>
                      {accent.track} {"//"} {item.category}
                    </span>
                  </div>

                  <div
                    className="px-2.5 py-1 text-[9px] font-mono tracking-widest uppercase"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      color: "#5a7066",
                    }}
                  >
                    {item.statusBadge}
                  </div>
                </div>

                {/* Title */}
                <h3
                  className="font-cinzel font-bold text-xl sm:text-2xl text-[#f2f2f0] group-hover:text-[#a7f3d0] transition-colors duration-300 leading-snug mb-3"
                >
                  {item.title}
                </h3>

                <p className="text-sm text-[#8a9490] leading-relaxed">
                  {item.description}
                </p>

                {/* Bottom strip */}
                <div className="mt-6 pt-4 flex items-center justify-between text-[10px] font-mono text-[#4a5e56]" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <span>AIML Department Proving Track</span>
                  <span
                    className="group-hover:translate-x-1 transition-transform duration-200"
                    style={{ color: accent.text }}
                  >
                    Details dropping soon →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
