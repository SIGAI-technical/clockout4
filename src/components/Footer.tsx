"use client";

import React from "react";
import { EVENT_CONFIG } from "@/config/event";
import { ArrowUp } from "lucide-react";

export default function Footer() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer
      className="relative z-10 w-full py-9 px-4 sm:px-6 lg:px-8 text-[11px] font-mono text-[#5a7066]"
      style={{ borderTop: "1px solid rgba(61,220,132,0.09)", background: "rgba(5,6,5,0.97)", backdropFilter: "blur(12px)" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div
              className="relative w-8 h-8 flex items-center justify-center border border-[#10b981]/25"
              style={{ background: "rgba(16,185,129,0.05)" }}
            >
              <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
                <path d="M9 1L17 15H1L9 1Z" stroke="#10b981" strokeWidth="1.5" fill="none"/>
                <path d="M9 5L14 14H4L9 5Z" fill="#10b981" opacity="0.2"/>
                <circle cx="9" cy="9" r="1.5" fill="#10b981"/>
              </svg>
            </div>
            <div>
              <div
                className="font-bold text-xs text-[#f2f2f0] tracking-[0.18em] uppercase"
                style={{ fontFamily: "var(--font-bebas), 'Arial Narrow', sans-serif", fontSize: "clamp(0.85rem, 2vw, 1rem)" }}
              >
                {EVENT_CONFIG.name} — {EVENT_CONFIG.subtitle}
              </div>
              <div className="text-[9px] text-[#4a6355] mt-0.5 tracking-[0.2em]">{EVENT_CONFIG.department}</div>
            </div>
          </div>

          {/* Center status */}
          <div className="flex items-center gap-2 text-center text-[10px]">
            <span className="w-1 h-1 bg-[#10b981]" />
            <span className="text-[#4a6355]">Official AIML Department Event • Registration via Google Forms</span>
          </div>

          {/* Back to top */}
          <button
            onClick={scrollToTop}
            type="button"
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-white/8 hover:border-[#10b981]/35 hover:text-[#a7f3d0] transition-all cursor-pointer"
            style={{ background: "rgba(255,255,255,0.02)" }}
          >
            <span className="tracking-[0.2em] uppercase text-[10px]">ASCEND</span>
            <ArrowUp className="w-3 h-3" />
          </button>
        </div>

        <div
          className="mt-7 pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-[9px] text-[#2d3d34]"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}
        >
          <span>© 2026 {EVENT_CONFIG.department}. All rights reserved under Latverian Sovereign Directive.</span>
          <span>
            {EVENT_CONFIG.location} • {EVENT_CONFIG.time}
          </span>
        </div>
      </div>
    </footer>
  );
}
