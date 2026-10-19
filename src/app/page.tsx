"use client";

import { useCallback, useEffect, useState } from "react";
import Overture from "@/components/cine/Overture";
import Opener from "@/components/site/Opener";
import Castle from "@/components/site/Castle";
import SoundHint from "@/components/site/SoundHint";
import Site from "@/components/site/Site";
import ChapterBar from "@/components/site/ChapterBar";
import { Aftermath, TopBar } from "@/components/site/Aftermath";
import { setSfxMuted } from "@/lib/sfx";
import { lockScroll } from "@/lib/scrollLock";
import { setScoreMuted } from "@/lib/score";
import { glideTo, startSmooth } from "@/lib/smooth";

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => { startSmooth(); }, []);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try { if (localStorage.getItem("co4-muted") === "1") setMuted(true); } catch { /* ignore */ }
    });
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    setSfxMuted(muted); setScoreMuted(muted);
    try { localStorage.setItem("co4-muted", muted ? "1" : "0"); } catch { /* ignore */ }
  }, [muted]);

  // while the intro plays, the page underneath stays put: no wheel, touch or keyboard scrolling
  useEffect(() => {
    if (!entered) return lockScroll();
  }, [entered]);

  const onDone = useCallback(() => { glideTo(0, true); setEntered(true); }, []);
  const register = useCallback(() => { const el = document.getElementById("register"); if (el) glideTo(el); }, []);

  return (
    <>
      <a href="#details" className="skip-link">Skip to the event details</a>
      <TopBar visible={entered} muted={muted} onMute={() => setMuted((m) => !m)} onRegister={register} />
      <main>
        <Opener />
        <Castle />
        {/* after the throne room you never leave it: its last frame stays behind everything, dimmed */}
        <div className="world">
          <div className="world__bg" aria-hidden="true" />
          <Site />
          <Aftermath />
        </div>
      </main>
      <ChapterBar visible={entered} />
      <SoundHint visible={entered} />
      <Overture onDone={onDone} />
      <div className="grain" aria-hidden="true" />
    </>
  );
}
