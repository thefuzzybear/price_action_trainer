'use client';

import { useEffect, useState } from 'react';

// A static set of candle shapes that stays the same across renders.
// Heights are in px — chosen to produce a visually realistic sequence.
const CANDLE_SHAPES = [
  { dir: 'up', wk1: 10, bd: 18, wk2: 7  },
  { dir: 'dn', wk1: 7,  bd: 24, wk2: 9  },
  { dir: 'up', wk1: 5,  bd: 12, wk2: 4  },
  { dir: 'up', wk1: 12, bd: 28, wk2: 8  },
  { dir: 'dn', wk1: 16, bd: 16, wk2: 11 },
  { dir: 'up', wk1: 6,  bd: 20, wk2: 5  },
  { dir: 'up', wk1: 9,  bd: 32, wk2: 8  },
  { dir: 'dn', wk1: 17, bd: 18, wk2: 13 },
  { dir: 'up', wk1: 5,  bd: 14, wk2: 4  },
  { dir: 'up', wk1: 8,  bd: 22, wk2: 6  },
  { dir: 'dn', wk1: 14, bd: 20, wk2: 10 },
  { dir: 'up', wk1: 6,  bd: 16, wk2: 5  }, // forming — animates in
  { dir: 'up', wk1: 7,  bd: 18, wk2: 6  }, // ghost — the unrevealed bar
] as const;

const SYMBOLS = ['NVDA · 1D', 'BTC · 1D', 'EUR/USD · 1D', 'AAPL · 1D', 'GLD · 1D', 'SPY · 1W'];

const VERDICTS = [
  { label: '▲  Bull call', bull: true  },
  { label: '▲  Bull call', bull: true  },
  { label: '▼  Bear call', bull: false },
  { label: '▲  Bull call', bull: true  },
] as const;

