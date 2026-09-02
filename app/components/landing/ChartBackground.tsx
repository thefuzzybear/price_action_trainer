'use client';

import { useEffect, useRef } from 'react';

// ── Price simulation ───────────────────────────────────────────────────────
type Regime = 'up' | 'down' | 'range';
interface Sim { price: number; vol: number; regime: Regime; ttl: number; bias: number }

function newRegime(): Pick<Sim, 'regime' | 'ttl' | 'bias'> {
  const r = Math.random();
  if (r < 0.38) return { regime: 'up',   ttl: 14 + (Math.random() * 22 | 0), bias:  0.008 };
  if (r < 0.72) return { regime: 'down', ttl: 12 + (Math.random() * 18 | 0), bias: -0.008 };
  return             { regime: 'range', ttl:  6 + (Math.random() * 14 | 0), bias:  0.0  };
}

function mkSim(p: number): Sim { return { price: p, vol: 0.014, ...newRegime() }; }

interface Bar { o: number; h: number; l: number; c: number }

function tick(s: Sim): [Bar, Sim] {
  const vm  = Math.random() < 0.045 ? 2.8 + Math.random() * 2.5 : 1;
  const v   = s.vol * vm;
  const o   = s.price;
  const c   = Math.max(o * 0.4, o + s.bias * o + (Math.random() - 0.5) * v * o * 2.4);
  const bod = Math.abs(c - o);
  const wk  = 0.3 + Math.random() * 1.0;
  const h   = Math.max(o, c) + bod * wk * (0.2 + Math.random() * 0.8);
  const l   = Math.min(o, c) - bod * wk * (0.2 + Math.random() * 0.8);
  let { ttl, regime, bias } = s;
  if (--ttl <= 0) ({ regime, ttl, bias } = newRegime());
  return [{ o, h, l, c }, { price: c, regime, ttl, bias, vol: s.vol * 0.93 + c * 0.014 * 0.07 }];
}

const BG   = '#F5F0E8';
const BULL = '#16a34a';
const BEAR = '#dc2626';
const BW   = 11;
const GAP  = 5;
const STEP = BW + GAP;
const TP   = 64;
const BP   = 64;
const SPD  = 0.45;

export default function ChartBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const rawCtx = cvs.getContext('2d');
    if (!rawCtx) return;

    // Non-null aliases — eliminates TS18047 inside nested closures
    const c: CanvasRenderingContext2D = rawCtx;
    const cv: HTMLCanvasElement       = cvs;

    const bars: Bar[] = [];
    let sim!: Sim;
    let W = 0, H = 0;
    let subPx = 0;
    let sLo = 0, sHi = 1;
    let raf = 0, alive = true, seeded = false;

    function py(p: number): number {
      const range = sHi - sLo;
      if (range === 0) return TP;
      return TP + (1 - (p - sLo) / range) * (H - TP - BP);
    }

    function computeScale(hard: boolean) {
      const vis = Math.ceil(W / STEP) + 4;
      const st  = Math.max(0, bars.length - vis);
      let lo = Infinity, hi = -Infinity;
      for (let i = st; i < bars.length; i++) {
        if (bars[i].l < lo) lo = bars[i].l;
        if (bars[i].h > hi) hi = bars[i].h;
      }
      if (!isFinite(lo) || !isFinite(hi)) return;
      const pad = (hi - lo) * 0.08;
      lo -= pad; hi += pad;
      if (hard) { sLo = lo; sHi = hi; }
      else { sLo += (lo - sLo) * 0.025; sHi += (hi - sHi) * 0.025; }
    }

    function resize() {
      const w = cv.offsetWidth  || window.innerWidth;
      const h = cv.offsetHeight || window.innerHeight;
      if (w === 0 || h === 0) return;
      W = cv.width  = w;
      H = cv.height = h;
      if (!seeded) {
        seeded = true;
        sim = mkSim(400 + Math.random() * 150);
        const need = Math.ceil(W / STEP) + 60;
        for (let i = 0; i < need; i++) {
          const [b, ns] = tick(sim); sim = ns; bars.push(b);
        }
        computeScale(true);
      } else {
        computeScale(true);
      }
    }

    function drawFrame() {
      c.fillStyle = BG;
      c.fillRect(0, 0, W, H);

      // Horizontal grid lines
      c.strokeStyle = 'rgba(100,55,25,0.07)';
      c.lineWidth   = 1;
      for (let i = 0; i <= 6; i++) {
        const y = TP + (i / 6) * (H - TP - BP);
        c.beginPath(); c.moveTo(0, y); c.lineTo(W, y); c.stroke();
      }

      // Vertical grid — scrolls with the candles
      c.strokeStyle = 'rgba(100,55,25,0.04)';
      const vp  = STEP * 5;
      const vof = ((subPx % vp) + vp) % vp;
      for (let x = W - vof; x >= -STEP; x -= vp) {
        c.beginPath(); c.moveTo(x, 0); c.lineTo(x, H); c.stroke();
      }

      // Candles — bars[n-1] newest (right), bars[0] oldest (left)
      const n = bars.length;
      for (let i = 0; i < n; i++) {
        const fromRight = n - 1 - i;           // 0 = newest bar
        const cx        = W - fromRight * STEP - subPx;

        if (cx + BW < 0 || cx - BW > W) continue;

        const b    = bars[i];
        const bull = b.c >= b.o;
        const col  = bull ? BULL : BEAR;

        const visCount = Math.ceil(W / STEP);
        c.globalAlpha  = Math.max(0.28, 1 - (fromRight / Math.max(1, visCount)) * 0.72);

        const yH    = py(b.h), yL = py(b.l);
        const yO    = py(b.o), yC = py(b.c);
        const yTop  = Math.min(yO, yC);
        const bodyH = Math.max(1.5, Math.abs(yC - yO));

        c.strokeStyle = col;
        c.lineWidth   = 1;
        c.beginPath(); c.moveTo(cx, yH); c.lineTo(cx, yL); c.stroke();

        c.fillStyle = col;
        c.fillRect(cx - BW / 2, yTop, BW, bodyH);
      }
      c.globalAlpha = 1;
    }

    function frame() {
      if (!alive) return;
      if (!seeded) { raf = requestAnimationFrame(frame); return; }

      subPx += SPD;
      if (subPx >= STEP) {
        subPx -= STEP;
        const [b, ns] = tick(sim); sim = ns;
        bars.push(b);
        const max = Math.ceil(W / STEP) + 80;
        if (bars.length > max) bars.splice(0, bars.length - max);
      }

      computeScale(false);
      drawFrame();
      raf = requestAnimationFrame(frame);
    }

    const ro = new ResizeObserver(resize);
    ro.observe(cv);
    resize();
    raf = requestAnimationFrame(frame);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      style={{
        position: 'fixed', top: 0, left: 0,
        width: '100vw', height: '100vh',
        display: 'block', zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
