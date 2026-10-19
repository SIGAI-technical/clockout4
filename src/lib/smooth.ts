import Lenis from "lenis";

/* Smooth, weighted scrolling (the same library D3COY uses). A mouse wheel moves in jumps; Lenis turns
   those into a glide, so the scroll-driven footage moves like a camera instead of stepping. Touch keeps
   the phone's own native scrolling. */
let lenis: Lenis | null = null;

export function startSmooth() {
  if (lenis || typeof window === "undefined") return lenis;
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, smoothWheel: true });
  const raf = (t: number) => { lenis?.raf(t); requestAnimationFrame(raf); };
  requestAnimationFrame(raf);
  // in-page links glide too
  addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest?.('a[href^="#"]') as HTMLAnchorElement | null;
    const id = a?.getAttribute("href")?.slice(1);
    const el = id ? document.getElementById(id) : null;
    if (!el || !lenis) return;
    e.preventDefault();
    lenis.scrollTo(el, { duration: 1.6 });
  });
  return lenis;
}

/** Glide to a position (px) or element; falls back to the browser when smoothing is off. */
export function glideTo(target: number | HTMLElement, immediate = false) {
  if (lenis) { lenis.scrollTo(target, immediate ? { immediate: true } : { duration: 1.6 }); return; }
  const top = typeof target === "number" ? target : target.getBoundingClientRect().top + scrollY;
  scrollTo({ top, behavior: immediate ? "instant" : "smooth" });
}

/** Freeze and release the page (used while the intro plays). */
export const pauseSmooth = () => lenis?.stop();
export const resumeSmooth = () => lenis?.start();
