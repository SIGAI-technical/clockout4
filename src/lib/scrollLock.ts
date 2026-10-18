/** Hold the page still: no wheel, touch or keyboard scrolling until the returned function is called.
 *  Buttons and links keep their keys, so the page stays usable from the keyboard. */
export function lockScroll(): () => void {
  const html = document.documentElement;
  const prev = html.style.overflow;
  html.style.overflow = "hidden";
  const stop = (e: Event) => e.preventDefault();
  const keys = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).closest?.("button, a, input")) return;
    if ([" ", "PageDown", "PageUp", "ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) e.preventDefault();
  };
  addEventListener("wheel", stop, { passive: false });
  addEventListener("touchmove", stop, { passive: false });
  addEventListener("keydown", keys);
  return () => {
    html.style.overflow = prev;
    removeEventListener("wheel", stop);
    removeEventListener("touchmove", stop);
    removeEventListener("keydown", keys);
  };
}
