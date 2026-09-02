'use client';

import { useEffect, useState } from 'react';

const BULL = '#22c55e';
const BEAR = '#ef4444';
const BG   = '#0D0B09';
const SURF = '#111118';
const MONO = '"SF Mono","Fira Code",Consolas,monospace';

const CANDLES = [
  { dir:'up', wk1:8,  bd:16, wk2:6  },
  { dir:'dn', wk1:6,  bd:22, wk2:8  },
  { dir:'up', wk1:4,  bd:10, wk2:3  },
  { dir:'up', wk1:10, bd:26, wk2:7  },
  { dir:'dn', wk1:14, bd:14, wk2:10 },
  { dir:'up', wk1:5,  bd:18, wk2:4  },
  { dir:'up', wk1:8,  bd:30, wk2:7  },
  { dir:'dn', wk1:15, bd:16, wk2:11 },
  { dir:'up', wk1:4,  bd:12, wk2:4  },
  { dir:'up', wk1:7,  bd:20, wk2:5  },
  { dir:'dn', wk1:12, bd:18, wk2:9  },
  { dir:'up', wk1:5,  bd:14, wk2:4  }, // forming
  { dir:'up', wk1:6,  bd:16, wk2:5  }, // ghost
] as const;

const SYMS = ['NVDA  1D', 'BTC  1D', 'EUR/USD  1D', 'AAPL  1D', 'GLD  1D', 'SPY  1W'];

