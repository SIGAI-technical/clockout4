import * as THREE from "three";
import { BATTLE_FRAG } from "./battleShader";

/* The battlefield as one WebGL scene, in screen pixels (y down at the API, y up inside).
   Draw order, back to front: sky/ground → rank 2 → fog → rank 1 → fog → rank 0 → close-ups →
   ground fog → ash. Every figure is a living plate: cloth moves in the wind (masked), the chest
   rises and falls, weight shifts, lightning lights the edges that face it, and each character's
   power is drawn on top of them. */

export type FxKind = "arcs" | "mandala" | "glow" | "rings" | "flames" | "prism" | "cards" | "eyes" | "dust" | "halo";
export type FxDef = { kind: FxKind; x: number; y: number; size: number; color: [number, number, number]; color2?: [number, number, number] };
export type FigDef = { key: string; id: string; rank: number; fx?: FxDef[]; mirror?: boolean };
/** `par`: parallax in figure widths (how far the near parts slide past the far parts); `key`: how much the cursor light shapes it */
export type Pose = { x: number; foot: number; h: number; op: number; bright: number; haze: number; power: number; par?: number; key?: number; blur?: number; hit?: number };
export type Cam = { zoom: number; cx: number; cy: number; pan: number; tilt: number; light: [number, number]; lightAmt: number; fog: number };

const FX_TYPE: Record<FxKind, number> = { arcs: 0, mandala: 1, glow: 2, rings: 3, flames: 4, prism: 5, cards: 6, eyes: 7, dust: 8, halo: 9 };

const PLANE_VERT = /* glsl */ `
varying vec2 vUv;
void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`;

const FIG_FRAG = /* glsl */ `
uniform sampler2D uMap, uMask, uDepth;
uniform float uTime, uPhase, uWind, uBright, uHaze, uOp, uPower, uMirror, uBias, uPar, uKey, uBlur, uHit;
uniform vec3 uRim, uFlash, uFog, uL;
varying vec2 vUv;
void main(){
  vec2 uv=vUv;
  if(uMirror>.5) uv.x=1.-uv.x;
  float m=texture2D(uMask,uv).r;
  // wind through cloth: slow swell, quicker flutter, stronger toward the hem
  float w=sin(uTime*1.7+uv.y*6.+uPhase)*.55+sin(uTime*3.1-uv.y*13.+uPhase*2.)*.28+sin(uTime*.6+uPhase)*.45;
  uv.x+=w*m*.02*uWind;
  uv.y+=sin(uTime*2.4+uv.x*9.+uPhase)*m*.005*uWind;
  // breath: the chest band rises and widens a hair
  float b=sin(uTime*1.15+uPhase);
  float band=smoothstep(.4,.68,uv.y)*(1.-smoothstep(.72,.9,uv.y));
  uv.y-=b*.004*band;
  uv.x=.5+(uv.x-.5)*(1.-b*.005*band);
  // weight shift: a slow lean from the feet
  uv.x+=sin(uTime*.4+uPhase*1.3)*.0045*uv.y;
  // depth: near parts slide past far parts as the camera moves round the figure
  float dz=texture2D(uDepth,uv).r;
  uv.x+=uPar*(dz-.45);
  vec4 c=texture2D(uMap,uv,uBias);
  // motion: smear along the direction of travel
  if(uBlur>.001){ for(int i=1;i<6;i++){ c+=texture2D(uMap,uv+vec2(float(i)*uBlur*.012,0.),uBias); } c/=6.; }
  float a=c.a*uOp;
  if(a<.004) discard;
  // edges that face the storm (upper left) catch the lightning
  float lit=clamp(c.a-texture2D(uMap,uv+vec2(-.012,.008),uBias).a,0.,1.);
  // edges facing away carry the character's own rim light, flickering with their power
  float back=clamp(c.a-texture2D(uMap,uv+vec2(.012,.006),uBias).a,0.,1.);
  // a surface normal from the depth map, lit by the light the viewer holds
  vec2 e=vec2(.006,.004);
  float dx=texture2D(uDepth,uv+vec2(e.x,0.)).r-texture2D(uDepth,uv-vec2(e.x,0.)).r;
  float dy=texture2D(uDepth,uv+vec2(0.,e.y)).r-texture2D(uDepth,uv-vec2(0.,e.y)).r;
  vec3 nn=normalize(vec3(-dx*9.,-dy*9.,1.));
  float sh=max(dot(nn,normalize(uL)),0.);
  vec3 col=c.rgb*uBright*mix(1.,.35+sh*1.25,uKey);
  col+=c.rgb*pow(sh,10.)*uKey*1.4;
  col+=uFlash*(lit*1.6+.18);
  col+=uRim*(back+lit*.4)*uPower*(.75+.25*sin(uTime*6.+uPhase*3.));
  col=mix(col,uFog,uHaze);
  col+=vec3(1.,.95,.85)*uHit*((lit+back)*2.2+.12);
  gl_FragColor=vec4(col*a,a);
}`;

