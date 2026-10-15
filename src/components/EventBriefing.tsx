"use client";

import React, { useEffect, useRef } from "react";
import { EVENT_CONFIG } from "@/config/event";
import { MapPin, Clock, Calendar, ShieldCheck, Compass, ArrowRight } from "lucide-react";

interface EventBriefingProps {
  onRegisterClick: () => void;
}

const INFO_CARDS = [
  {
    label: "DESIGNATION",
    sub: "Event Name",
    icon: ShieldCheck,
    color: "emerald" as const,
    value: EVENT_CONFIG.name,
    detail: EVENT_CONFIG.subtitle,
  },
  {
    label: "SECTOR",
    sub: "Location",
    icon: MapPin,
    color: "emerald" as const,
    value: EVENT_CONFIG.location,
    detail: "AIML Department",
  },
  {
    label: "CONVOCATION",
    sub: "Time",
    icon: Clock,
    color: "emerald" as const,
    value: EVENT_CONFIG.time,
    detail: "Gate check begins promptly",
  },
  {
    label: "DATE",
    sub: "Calendar",
    icon: Calendar,
    color: "gold" as const,
    value: EVENT_CONFIG.date,
    detail: "Announcement pending",
  },
];

export default function EventBriefing({ onRegisterClick }: EventBriefingProps) {
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
                (el as HTMLElement).style.transform = "translateY(0)";
              }, i * 80);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="event-briefing"
      className="relative z-10 w-full py-28 sm:py-36 px-4 sm:px-6 lg:px-8"
      aria-label="Event Briefing"
    >
      <div className="max-w-6xl mx-auto">
        {/* ── Section Header ── */}
        <div
          className="text-center mb-16 sm:mb-20"
          data-animate
          style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}
        >
          <div className="flex justify-center mb-5">
            <span className="section-badge">
              <span className="status-dot animate-status-pulse" />
              OFFICIAL PROCLAMATION
            </span>
          </div>

          <h2 className="font-cinzel font-black text-4xl sm:text-6xl tracking-[0.08em] uppercase text-[#f2f2f0] leading-tight">
            The Event Briefing
          </h2>

          <div className="doom-divider mt-5 max-w-xs mx-auto">
            <span className="doom-divider-text">LATVERIAN PROTOCOL DIRECTIVE</span>
          </div>

          <p className="mt-6 text-sm sm:text-base text-[#8a9490] leading-relaxed max-w-2xl mx-auto">
            {EVENT_CONFIG.briefing.statement}
          </p>
        </div>

        {/* ── Info Cards ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 mb-14">
          {INFO_CARDS.map((card, i) => {
            const Icon = card.icon;
            const isGold = card.color === "gold";
            return (
              <div
                key={card.label}
                data-animate
                className="glass-panel glass-panel-hover relative overflow-hidden"
                style={{
                  opacity: 0,
                  transform: "translateY(24px)",
                  transition: `opacity 0.7s ease ${i * 0.08}s, transform 0.7s ease ${i * 0.08}s, border-color 0.3s, box-shadow 0.3s`,
                  padding: "1.4rem 1.25rem",
                }}
              >
                {/* Top left accent bar */}
                <div
                  className="absolute top-0 left-0 right-0 h-px"
                  style={{
                    background: isGold
                      ? "linear-gradient(90deg, #c5a05960, transparent)"
                      : "linear-gradient(90deg, #10b98160, transparent)",
                  }}
                />

                <div className="flex items-center justify-between mb-4">
                  <span className={`text-[9px] font-mono tracking-[0.38em] uppercase ${isGold ? "text-[#dfc17b]" : "text-[#8ca396]"}`}>
                    {card.label}
                  </span>
                  <div
                    className="w-7 h-7 flex items-center justify-center border"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      borderColor: isGold ? "rgba(197,160,89,0.25)" : "rgba(16,185,129,0.2)",
                    }}
                  >
                    <Icon
                      className="w-3.5 h-3.5"
                      style={{ color: isGold ? "#dfc17b" : "#6ee7b7" }}
                    />
                  </div>
                </div>

                <div className="text-[9px] font-mono text-[#5a7066] uppercase tracking-wider mb-1">{card.sub}</div>
                <div className="text-xl sm:text-2xl font-black font-cinzel text-[#f2f2f0] leading-tight">
                  {card.value}
                </div>
                <div
                  className="mt-2 text-[10px] font-mono"
                  style={{ color: isGold ? "#c9a22799" : "#7bb898" }}
                >
                  {card.detail}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Sovereign Decree Banner ── */}
        <div
          data-animate
          className="glass-panel relative overflow-hidden"
          style={{
            opacity: 0,
            transform: "translateY(24px)",
            transition: "opacity 0.7s ease 0.32s, transform 0.7s ease 0.32s",
            padding: "2rem 2.5rem",
            borderColor: "rgba(61,220,132,0.2)",
          }}
        >
          {/* Emerald ambient blob */}
          <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full blur-[80px] pointer-events-none" style={{ background: "rgba(61,220,132,0.08)" }} />
          {/* Gold corner trace */}
          <div className="absolute bottom-0 left-0 w-40 h-px bg-gradient-to-r from-[#c9a227]/50 to-transparent" />
          <div className="absolute bottom-0 left-0 h-40 w-px bg-gradient-to-t from-[#c9a227]/50 to-transparent" />

          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 text-[10px] font-mono text-[#8ca396] uppercase tracking-[0.35em] mb-3">
                <Compass className="w-3.5 h-3.5 text-[#10b981]" />
                THE SOVEREIGN DECREE
              </div>

              <h3 className="font-cinzel font-bold text-xl sm:text-2xl lg:text-3xl text-[#f2f2f0] leading-snug mb-3">
                {EVENT_CONFIG.briefing.headline}
              </h3>

              <p className="text-sm text-[#8a9490] leading-relaxed">
                {EVENT_CONFIG.briefing.decree}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 shrink-0">
              <button
                onClick={onRegisterClick}
                type="button"
                className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-b from-[#10b981] to-[#047857] hover:from-[#34d399] hover:to-[#059669] text-white border border-[#34d399]/40 font-bold font-mono text-[11px] tracking-[0.22em] uppercase transition-all shadow-[0_4px_16px_rgba(16,185,129,0.35)] hover:scale-105 cursor-pointer"
              >
                REGISTER NOW
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#event-highlights"
                className="flex items-center gap-2 px-5 py-3 border border-white/12 hover:border-[#10b981]/40 text-[11px] font-mono tracking-wider uppercase text-[#8ca396] hover:text-[#f2f2f0] transition-all"
                style={{ background: "rgba(255,255,255,0.03)" }}
              >
                View Highlights
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
