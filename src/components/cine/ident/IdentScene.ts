import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import FRAMES from "../../../../public/sigai/frames.json";

/* ── Timeline (seconds) ──────────────────────────────────────────────────────
   One unbroken camera move. 0 → 7.2 the camera flies down a corridor of our photographs
   (flashing on every cut) towards the SIGAI letters waiting at its vanishing point, filled with
   photographs; it decelerates into a frontal framing exactly as the score's final hit lands (7.2),
   when the letters turn to silver inside the emerald box.                                  */
export const T = { D: 7.2, SUB: 8.0, FADE: 9.6, END: 10.4 };

export const RUSH_CUTS: number[] = [];
for (let t = 0.7, d = 0.5; t < T.D - 0.15; t += d, d = Math.max(0.075, d * 0.9)) RUSH_CUTS.push(t);

const clamp = (x: number) => Math.min(1, Math.max(0, x));
const smooth = (x: number) => { x = clamp(x); return x * x * (3 - 2 * x); };
const easeOut = (x: number) => 1 - Math.pow(1 - clamp(x), 3);

export type IdentAssets = { events: THREE.Texture[]; members: THREE.Texture[]; mark: HTMLImageElement; font: string };

/** Preloads every texture the ident needs; reports 0..1 progress. */
export function loadIdentAssets(onProgress: (p: number) => void): Promise<IdentAssets> {
  const loader = new THREE.TextureLoader();
  const fam = getComputedStyle(document.documentElement).getPropertyValue("--f-logo").trim() || "Impact";
  const total = FRAMES.length + 2;
  let done = 0;
  const tick = () => onProgress(++done / total);
  const tex = (src: string) => new Promise<THREE.Texture>((res) => {
    loader.load(`/sigai/${src}.jpg`, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; tick(); res(t); }, undefined, () => { tick(); res(new THREE.Texture()); });
  });
  const mark = new Promise<HTMLImageElement>((res) => {
    const im = new Image(); im.onload = () => { tick(); res(im); }; im.onerror = () => { tick(); res(im); }; im.src = "/sigai/mark-mask.png";
  });
  const font = document.fonts.load(`400 200px ${fam}`).then(() => { tick(); return fam; }, () => { tick(); return fam; });
  const ev = FRAMES.filter((f) => f.kind === "event").map((f) => tex(f.src));
  const mem = FRAMES.filter((f) => f.kind === "member").map((f) => tex(f.src));
  return Promise.all([Promise.all(ev), Promise.all(mem), mark, font]).then(([events, members, m, f]) => ({ events, members, mark: m, font: f }));
}

/* ── Shaders ─────────────────────────────────────────────────────────────── */
const VERT = /* glsl */ `
varying vec2 vUv; varying float vDepth;
void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vDepth=-mv.z; gl_Position=projectionMatrix*mv; }`;

// A photograph hung in the dark: cover-fit, graded, soft edges, a glass sheen and a hairline of green light.
const PANEL_FRAG = /* glsl */ `
uniform sampler2D map; uniform vec2 uScale; uniform float uOp, uTime, uSeed, uFog, uGain;
varying vec2 vUv; varying float vDepth;
void main(){
  vec2 uv=(vUv-.5)*uScale+.5;
  vec3 c=texture2D(map,uv).rgb*uGain;
  float l=dot(c,vec3(.3,.59,.11));
  c=mix(vec3(l),c,.85);
  c=pow(c,vec3(1.08))*vec3(.92,1.04,.97);
  vec2 e=min(vUv,1.-vUv);
  float edge=smoothstep(0.,.05,e.x)*smoothstep(0.,.05,e.y);
  float rim=(1.-smoothstep(0.,.006,min(e.x,e.y)))*.9;
  float s=fract((vUv.x*.7+vUv.y*.4)*.5-uTime*.18+uSeed);
  float sheen=smoothstep(.0,.06,s)*smoothstep(.14,.06,s)*.22;
  vec3 col=c*(.35+.65*edge)+sheen+vec3(.25,1.,.55)*rim*.6;
  float fog=exp(-max(vDepth-2.,0.)*uFog);
  gl_FragColor=vec4(col*fog*uOp,1.);
}`;

