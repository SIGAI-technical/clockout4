"use client";

import { useEffect, useRef, useState } from "react";
import { EVENT, formEmbedUrl } from "@/config/event";

/* After the throne room: the event, plainly, over a dim view of the castle — then the form. */
const ROMAN = ["I", "II", "III", "IV", "V"];

/* ── The countdown ── */
function Countdown() {
  const at = EVENT.startsAt ? Date.parse(EVENT.startsAt) : NaN;
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id0 = requestAnimationFrame(tick);
    const id = setInterval(tick, 1000);
    return () => { cancelAnimationFrame(id0); clearInterval(id); };
  }, []);
  const left = Number.isFinite(at) && now !== null ? Math.max(0, at - now) : null;
  const parts = left === null ? ["—", "—", "—", "—"] : [Math.floor(left / 864e5), Math.floor(left / 36e5) % 24, Math.floor(left / 6e4) % 60, Math.floor(left / 1e3) % 60].map((n) => String(n).padStart(2, "0"));
  return (
    <div className="count" role="timer" aria-label={left === null ? "Countdown starts when the date is announced" : `${parts[0]} days, ${parts[1]} hours, ${parts[2]} minutes to go`}>
      {["days", "hours", "min", "sec"].map((l, i) => <div key={l}><b>{parts[i]}</b><span>{l}</span></div>)}
    </div>
  );
}

export default function Site() {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -10% 0px" });
    root.current?.querySelectorAll("[data-reveal]").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
  const embed = formEmbedUrl();

  return (
    <div ref={root} className="site">
      <section id="details" className="details" aria-labelledby="details-title">
        <div className="wrap">
          <header className="head" data-reveal>
            <p className="label">{EVENT.name} {EVENT.edition}</p>
            <h2 id="details-title" className="display">Your orders</h2>
          </header>

          <div className="when" data-reveal>
            <dl className="facts">
              <div><dt>Date</dt><dd>{EVENT.date}</dd></div>
              <div><dt>Time</dt><dd>{EVENT.time}</dd></div>
              <div><dt>Report by</dt><dd>{EVENT.reporting}</dd></div>
              <div><dt>Venue</dt><dd>{EVENT.venue}</dd></div>
            </dl>
            <Countdown />
          </div>

          <h3 id="trials" className="sub" data-reveal>The trials</h3>
          <ol className="trials2">
            {EVENT.trials.map((t, i) => (
              <li key={i} data-reveal style={{ transitionDelay: `${i * 90}ms` }}>
                <span className="trials2__n">{ROMAN[i]}</span>
                <h4>{t.name}</h4>
                <p>{t.line}</p>
                <dl><div><dt>Team</dt><dd>{t.team}</dd></div><div><dt>Duration</dt><dd>{t.duration}</dd></div><div><dt>Prize</dt><dd>{t.prize}</dd></div></dl>
              </li>
            ))}
          </ol>

          <div className="split">
            <div id="spoils" data-reveal>
              <h3 className="sub">Prizes</h3>
              <p className="pool">{EVENT.prizePool}</p>
              <ul className="rows">{EVENT.trials.map((t, i) => <li key={i}><span>{t.name}</span><span>{t.prize}</span></li>)}</ul>
            </div>
            <div id="terms" data-reveal>
              <h3 className="sub">Rules</h3>
              <ol className="rules">{EVENT.rules.map((r, i) => <li key={i}>{r}</li>)}</ol>
              <dl className="facts facts--one">
                <div><dt>Who can enter</dt><dd>{EVENT.eligibility}</dd></div>
                <div><dt>Fee</dt><dd>{EVENT.fee}</dd></div>
                <div><dt>Registration closes</dt><dd>{EVENT.deadline}</dd></div>
              </dl>
            </div>
          </div>
        </div>
      </section>

      <section id="register" className="register" aria-labelledby="register-title">
        <div className="wrap">
          <header className="head" data-reveal>
            <p className="label">Closes {EVENT.deadline}</p>
            <h2 id="register-title" className="display">Register</h2>
          </header>
          <div className="form-frame" data-reveal>
            {embed ? (
              <iframe key={embed} src={embed} title="Clockout 4.0 registration form" loading="lazy">Loading…</iframe>
            ) : (
              <div className="form-frame__empty">
                <strong>Registration form</strong>
                <span>The Google Form appears here once its link is added to <code>src/config/event.ts</code>.</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
