"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";

export type BoltHandle = { set: (a: [number, number], b: [number, number], power: number) => void };

/** Lightning between two points (normalised to the canvas). Two colours meet in the middle:
 *  Doom's green from the left, Thor's blue from the right. Strobes at ~16fps like real arcs. */
const Bolt = forwardRef<BoltHandle>(function Bolt(_, ref) {
  const cv = useRef<HTMLCanvasElement>(null);
  const st = useRef({ a: [0.4, 0.5] as [number, number], b: [0.6, 0.5] as [number, number], p: 0 });
  useImperativeHandle(ref, () => ({ set(a, b, p) { st.current = { a, b, p }; } }), []);

  useEffect(() => {
    const c = cv.current!;
    const g = c.getContext("2d")!;
    let raf = 0, last = 0;
    const path = (pts: [number, number][], x0: number, y0: number, x1: number, y1: number, d: number, j: number) => {
      if (d === 0) { pts.push([x1, y1]); return; }
      const L = Math.hypot(x1 - x0, y1 - y0) * j;
      const mx = (x0 + x1) / 2 + (Math.random() - 0.5) * L * 0.4, my = (y0 + y1) / 2 + (Math.random() - 0.5) * L;
      path(pts, x0, y0, mx, my, d - 1, j); path(pts, mx, my, x1, y1, d - 1, j);
    };
    const stroke = (pts: [number, number][], color: string, glow: string, w: number, dpr: number) => {
      g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
      for (const p of pts) g.lineTo(p[0], p[1]);
      g.lineCap = "round"; g.lineJoin = "round";
      g.strokeStyle = glow; g.lineWidth = w * 5 * dpr; g.shadowColor = color; g.shadowBlur = 24 * dpr; g.stroke();
      g.strokeStyle = "rgba(245,255,250,.95)"; g.lineWidth = w * dpr; g.shadowBlur = 0; g.stroke();
    };
    const draw = (t: number) => {
      raf = requestAnimationFrame(draw);
      if (t - last < 60) return;
      last = t;
      const dpr = Math.min(devicePixelRatio, 2);
      const W = c.clientWidth * dpr, H = c.clientHeight * dpr;
      if (c.width !== W || c.height !== H) { c.width = W; c.height = H; }
      g.clearRect(0, 0, W, H);
      const { a, b, p } = st.current;
      if (p <= 0.01 || Math.random() < 0.25 * (1 - p)) return;
      const ax = a[0] * W, ay = a[1] * H, bx = b[0] * W, by = b[1] * H;
      // each side reaches toward the middle; at full power they meet
      const reach = Math.min(1, p * 1.15);
      const mx = (ax + bx) / 2, my = (ay + by) / 2;
      const n = 1 + Math.floor(Math.random() * 2 + p * 2);
      for (let i = 0; i < n; i++) {
        const ex = ax + (mx - ax) * reach + (Math.random() - 0.5) * 30 * dpr, ey = ay + (my - ay) * reach + (Math.random() - 0.5) * 60 * dpr * (1 - p);
        const pa: [number, number][] = [[ax, ay]]; path(pa, ax, ay, ex, ey, 6, 0.5);
        stroke(pa, "#46e08f", "rgba(70,224,143,.35)", 1.4 + p, dpr);
        const fx = bx + (mx - bx) * reach + (Math.random() - 0.5) * 30 * dpr, fy = by + (my - by) * reach + (Math.random() - 0.5) * 60 * dpr * (1 - p);
        const pb: [number, number][] = [[bx, by]]; path(pb, bx, by, fx, fy, 6, 0.5);
        stroke(pb, "#8fd0ff", "rgba(130,200,255,.35)", 1.4 + p, dpr);
      }
      if (p > 0.85) {
        const r = W * 0.06 * p;
        const glow = g.createRadialGradient(mx, my, 0, mx, my, r);
        glow.addColorStop(0, "rgba(255,255,255,.9)"); glow.addColorStop(1, "rgba(200,255,230,0)");
        g.fillStyle = glow; g.fillRect(mx - r, my - r, r * 2, r * 2);
      }
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return <canvas ref={cv} className="bolt" aria-hidden="true" />;
});

export default Bolt;
