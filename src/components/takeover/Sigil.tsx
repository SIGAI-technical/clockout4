import { forwardRef } from "react";

/** Doom's seal for the takeover: a hooded faceplate inside a ringed border lettered with his claim.
 *  Every line has pathLength 1, so the stroke can be drawn on by setting --draw from 0 to 1. */
const Sigil = forwardRef<SVGSVGElement, { className?: string }>(function Sigil({ className }, ref) {
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const a = (i / 36) * Math.PI * 2, r0 = 80, r1 = i % 3 === 0 ? 86 : 83;
    return `M${(Math.cos(a) * r0).toFixed(2)},${(Math.sin(a) * r0).toFixed(2)}L${(Math.cos(a) * r1).toFixed(2)},${(Math.sin(a) * r1).toFixed(2)}`;
  }).join("");
  return (
    <svg ref={ref} className={`sigil ${className ?? ""}`} viewBox="-100 -100 200 200" aria-hidden="true">
      <defs>
        <path id="sigil-ring" d="M-91,0a91,91 0 1,1 182,0a91,91 0 1,1 -182,0" />
      </defs>
      <g className="sigil__lines" fill="none" strokeLinecap="round" strokeLinejoin="round">
        <circle r="97" pathLength={1} />
        <circle r="86" pathLength={1} />
        <path d={ticks} pathLength={1} className="sigil__thin" />
        {/* the hood */}
        <path d="M-58,62 C-66,-10 -50,-68 0,-72 C50,-68 66,-10 58,62" pathLength={1} />
        <path d="M-46,58 C-52,0 -40,-54 0,-58 C40,-54 52,0 46,58" pathLength={1} className="sigil__thin" />
        {/* the faceplate */}
        <path d="M-30,-40 L30,-40 C35,-14 34,16 21,38 L0,50 L-21,38 C-34,16 -35,-14 -30,-40 Z" pathLength={1} />
        <path d="M-25,-14 L-6,-12 L-8,-6 L-23,-8 Z M25,-14 L6,-12 L8,-6 L23,-8 Z" pathLength={1} />
        <path d="M0,-40 L0,-20 M-12,18 L-12,32 M-6,19 L-6,36 M0,19 L0,38 M6,19 L6,36 M12,18 L12,32" pathLength={1} className="sigil__thin" />
      </g>
      <text className="sigil__text"><textPath href="#sigil-ring" startOffset="0">LATVERIA · BY DECREE OF VICTOR VON DOOM · LATVERIA · BY DECREE OF VICTOR VON DOOM ·</textPath></text>
    </svg>
  );
});
export default Sigil;
