import type { Metadata } from 'next';
import type React from 'react';
import ChartBackground from './components/landing/ChartBackgroundLoader';

export const metadata: Metadata = {
  title: 'Empyrean — Price Action Trainer',
  description:
    'Commit a directional call before each bar reveals. 200 forced decisions per session. Build the pattern recognition that passive watching never could.',
  openGraph: {
    title: 'Empyrean Price Action Trainer',
    description: 'Commit before the reveal. 200 decisions per session.',
    url: 'https://price-action-trainer.vercel.app',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
  alternates: { canonical: 'https://price-action-trainer.vercel.app/' },
};

// ─── Tokens ────────────────────────────────────────────────────────────────
const C = {
  bg:      '#0D0B09',
  text:    '#F2EDE6',
  muted:   '#9A8F84',
  faint:   '#524840',
  rule:    'rgba(255,255,255,0.08)',
  maroon:  '#6B1A2A',
  cream:   '#F2EDE6',
  bull:    '#22c55e',
  bear:    '#ef4444',
  // glass panels that float over the chart
  glass:   'rgba(13,11,9,0.82)',
  glassBorder: 'rgba(255,255,255,0.10)',
} as const;

const SERIF = 'Georgia,"Times New Roman",serif';
const MONO  = '"SF Mono","Fira Code",Consolas,monospace';
const SANS  = '-apple-system,BlinkMacSystemFont,"Inter",system-ui,sans-serif';
const PX    = 'clamp(20px, 5vw, 72px)';

// Shared panel style — semi-transparent glass over the chart
function panel(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: C.glass,
    backdropFilter: 'blur(18px)',
    WebkitBackdropFilter: 'blur(18px)',
    border: `1px solid ${C.glassBorder}`,
    borderRadius: 8,
    ...extra,
  };
}

