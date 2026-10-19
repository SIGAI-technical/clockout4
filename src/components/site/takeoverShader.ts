// The broadcast behind everything: dead-channel static that Doom's signal burns through, then his
// green leaded glass, lit from above, breathing with a slow pulse. Interference tears it sideways.
export const TAKEOVER_FRAG = `
uniform vec2 uRes;
uniform float uTime, uStatic, uGlass, uPulse, uTear, uStamp;

float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
vec2 h2(vec2 p){return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x),f.y);}

// leaded glass: voronoi cells; returns (distance to the lead, cell id)
vec2 glass(vec2 p){
  vec2 i=floor(p),f=fract(p); float d1=8.,d2=8.; float id=0.;
  for(int y=-1;y<=1;y++)for(int x=-1;x<=1;x++){
    vec2 g=vec2(x,y); vec2 o=h2(i+g); vec2 r=g+o-f; float d=dot(r,r);
    if(d<d1){d2=d1;d1=d;id=h1(i+g);}else if(d<d2){d2=d;}
  }
  return vec2(sqrt(d2)-sqrt(d1),id);
}

void main(){
  vec2 uv=vUv; float a=uRes.x/uRes.y;
  // interference: horizontal tearing bands
  float band=step(.6,n(vec2(uv.y*18.,floor(uTime*24.))))*uTear;
  uv.x+=(h1(vec2(floor(uv.y*60.),floor(uTime*30.)))-.5)*.08*band;

  // ── Doom's window ──
  vec2 q=(uv-vec2(.5,.62))*vec2(a,1.);
  float r=length(q), an=atan(q.y,q.x);
  // rose-window layout: concentric rings of cells, radial spokes
  vec2 gp=vec2(an*3.2/3.14159*4.,r*9.);
  vec2 g=glass(gp+vec2(0.,uTime*.0));
  float lead=smoothstep(.07,.02,g.x);
  vec3 tint=mix(vec3(.02,.16,.08),vec3(.1,.55,.28),g.y);
  tint=mix(tint,vec3(.35,.6,.18),step(.86,g.y));            // a few yellow-green panes
  tint=mix(tint,vec3(.05,.12,.16),step(.93,g.y)*.8);         // and some cold ones
  float light=exp(-r*1.6)*(.55+.45*uPulse)+.08;
  float flick=.85+.15*n(vec2(g.y*40.,uTime*.6));
  vec3 win=tint*light*flick*(1.-lead*.92);
  // the iron frame of the rose: rings and spokes
  float ring=smoothstep(.012,0.,abs(fract(r*3.)-.5)-.47)*step(r,1.2);
  float spoke=smoothstep(.02,0.,abs(sin(an*6.))*r-.0)*step(.06,r)*step(r,.98);
  win*=1.-clamp(ring+spoke*.8,0.,1.)*.85;
  win*=smoothstep(1.25,.75,r);                               // the window ends; dark stone beyond
  // shafts of light falling from the window
  float shaft=pow(max(0.,n(vec2(uv.x*a*7.+uv.y*1.5,uTime*.08))),3.)*smoothstep(.6,0.,uv.y)*.25;
  win+=vec3(.15,.55,.3)*shaft*uGlass;
  // dust in the shafts
  float dust=step(.995,h1(floor(uv*uRes/2.)+floor(uTime*3.)))*smoothstep(.7,.1,uv.y);
  win+=vec3(.4,.9,.6)*dust*.4*uGlass;
  vec3 col=win*uGlass;

  // the sigil's stamp: a burst of green light from the centre
  col+=vec3(.25,1.,.55)*exp(-length((uv-.5)*vec2(a,1.))*4.)*uStamp;

  // ── dead channel ──
  float s=h1(uv*uRes+fract(uTime*91.)*vec2(311.,97.));
  float roll=smoothstep(.0,.08,abs(fract(uv.y-uTime*.35)-.5));
  vec3 stat=vec3(s)*(.35+.25*roll);
  col=mix(col,stat,uStatic);

  // scanlines, grain, vignette
  col*=.92+.08*sin(uv.y*uRes.y*1.6);
  col+=(h1(vUv*uRes+fract(uTime)*71.)-.5)*.03;
  col*=smoothstep(1.3,.4,length((vUv-.5)*vec2(1.2,1.5)));
  // a torn band flares a little
  col+=vec3(.16,.18,.17)*band*.4;
  gl_FragColor=vec4(col,1.);
}`;
