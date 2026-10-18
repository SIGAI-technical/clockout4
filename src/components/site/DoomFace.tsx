/** Doom, unmasked from the dark: his iron face inside the green hood (graded to the site), and a faint
 *  green light that catches in the eye slots when he wakes. One box with the picture's own aspect, so
 *  the light stays in his eyes at any size, and it all breathes together.
 *  Driven by CSS variables on an ancestor: --presence and --eyes (how awake he is, 0…1). */
export default function DoomFace({ className = "" }: { className?: string }) {
  return (
    <div className={`face ${className}`} aria-hidden="true">
      <div className="face__body">
        <div className="face__glint face__glint--l" />
        <div className="face__glint face__glint--r" />
      </div>
    </div>
  );
}
