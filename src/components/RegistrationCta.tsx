"use client";

import React, { useEffect, useRef } from "react";
import { EVENT_CONFIG } from "@/config/event";
import { ExternalLink, MapPin, Clock, Calendar, ShieldAlert } from "lucide-react";

interface RegistrationCtaProps {
  onRegisterClick: () => void;
}

export default function RegistrationCta({ onRegisterClick }: RegistrationCtaProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const formUrl = EVENT_CONFIG.googleFormUrl;
  const isUrlConfigured =
    Boolean(formUrl) &&
    (formUrl.startsWith("http://") || formUrl.startsWith("https://")) &&
    !formUrl.includes("example.com");

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
              }, i * 100);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="registration-cta"
      className="relative z-10 w-full py-28 sm:py-36 px-4 sm:px-6 lg:px-8"
      aria-label="Registration"
    >
      <div className="max-w-4xl mx-auto">
        <div
          className="relative overflow-hidden text-center"
          data-animate
          style={{
            opacity: 0,
            transform: "translateY(32px)",
            transition: "opacity 0.8s ease, transform 0.8s ease",
            background: "rgba(8,12,9,0.92)",
            border: "1px solid rgba(61,220,132,0.2)",
            backdropFilter: "blur(24px)",
          }}
        >
          {/* Ambient emerald backlight */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse 70% 60% at 50% 50%, rgba(61,220,132,0.06) 0%, transparent 70%)",
            }}
          />

          {/* Top accent line */}
          <div
            className="absolute top-0 inset-x-0 h-px"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(201,162,39,0.55), rgba(61,220,132,0.55), transparent)",
            }}
          />

          {/* Corner brackets */}
          <div className="absolute top-5 left-5 w-10 h-10 border-l-2 border-t-2 border-[#10b981]/30 pointer-events-none" />
          <div className="absolute top-5 right-5 w-10 h-10 border-r-2 border-t-2 border-[#10b981]/30 pointer-events-none" />
          <div className="absolute bottom-5 left-5 w-10 h-10 border-l-2 border-b-2 border-[#c5a059]/25 pointer-events-none" />
          <div className="absolute bottom-5 right-5 w-10 h-10 border-r-2 border-b-2 border-[#c5a059]/25 pointer-events-none" />

          <div className="relative z-10 px-8 sm:px-14 py-14 sm:py-16">
            {/* Status badge */}
            <div className="flex justify-center mb-7">
              <span
                className="section-badge"
                data-animate
                style={{ opacity: 0, transform: "translateY(16px)", transition: "opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s" }}
              >
                <span className="status-dot animate-status-pulse" />
                PORTAL READY — ACCESS PROTOCOL
              </span>
            </div>

            <h2
              className="font-cinzel font-black text-3xl sm:text-5xl md:text-6xl tracking-[0.08em] uppercase text-[#f2f2f0] leading-tight"
              data-animate
              style={{ opacity: 0, transform: "translateY(20px)", transition: "opacity 0.7s ease 0.2s, transform 0.7s ease 0.2s" }}
            >
              READY TO ENTER<br />
              <span className="shimmer-gold">DOOM&apos;S DOMAIN?</span>
            </h2>

            <div
              className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg font-cinzel font-semibold tracking-[0.22em] uppercase shimmer-text"
              data-animate
              style={{ opacity: 0, transform: "translateY(16px)", transition: "opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s" }}
            >
              SECURE YOUR ACCESS TO CLOCKOUT 4.0
            </div>

            <p
              className="mt-5 text-sm text-[#8a9490] max-w-xl mx-auto leading-relaxed"
              data-animate
              style={{ opacity: 0, transform: "translateY(16px)", transition: "opacity 0.7s ease 0.38s, transform 0.7s ease 0.38s" }}
            >
              Traverse the fortress of the AIML Department. Take your place before the sovereign conclave.
              Registration is processed exclusively through Google Forms.
            </p>

            {/* CTA */}
            <div
              className="mt-10 sm:mt-12 flex flex-col items-center gap-4"
              data-animate
              style={{ opacity: 0, transform: "translateY(16px)", transition: "opacity 0.7s ease 0.46s, transform 0.7s ease 0.46s" }}
            >
              {isUrlConfigured ? (
                <a
                  href={formUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-3 px-10 sm:px-14 py-4 sm:py-5 bg-gradient-to-b from-[#10b981] to-[#047857] hover:from-[#34d399] hover:to-[#059669] text-white border border-[#34d399]/40 font-bold font-mono text-sm sm:text-base tracking-[0.22em] uppercase shadow-[0_12px_36px_rgba(16,185,129,0.35)] hover:scale-105 transition-all duration-200 cursor-pointer"
                >
                  REGISTER NOW
                  <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>
              ) : (
                <button
                  onClick={onRegisterClick}
                  type="button"
                  className="group inline-flex items-center gap-3 px-10 sm:px-14 py-4 sm:py-5 bg-gradient-to-b from-[#10b981] to-[#047857] hover:from-[#34d399] hover:to-[#059669] text-white border border-[#34d399]/40 font-bold font-mono text-sm sm:text-base tracking-[0.22em] uppercase shadow-[0_12px_36px_rgba(16,185,129,0.35)] hover:scale-105 transition-all duration-200 cursor-pointer"
                >
                  REGISTER NOW
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </button>
              )}

              {!isUrlConfigured && (
                <div className="flex items-center gap-2 text-[10px] font-mono text-[#8ca396]">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#10b981]" />
                  Google Form link will be attached directly by organizers
                </div>
              )}
            </div>

            {/* Quick info strip */}
            <div
              className="mt-12 pt-7 grid grid-cols-1 sm:grid-cols-3 gap-4 text-[11px] font-mono text-[#8ca396]"
              data-animate
              style={{ opacity: 0, transform: "translateY(12px)", transition: "opacity 0.7s ease 0.54s, transform 0.7s ease 0.54s", borderTop: "1px solid rgba(255,255,255,0.07)" }}
            >
              <div className="flex items-center justify-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-[#6ee7b7]" />
                {EVENT_CONFIG.location}
              </div>
              <div className="flex items-center justify-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#6ee7b7]" />
                {EVENT_CONFIG.time}
              </div>
              <div className="flex items-center justify-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#dfc17b]" />
                {EVENT_CONFIG.date}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
