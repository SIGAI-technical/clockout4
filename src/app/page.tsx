"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Overture from "@/components/cine/Overture";
import Opener from "@/components/site/Opener";
import Castle, { CHOICE_AT } from "@/components/site/Castle";
import Site from "@/components/site/Site";
import ChapterBar from "@/components/site/ChapterBar";
import { Aftermath, TopBar } from "@/components/battle/Aftermath";
import { setSfxMuted } from "@/lib/sfx";
import { lockScroll } from "@/lib/scrollLock";
import { castVote, loadSide, saveSide, type Side } from "@/lib/side";

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [muted, setMuted] = useState(false);
  const [side, setSide] = useState<Side | null>(null);
  const sideRef = useRef<Side | null>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try { if (localStorage.getItem("co4-muted") === "1") setMuted(true); } catch { /* ignore */ }
      const s = loadSide();
      if (s) { setSide(s); sideRef.current = s; saveSide(s); }
    });
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    setSfxMuted(muted);
    try { localStorage.setItem("co4-muted", muted ? "1" : "0"); } catch { /* ignore */ }
  }, [muted]);

  // while the intro plays, the page underneath stays put: no wheel, touch or keyboard scrolling
  useEffect(() => {
    if (!entered) return lockScroll();
  }, [entered]);

  // "#choose" lives inside the castle's pinned scroll: go to the moment the question is asked
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest?.('a[href="#choose"]');
      const el = document.getElementById("castle");
      if (!a || !el) return;
      e.preventDefault();
      scrollTo({ top: el.offsetTop + (el.offsetHeight - innerHeight) * (CHOICE_AT + 0.04), behavior: "smooth" });
    };
    addEventListener("click", onClick);
    return () => removeEventListener("click", onClick);
  }, []);

  const onDone = useCallback(() => { window.scrollTo(0, 0); setEntered(true); }, []);
  const register = useCallback(() => document.getElementById("register")?.scrollIntoView({ behavior: "smooth" }), []);
  const choose = useCallback((s: Side) => {
    castVote(s, sideRef.current);
    sideRef.current = s;
    setSide(s);
    saveSide(s);
  }, []);

  return (
    <>
      <a href="#table" className="skip-link">Skip to the event details</a>
      <TopBar visible={entered} muted={muted} side={side} onMute={() => setMuted((m) => !m)} onRegister={register} />
      <main>
        <Opener />
        <Castle side={side} onChoose={choose} />
        <Site side={side} />
        <Aftermath />
      </main>
      <ChapterBar visible={entered} />
      <Overture onDone={onDone} />
      <div className="grain" aria-hidden="true" />
    </>
  );
}
