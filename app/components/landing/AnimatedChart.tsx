'use client';

import { useEffect, useState } from 'react';

// Empyrean colour tokens — kept in sync with page.tsx
const E = {
  surface: '#13100D',   // chart window background
  raised:  '#1C1713',   // titlebar / sidebar
  border:  'rgba(107,26,42,0.25)',  // maroon-tinted border
  muted:   '#9E8E7A',
  faint:   '#5A4F43',
  bull:    '#22c55e',
  bear:    '#ef4444',
} as const;

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
  { dir: 'up', wk1: 6,  bd: 16, wk2: 5  }, // forming
  { dir: 'up', wk1: 7,  bd: 18, wk2: 6  }, // ghost
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
  const [tick,       setTick]       = useState(0);

  useEffect(() => {
    const s = setInterval(() => setSymIdx(i     => (i + 1) % SYMBOLS.length),  7_000);
    const v = setInterval(() => setVerdictIdx(i => (i + 1) % VERDICTS.length), 5_500);
    const f = setInterval(() => setTick(t => t + 1),                            7_000);
    return () => { clearInterval(s); clearInterval(v); clearInterval(f); };
  }, []);

  const verdict = VERDICTS[verdictIdx];

  return (
    <div
      className="w-full max-w-[480px] rounded-[8px] overflow-hidden"
      style={{
        background: E.surface,
        border: `1px solid ${E.border}`,
        boxShadow: '0 32px 64px rgba(0,0,0,0.65), 0 0 0 1px rgba(245,240,232,0.03)',
      }}
    >
      {/* Titlebar */}
      <div
        className="flex items-center gap-3 px-3 py-[9px]"
        style={{ background: E.raised, borderBottom: `1px solid ${E.border}` }}
      >
        {/* Omega mark in maroon instead of OS traffic lights */}
        <span
          className="text-[13px] font-bold leading-none select-none"
          style={{ color: '#6B1A2A', fontFamily: 'Georgia, "Times New Roman", serif' }}
          aria-hidden="true"
        >
          Ω
        </span>
        <span
          className="font-mono text-[10px] tracking-widest uppercase ml-1"
          style={{ color: E.faint, letterSpacing: '0.12em' }}
        >
          EMPYREAN
        </span>
        <span className="font-mono text-[10px] ml-1 transition-all duration-300" style={{ color: E.muted }}>
          · {SYMBOLS[symIdx]}
        </span>
        <span
          className="ml-auto font-mono text-[9px] font-semibold uppercase tracking-widest px-2 py-[2px] rounded-[3px]"
          style={{
            color: '#6B1A2A',
            border: '1px solid rgba(107,26,42,0.4)',
            background: 'rgba(107,26,42,0.08)',
          }}
        >
          TRAINER
        </span>
      </div>

      {/* OHLC strip */}
      <div
        className="flex items-center gap-4 px-3 py-[7px] font-mono text-[10px]"
        style={{ borderBottom: `1px solid ${E.border}` }}
        aria-hidden="true"
      >
        {[['O','462.18'],['H','471.40'],['L','459.80'],['C','468.55']].map(([l, v]) => (
          <span key={l} className="flex gap-1">
            <span style={{ color: E.faint }}>{l}</span>
            <span style={{ color: E.bull, fontWeight: 600 }}>{v}</span>
          </span>
        ))}
        <span className="ml-auto text-[10px]" style={{ color: E.faint }}>Bar 142 / 1258</span>
      </div>

      {/* Score + chart */}
      <div className="grid grid-cols-[88px_1fr]">

        {/* Score column */}
        <div
          className="px-[10px] py-[14px] flex flex-col gap-[11px]"
          style={{ borderRight: `1px solid ${E.border}` }}
          aria-hidden="true"
        >
          {[
            { label: 'Accuracy', value: '71%',   big: true  },
            { label: 'Correct',  value: '22/31', big: false },
          ].map(({ label, value, big }) => (
            <div key={label} className="flex flex-col gap-[2px]">
              <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.07em]" style={{ color: E.faint }}>{label}</span>
              <span
                className="font-mono font-semibold"
                style={{ fontSize: big ? 22 : 13, color: big ? E.bull : E.muted }}
              >
                {value}
              </span>
            </div>
          ))}

          <div className="h-px" style={{ background: E.border }} />

          {[
            { label: 'Bull calls', value: '▲ 74%', color: E.bull },
            { label: 'Bear calls', value: '▼ 64%', color: E.bear },
          ].map(({ label, value, color }) => (
            <div key={label} className="flex flex-col gap-[2px]">
              <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.07em]" style={{ color: E.faint }}>{label}</span>
              <span className="font-mono text-[13px] font-semibold" style={{ color }}>{value}</span>
            </div>
          ))}

          <div className="h-px" style={{ background: E.border }} />

          <div className="flex flex-col gap-[2px]">
            <span className="font-mono text-[8px] font-semibold uppercase tracking-[0.07em]" style={{ color: E.faint }}>Streak</span>
            <span className="font-mono text-[13px] font-semibold" style={{ color: '#C8941A' }}>6 ✦</span>
          </div>
        </div>

        {/* Chart column */}
        <div className="relative min-h-[168px] flex flex-col" aria-hidden="true">
          {/* Price lines */}
          <div className="absolute inset-0 pointer-events-none">
            {[
              { label: 'TP 475.00',    top: '15%', color: E.bull,  borderColor: 'rgba(34,197,94,0.3)'  },
              { label: 'Entry 462.18', top: '46%', color: E.muted, borderColor: 'rgba(158,142,122,0.3)' },
              { label: 'SL 455.00',   top: '72%', color: E.bear,  borderColor: 'rgba(239,68,68,0.3)'  },
            ].map(({ label, top, color, borderColor }) => (
              <div key={label} className="absolute left-0 right-0 flex justify-end items-center" style={{ top }}>
                <span className="font-mono text-[8px] mr-1" style={{ color }}>{label}</span>
                <div className="absolute inset-x-0 border-t border-dashed" style={{ borderColor }} />
              </div>
            ))}
          </div>

          {/* Candles */}
          <div className="flex-1 flex items-end gap-[3px] px-2 pb-2 pt-[10px]">
            {CANDLE_SHAPES.map((c, i) => {
              const isForming = i === CANDLE_SHAPES.length - 2;
              const isGhost   = i === CANDLE_SHAPES.length - 1;
              const color     = c.dir === 'up' ? E.bull : E.bear;
              return (
                <div
                  key={i}
                  className="flex flex-col items-center flex-1 max-w-[14px]"
                  style={isGhost ? { opacity: 0.15, filter: 'blur(1px)' } : {}}
                >
                  <div style={{ width: 1, height: c.wk1, background: color }} />
                  {isForming ? (
                    <div
                      key={`f-${tick}`}
                      style={{
                        width: '100%', maxWidth: 12, borderRadius: 1,
                        background: color, height: 2,
                        animation: 'empFormCandle 2.2s ease-out forwards',
                        ['--th' as string]: `${c.bd}px`,
                      }}
                    />
                  ) : (
                    <div style={{ width: '100%', maxWidth: 12, borderRadius: 1, background: color, height: c.bd }} />
                  )}
                  <div style={{ width: 1, height: c.wk2, background: color }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center gap-3 px-3 py-[7px]"
        style={{ borderTop: `1px solid ${E.border}` }}
        aria-hidden="true"
      >
        {[['→','reveal'],['B','bull'],['L','bear'],['E','trade']].map(([key, label]) => (
          <span key={key} className="flex items-center gap-1 text-[10px]" style={{ color: E.faint }}>
            <kbd
              className="font-mono text-[9px] rounded px-[5px] py-[1px]"
              style={{ color: E.muted, background: E.raised, border: `1px solid ${E.border}`, borderBottomWidth: 2 }}
            >
              {key}
            </kbd>
            {label}
          </span>
        ))}
        <span
          className="ml-auto font-mono text-[10px] font-semibold transition-colors duration-300"
          style={{ color: verdict.bull ? E.bull : E.bear }}
        >
          {verdict.label}
        </span>
      </div>

      <style>{`
        @keyframes empFormCandle {
          from { height: 2px; }
          to   { height: var(--th); }
        }
      `}</style>
    </div>
  );
}
