"use client";

import { useEffect, useState } from "react";
import { CHOICE_AT, LEGS } from "./Castle";

/* The journey's chapters, along the bottom: where you are, and a way to jump. Chapters inside the
   castle are points along its pinned scroll; the rest are ordinary sections. */
type Ch = { label: string; castle?: number; id?: string };
const CHAPTERS: Ch[] = [
  { label: "The gate", castle: LEGS[0].a },
  { label: "The hall", castle: LEGS[1].a + 0.01 },
  { label: "The throne", castle: CHOICE_AT + 0.04 },
  { label: "War table", id: "table" },
  { label: "Enlist", id: "register" },
  { label: "Questions", id: "faq" },
];

const castleTop = (f: number) => {
  const el = document.getElementById("castle");
  return el ? el.offsetTop + (el.offsetHeight - innerHeight) * f : 0;
};
const topOf = (c: Ch) => (c.castle !== undefined ? castleTop(c.castle) : (document.getElementById(c.id!)?.offsetTop ?? 0));

export default function ChapterBar({ visible }: { visible: boolean }) {
  const [active, setActive] = useState(-1);
  const [prog, setProg] = useState(0);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const y = scrollY + innerHeight * 0.35;
      let a = -1;
      CHAPTERS.forEach((c, i) => { if (y >= topOf(c) - 2) a = i; });
      setActive((v) => (v === a ? v : a));
      const max = document.documentElement.scrollHeight - innerHeight;
      setProg(max > 0 ? scrollY / max : 0);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <nav className={`chapters ${visible && active >= 0 ? "is-on" : ""}`} aria-label="Chapters">
      <span className="chapters__prog" style={{ transform: `scaleX(${prog})` }} aria-hidden="true" />
      <ol>
        {CHAPTERS.map((c, i) => (
          <li key={c.label}>
            <button type="button" className={i === active ? "is-active" : ""} aria-current={i === active ? "step" : undefined}
              onClick={() => scrollTo({ top: topOf(c), behavior: "smooth" })}>
              <span className="chapters__n">{String(i + 1).padStart(2, "0")}</span>{c.label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