export default function AnimatedChart() {
  const [symIdx,     setSymIdx]     = useState(0);
  const [verdictIdx, setVerdictIdx] = useState(0);
  const [tick,       setTick]       = useState(0); // increments to re-trigger forming animation

  useEffect(() => {
    const symTimer     = setInterval(() => setSymIdx(i     => (i + 1) % SYMBOLS.length),  7_000);
    const verdictTimer = setInterval(() => setVerdictIdx(i => (i + 1) % VERDICTS.length), 5_500);
    const formTimer    = setInterval(() => setTick(t => t + 1),                            7_000);
    return () => { clearInterval(symTimer); clearInterval(verdictTimer); clearInterval(formTimer); };
  }, []);

  const verdict = VERDICTS[verdictIdx];

  return (
    <div className="w-full max-w-[480px] rounded-[10px] overflow-hidden border border-white/[0.08] bg-[#111114] shadow-[0_24px_48px_rgba(0,0,0,0.55),0_0_0_1px_rgba(255,255,255,0.03)]">

      {/* Title bar */}
      <div className="flex items-center gap-3 px-3 py-[9px] bg-[#18181c] border-b border-white/[0.08]">
        <div className="flex gap-[5px]" aria-hidden="true">
          <span className="w-[10px] h-[10px] rounded-full bg-[#ef4444]" />
          <span className="w-[10px] h-[10px] rounded-full bg-[#f59e0b]" />
          <span className="w-[10px] h-[10px] rounded-full bg-[#22c55e]" />
        </div>
        <span className="font-mono text-[11px] text-[#44444c] ml-2 transition-all duration-300">
          {SYMBOLS[symIdx]}
        </span>
        <span className="ml-auto font-mono text-[10px] font-semibold text-[#22c55e] border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.06)] rounded px-[7px] py-[1px]">
          TRAINER
        </span>
      </div>

      {/* OHLC strip */}
      <div className="flex items-center gap-4 px-3 py-[7px] border-b border-white/[0.08] font-mono text-[10px]" aria-hidden="true">
        {[['O','462.18'],['H','471.40'],['L','459.80'],['C','468.55']].map(([l, v]) => (
          <span key={l} className="flex gap-1">
            <span className="text-[#44444c]">{l}</span>
            <span className="text-[#22c55e] font-semibold">{v}</span>
          </span>
        ))}
        <span className="ml-auto text-[#44444c] text-[10px]">Bar 142 / 1258</span>
      </div>

      {/* Score + chart columns */}
      <div className="grid grid-cols-[88px_1fr]">

        {/* Score column */}
        <div className="border-r border-white/[0.08] px-[10px] py-[14px] flex flex-col gap-[11px]" aria-hidden="true">
          {[
            { label: 'Accuracy', value: '71%',    cls: 'text-[22px] text-[#22c55e]' },
            { label: 'Correct',  value: '22/31',  cls: 'text-[13px] text-[#8a8a94]' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="flex flex-col gap-[2px]">
              <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.07em] text-[#44444c]">{label}</span>
              <span className={`font-mono font-semibold ${cls}`}>{value}</span>
            </div>
          ))}
          <div className="h-px bg-white/[0.08]" />
          {[
            { label: 'Bull calls', value: '▲ 74%', cls: 'text-[#22c55e]' },
            { label: 'Bear calls', value: '▼ 64%', cls: 'text-[#ef4444]' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="flex flex-col gap-[2px]">
              <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.07em] text-[#44444c]">{label}</span>
              <span className={`font-mono text-[13px] font-semibold ${cls}`}>{value}</span>
            </div>
          ))}
          <div className="h-px bg-white/[0.08]" />
          <div className="flex flex-col gap-[2px]">
            <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.07em] text-[#44444c]">Streak</span>
            <span className="font-mono text-[13px] font-semibold text-[#f59e0b]">6 ✦</span>
          </div>
        </div>

        {/* Chart column */}
        <div className="relative min-h-[168px] flex flex-col" aria-hidden="true">
          {/* Price lines */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute left-0 right-0 flex justify-end items-center" style={{ top: '15%' }}>
              <span className="font-mono text-[8px] text-[#22c55e] mr-1">TP 475.00</span>
              <div className="absolute inset-x-0 border-t border-dashed border-[rgba(34,197,94,0.35)]" />
            </div>
            <div className="absolute left-0 right-0 flex justify-end items-center" style={{ top: '46%' }}>
              <span className="font-mono text-[8px] text-[#8a8a94] mr-1">Entry 462.18</span>
              <div className="absolute inset-x-0 border-t border-dashed border-[rgba(138,138,148,0.35)]" />
            </div>
            <div className="absolute left-0 right-0 flex justify-end items-center" style={{ top: '72%' }}>
              <span className="font-mono text-[8px] text-[#ef4444] mr-1">SL 455.00</span>
              <div className="absolute inset-x-0 border-t border-dashed border-[rgba(239,68,68,0.35)]" />
            </div>
          </div>

          {/* Candles */}
          <div className="flex-1 flex items-end gap-[3px] px-2 pb-2 pt-[10px]">
            {CANDLE_SHAPES.map((c, i) => {
              const isForming = i === CANDLE_SHAPES.length - 2;
              const isGhost   = i === CANDLE_SHAPES.length - 1;
              const isUp      = c.dir === 'up';
              const color     = isUp ? '#22c55e' : '#ef4444';

              return (
                <div
                  key={i}
                  className={`flex flex-col items-center flex-1 max-w-[14px] ${isGhost ? 'opacity-15 blur-[1px]' : ''}`}
                >
                  {/* Top wick */}
                  <div style={{ width: 1, height: c.wk1, background: color }} />
                  {/* Body */}
                  {isForming ? (
                    <div
                      key={`forming-${tick}`}
                      style={{
                        width: '100%',
                        maxWidth: 12,
                        borderRadius: 1,
                        background: color,
                        height: 2,
                        animation: `formCandle 2.2s ease-out forwards`,
                        // CSS custom property used by the keyframe
                        ['--target-h' as string]: `${c.bd}px`,
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        maxWidth: 12,
                        borderRadius: 1,
                        background: color,
                        height: c.bd,
                      }}
                    />
                  )}
                  {/* Bottom wick */}
                  <div style={{ width: 1, height: c.wk2, background: color }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 px-3 py-[7px] border-t border-white/[0.08]" aria-hidden="true">
        {[['→','reveal'],['B','bull'],['L','bear'],['E','trade']].map(([key, label]) => (
          <span key={key} className="flex items-center gap-1 text-[10px] text-[#44444c]">
            <kbd className="font-mono text-[9px] text-[#8a8a94] bg-[#18181c] border border-white/[0.08] border-b-[2px] rounded px-[5px] py-[1px]">
              {key}
            </kbd>
            {label}
          </span>
        ))}
        <span
          className={`ml-auto font-mono text-[10px] font-semibold transition-colors duration-300 ${
            verdict.bull ? 'text-[#22c55e]' : 'text-[#ef4444]'
          }`}
        >
          {verdict.label}
        </span>
      </div>

      {/* Keyframe for the forming candle animation */}
      <style>{`
        @keyframes formCandle {
          from { height: 2px; }
          to   { height: var(--target-h); }
        }
      `}</style>
    </div>
  );
}