// Front face of the extruded logo: photographs inside the letters, then brushed silver + a specular sweep.
const FACE_FRAG = /* glsl */ `
uniform sampler2D uMask, m0, m1, m2, m3; uniform vec4 uAsp; uniform float uLA, uMetal, uSweep, uTime, uOp;
varying vec2 vUv;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
vec3 photo(sampler2D t, float a, vec2 q){
  float ba=uLA/4.; vec2 s=ba>a?vec2(1.,a/ba):vec2(ba/a,1.);
  return texture2D(t,(q-.5)*s+.5).rgb;
}
void main(){
  float m=texture2D(uMask,vUv).a; if(m<.02) discard;
  float b=floor(vUv.x*4.); vec2 q=vec2(fract(vUv.x*4.),vUv.y);
  vec3 p = b<1. ? photo(m0,uAsp.x,q) : b<2. ? photo(m1,uAsp.y,q) : b<3. ? photo(m2,uAsp.z,q) : photo(m3,uAsp.w,q);
  p*=1.25;
  // flat, printed silver ink — one colour, no lighting, no sheen
  vec3 metal=vec3(.86,.89,.875);
  vec3 col=mix(p,metal,uMetal);
  gl_FragColor=vec4(col*uOp,smoothstep(.3,.7,m));
}`;

// Side slices of the extrusion: dark emerald metal, brighter towards the face.
const SIDE_FRAG = /* glsl */ `
uniform sampler2D uMask; uniform float uK, uOp, uMetal;
varying vec2 vUv;
void main(){
  if(texture2D(uMask,vUv).a<.5) discard;
  vec3 c=mix(vec3(.05,.22,.12),vec3(.006,.03,.018),uK);
  c=mix(c, mix(vec3(.55,.62,.6),vec3(.06,.08,.07),uK), uMetal*.7);
  gl_FragColor=vec4(c*uOp,1.);
}`;

// The emerald box: deep, matte, fine-grained, lit softly from the upper left, one quiet hairline.
const PLATE_FRAG = /* glsl */ `
uniform float uOp, uAsp, uTime; varying vec2 vUv;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
  vec2 px=vUv*vec2(uAsp,1.);
  vec3 c=vec3(.016,.105,.058);              // one flat emerald, like a printed card
  vec2 e=min(px,vec2(uAsp,1.)-px);
  float line=1.-smoothstep(0.,.003,abs(min(e.x,e.y)-.055));
  c=mix(c,vec3(.6,.75,.68),line*.35);
  gl_FragColor=vec4(c*uOp,1.);
}`;

// Soft shadow under the letters, as if the silver were inlaid a hair above the plate.
const SHADOW_FRAG = /* glsl */ `
uniform sampler2D uBlur; uniform float uOp; varying vec2 vUv;
void main(){ float a=texture2D(uBlur,vUv).a; gl_FragColor=vec4(0.,.01,.005,a*.55*uOp); }`;

// Floor of the corridor: black gloss with green speed lines.
const FLOOR_FRAG = /* glsl */ `
uniform float uTime, uSpeed, uOp; varying vec2 vUv; varying float vDepth;
void main(){
  float lane=abs(fract(vUv.x*9.)-.5);
  float streak=smoothstep(.02,0.,lane)*smoothstep(.35,1.,fract(vUv.y*14.+uTime*uSpeed));
  vec3 c=vec3(.005,.015,.01)+vec3(.15,.8,.45)*streak*.25*min(uSpeed,1.5);
  gl_FragColor=vec4(c*exp(-vDepth*.06)*uOp,1.);
}`;

// Final grade: zoom blur from speed, chromatic fringe, flash, vignette, grain, fade.
const FINAL = {
  uniforms: { tDiffuse: { value: null }, uBlur: { value: 0 }, uFlash: { value: 0 }, uFade: { value: 1 }, uTime: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } },
  vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader: /* glsl */ `
uniform sampler2D tDiffuse; uniform float uBlur, uFlash, uFade, uTime; uniform vec2 uRes; varying vec2 vUv;
float h(vec2 p){return fract(sin(dot(p,vec2(12.9898,78.233)))*43758.5453);}
void main(){
  vec2 d=vUv-.5; vec3 c=vec3(0.);
  for(int i=0;i<10;i++){ float k=float(i)/9.; c+=texture2D(tDiffuse,.5+d*(1.-uBlur*k*.12)).rgb; }
  c/=10.;
  float ca=.0004+uBlur*.0005;
  c.r=mix(c.r,texture2D(tDiffuse,.5+d*(1.+ca)).r,.5);
  c.b=mix(c.b,texture2D(tDiffuse,.5+d*(1.-ca)).b,.5);
  c+=vec3(.75,1.,.85)*uFlash;
  c*=smoothstep(1.05,.25,length(d*vec2(1.1,1.)));
  c+=(h(vUv*uRes+fract(uTime*7.)*91.)-.5)*.035;
  gl_FragColor=vec4(c*uFade,1.);
}`,
};

