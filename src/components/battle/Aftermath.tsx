"use client";

import { useState } from "react";
import { EVENT } from "@/config/event";

/** After the clash: questions, who to call, and the small print. */
export function Aftermath() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="after" aria-labelledby="faq-title">
      <div className="after__inner">
        <p className="saga__kicker">After the smoke</p>
        <h2 id="faq-title" className="decree-type after__title">Petitions to Doom</h2>
        <div className="faq">
          {EVENT.faq.map((f, i) => (
            <div key={i} className={`faq__item ${open === i ? "is-open" : ""}`}>
              <h3>
                <button type="button" aria-expanded={open === i} aria-controls={`faq-${i}`} onClick={() => setOpen(open === i ? -1 : i)}>
                  <span className="faq__n">{String(i + 1).padStart(2, "0")}</span>
                  <span>{f.q}</span>
                  <i aria-hidden="true" />
                </button>
              </h3>
              <div id={`faq-${i}`} className="faq__a" role="region" hidden={open !== i}><p>{f.a}</p></div>
            </div>
          ))}
        </div>

        <div className="contacts">
          <p className="saga__kicker">Send word to Doom&rsquo;s heralds</p>
          <ul>
            {EVENT.contacts.map((c, i) => (
              <li key={i}><strong>{c.name}</strong><a href={`tel:${c.phone.replace(/[^+\d]/g, "")}`}>{c.phone}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <footer className="foot">
        <span className="t-track">{EVENT.name} {EVENT.edition} · {EVENT.host}</span>
        <span className="foot__fine">A student fan event. Not affiliated with or endorsed by Marvel Studios. Characters © their owners.</span>
      </footer>
    </section>
  );
}

export function TopBar({ visible, muted, side, onMute, onRegister }: { visible: boolean; muted: boolean; side: "kneel" | "resist" | null; onMute: () => void; onRegister: () => void }) {
  return (
    <nav className={`topbar ${visible ? "is-on" : ""}`} aria-label="Primary">
      <a href="#top" className="topbar__mark" aria-label="Back to the start">
        <span className="topbar__logo" aria-hidden="true" />
        <span>{EVENT.name} <em>{EVENT.edition}</em></span>
      </a>
      <div className="topbar__right">
        <a href="#choose" className={`side-chip ${side ? `side-chip--${side}` : ""}`}>{side === "kneel" ? "Loyal to Latveria" : side === "resist" ? "Resistance" : "Choose a side"}</a>
        <button type="button" className={`sound ${muted ? "is-muted" : ""}`} onClick={onMute} aria-pressed={!muted} aria-label={muted ? "Turn sound on" : "Turn sound off"}>
          <i /><i /><i /><i />
        </button>
        <button type="button" className="topbar__cta" onClick={onRegister}>{side === "resist" ? "Enlist" : side === "kneel" ? "Swear in" : "Register"}</button>
      </div>
    </nav>
  );
}
