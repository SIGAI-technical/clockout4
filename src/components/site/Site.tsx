"use client";

import { useEffect, useRef, useState } from "react";
import { EVENT, formEmbedUrl } from "@/config/event";
import type { Side } from "@/lib/side";
import Sigil from "../takeover/Sigil";

/* After the throne room: Doom's war table, where the event lives as objects — the trials as sealed
   dossiers, the spoils on parchment under his seal, the terms cut into iron, the Doomsday clock — and
   then the terminal where names are entered. The words change with the visitor's side.          */
type Voice = { tag: string; kicker: string; line: string };
const V = (none: Voice, kneel: Voice, resist: Voice) => ({ none, kneel, resist });
const COPY = {
  table: V(
    { tag: "Doom's war table", kicker: "The war table", line: "Everything Doom has planned for you lies here." },
    { tag: "Doom's war table", kicker: "Your orders", line: "Read them well. Doom does not repeat himself." },
    { tag: "Stolen from his war table", kicker: "His plans", line: "We got into his war room. This is everything he has planned." },
  ),
  roll: V(
    { tag: "Latverian state terminal", kicker: "Enter your name", line: "Kneel or resist. Either way, Doom will know your name." },
    { tag: "Latverian state terminal", kicker: "Swear your name", line: "Your name, in Doom's ledger. Serve him well." },
    { tag: "Hijacked terminal · Resistance", kicker: "Join the resistance", line: "We've taken one of his terminals. Sign up before he notices." },
  ),
};
const voice = (k: keyof typeof COPY, side: Side | null) => COPY[k][side ?? "none"];
const ROMAN = ["I", "II", "III", "IV", "V"];

/* ── The Doomsday clock ── */
function DoomClock() {
  const at = EVENT.startsAt ? Date.parse(EVENT.startsAt) : NaN;
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const id0 = requestAnimationFrame(tick);
    const id = setInterval(tick, 1000);
    return () => { cancelAnimationFrame(id0); clearInterval(id); };
  }, []);
  const left = Number.isFinite(at) && now !== null ? Math.max(0, at - now) : null;
  const parts = left === null ? ["--", "--", "--", "--"] : [Math.floor(left / 864e5), Math.floor(left / 36e5) % 24, Math.floor(left / 6e4) % 60, Math.floor(left / 1e3) % 60].map((n) => String(n).padStart(2, "0"));
  return (
    <div className="clock" role="timer" aria-label={left === null ? "Countdown starts when the date is announced" : `${parts[0]} days, ${parts[1]} hours, ${parts[2]} minutes until Doom arrives`}>
      {["Days", "Hours", "Mins", "Secs"].map((l, i) => (
        <div key={l} className="clock__cell"><b>{parts[i]}</b><span>{l}</span></div>
      ))}
    </div>
  );
}

const Seal = ({ className = "" }: { className?: string }) => <span className={`wax ${className}`} aria-hidden="true"><Sigil /></span>;

export default function Site({ side }: { side: Side | null }) {
  const root = useRef<HTMLDivElement>(null);
  // objects settle onto the table as they come into view
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -10% 0px" });
    root.current?.querySelectorAll("[data-reveal]").forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);
  const t = voice("table", side), r = voice("roll", side);
  const embed = formEmbedUrl(side);

  return (
    <div ref={root} className="site">
      <section id="table" className="table" aria-labelledby="table-title">
        <header className="table__head" data-reveal>
          <span className="sec__tag">{t.tag}</span>
          <h2 id="table-title" className="decree-type sec__title">{t.kicker}</h2>
          <p className="sec__line">“{t.line}”</p>
        </header>

        <div className="table__top">
          {/* the trials: three sealed dossiers */}
          <div id="trials" className="dossiers" aria-label="The trials">
            {EVENT.trials.map((tr, i) => (
              <article key={i} className="dossier" data-reveal style={{ ["--r" as string]: `${[-2.5, 1.5, -1][i]}deg`, transitionDelay: `${i * 110}ms` }}>
                <span className="dossier__tab">Trial {ROMAN[i]}</span>
                <div className="paper dossier__paper">
                  <span className="paper__stamp">Classified · Latveria</span>
                  <h3>{tr.name}</h3>
                  <p>{tr.line}</p>
                  <dl>
                    <div><dt>Team</dt><dd>{tr.team}</dd></div>
                    <div><dt>Time</dt><dd>{tr.duration}</dd></div>
                    <div><dt>Spoils</dt><dd>{tr.prize}</dd></div>
                  </dl>
                </div>
                <Seal className="dossier__seal" />
              </article>
            ))}
          </div>

          {/* the spoils: one sheet, under his seal */}
          <article id="spoils" className="paper scroll-sheet" data-reveal style={{ ["--r" as string]: "1.8deg" }} aria-labelledby="spoils-title">
            <span className="paper__stamp">By decree · The spoils</span>
            <h3 id="spoils-title">Doom rewards those who survive him</h3>
            <p className="scroll-sheet__pool">{EVENT.prizePool}</p>
            <ul>{EVENT.trials.map((tr, i) => <li key={i}><span>{tr.name}</span><b>{tr.prize}</b></li>)}</ul>
            <Seal className="scroll-sheet__seal" />
          </article>

          {/* the terms: cut into iron */}
          <article id="terms" className="tablet" data-reveal style={{ ["--r" as string]: "-1.2deg" }} aria-labelledby="terms-title">
            <span className="tablet__rivets" aria-hidden="true" />
            <h3 id="terms-title" className="decree-type">Terms of surrender</h3>
            <ol>{EVENT.rules.map((x, i) => <li key={i}>{x}</li>)}</ol>
            <dl>
              <div><dt>Who</dt><dd>{EVENT.eligibility}</dd></div>
              <div><dt>Fee</dt><dd>{EVENT.fee}</dd></div>
              <div><dt>Closes</dt><dd>{EVENT.deadline}</dd></div>
            </dl>
          </article>

          {/* the Doomsday clock: an instrument on the table */}
          <article id="day" className="instrument" data-reveal style={{ ["--r" as string]: "2deg" }} aria-labelledby="clock-title">
            <h3 id="clock-title">{side === "resist" ? "Until he strikes" : "The Doomsday clock"}</h3>
            <DoomClock />
            <p>{EVENT.date} · {EVENT.time}<br />{EVENT.venue}</p>
          </article>
        </div>
      </section>

      <section id="register" className="roll-sec" aria-labelledby="register-title">
        <header className="table__head" data-reveal>
          <span className="sec__tag">{r.tag}</span>
          <h2 id="register-title" className="decree-type sec__title">{r.kicker}</h2>
          <p className="sec__line">“{r.line}”</p>
          {!side && <p className="register__nudge">You haven&rsquo;t chosen a side. <a href="#choose">Stand before the throne</a> first, so Doom knows where you stand.</p>}
        </header>
        <div className="terminal" data-reveal>
          <div className="terminal__bar"><span>LATVERIA · ROLL OF NAMES</span><span className="tk__rec"><i />LIVE</span></div>
          <div className="terminal__screen">
            {embed ? (
              <iframe key={embed} src={embed} title="Clockout 4.0 registration form" loading="lazy">Loading…</iframe>
            ) : (
              <div className="roll__placeholder">
                <strong>Registration form</strong>
                <span>The Google Form appears here once its link is added to <code>src/config/event.ts</code>.</span>
              </div>
            )}
          </div>
          <div className="terminal__foot"><span>Closes {EVENT.deadline}</span><span>Terminal 04 · AIML Department</span></div>
        </div>
      </section>
    </div>
  );
}
