"use client";

import { useState } from "react";
import { EVENT } from "@/config/event";

/** The end of the page: questions, who to call, Doom's last word, and the small print. */
export function Aftermath() {
  const [open, setOpen] = useState(0);
  return (
    <section id="faq" className="after" aria-labelledby="faq-title">
      <div className="after__inner">
        <h2 id="faq-title" className="display after__title">Questions</h2>
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
          <h3 className="sub">Contact</h3>
          <ul>
            {EVENT.contacts.map((c, i) => (
              <li key={i}><strong>{c.name}</strong><a href={`tel:${c.phone.replace(/[^+\d]/g, "")}`}>{c.phone}</a></li>
            ))}
          </ul>
        </div>
      </div>
      {/* the last word is Doom's */}
      <div className="final">
        <p className="final__line">The fourth floor awaits.</p>
        <p className="final__sub">{EVENT.date} · {EVENT.venue}</p>
        <div className="final__actions">
          <a href="#register" className="final__cta">Register</a>
          <a href={`https://instagram.com/${EVENT.instagram.replace(/^@/, "")}`} className="final__ig" target="_blank" rel="noopener noreferrer">@{EVENT.instagram.replace(/^@/, "")}</a>
        </div>
      </div>
      <footer className="foot">
        <span className="t-track">{EVENT.name} {EVENT.edition} · {EVENT.host}</span>
        <span className="foot__fine">A student fan event. Not affiliated with or endorsed by Marvel Studios. Characters © their owners.</span>
      </footer>
    </section>
  );
}

export function TopBar({ visible, muted, onMute, onRegister }: { visible: boolean; muted: boolean; onMute: () => void; onRegister: () => void }) {
  return (
    <nav className={`topbar ${visible ? "is-on" : ""}`} aria-label="Primary">
      <a href="#top" className="topbar__mark" aria-label="Back to the start">
        <span className="topbar__logo" aria-hidden="true" />
        <span>{EVENT.name} <em>{EVENT.edition}</em></span>
      </a>
      <div className="topbar__right">
        <button type="button" className={`sound ${muted ? "is-muted" : ""}`} onClick={onMute} aria-pressed={!muted} aria-label={muted ? "Turn sound on" : "Turn sound off"}>
          <i /><i /><i /><i />
        </button>
        <button type="button" className="topbar__cta" onClick={onRegister}>Register</button>
      </div>
    </nav>
  );
}