const FX_FRAG = /* glsl */ `
uniform float uTime, uType, uOp, uSeed;
uniform vec3 uC, uC2;
varying vec2 vUv;
float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<4;i++){s+=a*n(p);p*=2.07;a*=.5;}return s;}
vec3 hue(float x){return clamp(abs(mod(x*6.+vec3(0,4,2),6.)-3.)-1.,0.,1.);}
void main(){
  vec2 q=vUv-.5; float r=length(q); float an=atan(q.y,q.x);
  float t=uTime+uSeed*10.;
  vec3 col=vec3(0.);
  int k=int(uType+.5);
  if(k==0){                       // arcs: crackling lightning around a point
    float strobe=step(.35,h1(vec2(floor(t*15.),uSeed)));
    float e=0.;
    for(int i=0;i<3;i++){
      float fi=float(i);
      float rid=1.-abs(fbm(vec2(an*2.2+fi*7.+floor(t*15.)*.37,r*7.-t*9.))*2.-1.);
      e+=pow(rid,18.)*smoothstep(.5,.08,r);
    }
    col=(uC*1.2+vec3(.6))*e*strobe+uC*exp(-r*9.)*.35;
  } else if(k==1){                // mandala: rotating mystic circles
    float rot=an+t*.9;
    float ring=exp(-abs(r-.36)*90.)+exp(-abs(r-.28)*140.)*.7+exp(-abs(r-.44)*160.)*.5;
    float ticks=smoothstep(.6,1.,sin(rot*24.))*smoothstep(.02,0.,abs(r-.4));
    float glyph=smoothstep(.75,1.,sin((an-t*.6)*8.))*smoothstep(.03,0.,abs(r-.32));
    float star=smoothstep(.015,0.,abs(sin((an+t*.4)*3.)*r-.0))*smoothstep(.36,.1,r)*.35;
    col=uC*(ring+ticks+glyph+star)*1.4+uC*exp(-r*7.)*.25;
  } else if(k==2){                // glow: a pulse of the character's light
    col=uC*exp(-r*7.)*(.75+.25*sin(t*2.3));
  } else if(k==3){                // rings: Shang-Chi's ten rings, turning
    for(int i=0;i<5;i++){
      float fi=float(i);
      float ang=t*(.8+fi*.13)+fi*1.3;
      vec2 c=vec2(cos(ang),sin(ang)*.35)*.16;
      vec2 d=(q-c)*vec2(1.,2.4);
      float e=exp(-abs(length(d)-.09)*120.);
      col+=uC*e*(1.2+.4*sin(t*3.+fi));
    }
    col+=uC*exp(-r*6.)*.2;
  } else if(k==4){                // flames
    vec2 p=vec2(q.x*2.2,vUv.y);
    float f=fbm(vec2(p.x*3.,p.y*3.-t*2.6))*1.2;
    float shape=smoothstep(.55,0.,abs(p.x))*smoothstep(1.,.15,vUv.y+f*.35);
    col=mix(uC2,uC,smoothstep(.3,.8,shape))*pow(shape,1.4)*1.6;
  } else if(k==5){                // prism: Sue's shimmering field
    float hex=abs(sin((q.x*1.732+q.y)*40.))*abs(sin((q.x*1.732-q.y)*40.))*abs(sin(q.y*80.));
    float edge=exp(-abs(r-.4)*30.);
    col=hue(an/6.283+t*.15+r)*(edge*.9+smoothstep(.4,.2,r)*.12*(.5+hex))*(.6+.4*sin(t*2.+r*20.));
  } else if(k==6){                // cards: charged cards orbiting the hand
    for(int i=0;i<3;i++){
      float fi=float(i);
      float ang=t*1.6+fi*2.094;
      vec2 c=vec2(cos(ang)*.26,sin(ang)*.12+sin(t*2.+fi)*.03);
      vec2 d=(q-c);
      float ca=ang*.5; d=mat2(cos(ca),-sin(ca),sin(ca),cos(ca))*d;
      float card=smoothstep(.03,0.,max(abs(d.x)-.035,abs(d.y)-.05));
      col+=uC*(card*1.6+exp(-length(d)*28.)*.8);
    }
    col+=uC*exp(-r*8.)*.3;
  } else if(k==7){                // eyes: the Sentinel's stare
    float pulse=.65+.35*sin(t*3.);
    col=uC*(exp(-r*30.)*1.6+exp(-r*9.)*.4)*pulse;
  } else if(k==8){                // dust: kicked up at the feet
    float d=fbm(vec2(q.x*5.+t*.3,vUv.y*3.-t*.5));
    col=uC*d*smoothstep(.5,0.,abs(q.x))*smoothstep(.9,0.,vUv.y)*.35;
  } else {                        // halo: psychic waves
    float w=sin(r*40.-t*4.)*.5+.5;
    col=uC*(pow(w,6.)*smoothstep(.48,.15,r)*.7+exp(-r*8.)*.35);
  }
  gl_FragColor=vec4(col*uOp,0.);
}`;

