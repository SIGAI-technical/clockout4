# Clockout 4.0: image asset brief

Images only, no video. All motion (marching, fog, lightning, the clash) is added in code.
Put every file in `Images/battle/` using the filenames below.

## Rules for every image

1. **Faces are allowed.** A three-quarter view works best: the character is turned toward the direction they walk, so we see the face in profile and the body in motion.
2. **Background:** transparent PNG if your tool can do it. Otherwise use **pure black (#000000)** with nothing else in the background, and I'll cut the figures out.
3. **Full body, head to feet**, with a little space around the figure and the feet visible, so I can stand everyone on the same ground.
4. **Direction matters:**
   - **Doom's side faces RIGHT** (walking toward the right edge of the frame).
   - **Heroes face LEFT** (walking toward the left edge).
5. **Pose:** walking forward, mid-stride, determined. Not standing still and not posing for a photo.
6. **Lighting:** dark and cinematic. Each figure is lit low-key, with a strong **rim light from behind** in that character's signature colour (listed below).
7. **Size:** at least **2048 px tall**, PNG.
8. **Style:** photoreal, matching the film's look, so the same style prompt goes on every image.

### Style prompt (paste in front of every character prompt)

> Photorealistic cinematic film still, full-body figure isolated on a pure black background, dark moody low-key lighting, strong colored rim light from behind outlining the silhouette, three-quarter view, mid-stride walking pose, feet visible, 35mm anamorphic, high detail costume texture, no text, no logo, no background elements

---

## Doom's side (faces right →)

| File | Character | Signature light | Prompt (after the style prompt) |
|---|---|---|---|
| `doom.png` | **Doctor Doom** | Emerald green | Doctor Doom in three-quarter view walking right, dark green hooded cloak, polished steel mask and armour, cape trailing, one gauntlet crackling with green lightning, green rim light |
| `strange.png` | **Doctor Strange** (corrupted, on Doom's side) | Orange-gold + green | Doctor Strange in three-quarter view walking right, dark blue robes, deep red Cloak of Levitation billowing, glowing orange mystic mandala circles around both hands, cold expression, orange-and-green rim light |
| `hulk.png` | **Hulk** | Toxic green | The Hulk in three-quarter view walking right, massive green muscular body, torn dark trousers, hunched powerful stride, fists clenched, snarling, green rim light, dust kicking up at his feet |
| `sentinel.png` | **Sentinel** (giant robot) | Red eyes, cold steel | Giant X-Men Sentinel robot, towering purple-and-steel armoured humanoid, seen from a low angle, three-quarter view walking right, glowing red eyes, red rim light |
| `doombot.png` | **Doombot** (rank-and-file) | Green | A Doombot soldier, steel mask and armour like Doom, green hooded cloak, walking right, green rim light (I'll repeat this one to build the army) |

## The opponents (face left ←)

| File | Character | Signature light | Prompt (after the style prompt) |
|---|---|---|---|
| `thor.png` | **Thor** (Avengers) | Electric blue-white | Thor in three-quarter view walking left, dark armour, long red cape, Mjolnir in hand crackling with blue lightning, fierce expression, blue-white rim light |
| `cap.png` | **Captain America (Steve Rogers)** (Avengers) | Cool white | Steve Rogers as Captain America in three-quarter view walking left, classic star-spangled suit, round shield on his arm, determined, cool white rim light |
| `reed.png` | **Mister Fantastic** (Fantastic Four) | Pale blue | Mister Fantastic in three-quarter view walking left, white-and-blue retro space suit with a "4" emblem, focused expression, pale blue rim light |
| `sue.png` | **Invisible Woman** (Fantastic Four) | Prismatic rainbow | Invisible Woman in three-quarter view walking left, white-and-blue retro suit, long blonde hair, one hand raised throwing a shimmering prismatic force field, rainbow-tinted rim light |
| `thing.png` | **The Thing** (Fantastic Four) | Warm orange | The Thing in three-quarter view walking left, huge orange rocky body, blue shorts / belt, heavy stride, warm orange rim light |
| `torch.png` *(optional)* | **Human Torch** (Fantastic Four) | Fire orange | Human Torch in three-quarter view walking left, body fully engulfed in flames, the flames are the light |
| `profx.png` | **Professor X** (X-Men) | Violet | Professor X in a wheelchair, three-quarter view rolling left, bald, dark suit, violet psychic glow around his head, calm stern expression |
| `cyclops.png` | **Cyclops** (X-Men) | Ruby red | Cyclops in three-quarter view walking left, dark blue-and-yellow X-Men suit, visor glowing red with a beam about to fire, red rim light |
| `gambit.png` | **Gambit** (X-Men) | Magenta pink | Gambit in three-quarter view walking left, long brown trench coat, bo staff in one hand, glowing pink-charged playing cards in the other, smirking, magenta rim light |
| `shangchi.png` | **Shang-Chi** | Gold-orange | Shang-Chi in three-quarter view walking left, dark fighting suit, the Ten Rings glowing gold-orange around both forearms, gold rim light |

## The clash (the two close-ups just before the form)

| File | Content | Prompt (after the style prompt, but **not** full body) |
|---|---|---|
| `clash_doom.png` | Doom, reaching right | Close-up of Doctor Doom from the chest up, facing right, armoured gauntlet thrust toward the right edge of frame, green lightning crackling off it, black background |
| `clash_thor.png` | Thor, reaching left | Close-up of Thor from the chest up, facing left, Mjolnir thrust toward the left edge of frame, blue lightning crackling off it, black background |

## The battlefield (environment plates, no characters)

| File | Size | Prompt |
|---|---|---|
| `field_sky.png` | 6000 × 2000 (3:1) | Ultra-wide cinematic panorama, stormy apocalyptic sky. Left side: dark, green lightning inside heavy clouds. Right side: a break in the clouds with cold pale light. Photoreal, no ground, no characters |
| `field_castle.png` | 4000 × 2000, black or transparent background | A dark gothic castle with tall towers on a distant cliff, green-lit windows, silhouetted against storm, standing alone (this sits behind Doom on the far left) |
| `field_ground.png` | 6000 × 1500 | Ultra-wide scorched battlefield plain at ground level, cracked earth, scattered rubble, smoke, embers, flat horizon, photoreal, dark, no characters, no sky (black above horizon) |
| `field_debris.png` | 6000 × 800, transparent or black | Foreground rubble, broken stone and debris along the bottom edge, very dark, close to camera (this slides past fastest) |

---

## Event details

Not needed yet. The site will launch with clearly marked placeholders (date, venue, trials, prizes, rules, contacts, FAQ) kept in one config file, so swapping in the real details later is a one-file change.

## The form

The form will be an **embedded Google Form** that appears at the moment of the clash. All I need is:

- The form's link (`https://docs.google.com/forms/d/e/.../viewform`). Until then the site shows a placeholder frame.
- Tip: in the form's settings, turn off "Require sign-in" (or "Restrict to users in your organisation") so it loads inside the site for everyone.

---

### Priority if you're short on time

1. Must have: `doom`, `thor`, `hulk`, `strange`, `sentinel`, `cyclops`, `sue`, `thing`, `shangchi`, `field_sky`, `field_ground`
2. Next: `gambit`, `profx`, `reed`, `cap`, `doombot`, `field_castle`
3. Nice to have: `torch`, `clash_doom`, `clash_thor`, `field_debris`
