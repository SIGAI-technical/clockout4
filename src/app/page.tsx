"use client";

import { useCallback, useEffect, useState } from "react";
import Overture from "@/components/cine/Overture";
import Saga, { FORM_AT } from "@/components/battle/Saga";
import { Aftermath, TopBar } from "@/components/battle/Aftermath";
import { setSfxMuted } from "@/lib/sfx";

export default function Home() {
  const [entered, setEntered] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try { if (localStorage.getItem("co4-muted") === "1") setMuted(true); } catch { /* ignore */ }
    });
    return () => cancelAnimationFrame(id);
  }, []);
  useEffect(() => {
    setSfxMuted(muted);
    try { localStorage.setItem("co4-muted", muted ? "1" : "0"); } catch { /* ignore */ }
  }, [muted]);

  const onDone = useCallback(() => { window.scrollTo(0, 0); setEntered(true); }, []);
  // "Register" jumps straight to the moment the form is open
  const register = useCallback(() => {
    const el = document.getElementById("saga");
    if (!el) return;
    const top = el.offsetTop + (el.offsetHeight - innerHeight) * FORM_AT;
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  return (
    <>
      <a href="#faq" className="skip-link">Skip to questions</a>
      <TopBar visible={entered} muted={muted} onMute={() => setMuted((m) => !m)} onRegister={register} />
      <main>
        <Saga />
        <Aftermath />
      </main>
      <Overture onDone={onDone} />
      <div className="grain" aria-hidden="true" />
    </>
  );
}
