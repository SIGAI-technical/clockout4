// Minimal fullscreen-quad WebGL runner shared by the castle lens and the stained-glass end card.
export type Uniforms = Record<string, number | number[]>;

const VERT = `attribute vec2 p;varying vec2 vUv;void main(){vUv=p*.5+.5;gl_Position=vec4(p,0.,1.);}`;

export interface Quad {
  gl: WebGLRenderingContext;
  render: (u: Uniforms) => void;
  resize: () => void;
  bindTexture: (name: string, unit: number, src?: TexImageSource) => void;
  destroy: () => void;
}

export function createQuad(canvas: HTMLCanvasElement, frag: string, maxDpr = 1.5): Quad | null {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, premultipliedAlpha: false, powerPreference: "high-performance" });
  if (!gl) return null;
  const sh = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, "precision highp float;varying vec2 vUv;" + frag));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "p");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const locs = new Map<string, WebGLUniformLocation | null>();
  const uni = (n: string) => {
    if (!locs.has(n)) locs.set(n, gl.getUniformLocation(prog, n));
    return locs.get(n)!;
  };
  const textures = new Map<string, WebGLTexture>();

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    gl.viewport(0, 0, w, h);
  };

  return {
    gl,
    resize,
    bindTexture(name, unit, src) {
      let t = textures.get(name);
      if (!t) {
        t = gl.createTexture()!;
        textures.set(name, t);
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([3, 5, 4]));
      }
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, t);
      if (src) {
        try {
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, src);
        } catch {
          /* frame not ready */
        }
      }
      gl.uniform1i(uni(name), unit);
    },
    render(u) {
      for (const k in u) {
        const v = u[k];
        const l = uni(k);
        if (l === null) continue;
        if (typeof v === "number") gl.uniform1f(l, v);
        else if (v.length === 2) gl.uniform2fv(l, v);
        else if (v.length === 3) gl.uniform3fv(l, v);
        else gl.uniform4fv(l, v);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    },
    destroy() {
      textures.forEach((t) => gl.deleteTexture(t));
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    },
  };
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** 0→1 as x moves from a to b, smoothstepped. */
export const span = (x: number, a: number, b: number) => {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
};
