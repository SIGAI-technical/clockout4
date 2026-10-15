"use client";

import React, { useState } from "react";
import { EVENT_CONFIG } from "@/config/event";
import { ExternalLink, X, Copy, Check, Calendar, ShieldAlert } from "lucide-react";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
  const [copied, setCopied] = useState(false);
  const formUrl = EVENT_CONFIG.googleFormUrl;
  const isUrlConfigured =
    Boolean(formUrl) &&
    (formUrl.startsWith("http://") || formUrl.startsWith("https://")) &&
    !formUrl.includes("example.com");

  if (!isOpen) return null;

  const handleCopy = () => {
    const text = `${EVENT_CONFIG.name} — ${EVENT_CONFIG.subtitle}
Location: ${EVENT_CONFIG.location}
Time: ${EVENT_CONFIG.time}
Date: ${EVENT_CONFIG.date}
Department: ${EVENT_CONFIG.department}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadCalendar = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Clockout 4.0//AIML Department//EN
BEGIN:VEVENT
SUMMARY:Clockout 4.0 — The Doom Takeover
DESCRIPTION:Clockout 4.0 at the AIML Department. Location: 4th Floor\\, AIML Department. Time: 2:00 PM onwards. Date: ${EVENT_CONFIG.date}.
LOCATION:${EVENT_CONFIG.location}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "Clockout_4.0_Event.ics");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/82 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg shadow-2xl glow-emerald overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(9,13,10,0.97)",
          border: "1px solid rgba(61,220,132,0.25)",
          padding: "1.75rem 2rem",
        }}
      >
        {/* Top accent line */}
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: "linear-gradient(90deg, transparent, rgba(61,220,132,0.75), rgba(201,162,39,0.45), transparent)" }} />

        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center border border-white/8 hover:border-[#10b981]/35 text-[#5a7066] hover:text-[#a7f3d0] transition-all cursor-pointer"
          style={{ background: "rgba(255,255,255,0.03)" }}
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div
            className="p-2.5 border text-[#10b981] flex-shrink-0"
            style={{ background: "rgba(16,185,129,0.08)", borderColor: "rgba(16,185,129,0.22)" }}
          >
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[9px] font-mono uppercase tracking-[0.35em] text-[#8ca396] mb-0.5">
              Official Latverian Dispatch
            </div>
            <h3 id="modal-title" className="text-lg font-bold font-cinzel text-[#f2f2f0]">
              Registration Status
            </h3>
          </div>
        </div>

        {isUrlConfigured ? (
          <div className="space-y-4">
            <p className="text-sm text-[#a3a8a4] leading-relaxed">
              The official Google Form for <span className="text-[#f2f2f0] font-semibold">{EVENT_CONFIG.name}</span> is live.
              Click below to proceed to the registration form.
            </p>
            <div className="pt-1">
              <a
                href={formUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-b from-[#10b981] to-[#047857] hover:from-[#34d399] hover:to-[#059669] text-white border border-[#34d399]/40 font-bold text-sm tracking-[0.22em] uppercase transition-all duration-200 shadow-[0_8px_24px_rgba(16,185,129,0.35)] cursor-pointer"
              >
                <span>Proceed to Google Form</span>
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-[#050605]/80 border border-[#10b981]/18">
              <div className="text-[9px] font-mono uppercase tracking-[0.3em] text-[#10b981] mb-1.5 font-semibold">
                Portal Status: Awaiting Form Link
              </div>
              <p className="text-sm text-[#a3a8a4] leading-relaxed">
                The official registration Google Form link has not yet been attached to this deployment
                (<code className="text-xs text-[#a7f3d0] font-mono">NEXT_PUBLIC_GOOGLE_FORM_URL</code>).
                Registration will unlock once published by the AIML Department organizers.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="text-[#5a7066] uppercase tracking-wider text-[9px] mb-1">Venue</div>
                <div className="font-semibold text-[#f2f2f0]">{EVENT_CONFIG.location}</div>
              </div>
              <div className="p-3 border border-white/8" style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="text-[#5a7066] uppercase tracking-wider text-[9px] mb-1">Time</div>
                <div className="font-semibold text-[#f2f2f0]">{EVENT_CONFIG.time}</div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-white/10 hover:border-white/20 text-xs text-[#f2f2f0] font-medium tracking-wider uppercase transition-colors cursor-pointer"
                style={{ background: "rgba(255,255,255,0.04)" }}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#10b981]" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "Details Copied!" : "Copy Event Details"}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadCalendar}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 border border-[#10b981]/25 hover:border-[#10b981]/45 text-xs text-[#a7f3d0] font-medium tracking-wider uppercase transition-colors cursor-pointer"
                style={{ background: "rgba(16,185,129,0.06)" }}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Save to Calendar</span>
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 pt-4 flex justify-between items-center text-[10px] text-[#3a4f40]" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <span>{EVENT_CONFIG.department}</span>
          <span className="font-mono text-[#10b981]/60">LATVERIA // CLOCKOUT 4.0</span>
        </div>
      </div>
    </div>
  );
}
