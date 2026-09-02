'use client';

import { useEffect, useRef } from 'react';

function nextBar(prevClose: number, volatility: number) {
  const move  = (Math.random() - 0.48) * volatility;
  const open  = prevClose;
  const close = Math.max(10, open + move);
  const range = Math.abs(move) * (0.4 + Math.random() * 1.2);
  const high  = Math.max(open, close) + Math.random() * range;
  const low   = Math.min(open, close) - Math.random() * range;
  return { open, high, low, close };
}

const BULL = '#22c55e';
const BEAR = '#ef4444';
const BG   = '#0D0B09';

export default function ChartBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rawCtx = canvas.getContext('2d');
    if (!rawCtx) return;

    // Capture as non-null to avoid TS18047 inside nested functions
    const cvs = canvas as HTMLCanvasElement;
    const ctx  = rawCtx as CanvasRenderingContext2D;

    const BAR_W       = 14;
    const BAR_GAP     = 6;
    const STEP        = BAR_W + BAR_GAP;
    const TOP_PAD     = 60;
    const BOT_PAD     = 60;
    const SCROLL_SPD  = 0.4;  // px per frame

    let W = 0, H = 0;
    const bars: ReturnType<typeof nextBar>[] = [];
    let animId  = 0;
    let subPx   = 0;
    let running = true;

    function priceToY(price: number, lo: number, hi: number): number {
      const range = hi - lo || 1;
      return TOP_PAD + (1 - (price - lo) / range) * (H - TOP_PAD - BOT_PAD);
    }

    function seed() {
      W = cvs.width  = cvs.offsetWidth;
      H = cvs.height = cvs.offsetHeight;
      const needed = Math.ceil(W / STEP) + 40;
      bars.length = 0;
      let price = 380 + Math.random() * 120;
      for (let i = 0; i < needed; i++) {
        const b = nextBar(price, price * 0.018);
        price = b.close;
        bars.push(b);
      }
    }

    function drawGrid(lo: number, hi: number) {
      ctx.strokeStyle = 'rgba(255,255,255,0.035)';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        const price = lo + (hi - lo) * (i / 5);
        const y = priceToY(price, lo, hi);
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y);
        ctx.stroke();
      }
    }

    function drawVGrid(offsetX: number) {
      ctx.strokeStyle = 'rgba(255,255,255,0.02)';
      ctx.lineWidth = 1;
      const period = STEP * 5;
      const start  = ((offsetX % period) + period) % period;
      for (let x = W - start; x > -STEP; x -= period) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, H);
        ctx.stroke();
      }
    }

    function draw(offsetX: number) {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = BG;
      ctx.fillRect(0, 0, W, H);

      const startIdx = Math.max(0, Math.floor(offsetX / STEP) - 1);
      const endIdx   = Math.min(bars.length - 1, startIdx + Math.ceil(W / STEP) + 4);

      let lo = Infinity, hi = -Infinity;
      for (let i = startIdx; i <= endIdx; i++) {
        if (bars[i].low  < lo) lo = bars[i].low;
        if (bars[i].high > hi) hi = bars[i].high;
      }
      const pad = (hi - lo) * 0.1;
      lo -= pad; hi += pad;

      drawGrid(lo, hi);
      drawVGrid(offsetX);

      const total = endIdx - startIdx + 1;

      for (let i = startIdx; i <= endIdx; i++) {
        const b   = bars[i];
        const rel = i - startIdx;           // 0 = leftmost visible bar
        // x coordinate: bars scroll right-to-left, newest bar is on the right
        const cx  = W - rel * STEP + (offsetX % STEP) - STEP * 0.5;

        const yO  = priceToY(b.open,  lo, hi);
        const yC  = priceToY(b.close, lo, hi);
        const yH  = priceToY(b.high,  lo, hi);
        const yL  = priceToY(b.low,   lo, hi);
        const col = b.close >= b.open ? BULL : BEAR;

        // Older bars are slightly more transparent
        const progress = rel / Math.max(1, total - 1);
        ctx.globalAlpha = 0.35 + 0.55 * progress;

        // Wick
        ctx.strokeStyle = col;
        ctx.lineWidth   = 1;
        ctx.beginPath();
        ctx.moveTo(cx, yH);
        ctx.lineTo(cx, yL);
        ctx.stroke();

        // Body
        const top  = Math.min(yO, yC);
        const bodyH = Math.max(2, Math.abs(yC - yO));
        ctx.fillStyle = col;
        ctx.fillRect(cx - BAR_W / 2, top, BAR_W, bodyH);
      }
      ctx.globalAlpha = 1;
    }

    function frame() {
      if (!running) return;

      subPx += SCROLL_SPD;
      if (subPx >= STEP) {
        subPx -= STEP;
        const last = bars[bars.length - 1];
        bars.push(nextBar(last.close, last.close * 0.018));
        const maxBars = Math.ceil(W / STEP) + 60;
        if (bars.length > maxBars) bars.splice(0, bars.length - maxBars);
      }

      draw(subPx);
      animId = requestAnimationFrame(frame);
    }

    const ro = new ResizeObserver(() => { seed(); });
    ro.observe(cvs);
    seed();
    animId = requestAnimationFrame(frame);

    return () => {
      running = false;
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100%',
        height: '100%',
        display: 'block',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
}
