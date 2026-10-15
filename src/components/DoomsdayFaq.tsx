"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

interface FaqItem {
  question: string;
  answer: string;
  code: string;
}

const FAQS: FaqItem[] = [
  {
    code: "FAQ-01",
    question: "Who is eligible to participate in Clockout 4.0?",
    answer:
      "Clockout 4.0 is open to all undergraduate and postgraduate students interested in AI, machine learning, systems engineering, and rapid software development. Multidisciplinary teams are strongly encouraged.",
  },
  {
    code: "FAQ-02",
    question: "What is the team size and composition protocol?",
    answer:
      "Participants can register in squads of 2 to 4 members. Solo participants may also apply and participate independently or connect with other engineers during Phase 01: The Breach.",
  },
  {
    code: "FAQ-03",
    question: "How is official registration confirmed?",
    answer:
      "Registration is processed exclusively through the official Google Form. Once submitted, your squad's credentials will be logged in the Latverian roster and email confirmations dispatched prior to the event.",
  },
  {
    code: "FAQ-04",
    question: "What equipment should squads bring to the proving grounds?",
    answer:
      "Squads must bring their own laptops, chargers, and development dependencies. High-speed connectivity, power outlets, testing environments, and faculty mentorship will be accessible throughout the 4th Floor proving grounds.",
  },
  {
    code: "FAQ-05",
    question: "What are the primary criteria for judging and the throne pitch?",
    answer:
      "Submissions are evaluated on technical innovation, model robustness, practical problem-solving impact, codebase craftsmanship, and the clarity of your final demonstration before the jury.",
  },
];

export default function DoomsdayFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <section
      id="event-faq"
      className="relative z-10 w-full py-24 sm:py-32 px-4 sm:px-6 lg:px-8"
      aria-label="Frequently Asked Questions"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-5">
            <span className="section-badge">
              <HelpCircle className="w-3 h-3" />
              DIRECTIVES & PROTOCOLS
            </span>
          </div>

          <h2 className="font-cinzel font-black text-3xl sm:text-5xl uppercase text-[#f2f2f0] leading-tight">
            Frequently Asked Directives
          </h2>

          <div className="doom-divider mt-5 max-w-xs mx-auto">
            <span className="doom-divider-text">LATVERIAN CODE OF CONDUCT & RULES</span>
          </div>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <div
                key={faq.code}
                className="overflow-hidden transition-all duration-200"
                style={{
                  border: isOpen
                    ? "1px solid rgba(61,220,132,0.38)"
                    : "1px solid rgba(255,255,255,0.08)",
                  background: isOpen ? "rgba(12,19,14,0.95)" : "rgba(8,11,9,0.82)",
                }}
              >
                <button
                  onClick={() => toggle(i)}
                  type="button"
                  className="w-full p-5 sm:p-6 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-[9px] font-mono text-[#10b981] font-bold tracking-[0.3em] flex-shrink-0">
                      {faq.code}
                    </span>
                    <span className="font-cinzel font-bold text-sm sm:text-base text-[#f2f2f0] leading-snug">
                      {faq.question}
                    </span>
                  </div>

                  <div
                    className="w-6 h-6 flex items-center justify-center flex-shrink-0 border transition-all duration-200"
                    style={{
                      borderColor: isOpen ? "rgba(16,185,129,0.4)" : "rgba(255,255,255,0.1)",
                      background: isOpen ? "rgba(16,185,129,0.08)" : "transparent",
                    }}
                  >
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        isOpen ? "rotate-180 text-[#10b981]" : "text-[#5a7066]"
                      }`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 sm:px-6 pb-6 text-sm text-[#a3a8a4] leading-relaxed pt-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                    <p>{faq.answer}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