const FOG_FRAG = /* glsl */ `
uniform float uTime, uOp, uSeed, uOff; uniform vec3 uC; uniform vec2 uAsp;
varying vec2 vUv;
float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p*=2.03;a*=.5;}return s;}
void main(){
  vec2 p=vUv*uAsp+vec2(uOff,0.);
  float f=fbm(p*1.6+vec2(uTime*.05+uSeed,uTime*.012));
  f=smoothstep(.35,.85,f+fbm(p*3.-vec2(uTime*.08,0.))*.35);
  float band=smoothstep(0.,.35,vUv.y)*smoothstep(1.,.45,vUv.y);
  float a=f*band*uOp;
  gl_FragColor=vec4(uC*a,a);
}`;

const ASH_VERT = /* glsl */ `
attribute float aSeed;
uniform float uTime, uH, uW, uWind;
varying float vSeed; varying float vLife;
void main(){
  vSeed=aSeed;
  vec3 p=position;
  float sp=.3+aSeed*.7;
  p.y=mod(p.y+uTime*28.*sp,uH+80.)-40.;
  p.x=mod(p.x+uTime*(40.+uWind*60.)*sp+sin(uTime*.8+aSeed*40.)*18.,uW+80.)-40.;
  vLife=.5+.5*sin(uTime*(1.+aSeed*3.)+aSeed*30.);
  gl_PointSize=(1.5+aSeed*aSeed*5.)*(aSeed>.93?1.4:1.);
  gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
}`;
const ASH_FRAG = /* glsl */ `
varying float vSeed; varying float vLife;
uniform float uOp;
void main(){
  float d=length(gl_PointCoord-.5);
  float a=smoothstep(.5,0.,d)*uOp;
  vec3 c=vSeed>.93?vec3(1.,.42,.1)*(.6+.8*vLife):vec3(.55,.6,.57)*.5;
  a*=vSeed>.93?1.:.55;
  gl_FragColor=vec4(c*a,a*.8);
}`;

const BEAM_FRAG = /* glsl */ `
uniform float uTime, uOp, uHead, uLen, uSeed, uKind; uniform vec3 uC;
varying vec2 vUv;
float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x),f.y);}
void main(){
  float x=vUv.x, y=vUv.y-.5;
  // the lit stretch: from (head-len) to head, brightest at the head
  float tail=uHead-uLen;
  float on=smoothstep(tail,tail+.04,x)*smoothstep(uHead+.01,uHead-.01,x);
  float grad=mix(.35,1.,clamp((x-tail)/max(uLen,.001),0.,1.));
  float wob=(n(vec2(x*18.-uTime*30.,uSeed))-.5)*.18*(uKind>.5?1.:.3);
  float yy=abs(y-wob);
  float core=exp(-yy*38.), glow=exp(-yy*7.);
  float flick=.8+.2*n(vec2(uTime*40.,uSeed));
  vec3 col=(vec3(1.)*core*1.2+uC*glow*.9+uC*core)*on*grad*flick;
  // the head itself flares
  col+=uC*exp(-length(vec2((x-uHead)*6.,y))*9.)*1.5*step(.001,uLen);
  gl_FragColor=vec4(col*uOp,0.);
}`;

