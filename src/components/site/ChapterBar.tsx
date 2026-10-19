"use client";

import { useEffect, useState } from "react";
import { LEGS, THRONE_AT } from "./Castle";
import { glideTo } from "@/lib/smooth";

/* The journey's chapters, along the bottom: where you are, and a way to jump. Chapters inside the
   castle are points along its pinned scroll; the rest are ordinary sections. */
type Ch = { label: string; castle?: number; id?: string };
const CHAPTERS: Ch[] = [
  { label: "The gate", castle: LEGS[0].a },
  { label: "The hall", castle: LEGS[1].a + 0.01 },
  { label: "The throne", castle: THRONE_AT },
  { label: "Details", id: "details" },
  { label: "Register", id: "register" },
  { label: "Questions", id: "faq" },
];

// positions on the page (not offsetTop: the sections after the castle sit inside a positioned wrapper)
const pageTop = (el: Element) => el.getBoundingClientRect().top + scrollY;
const castleTop = (f: number) => {
  const el = document.getElementById("castle");
  return el ? pageTop(el) + (el.offsetHeight - innerHeight) * f : 0;
};
const topOf = (c: Ch) => {
  if (c.castle !== undefined) return castleTop(c.castle);
  const el = document.getElementById(c.id!);
  return el ? pageTop(el) : 0;
};

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
              onClick={() => glideTo(topOf(c))}>
              {c.label}
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}
