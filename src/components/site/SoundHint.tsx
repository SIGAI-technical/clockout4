"use client";

import { useEffect, useState } from "react";
import { needsGesture, onUnlock, unlockScore } from "@/lib/score";
import { isSfxMuted } from "@/lib/sfx";

/* Browsers won't play sound until the visitor taps or presses a key, and scrolling doesn't count.
   If someone starts scrolling in silence, this asks once, quietly, and goes away for good. */
export default function SoundHint({ visible }: { visible: boolean }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    if (!visible) return;
    let shown = false;
    const onScroll = () => { if (!shown && scrollY > innerHeight * 0.4 && needsGesture() && !isSfxMuted()) { shown = true; setShow(true); } };
    addEventListener("scroll", onScroll, { passive: true });
    const off = onUnlock(() => setShow(false));
    return () => { removeEventListener("scroll", onScroll); off(); };
  }, [visible]);
  return (
    <button type="button" className={`sound-hint ${show ? "is-on" : ""}`} onClick={() => { unlockScore(); setShow(false); }} tabIndex={show ? 0 : -1} aria-hidden={!show}>
      <i aria-hidden="true" /><i aria-hidden="true" /><i aria-hidden="true" />
      Tap for sound
    </button>
  );
}
