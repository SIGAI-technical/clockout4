"use client";

import React, { useEffect, useRef } from "react";
import { Trophy, Award, Sparkles } from "lucide-react";

interface VaultReward {
  title: string;
  rank: string;
  category: string;
  perks: string[];
  borderGlow: string;
  isGrandPrize?: boolean;
}

const VAULT_REWARDS: VaultReward[] = [
  {
    title: "The Sovereign Victor",
    rank: "CHAMPION",
    category: "GRAND CHAMPION OF CLOCKOUT 4.0",
    perks: [
      "Clockout 4.0 Grand Sovereign Trophy",
      "Direct Faculty & Industry Mentorship Conclave",
      "Official Sovereign Champion Gold Credentials",
      "Exclusive Latverian Takeover Artifact Kit",
    ],
    borderGlow: "#c9a227",
    isGrandPrize: true,
  },
  {
    title: "Neural Architecture Laureate",
    rank: "FIRST RUNNER UP",
    category: "TECHNICAL COMPUTATIONAL EXCELLENCE",
    perks: [
      "Silver Latverian Seal of Distinction",
      "Advanced Research & Prototyping Commendation",
      "Faculty Certificate of Merit",
      "Clockout 4.0 Official Swag Package",
    ],
    borderGlow: "#10b981",
  },
  {
    title: "Innovation Vanguard",
    rank: "SECOND RUNNER UP",
    category: "RAPID APPLIED INTELLIGENCE",
    perks: [
      "Bronze Sovereign Seal Award",
      "Special Innovation Category Citation",
      "Verified Certificate of Achievement",
      "Department Commendation Badge",
    ],
    borderGlow: "#10b981",
  },
];

export default function LatverianVault() {
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
      id="latverian-vault"
      className="relative z-10 w-full py-24 sm:py-32 px-4 sm:px-6 lg:px-8"
      aria-label="Latverian Bounty & Rewards Vault"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div
          className="text-center mb-16 sm:mb-20"
          data-animate
          style={{ opacity: 0, transform: "translateY(24px)", transition: "opacity 0.7s ease, transform 0.7s ease" }}
        >
          <div className="flex justify-center mb-5">
            <span className="section-badge section-badge-gold">
              <Trophy className="w-3 h-3" />
              SOVEREIGN ACCLAIM & RECOGNITION
            </span>
          </div>

          <h2 className="font-cinzel font-black text-4xl sm:text-6xl tracking-[0.08em] uppercase text-[#f2f2f0] leading-tight">
            The Latverian Vault
          </h2>

          <div className="doom-divider mt-5 max-w-xs mx-auto" style={{ "--divider-color": "#c9a227" } as React.CSSProperties}>
            <span className="doom-divider-text" style={{ color: "#7a6020" }}>HONORS DECREED BY DOOM</span>
          </div>
        </div>

        {/* Rewards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {VAULT_REWARDS.map((reward, i) => (
            <div
              key={reward.title}
              data-animate
              className={`relative flex flex-col justify-between overflow-hidden group transition-all duration-300 ${
                reward.isGrandPrize
                  ? "shadow-2xl glow-gold md:-translate-y-2"
                  : "hover:border-[#10b981]/45"
              }`}
              style={{
                opacity: 0,
                transform: "translateY(30px)",
                transition: `opacity 0.7s ease ${i * 0.12}s, transform 0.7s ease ${i * 0.12}s, border-color 0.3s, background 0.3s`,
                backdropFilter: "blur(20px)",
                padding: "1.75rem",
                border: reward.isGrandPrize
                  ? "1px solid rgba(201,162,39,0.55)"
                  : "1px solid rgba(61,220,132,0.18)",
                background: reward.isGrandPrize
                  ? "linear-gradient(160deg, rgba(20,16,5,0.97) 0%, rgba(13,15,12,0.97) 100%)"
                  : "rgba(10,13,11,0.82)",
              }}
            >
              {/* Grand prize top bar */}
              {reward.isGrandPrize && (
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#c9a227] to-transparent" />
              )}

              <div>
                <div className="flex items-center justify-between mb-5">
                  <span
                    className="text-[9px] font-mono px-3 py-1.5 uppercase tracking-wider font-bold"
                    style={{
                      background: reward.isGrandPrize ? "#c5a059" : "rgba(16,185,129,0.12)",
                      color: reward.isGrandPrize ? "#050605" : "#a7f3d0",
                      border: reward.isGrandPrize ? "none" : "1px solid rgba(16,185,129,0.28)",
                    }}
                  >
                    {reward.rank}
                  </span>
                  <div
                    className="w-8 h-8 border flex items-center justify-center"
                    style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)" }}
                  >
                    {reward.isGrandPrize ? (
                      <Trophy className="w-4 h-4 text-[#dfc17b]" />
                    ) : (
                      <Award className="w-4 h-4 text-[#6ee7b7]" />
                    )}
                  </div>
                </div>

                <h3 className="font-cinzel font-black text-xl sm:text-2xl text-[#f2f2f0] mb-1">
                  {reward.title}
                </h3>

                <p className="text-[9px] font-mono text-[#8ca396] tracking-wider uppercase mb-6">
                  {reward.category}
                </p>

                <div className="space-y-3 mb-8" style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "1.25rem" }}>
                  {reward.perks.map((perk, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-2.5 text-xs text-[#c8ccc9]">
                      <span
                        className="w-1 h-1 mt-1.5 flex-shrink-0"
                        style={{ background: reward.isGrandPrize ? "#c5a059" : "#10b981" }}
                      />
                      <span>{perk}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 text-[9px] font-mono text-[#4a5e56] tracking-widest uppercase flex items-center gap-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                <Sparkles className="w-3 h-3 text-[#c9a227]" />
                <span>LATVERIAN CERTIFIED RECORD</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
