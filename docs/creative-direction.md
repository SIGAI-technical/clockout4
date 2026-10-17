# Clockout 4.0 — Creative Direction

## Trailer analysis (Avengers: Doomsday, trailer 5 — 84 shots, 2:31)

Measured with OpenCV (per-shot CIELAB luma/chroma, Farneback optical flow, histogram scene cuts):

| Trait | Evidence | Design rule |
|---|---|---|
| Crushed blacks | 5th-percentile luma 0–3 in 70% of shots; mean luma 7–20 in hero beats | Page base is near-black `#030504`; light only comes from *sources* (windows, energy, metal) |
| Cool shadows, warm practicals | Shadow chroma green-teal (a≈-3…-8), candles/torches stay warm | Green-teal ambience, small warm accents (sconces, gold) |
| Long holds → burst | 4–7 s holds early; 97–105 s = 20 cuts at 0.17–0.25 s ending on Doom → cut to black | Intro montage ramps cut length 300 ms → 60 ms, then hard black |
| Comic → chrome logo | 30–35 s: yellow halftone panels flip-book into the chrome studio logo | CLOCKOUT reveal: photo flip-book *inside* the letterforms, settling into brushed metal |
| Doom is never frontal at first | 23–30 s over-shoulder: hood + pauldron fill frame, lens flare, ship silhouette; frontal mask only in final lightning burst | Doom shown as hood, pauldron, gauntlet, throne silhouette — cropped below the chin |
| Character aura by light colour | Storm blue-white (Thor), violet kinetic (Gambit), red optic (Cyclops), gold vibranium (Wakanda) | Each arena gets a faceless character + aura colour, used only as a rim light accent |
| End card | Green leaded stained glass, volumetric shafts, chrome title dollying out of black, tiny wide-tracked silver type | Info section = "end card": stained-glass shader, tracked silver small caps, countdown slots |
| Camera | Slow push-ins (flow ≈0.2 px/f) in holds; whip pans (4–5 px/f) only in bursts | Scroll journey is slow & weighted; speed only in montage |

## Three concepts

**A — "Through the Leaded Glass."** The whole site lives behind Doom's stained-glass window. A single WebGL scene; each section is a pane that lights up as you scroll. *Strength:* a unique visual system. *Weakness:* abstract. It loses the castle journey and the characters, and the glass becomes wallpaper.

**B — "Latveria Monthly #1."** A prestige 90s comic issue: painted cover, splash pages, panel grids, lettered balloons, page-turn transitions. *Strength:* fully commits to the comic influence. *Weakness:* it tips into the "childish" register the brief rejects (95/5 realism split violated), and photoreal footage fights with drawn panels.

**C — "The Doomsday Reel."** The site is structured like the trailer: cold open → flip-book logo → castle journey (scroll-scrubbed footage through a WebGL lens: fog, shafts, grain, scope letterbox) → Doom revealed by silhouette → the "end card" with event info. Comic language appears only as lettering: narration caption boxes, one Doom balloon, halftone on the transitions.
*Strength:* it keeps both things the brief says already work, it follows the trailer's measured rhythm, and it holds the 95/5 split. *Weakness:* it leans on video. That is mitigated by an all-intra encode for scrubbing, a mobile encode, and posters.

**Selected: C**, taking A's stained-glass shader for the end card (it is the trailer's own closing image).

## Iterations on C
1. **Structure pass.** Gate → logo flip → castle → Doom → end card → arenas → trials → FAQ → register. Problem found: info sections read as a generic landing page after the cinema.
2. **Lettering pass.** Replaced Bebas/Bangers with Anton (logo only), Archivo with the width axis (tracked silver small caps), and Cormorant italic (Doom's voice). Arenas became faceless character "dossier" panels with aura rim light. Halftone is only revealed on hover/focus.
3. **Motion pass.** Cut-length ramp tuned to the trailer burst. The scroll scrub is lerped (no seek-thrash), and velocity drives chromatic split. Lightning flashes are synced to the archway match-cut.
4. **Polish pass.** Mobile encode with DPR clamp, reduced-motion path (no pin, still frames), the sound toggle persists, and audio is gated behind the Enter gesture.