type Panel = { mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>; w: number; h: number; base: number };

export class IdentScene {
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private finalPass: ShaderPass;
  private bloom: UnrealBloomPass;
  private scene = new THREE.Scene();
  private cam: THREE.PerspectiveCamera;
  private corridor: Panel[] = [];
  private floor: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private logo = new THREE.Group();
  private face!: THREE.ShaderMaterial;
  private shadow!: THREE.ShaderMaterial;
  private sides: THREE.ShaderMaterial[] = [];
  private plate!: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private logoW = 10;
  private plateW = 11.6;
  private plateH = 4;
  private pool: THREE.Texture[];
  private cutIdx = -1;

  constructor(private canvas: HTMLCanvasElement, private a: IdentAssets) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1.5 : 1.75));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.scene.background = new THREE.Color(0x010201);
    this.cam = new THREE.PerspectiveCamera(42, 1, 0.05, 200);

    // interleave people and moments so the montage reads as a story
    this.pool = a.members.flatMap((m, i) => [m, a.events[i % a.events.length]]);

    this.buildCorridor();
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(7, 60), new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FLOOR_FRAG, uniforms: { uTime: { value: 0 }, uSpeed: { value: 0 }, uOp: { value: 0 } },
    }));
    this.floor.rotation.x = -Math.PI / 2; this.floor.position.set(0, -2.05, -28);
    this.scene.add(this.floor);
    this.buildLogo();

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.cam));
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.32, 0.5, 0.92);
    this.composer.addPass(this.bloom);
    this.finalPass = new ShaderPass(FINAL);
    this.composer.addPass(this.finalPass);
    this.composer.addPass(new OutputPass());
    this.resize();
  }

  private panel(tex: THREE.Texture, w: number, h: number, seed: number) {
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: PANEL_FRAG,
      uniforms: { map: { value: tex }, uScale: { value: new THREE.Vector2(1, 1) }, uOp: { value: 0 }, uTime: { value: 0 }, uSeed: { value: seed }, uFog: { value: 0.09 }, uGain: { value: 1 } },
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    mesh.scale.set(w, h, 1);
    const p: Panel = { mesh, w, h, base: seed };
    this.fit(p, tex);
    this.scene.add(mesh);
    return p;
  }

  private fit(p: Panel, tex: THREE.Texture) {
    const img = tex.image as { width?: number; height?: number } | undefined;
    const ia = img?.width && img.height ? img.width / img.height : 1.4;
    const pa = p.w / p.h;
    p.mesh.material.uniforms.map.value = tex;
    p.mesh.material.uniforms.uScale.value.set(ia > pa ? pa / ia : 1, ia > pa ? 1 : ia / pa);
  }

  private buildCorridor() {
    let i = 0;
    for (let z = -2; z > -56; z -= 2.3) {
      for (const side of [-1, 1]) {
        for (const y of [-0.95, 0.95]) {
          const portrait = (i % 3) === 0;
          const w = portrait ? 1.35 : 2.3, h = 1.75;
          const p = this.panel(this.pool[i % this.pool.length], w, h, i * 0.13);
          p.mesh.position.set(side * 2.25, y, z + (y > 0 ? 1.1 : 0));
          p.mesh.rotation.y = -side * (Math.PI / 2 - 0.42);
          p.mesh.material.uniforms.uFog.value = 0.05;
          this.corridor.push(p);
          i++;
        }
      }
    }
  }

  private buildLogo() {
    // one mask holds mark + wordmark, measured so the group is optically centred
    const F = 360;
    const cv = document.createElement("canvas");
    const g = cv.getContext("2d")!;
    g.font = `400 ${F}px ${this.a.font}`;
    const mt = g.measureText("SIGAI");
    const asc = mt.actualBoundingBoxAscent, desc = mt.actualBoundingBoxDescent;
    const capH = asc + desc;
    const tw = mt.actualBoundingBoxLeft + mt.actualBoundingBoxRight + F * 0.035 * 4;
    const mark = this.a.mark;
    const mh = capH * 1.02, mw = mark.naturalWidth ? mh * (mark.naturalWidth / mark.naturalHeight) : mh * 0.77;
    const gap = F * 0.16, pad = F * 0.04;
    cv.width = Math.ceil(mw + gap + tw + pad * 2);
    cv.height = Math.ceil(capH + pad * 2);
    g.font = `400 ${F}px ${this.a.font}`;
    g.fillStyle = "#fff"; g.textBaseline = "alphabetic"; g.textAlign = "left";
    (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = `${F * 0.035}px`;
    if (mark.naturalWidth) g.drawImage(mark, pad, pad + (capH - mh) / 2, mw, mh);
    g.fillText("SIGAI", pad + mw + gap + mt.actualBoundingBoxLeft, pad + asc);
    const mask = new THREE.CanvasTexture(cv);
    mask.anisotropy = 8;
    const bc = document.createElement("canvas"); bc.width = cv.width; bc.height = cv.height;
    const bg = bc.getContext("2d")!; bg.filter = `blur(${F * 0.03}px)`; bg.drawImage(cv, 0, F * 0.022);
    const blurMask = new THREE.CanvasTexture(bc);

    const la = cv.width / cv.height;
    this.logoW = 9; const lh = this.logoW / la;
    this.plateW = this.logoW + lh * 1.3; this.plateH = lh * 2.05;
    const geo = new THREE.PlaneGeometry(this.logoW, lh);
    const N = 0, depth = 0.02;
    for (let i = N; i >= 1; i--) {
      const m = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: SIDE_FRAG, uniforms: { uMask: { value: mask }, uK: { value: i / N }, uOp: { value: 1 }, uMetal: { value: 0 } } });
      const s = new THREE.Mesh(geo, m); s.position.z = -(i / N) * depth;
      this.sides.push(m); this.logo.add(s);
    }
    const asp = new THREE.Vector4(1.4, 1.4, 1.4, 1.4);
    this.face = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FACE_FRAG,
      uniforms: { uMask: { value: mask }, m0: { value: this.pool[0] }, m1: { value: this.pool[1] }, m2: { value: this.pool[2] }, m3: { value: this.pool[3] }, uAsp: { value: asp }, uLA: { value: la }, uMetal: { value: 0 }, uSweep: { value: -1 }, uTime: { value: 0 }, uOp: { value: 1 } },
    });
    this.face.transparent = true;
    this.shadow = new THREE.ShaderMaterial({ vertexShader: VERT, fragmentShader: SHADOW_FRAG, transparent: true, depthWrite: false, uniforms: { uBlur: { value: blurMask }, uOp: { value: 0 } } });
    const sh = new THREE.Mesh(geo, this.shadow); sh.position.z = -0.01; this.logo.add(sh);
    this.logo.add(new THREE.Mesh(geo, this.face));

    this.plate = new THREE.Mesh(new THREE.PlaneGeometry(this.plateW, this.plateH), new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: PLATE_FRAG, uniforms: { uOp: { value: 0 }, uAsp: { value: this.plateW / this.plateH }, uTime: { value: 0 } },
    }));
    this.plate.position.z = -depth - 0.02;
    this.logo.add(this.plate);
    this.logo.position.set(0, 0, -90);
    this.scene.add(this.logo);
  }

  private setLetterPhotos(k: number) {
    const u = this.face.uniforms;
    const keys = ["m0", "m1", "m2", "m3"] as const;
    const asp: number[] = [];
    keys.forEach((key, j) => {
      const t = this.pool[(k * 4 + j * 7) % this.pool.length];
      u[key].value = t;
      const img = t.image as { width?: number; height?: number } | undefined;
      asp.push(img?.width && img.height ? img.width / img.height : 1.4);
    });
    (u.uAsp.value as THREE.Vector4).set(asp[0], asp[1], asp[2], asp[3]);
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.cam.aspect = w / h;
    this.cam.fov = w < h ? 60 : 42;
    this.cam.updateProjectionMatrix();
    (this.finalPass.uniforms.uRes.value as THREE.Vector2).set(w, h);
  }

  /** distance at which the plate fills `frac` of the frame width (and fits the height) */
  private logoDistance(frac: number) {
    const vt = Math.tan(THREE.MathUtils.degToRad(this.cam.fov / 2));
    const byW = this.plateW / frac / 2 / (vt * this.cam.aspect);
    const byH = this.plateH / 0.5 / 2 / vt;
    return Math.max(byW, byH);
  }

  /** Renders the frame for time t (seconds). Returns the cut index when a new cut lands. */
  render(t: number) {
    const fu = this.finalPass.uniforms;
    fu.uTime.value = t;
    let blur = 0, flash = 0;
    const look = new THREE.Vector3();

    const L = this.logo.position;
    const dist = this.logoDistance(this.cam.aspect < 1 ? 0.9 : 0.62);
    // one curve: gentle start, a hard rush through the middle, a long glide to rest on the logo
    const camZ = (x: number) => {
      const u = Math.pow(clamp(x / T.D), 1.12);
      const s5 = u * u * u * (u * (u * 6 - 15) + 10);
      return THREE.MathUtils.lerp(6, L.z + dist, s5) - 0.03 * dist * easeOut((x - T.D) / 3);
    };
    const z = camZ(t);
    const speed = Math.abs(camZ(t + 1 / 60) - z) * 60;
    const settle = smooth(t / T.D);
    this.cam.up.set(0, 1, 0);
    this.cam.position.set(0, 0.06 * (1 - settle), z);
    look.set(0, 0, L.z);
    this.cam.lookAt(look);
    this.cam.rotation.z += Math.sin(t * 1.3) * 0.025 * (1 - settle);
    blur = Math.min(1.6, speed / 22);

    // cuts: corridor photographs and the photographs inside the letters change together
    let k = -1;
    for (let i = 0; i < RUSH_CUTS.length; i++) if (t >= RUSH_CUTS[i]) k = i;
    if (k !== this.cutIdx && t < T.D) {
      this.cutIdx = k;
      if (k >= 0) {
        this.corridor.forEach((p, i) => { if ((i + k) % 3 === 0) this.fit(p, this.pool[(i * 5 + k * 3) % this.pool.length]); });
        this.setLetterPhotos(k);
      }
    }
    const since = k >= 0 ? t - RUSH_CUTS[k] : 9;
    const pulse = t < T.D ? Math.exp(-since * 14) : 0;
    const cOp = smooth(t / 0.9);
    this.corridor.forEach((p) => {
      const ahead = z - p.mesh.position.z;
      const u = p.mesh.material.uniforms;
      u.uOp.value = cOp * smooth((40 - ahead) / 12) * smooth((ahead + 1.5) / 2);
      u.uGain.value = 1 + 0.55 * pulse;
      u.uTime.value = t;
    });
    const fl = this.floor.material.uniforms;
    fl.uOp.value = cOp * (1 - smooth((t - T.D + 1.2) / 1.2)); fl.uTime.value = t; fl.uSpeed.value = 0.15 + speed / 12;

    // the letters: dim in the distance, photographs flashing inside, then silver in the box
    this.face.uniforms.uOp.value = smooth((t - 0.6) / 2.2) * (1 + 0.25 * pulse);
    const metal = smooth((t - T.D + 0.1) / 0.8);
    this.face.uniforms.uMetal.value = metal;
    this.face.uniforms.uSweep.value = -0.4 + 1.9 * smooth((t - T.D - 0.35) / 1.5);
    this.plate.material.uniforms.uOp.value = metal;
    this.shadow.uniforms.uOp.value = 0;
    flash = Math.pow(Math.max(0, 1 - Math.abs(t - T.D) / 0.18), 2) * 0.22;

    // the logo is a printed mark, not a light source: no bloom once it is on screen
    this.bloom.strength = 0.32 * (1 - smooth((t - T.D + 0.4) / 0.6));
    fu.uBlur.value = blur;
    fu.uFlash.value = flash;
    fu.uFade.value = Math.min(smooth(t / 0.6), 1 - smooth((t - T.FADE) / (T.END - T.FADE)));
    this.composer.render();
  }

  dispose() {
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      if (m.material) (m.material as THREE.Material).dispose();
    });
    this.composer.dispose();
    this.renderer.dispose();
  }
}
