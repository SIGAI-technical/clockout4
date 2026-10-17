// The battlefield, procedural: storm sky (Doom's green to the left, a cold break in the clouds to the
// right), scorched ground in perspective, a fog bank on the horizon, rising embers, lightning, and the
// light that gathers in the centre as the armies close.
export const BATTLE_FRAG = `
uniform vec2 uRes;
uniform float uTime, uP, uFlash, uClash, uShake, uPan, uTilt;

float h1(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);
  return mix(mix(h1(i),h1(i+vec2(1,0)),f.x),mix(h1(i+vec2(0,1)),h1(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<5;i++){s+=a*n(p);p=p*2.03+vec2(1.7,9.2);a*=.5;}return s;}

void main(){
  vec2 uv=vUv;
  float a=uRes.x/uRes.y;
  uv+=vec2(h1(vec2(uTime,1.))-.5,h1(vec2(uTime,2.))-.5)*.006*uShake;
  uv.x+=uPan;                                    // which side of the field the camera faces
  float hz=.4+uTilt;                             // horizon (lower = looking up)
  float side=smoothstep(.15,.85,uv.x);           // 0 = Doom, 1 = heroes
  vec3 col;

  if(uv.y>hz){
    // ── sky ──
    float y=(uv.y-hz)/(1.-hz);
    vec2 q=vec2(uv.x*a*1.4,y*1.6);
    float c=fbm(q*1.3+vec2(uTime*.018,0.));
    float c2=fbm(q*3.1-vec2(uTime*.03,uTime*.01));
    float cloud=smoothstep(.35,.85,c*.7+c2*.45);
    vec3 doomSky=mix(vec3(.01,.025,.018),vec3(.03,.09,.055),cloud);
    vec3 heroSky=mix(vec3(.015,.022,.03),vec3(.11,.13,.15),cloud);
    col=mix(doomSky,heroSky,side);
    // the break in the clouds over the heroes
    float brk=smoothstep(.55,0.,length((uv-vec2(.82,.78))*vec2(a*.6,1.)))*(1.-cloud*.7);
    col+=vec3(.22,.26,.3)*brk*.55;
    // lightning inside the clouds on Doom's side
    float lx=.18+.1*sin(floor(uTime*.7)*12.9);
    float bolt=smoothstep(.45,0.,length((uv-vec2(lx,.82))*vec2(a*.5,1.)));
    col+=vec3(.25,1.,.55)*bolt*cloud*uFlash*(1.-side)*1.4;
    col+=vec3(.05,.22,.12)*uFlash*(1.-side)*.5;
    // haze toward the horizon
    col=mix(col,mix(vec3(.03,.08,.05),vec3(.09,.1,.11),side),smoothstep(.35,0.,y)*.8);
  } else {
    // ── ground in perspective ──
    float d=(hz-uv.y)/hz;                         // 0 at horizon, 1 at bottom
    float z=.06/(d+.02);                          // depth
    vec2 g=vec2((uv.x-.5)*a*z*6.,z*8.+uP*14.);    // the ground slides toward us as the armies march
    float dirt=fbm(g*.9);
    float crack=smoothstep(.04,0.,abs(fbm(g*1.7+3.)-.5));
    col=mix(vec3(.012,.014,.012),vec3(.05,.05,.045),dirt)*(.35+.65*d);
    col+=vec3(1.,.35,.08)*crack*.12*smoothstep(.2,.9,d)*(.6+.4*sin(uTime*2.+g.x));   // embers in the cracks
    col=mix(col,col*vec3(.75,1.15,.9),1.-side);
    // light from the sky reflected on the plain
    col+=mix(vec3(.02,.07,.04),vec3(.05,.06,.07),side)*smoothstep(.5,0.,d);
    col+=vec3(.15,.5,.3)*uFlash*(1.-side)*smoothstep(.4,0.,d)*.4;
  }

  // fog bank on the horizon
  float fog=exp(-abs(uv.y-hz-.02)*9.)*(.55+.45*fbm(vec2(uv.x*a*2.-uTime*.04,uTime*.02)));
  col+=mix(vec3(.04,.12,.07),vec3(.1,.11,.12),side)*fog*.7;

  // rising embers
  vec2 eg=vec2(uv.x*a*26.,uv.y*18.-uTime*.9);
  vec2 ci=floor(eg); vec2 cf=fract(eg)-.5;
  float r=h1(ci);
  float ember=smoothstep(.08,0.,length(cf-vec2(sin(uTime+r*20.)*.25,0.)))*step(.965,r);
  col+=vec3(1.,.45,.12)*ember*(.5+.5*sin(uTime*3.+r*40.))*.8;

  // the light that gathers between the armies
  float mid=exp(-pow((uv.x-.5)*a*2.2,2.)*(3.-2.*uClash))*exp(-pow((uv.y-hz-.08)*3.,2.));
  col+=mix(vec3(.2,.9,.5),vec3(.85,1.,.95),uClash)*mid*(.05+uClash*.9)*smoothstep(.2,1.,uP+uClash);

  // vignette and grain
  col*=smoothstep(1.25,.35,length((vUv-.5)*vec2(1.1,1.4)));
  col+=(h1(vUv*uRes+fract(uTime)*71.)-.5)*.025;
  gl_FragColor=vec4(col,1.);
}`;