const BURST_FRAG = /* glsl */ `
uniform float uPh, uOp, uSeed; uniform vec3 uC;
varying vec2 vUv;
float h1(float p){return fract(sin(p*127.1)*43758.5453);}
void main(){
  vec2 q=vUv-.5; float r=length(q), a=atan(q.y,q.x);
  float ph=uPh;
  float flash=exp(-r*(8.+ph*30.))*(1.-ph)*2.2;
  float ring=exp(-abs(r-ph*.46)*(60.-ph*30.))*(1.-ph)*1.3;
  // sparks: thin radial streaks thrown outward
  float s=0.;
  for(int i=0;i<14;i++){
    float fi=float(i);
    float an=h1(fi+uSeed)*6.283, sp=.25+h1(fi*3.1+uSeed)*.25;
    float d=abs(sin(a-an))*r;
    float along=r-ph*sp;
    s+=exp(-d*260.)*smoothstep(.07,0.,abs(along))*step(0.,cos(a-an));
  }
  vec3 col=(vec3(1.)*flash*.8+uC*(flash+ring+s*1.6*(1.-ph)));
  gl_FragColor=vec4(col*uOp,0.);
}`;

const SHADOW_FRAG = /* glsl */ `
uniform float uOp;
varying vec2 vUv;
void main(){
  vec2 q=(vUv-.5)*2.;
  float a=smoothstep(1.,0.,length(q))*.75+smoothstep(.45,0.,length(q*vec2(1.,1.6)))*.25;
  gl_FragColor=vec4(0.,0.,0.,a*uOp);
}`;

type FigRec = { shadow: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>; sx: number; sy: number; sh: number; def: FigDef; mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>; fx: { mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>; def: FxDef }[]; aspect: number; phase: number };

const premul = { blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor, transparent: true, depthTest: false, depthWrite: false } as const;
const additive = { blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, transparent: true, depthTest: false, depthWrite: false } as const;

export class Field {
  private r: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private cam = new THREE.OrthographicCamera(0, 1, 1, 0, -10, 10);
  private bg: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>;
  private figs = new Map<string, FigRec>();
  private fogOp: number[] = [];
  private fogs: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
  private ash: THREE.Points<THREE.BufferGeometry, THREE.ShaderMaterial>;
  private beams: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
  private bursts: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>[] = [];
  private W = 1; private H = 1;
  private loader = new THREE.TextureLoader();