// ─── Small components ──────────────────────────────────────────────────────
function Kbd({ ch }: { ch: string }) {
  return (
    <kbd style={{
      fontFamily: MONO, fontSize: 10, color: C.muted,
      background: 'rgba(255,255,255,0.06)',
      border: `1px solid ${C.rule}`, borderBottomWidth: 2,
      borderRadius: 3, padding: '1px 6px', lineHeight: 1.6,
      display: 'inline-block',
    }}>
      {ch}
    </kbd>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────
const STEPS = [
  { n: '01', title: 'Pick a dataset',        body: '500+ instruments. Stocks, forex, crypto, ETFs, indices. Daily, weekly, monthly.' },
  { n: '02', title: 'Hard right edge only',  body: "The chart loads at a random point in history. You see 50 bars. Nothing beyond. Blind mode hides the ticker so prior knowledge can't bias your read." },
  { n: '03', title: 'Commit before reveal',  body: "Press B or L. Then →. Your call is locked the moment you press. There is no amending it after you see the outcome." },
  { n: '04', title: 'Map the trade',         body: 'Set entry, TP, SL. Lines draw on the chart. They resolve automatically as you step forward.' },
  { n: '05', title: 'Read the session back', body: 'Accuracy, bull/bear split, streak, trade log. It shows where your reading is systematically off — not just whether this session went well.' },
] as const;

const STATS = [
  { label: 'Overall accuracy',   val: '67%',     col: '#22c55e' },
  { label: 'Bull call accuracy', val: '71%',     col: '#22c55e' },
  { label: 'Bear call accuracy', val: '52%',     col: '#ef4444' },
  { label: 'Current streak',     val: '4 ✦',     col: '#C8941A' },
  { label: 'TP / trades',        val: '3 / 5',   col: C.text    },
  { label: 'Best R:R',           val: '1 : 3.1', col: C.text    },
] as const;

const DATASETS = [
  { cls: 'US Equities',    ex: 'AAPL · MSFT · NVDA · TSLA · AMZN', count: '160+', range: '2000–2025' },
  { cls: 'ETFs & Indices', ex: 'SPY · QQQ · IWM · GLD · TLT · XLK', count: '80+',  range: '1995–2025' },
  { cls: 'Forex',          ex: 'EUR/USD · GBP/USD · USD/JPY',        count: '60+',  range: '2000–2025' },
  { cls: 'Crypto',         ex: 'BTC · ETH · SOL · BNB · DOGE',      count: '50+',  range: '2017–2025' },
  { cls: 'Commodities',    ex: 'Gold · Silver · Crude Oil',          count: '20+',  range: '2005–2025' },
  { cls: 'Global Indices', ex: 'FTSE · DAX · Nikkei · ASX 200',     count: '15+',  range: '2010–2025' },
] as const;

const FAQS = [
  { q: 'Is it free?',
    a: 'Yes. Runs in your browser with no account required. An account lets you save progress across devices and appear on the leaderboard.' },
  { q: 'How is this different from paper trading?',
    a: "Paper trading in real time gives you one bar per trading day. This gives you 200-plus decisions per session. More importantly, you commit a prediction before seeing the outcome — which is what creates a genuine feedback signal. Watching charts in real time lets you stay vague about your expectations, which is why it rarely builds skill." },
  { q: 'What is blind mode?',
    a: "Blind mode hides the ticker. If you know you're looking at AAPL in 2021, your brain factors in what you already know. Blind mode forces you to read the structure, not the name." },
  { q: 'What does noise injection do?',
    a: "Adds small random perturbations to OHLC values. Prevents recognising historical sequences you've already studied, keeping sessions novel even on familiar datasets." },
  { q: 'Can I review trades after a session?',
    a: 'Yes. Summary shows entry, TP, SL, exit, R:R, and outcome per trade. Click Review to jump back to your entry bar and step through the move against your levels.' },
  { q: 'How will the leaderboard work?',
    a: 'Weekly directional accuracy across sessions with 30-plus predictions. A 30-call floor prevents a single lucky session from gaming rankings. Resets midnight UTC every Monday.' },
] as const;

// ─── Page ──────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      {/* The chart runs fixed behind everything */}
      <ChartBackground />

      {/* Overlay gradient: dark at the very top (nav legibility), transparent in middle, 
          dark at bottom — so content panels always have contrast */}
      <div aria-hidden="true" style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: `
          linear-gradient(to bottom,
            rgba(13,11,9,0.75) 0%,
            rgba(13,11,9,0.0) 18%,
            rgba(13,11,9,0.0) 82%,
            rgba(13,11,9,0.55) 100%
          )
        `,
      }} />

      {/* Scrollable content layer */}
      <div style={{ position: 'relative', zIndex: 2, fontFamily: SANS, color: C.text }}>

        {/* ── NAV ──────────────────────────────────────────────────────── */}
        <nav style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          height: 48,
          display: 'flex', alignItems: 'center',
          padding: `0 ${PX}`,
          background: 'rgba(13,11,9,0.75)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid rgba(255,255,255,0.07)`,
        }}>
          <a href="/" style={{ textDecoration: 'none', marginRight: 'auto' }}>
            <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700,
                           letterSpacing: '0.04em', color: C.text }}>
              Empyrean
            </span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {[['#method','Method'],['#datasets','Datasets'],['#faq','FAQ'],['/blog/','Blog']].map(([h,l]) => (
              <a key={h} href={h} style={{ fontSize: 12, color: C.muted, textDecoration: 'none' }}>
                {l}
              </a>
            ))}
            <a href="/app/" style={{
              fontSize: 12, fontWeight: 600,
              background: C.maroon, color: C.cream,
              borderRadius: 4, padding: '5px 14px', textDecoration: 'none',
            }}>
              Open trainer
            </a>
          </div>
        </nav>

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        {/* Full-viewport hero — content floats over the live chart.
            The chart is visible in all the whitespace around the text panel. */}
        <section style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'flex-end',
          padding: `0 ${PX} 80px`,
        }}>
          <div style={{
            ...panel({ padding: '40px 44px', maxWidth: 580 }),
            marginTop: 'auto',
          }}>
            {/* Eyebrow */}
            <div style={{
              fontFamily: MONO, fontSize: 9, fontWeight: 600,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: C.faint, marginBottom: 20,
            }}>
              Empyrean · Price Action Training
            </div>

            <h1 style={{
              fontFamily: SERIF,
              fontSize: 'clamp(2rem, 4vw, 3.2rem)',
              fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.12,
              color: C.text, marginBottom: 20,
            }}>
              The market is always moving.<br />
              Most practice isn't.
            </h1>

            <p style={{ fontSize: 15, lineHeight: 1.8, color: C.muted, marginBottom: 32 }}>
              200 decisions per session. Each one committed before the bar reveals.
              Right or wrong — recorded either way. That's how pattern recognition
              actually builds.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
              <a href="/app/" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontSize: 14, fontWeight: 600,
                background: C.text, color: C.bg,
                borderRadius: 5, padding: '11px 24px', textDecoration: 'none',
              }}>
                Start a session
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M1.5 6h9M6.5 1.5L11 6l-4.5 4.5" stroke="currentColor"
                        strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a href="#method" style={{
                fontSize: 13, color: C.muted, textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center',
                border: `1px solid rgba(255,255,255,0.12)`,
                borderRadius: 5, padding: '10px 18px',
              }}>
                How it works
              </a>
            </div>

            {/* Keyboard hints */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
              {[['→','reveal'],['B','bull'],['L','bear'],['E','trade'],['Tab','summary']].map(([k,l],i,a) => (
                <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                                       fontSize: 11, color: C.faint }}>
                  <Kbd ch={k} /> {l}
                  {i < a.length - 1 && <span style={{ marginLeft: 2, color: C.faint }}>·</span>}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* ── STAT BREAK — large number in transparent panel ────────────── */}
        {/* Sits in the middle of the chart — chart is fully visible around it */}
        <section style={{
          minHeight: '60vh',
          display: 'flex', alignItems: 'center',
          padding: `0 ${PX}`,
        }}>
          <div style={{ ...panel({ padding: '48px 56px', display: 'inline-block' }) }}>
            <div style={{
              fontFamily: MONO, fontSize: 'clamp(4rem, 14vw, 10rem)',
              fontWeight: 700, lineHeight: 1, letterSpacing: '-0.04em',
              color: C.text,
            }}>
              200
            </div>
            <div style={{
              fontFamily: MONO, fontSize: 12, color: C.faint,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              marginTop: 12, maxWidth: 360,
            }}>
              Forced predictions per session ·  
              eight months of daily charts compressed to two hours
            </div>
          </div>
        </section>

        {/* ── METHOD ───────────────────────────────────────────────────── */}
        <section id="method" style={{
          padding: `120px ${PX}`,
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <div style={{ ...panel({ padding: '48px 48px', maxWidth: 600, width: '100%' }) }}>
            <p style={{
              fontFamily: MONO, fontSize: 9, fontWeight: 600,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: C.faint, marginBottom: 32,
            }}>
              How a session works
            </p>

            {/* Opening statement */}
            <p style={{
              fontFamily: SERIF, fontSize: 'clamp(1rem, 2vw, 1.35rem)',
              fontWeight: 400, lineHeight: 1.6, color: C.text,
              marginBottom: 40,
            }}>
              Watching a chart is not practice. You can rationalise any move after
              the fact without ever having committed. The learning signal is zero.
              This tool forces the commitment.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {STEPS.map((s, i) => (
                <div key={s.n} style={{
                  display: 'grid', gridTemplateColumns: '36px 1fr', gap: 20,
                  padding: '24px 0',
                  borderTop: `1px solid rgba(255,255,255,0.07)`,
                  ...(i === STEPS.length - 1 ? { borderBottom: `1px solid rgba(255,255,255,0.07)` } : {}),
                }}>
                  <span style={{
                    fontFamily: MONO, fontSize: 10, color: C.faint,
                    letterSpacing: '0.06em', paddingTop: 3,
                  }}>
                    {s.n}
                  </span>
                  <div>
                    <h3 style={{
                      fontFamily: SERIF, fontSize: 15,
                      fontWeight: 400, color: C.text,
                      marginBottom: 6, letterSpacing: '-0.01em',
                    }}>
                      {s.title}
                    </h3>
                    <p style={{ fontSize: 13, lineHeight: 1.7, color: C.muted }}>
                      {s.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── TRACKING STATS ───────────────────────────────────────────── */}
        <section style={{
          padding: `80px ${PX}`,
          display: 'flex', justifyContent: 'flex-start',
        }}>
          <div style={{ ...panel({ padding: '40px 40px', maxWidth: 740, width: '100%' }) }}>
            <p style={{
              fontFamily: MONO, fontSize: 9, fontWeight: 600,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: C.faint, marginBottom: 8,
            }}>
              What every session tracks
            </p>
            <p style={{
              fontSize: 14, lineHeight: 1.7, color: C.muted,
              marginBottom: 32, maxWidth: 440,
            }}>
              Bull vs bear split is the most useful signal.
              A 20-point gap is a bias you can fix. You can't fix what you can't see.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 1,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 6, overflow: 'hidden',
            }}>
              {STATS.map(({ label, val, col }) => (
                <div key={label} style={{
                  padding: '20px 18px',
                  background: 'rgba(13,11,9,0.85)',
                  backdropFilter: 'blur(8px)',
                }}>
                  <div style={{
                    fontFamily: MONO, fontSize: 9, fontWeight: 600,
                    textTransform: 'uppercase', letterSpacing: '0.1em',
                    color: C.faint, marginBottom: 8,
                  }}>
                    {label}
                  </div>
                  <div style={{
                    fontFamily: MONO, fontSize: 26, fontWeight: 700,
                    letterSpacing: '-0.02em', color: col,
                  }}>
                    {val}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── LEADERBOARD EMPTY STATE ───────────────────────────────────── */}
        <section style={{
          padding: `80px ${PX}`,
          display: 'flex', justifyContent: 'center',
        }}>
          <div style={{ ...panel({ padding: '48px 48px', maxWidth: 680, width: '100%' }) }}>
            <p style={{
              fontFamily: MONO, fontSize: 9, fontWeight: 600,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: C.faint, marginBottom: 24,
            }}>
              Community rankings
            </p>
            <p style={{
              fontFamily: SERIF, fontSize: 'clamp(1rem, 2vw, 1.3rem)',
              lineHeight: 1.55, color: C.text, marginBottom: 40,
              fontWeight: 400,
            }}>
              A weekly leaderboard is coming — ranked by directional accuracy,
              sessions with 30-plus predictions only.
            </p>

            {/* Mock table headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 80px 64px 64px 72px',
              padding: '8px 0',
              borderTop: `1px solid rgba(255,255,255,0.07)`,
              borderBottom: `1px solid rgba(255,255,255,0.07)`,
              fontFamily: MONO, fontSize: 9, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.09em',
              color: C.faint, marginBottom: 0,
            }}>
              {['#','Trader','Accuracy','Sessions','Streak','R:R'].map(h => (
                <span key={h}>{h}</span>
              ))}
            </div>

            {/* Ghost placeholder rows */}
            {[1,2,3].map((n, i) => (
              <div key={n} style={{
                display: 'grid',
                gridTemplateColumns: '40px 1fr 80px 64px 64px 72px',
                padding: '13px 0',
                borderBottom: `1px solid rgba(255,255,255,0.05)`,
                alignItems: 'center',
                opacity: 0.18 - i * 0.04,
              }}>
                <span style={{ fontFamily: MONO, fontSize: 12, color: C.faint }}>{n}</span>
                <span style={{ height: 10, width: 100 - i * 20, background: C.faint, borderRadius: 2, display: 'block' }} />
                <span style={{ height: 10, width: 32, background: C.faint, borderRadius: 2, display: 'block' }} />
                <span style={{ height: 10, width: 24, background: C.faint, borderRadius: 2, display: 'block' }} />
                <span style={{ height: 10, width: 20, background: C.faint, borderRadius: 2, display: 'block' }} />
                <span style={{ height: 10, width: 36, background: C.faint, borderRadius: 2, display: 'block' }} />
              </div>
            ))}

            <div style={{ marginTop: 36, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
              <a href="/app/" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontSize: 13, fontWeight: 600,
                background: C.maroon, color: C.cream,
                borderRadius: 5, padding: '10px 20px', textDecoration: 'none',
              }}>
                Train now — be first on the board
              </a>
              <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint }}>
                Resets Monday UTC · 30+ calls to qualify
              </span>
            </div>
          </div>
        </section>

        {/* ── DATASETS ─────────────────────────────────────────────────── */}
        <section id="datasets" style={{
          padding: `80px ${PX}`,
          display: 'flex', justifyContent: 'flex-end',
        }}>
          <div style={{ ...panel({ padding: '40px 40px', maxWidth: 700, width: '100%' }) }}>
            <p style={{
              fontFamily: MONO, fontSize: 9, fontWeight: 600,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: C.faint, marginBottom: 32,
            }}>
              500+ instruments · pre-loaded · no API key
            </p>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
              gap: 1, background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 6, overflow: 'hidden', marginBottom: 10,
            }}>
              {DATASETS.map(({ cls, ex, count, range }) => (
                <div key={cls} style={{
                  padding: '18px 16px',
                  background: 'rgba(13,11,9,0.85)',
                  backdropFilter: 'blur(8px)',
                }}>
                  <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700,
                                color: C.text, marginBottom: 6 }}>
                    {count}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 5 }}>
                    {cls}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: C.faint,
                                lineHeight: 1.7, marginBottom: 5 }}>
                    {ex}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: C.faint }}>
                    {range}
                  </div>
                </div>
              ))}
            </div>
            <p style={{ fontFamily: MONO, fontSize: 10, color: C.faint }}>
              Daily · Weekly · Monthly. Historical coverage varies by instrument.
            </p>
          </div>
        </section>

        {/* ── FAQ ──────────────────────────────────────────────────────── */}
        <section id="faq" style={{
          padding: `80px ${PX}`,
          display: 'flex', justifyContent: 'flex-start',
        }}>
          <div style={{ ...panel({ padding: '40px 40px', maxWidth: 640, width: '100%' }) }}>
            <p style={{
              fontFamily: MONO, fontSize: 9, fontWeight: 600,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: C.faint, marginBottom: 36,
            }}>
              Questions
            </p>
            {FAQS.map(({ q, a }, i) => (
              <details key={q} style={{
                borderTop: i === 0 ? '1px solid rgba(255,255,255,0.07)' : 'none',
                borderBottom: '1px solid rgba(255,255,255,0.07)',
              }}>
                <summary style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 0', cursor: 'pointer', listStyle: 'none',
                  fontFamily: SERIF, fontSize: 14, fontWeight: 400, color: C.text,
                }}>
                  {q}
                  <span style={{ color: C.faint, fontSize: 18, fontWeight: 300, marginLeft: 16 }}>+</span>
                </summary>
                <p style={{ paddingBottom: 18, fontSize: 13, lineHeight: 1.8, color: C.muted }}>
                  {a}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* ── BOTTOM CTA ───────────────────────────────────────────────── */}
        {/* Takes up a full viewport height so the chart is very visible around the CTA */}
        <section style={{
          minHeight: '90vh',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: `80px ${PX}`,
          textAlign: 'center',
        }}>
          <div style={{ ...panel({ padding: '64px 56px', maxWidth: 560 }) }}>
            <h2 style={{
              fontFamily: SERIF,
              fontSize: 'clamp(1.8rem, 5vw, 3.2rem)',
              fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.1,
              color: C.text, marginBottom: 20,
            }}>
              Pick a dataset.<br />Press →.<br />See where you stand.
            </h2>
            <p style={{
              fontSize: 15, lineHeight: 1.75, color: C.muted,
              marginBottom: 36,
            }}>
              No download. No sign-up. Your first session tells you more about your
              chart reading than months of passive watching ever would.
            </p>
            <a href="/app/" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              fontSize: 15, fontWeight: 600,
              background: C.text, color: C.bg,
              borderRadius: 6, padding: '14px 36px', textDecoration: 'none',
            }}>
              Open the trainer
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M7.5 2L13 7l-5.5 5" stroke="currentColor"
                      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>
        </section>

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <footer style={{
          borderTop: `1px solid rgba(255,255,255,0.07)`,
          background: 'rgba(13,11,9,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: `18px ${PX}`,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
        }}>
          <span style={{ fontFamily: MONO, fontSize: 11, color: C.faint }}>
            Empyrean · © 2026
          </span>
          <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            {[['/blog/','Blog'],['/app/','Train'],['#faq','FAQ']].map(([h,l]) => (
              <a key={h} href={h} style={{ fontSize: 12, color: C.faint, textDecoration: 'none' }}>
                {l}
              </a>
            ))}
            <a href="https://buymeacoffee.com/YOUR_BMC_USERNAME"
               target="_blank" rel="noopener noreferrer"
               style={{
                 display: 'inline-flex', alignItems: 'center', gap: 5,
                 fontSize: 11, fontWeight: 700,
                 background: '#FFDD00', color: '#000',
                 padding: '4px 10px', borderRadius: 3, textDecoration: 'none',
               }}>
              ☕ Support
            </a>
          </div>
        </footer>

      </div>

      <style>{`
        details summary::-webkit-details-marker { display: none; }
        html { scroll-behavior: smooth; }
        body { overflow-x: hidden; }
      `}</style>
    </>
  );
}

// (React type used above in panel() helper)
