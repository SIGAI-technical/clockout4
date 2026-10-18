/** Doom's face, as one object: the hood, the faceplate's eye slits inside it, and the green light those
 *  eyes throw onto the inside of the cowl. Everything sits in one box with the photo's own aspect, so
 *  the eyes stay where his face is at any size, and it all breathes together.
 *  Driven by CSS variables on an ancestor: --presence, --eyes (0…1+), --lx/--ly (where the viewer is). */
export default function DoomFace({ className = "" }: { className?: string }) {
  return (
    <div className={`face ${className}`} aria-hidden="true">
      <div className="face__body">
        <div className="face__glow" />
        <div className="face__eye face__eye--l" />
        <div className="face__eye face__eye--r" />
      </div>
    </div>
  );
}