  constructor(canvas: HTMLCanvasElement, defs: FigDef[], meta: Record<string, { w: number; h: number }>, rims: Record<string, [number, number, number]>) {
    this.r = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance" });
    this.r.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 760 ? 1.5 : 1.5));
    this.r.outputColorSpace = THREE.LinearSRGBColorSpace;

    // sky and ground
    this.bg = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.ShaderMaterial({
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=vec4(position.xy,0.,1.); }`,
      fragmentShader: "varying vec2 vUv;\n" + BATTLE_FRAG,
      uniforms: { uRes: { value: new THREE.Vector2() }, uTime: { value: 0 }, uPan: { value: 0 }, uTilt: { value: 0 }, uP: { value: 0 }, uFlash: { value: 0 }, uClash: { value: 0 }, uShake: { value: 0 } },
      depthTest: false, depthWrite: false,
    }));
    this.bg.renderOrder = 0; this.bg.frustumCulled = false;
    this.scene.add(this.bg);

    // fog banks between the ranks, and rolling over the front feet
    const fogDefs: [number, [number, number, number], number][] = [[15, [0.07, 0.13, 0.1], 0.6], [25, [0.06, 0.1, 0.09], 0.55], [50, [0.05, 0.08, 0.07], 0.7]];
    fogDefs.forEach(([order, c, op], i) => {
      const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
        vertexShader: PLANE_VERT, fragmentShader: FOG_FRAG, ...premul,
        uniforms: { uOff: { value: 0 }, uTime: { value: 0 }, uOp: { value: op }, uSeed: { value: i * 7.3 }, uC: { value: new THREE.Vector3(...c) }, uAsp: { value: new THREE.Vector2(3, 1) } },
      }));
      m.renderOrder = order; this.fogs.push(m); this.fogOp.push(op); this.scene.add(m);
    });

    // ash and embers drifting past the camera
    const N = innerWidth < 760 ? 220 : 480;
    const pos = new Float32Array(N * 3), seed = new Float32Array(N);
    for (let i = 0; i < N; i++) { pos[i * 3] = Math.random() * 2000; pos[i * 3 + 1] = Math.random() * 1200; seed[i] = Math.random(); }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    this.ash = new THREE.Points(g, new THREE.ShaderMaterial({
      vertexShader: ASH_VERT, fragmentShader: ASH_FRAG, ...premul,
      uniforms: { uTime: { value: 0 }, uH: { value: 1 }, uW: { value: 1 }, uWind: { value: 0 }, uOp: { value: 1 } },
    }));
    this.ash.renderOrder = 60; this.ash.frustumCulled = false;
    this.scene.add(this.ash);

    // attacks: beams and thrown things, and the bursts where they land
    for (let i = 0; i < 16; i++) {
      const b = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
        vertexShader: PLANE_VERT, fragmentShader: BEAM_FRAG, ...additive,
        uniforms: { uTime: { value: 0 }, uOp: { value: 0 }, uHead: { value: 1 }, uLen: { value: 1 }, uSeed: { value: i * 3.7 }, uKind: { value: 0 }, uC: { value: new THREE.Vector3(1, 1, 1) } },
      }));
      b.renderOrder = 55; b.frustumCulled = false; b.visible = false; this.scene.add(b); this.beams.push(b);
      const u = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
        vertexShader: PLANE_VERT, fragmentShader: BURST_FRAG, ...additive,
        uniforms: { uPh: { value: 0 }, uOp: { value: 0 }, uSeed: { value: i * 5.1 }, uC: { value: new THREE.Vector3(1, 1, 1) } },
      }));
      u.renderOrder = 56; u.frustumCulled = false; u.visible = false; this.scene.add(u); this.bursts.push(u);
    }

    // the figures and their powers
    defs.forEach((d, i) => {
      const map = this.loader.load(`/battle/${d.id}.webp`, (t) => { t.needsUpdate = true; });
      map.colorSpace = THREE.NoColorSpace; map.anisotropy = 4; map.generateMipmaps = true; map.minFilter = THREE.LinearMipmapLinearFilter;
      const mask = this.loader.load(`/battle/${d.id}_m.png`);
      const depth = this.loader.load(`/battle/${d.id}_d.png`);
      depth.colorSpace = THREE.NoColorSpace;
      const rim = rims[d.id] ?? [0.6, 0.6, 0.6];
      const phase = i * 1.913;
      const mat = new THREE.ShaderMaterial({
        vertexShader: PLANE_VERT, fragmentShader: FIG_FRAG, ...premul,
        uniforms: {
          uMap: { value: map }, uMask: { value: mask }, uDepth: { value: depth }, uPar: { value: 0 }, uKey: { value: 0 }, uBlur: { value: 0 }, uHit: { value: 0 }, uL: { value: new THREE.Vector3(0, 0, 1) }, uTime: { value: 0 }, uPhase: { value: phase }, uWind: { value: 1 }, uBright: { value: 1 },
          uHaze: { value: 0 }, uOp: { value: 0 }, uPower: { value: 0.5 }, uMirror: { value: d.mirror ? 1 : 0 }, uBias: { value: 0 },
          uRim: { value: new THREE.Vector3(...rim) }, uFlash: { value: new THREE.Vector3() }, uFog: { value: new THREE.Vector3(0.05, 0.09, 0.07) },
        },
      });
      const shadow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({ vertexShader: PLANE_VERT, fragmentShader: SHADOW_FRAG, ...premul, uniforms: { uOp: { value: 0 } } }));
      shadow.renderOrder = 9 + d.rank * 10; shadow.frustumCulled = false; shadow.visible = false;
      this.scene.add(shadow);
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
      mesh.renderOrder = 10 + d.rank * 10; mesh.frustumCulled = false; mesh.visible = false;
      this.scene.add(mesh);
      const fx = (d.fx ?? []).map((f, j) => {
        const fm = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.ShaderMaterial({
          vertexShader: PLANE_VERT, fragmentShader: FX_FRAG, ...additive,
          uniforms: { uTime: { value: 0 }, uType: { value: FX_TYPE[f.kind] }, uOp: { value: 0 }, uSeed: { value: i + j * 0.37 }, uC: { value: new THREE.Vector3(...f.color) }, uC2: { value: new THREE.Vector3(...(f.color2 ?? f.color)) } },
        }));
        fm.renderOrder = 11 + d.rank * 10; fm.frustumCulled = false; fm.visible = false;
        this.scene.add(fm);
        return { mesh: fm, def: f };
      });
      const m = meta[d.id];
      this.figs.set(d.key, { shadow, sx: 0, sy: 0, sh: 1, def: d, mesh, fx, aspect: m.w / m.h, phase });
    });
    this.resize();
  }

  resize() {
    const w = innerWidth, h = innerHeight;
    this.W = w; this.H = h;
    this.r.setSize(w, h, false);
    this.cam.left = 0; this.cam.right = w; this.cam.top = h; this.cam.bottom = 0; this.cam.updateProjectionMatrix();
    const px = this.r.getPixelRatio();
    this.bg.material.uniforms.uRes.value.set(w * px, h * px);
    // fog: back bank, middle bank, the low roll over the front feet
    const place = (m: THREE.Mesh, top: number, height: number) => { m.position.set(w / 2, h - (top + height / 2) * h, 0); m.scale.set(w * 1.2, height * h, 1); };
    place(this.fogs[0], 0.6, 0.24); place(this.fogs[1], 0.7, 0.22); place(this.fogs[2], 0.84, 0.2);
    this.fogs.forEach((f) => (f.material.uniforms.uAsp.value as THREE.Vector2).set((w * 1.2) / (f.scale.y || 1) * 0.35, 1));
    this.ash.material.uniforms.uW.value = w; this.ash.material.uniforms.uH.value = h;
  }

  /** Place a figure. Screen pixels, y down; `foot` is where the feet stand. */
  pose(key: string, p: Pose) {
    const f = this.figs.get(key);
    if (!f) return;
    const vis = p.op > 0.003;
    f.mesh.visible = vis; f.shadow.visible = vis;
    f.fx.forEach((x) => (x.mesh.visible = vis && p.power > 0.02));
    if (!vis) return;
    const w = p.h * f.aspect;
    f.mesh.position.set(p.x, this.H - (p.foot - p.h / 2), 0);
    f.mesh.scale.set(w, p.h, 1);
    f.shadow.position.set(p.x, this.H - p.foot + p.h * 0.03, 0);
    f.shadow.scale.set(w * 1.15, p.h * 0.09, 1);
    f.shadow.material.uniforms.uOp.value = p.op * (1 - p.haze) * 0.85;
    const u = f.mesh.material.uniforms;
    f.sx = p.x; f.sy = p.foot - p.h / 2; f.sh = p.h;
    u.uPar.value = (p.par ?? 0) * (f.def.mirror ? -1 : 1); u.uKey.value = p.key ?? 0.35;
    u.uBlur.value = p.blur ?? 0; u.uHit.value = p.hit ?? 0;
    u.uOp.value = p.op; u.uBright.value = p.bright; u.uHaze.value = p.haze; u.uPower.value = p.power; u.uBias.value = p.haze * 3;
    f.fx.forEach(({ mesh, def }) => {
      const fx = f.def.mirror ? 1 - def.x : def.x;
      mesh.position.set(p.x + (fx - 0.5) * w, this.H - (p.foot - p.h + def.y * p.h), 0);
      const s = def.size * p.h;
      mesh.scale.set(def.kind === "flames" ? s * 0.6 : s, s, 1);
      mesh.material.uniforms.uOp.value = p.op * p.power * (1 - p.haze * 0.6);
    });
  }

  /** A beam or a thrown thing from a to b (screen px, y down). head/len: the lit stretch, as fractions of the path. */
  beam(i: number, a: [number, number], b: [number, number], o: { w: number; color: [number, number, number]; op: number; head?: number; len?: number; jag?: boolean }) {
    const m = this.beams[i]; if (!m) return;
    m.visible = o.op > 0.003; if (!m.visible) return;
    const ax = a[0], ay = this.H - a[1], bx = b[0], by = this.H - b[1];
    const L = Math.hypot(bx - ax, by - ay);
    m.position.set((ax + bx) / 2, (ay + by) / 2, 0); m.rotation.z = Math.atan2(by - ay, bx - ax); m.scale.set(L + o.w, o.w * 3, 1);
    const u = m.material.uniforms;
    u.uOp.value = o.op; u.uHead.value = o.head ?? 1; u.uLen.value = o.len ?? 1; u.uKind.value = o.jag ? 1 : 0; (u.uC.value as THREE.Vector3).set(...o.color);
  }
  /** An impact: ph runs 0 → 1 over its life. */
  burst(i: number, x: number, y: number, size: number, color: [number, number, number], ph: number) {
    const m = this.bursts[i]; if (!m) return;
    m.visible = ph > 0 && ph < 1; if (!m.visible) return;
    m.position.set(x, this.H - y, 0); m.scale.set(size, size, 1);
    const u = m.material.uniforms; u.uPh.value = ph; u.uOp.value = 1; (u.uC.value as THREE.Vector3).set(...color);
  }
  clearAttacks() { this.beams.forEach((b) => (b.visible = false)); this.bursts.forEach((b) => (b.visible = false)); }

  render(t: number, s: { march: number; flash: number; clash: number; shake: number; wind: number }, c: Cam) {
    const b = this.bg.material.uniforms;
    b.uTime.value = t; b.uP.value = s.march; b.uFlash.value = s.flash; b.uClash.value = s.clash; b.uShake.value = s.shake; b.uPan.value = c.pan; b.uTilt.value = c.tilt;
    const flashCol = new THREE.Vector3(0.25, 0.85, 0.5).multiplyScalar(s.flash * 0.55);
    for (const f of this.figs.values()) {
      const u = f.mesh.material.uniforms;
      u.uTime.value = t; u.uWind.value = s.wind; (u.uFlash.value as THREE.Vector3).copy(flashCol);
      // light direction in the figure's own frame: from its centre toward the held light, a little in front
      const lx = (c.light[0] * this.W - f.sx) / f.sh, ly = (f.sy - c.light[1] * this.H) / f.sh;
      (u.uL.value as THREE.Vector3).set(lx * (f.def.mirror ? -1 : 1), ly, 0.55);
      u.uKey.value *= c.lightAmt;
      f.fx.forEach((x) => (x.mesh.material.uniforms.uTime.value = t));
    }
    this.fogs.forEach((f, i) => { f.material.uniforms.uOp.value = this.fogOp[i] * c.fog; f.material.uniforms.uTime.value = t; f.material.uniforms.uOff.value = c.pan * (2 + i * 2.5); });
    this.beams.forEach((b) => (b.material.uniforms.uTime.value = t));
    this.ash.material.uniforms.uTime.value = t; this.ash.material.uniforms.uWind.value = s.wind;
    // the camera: a push in about a chosen point
    const z = c.zoom, X = c.cx * this.W, Y = (1 - c.cy) * this.H;
    this.cam.left = X - X / z; this.cam.right = this.cam.left + this.W / z;
    this.cam.bottom = Y - Y / z; this.cam.top = this.cam.bottom + this.H / z;
    this.cam.updateProjectionMatrix();
    this.r.render(this.scene, this.cam);
  }

  dispose() {
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.geometry) m.geometry.dispose();
      const mat = m.material as THREE.ShaderMaterial | undefined;
      if (mat) { Object.values(mat.uniforms ?? {}).forEach((v) => (v.value as THREE.Texture)?.isTexture && (v.value as THREE.Texture).dispose()); mat.dispose(); }
    });
    this.r.dispose();
  }
}