export default function AnimatedChart() {
  const [symIdx, setSymIdx]   = useState(0);
  const [verdict, setVerdict] = useState<'bull' | 'bear'>('bull');
  const [tick, setTick]       = useState(0);

  useEffect(() => {
    const s = setInterval(() => setSymIdx(i => (i + 1) % SYMS.length), 7_000);
    const v = setInterval(() => setVerdict(d => d === 'bull' ? 'bear' : 'bull'), 4_500);
    const f = setInterval(() => setTick(t => t + 1), 7_000);
    return () => { clearInterval(s); clearInterval(v); clearInterval(f); };
  }, []);

  const border = 'rgba(255,255,255,0.07)';

  return (
    <div style={{
      width: '100%', maxWidth: 480,
      background: SURF, borderRadius: 8, overflow: 'hidden',
      border: `1px solid ${border}`,
      boxShadow: '0 40px 80px rgba(0,0,0,0.7)',
    }}>
      {/* Header strip */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px',
        background: 'rgba(255,255,255,0.03)',
        borderBottom: `1px solid ${border}`,
        fontFamily: MONO, fontSize: 10,
      }}>
        <span style={{ color: 'rgba(255,255,255,0.25)' }}>{SYMS[symIdx]}</span>
        <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.15)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          price action trainer
        </span>
      </div>

      {/* OHLC row */}
      <div style={{
        display: 'flex', gap: 16, padding: '6px 12px',
        borderBottom: `1px solid ${border}`,
        fontFamily: MONO, fontSize: 10,
      }}>
        {[['O','462.18'],['H','471.40'],['L','459.80'],['C','468.55']].map(([l, v]) => (
          <span key={l} style={{ display: 'flex', gap: 4 }}>
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>{l}</span>
            <span style={{ color: BULL, fontWeight: 600 }}>{v}</span>
          </span>
        ))}
        <span style={{ marginLeft: 'auto', color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>142 / 1258</span>
      </div>

      {/* Score + chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr' }}>

        {/* Score sidebar */}
        <div style={{
          padding: '14px 10px',
          borderRight: `1px solid ${border}`,
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          {[
            { label: 'ACC',  val: '71%',   big: true, color: BULL },
            { label: 'HIT',  val: '22/31', big: false, color: 'rgba(255,255,255,0.45)' },
          ].map(({ label, val, big, color }) => (
            <div key={label}>
              <div style={{ fontFamily: MONO, fontSize: 8, color: 'rgba(255,255,255,0.2)',
                            textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 2 }}>
                {label}
              </div>
              <div style={{ fontFamily: MONO, fontWeight: 700, fontSize: big ? 20 : 12, color }}>
                {val}
              </div>
            </div>
          ))}
          <div style={{ height: 1, background: border }} />
          {[
            { label: '▲', val: '74%', color: BULL },
            { label: '▼', val: '64%', color: BEAR },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color }}>
              {label} {val}
            </div>
          ))}
          <div style={{ height: 1, background: border }} />
          <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 600, color: '#C8941A' }}>
            6 ✦
          </div>
        </div>

        {/* Chart area */}
        <div style={{ position: 'relative', minHeight: 180, display: 'flex', flexDirection: 'column' }}>
          {/* Price lines */}
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {[
              { label: 'TP   475.00', top: '14%', color: BULL,   dash: 'rgba(34,197,94,0.3)' },
              { label: 'ENT  462.18', top: '45%', color: 'rgba(255,255,255,0.3)', dash: 'rgba(255,255,255,0.15)' },
              { label: 'SL   455.00', top: '71%', color: BEAR,   dash: 'rgba(239,68,68,0.3)' },
            ].map(({ label, top, color, dash }) => (
              <div key={label} style={{
                position: 'absolute', left: 0, right: 0, top,
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              }}>
                <div style={{
                  position: 'absolute', left: 0, right: 0,
                  borderTop: `1px dashed ${dash}`,
                }} />
                <span style={{
                  fontFamily: MONO, fontSize: 8, color,
                  marginRight: 4, position: 'relative', zIndex: 1,
                  background: SURF, paddingLeft: 2,
                }}>
                  {label}
                </span>
              </div>
            ))}
          </div>

          {/* Candles */}
          <div style={{
            flex: 1, display: 'flex', alignItems: 'flex-end',
            gap: 3, padding: '10px 8px 8px',
          }}>
            {CANDLES.map((c, i) => {
              const forming = i === CANDLES.length - 2;
              const ghost   = i === CANDLES.length - 1;
              const col     = c.dir === 'up' ? BULL : BEAR;
              return (
                <div key={i} style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  flex: 1, maxWidth: 14,
                  opacity: ghost ? 0.12 : 1,
                  filter: ghost ? 'blur(1px)' : 'none',
                }}>
                  <div style={{ width: 1, height: c.wk1, background: col }} />
                  {forming
                    ? <div key={`f${tick}`} style={{
                        width: '100%', maxWidth: 12, borderRadius: 1,
                        background: col, height: 2,
                        animation: `candleForm 2s ease-out forwards`,
                        ['--ch' as string]: `${c.bd}px`,
                      }} />
                    : <div style={{ width: '100%', maxWidth: 12, borderRadius: 1, background: col, height: c.bd }} />
                  }
                  <div style={{ width: 1, height: c.wk2, background: col }} />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '7px 12px',
        borderTop: `1px solid ${border}`,
      }}>
        {[['→','reveal'],['B','bull'],['L','bear'],['E','trade']].map(([k, l]) => (
          <span key={k} style={{ display: 'flex', alignItems: 'center', gap: 4,
                                  fontFamily: MONO, fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
            <kbd style={{
              fontFamily: MONO, fontSize: 9,
              color: 'rgba(255,255,255,0.35)',
              background: BG, border: '1px solid rgba(255,255,255,0.1)',
              borderBottomWidth: 2, borderRadius: 3, padding: '1px 5px',
            }}>
              {k}
            </kbd>
            {l}
          </span>
        ))}
        <span style={{
          marginLeft: 'auto', fontFamily: MONO, fontSize: 10, fontWeight: 600,
          color: verdict === 'bull' ? BULL : BEAR,
        }}>
          {verdict === 'bull' ? '▲  Bull call' : '▼  Bear call'}
        </span>
      </div>

      <style>{`@keyframes candleForm { from{height:2px} to{height:var(--ch)} }`}</style>
    </div>
  );
}
