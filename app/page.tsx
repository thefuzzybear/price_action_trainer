import type { Metadata } from 'next';
import type React from 'react';
import ChartBackground from './components/landing/ChartBackgroundLoader';

export const metadata: Metadata = {
  title: 'Empyrean — Price Action Trainer',
  description:
    'A price action training tool that tracks your directional accuracy across 200+ decisions per session. Each call is locked before the bar reveals — so you actually learn something.',
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
  bg:      '#F5F0E8',   // warm parchment — matches chart background
  text:    '#1A1208',   // near-black with warmth
  muted:   '#6B5E52',   // warm mid-tone
  faint:   '#A89880',   // light warm grey
  rule:    'rgba(42,26,10,0.10)',
  maroon:  '#6B1A2A',   // primary accent
  maroonLight: '#8B2A3C',
  bull:    '#22c55e',
  bear:    '#ef4444',
  // Glass panels: dark parchment over the light chart
  glass:       'rgba(245,240,232,0.88)',
  glassDark:   'rgba(26,18,8,0.82)',
  glassBorder: 'rgba(42,26,10,0.14)',
} as const;

const SERIF = 'Georgia,"Times New Roman",serif';
const MONO  = '"SF Mono","Fira Code",Consolas,monospace';
const SANS  = '-apple-system,BlinkMacSystemFont,"Inter",system-ui,sans-serif';
const PX    = 'clamp(20px, 5vw, 72px)';

// Shared panel — warm parchment glass floating over the chart
function panel(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: C.glass,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid ${C.glassBorder}`,
    borderRadius: 8,
    ...extra,
  };
}

// Dark panel variant — used for nav, footer, and the stats section
function panelDark(extra?: React.CSSProperties): React.CSSProperties {
  return {
    background: C.glassDark,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: `1px solid rgba(255,255,255,0.08)`,
    borderRadius: 8,
    ...extra,
  };
}

// ─── Small components ──────────────────────────────────────────────────────
function Kbd({ ch }: { ch: string }) {
  return (
    <kbd style={{
      fontFamily: MONO, fontSize: 10, color: C.muted,
      background: 'rgba(107,26,42,0.06)',
      border: `1px solid ${C.glassBorder}`, borderBottomWidth: 2,
      borderRadius: 3, padding: '1px 6px', lineHeight: 1.6,
      display: 'inline-block',
    }}>
      {ch}
    </kbd>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────
const STEPS = [
  { n: '01', title: 'Pick a dataset',
    body: 'There are 500+ instruments across stocks, forex, crypto, ETFs, and global indices. Pick anything — daily, weekly, or monthly timeframe.' },
  { n: '02', title: 'The chart starts somewhere in history',
    body: "You load in at a random point. You can see the last 50 bars but nothing forward. If you turn on blind mode, the ticker is hidden too — so you can't lean on what you already know about a stock." },
  { n: '03', title: 'Call the next bar before it reveals',
    body: "Press B if you think the next bar closes up, L if you think it closes down. Then hit → to reveal. The call is logged the moment you press — there's no changing your mind once you see the outcome." },
  { n: '04', title: 'Map a trade if you want to',
    body: 'You can set an entry, take-profit, and stop-loss. The levels appear on the chart as dashed lines and resolve on their own as you keep stepping forward.' },
  { n: '05', title: 'Review the session at the end',
    body: "The summary breaks down your accuracy, how your bull calls compare to your bear calls, your streak, and every trade you mapped. The interesting thing is usually the gap between the two call types — that tends to point at something specific." },
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
    a: "Yes, completely. It runs in your browser and you don't need an account to use it. If you create one, your sessions are saved so you can pick up where you left off across devices, and your results count toward the leaderboard." },
  { q: 'How is this different from paper trading?',
    a: "Paper trading in real time gives you roughly one bar per trading day on a daily chart. That's one decision. Here you get 200-plus per session. The bigger difference is that you have to commit your call before seeing the outcome — real paper trading lets you stay vague about what you expected, which means you never really get a feedback signal. Your brain just fills in the story after the fact." },
  { q: 'What is blind mode?',
    a: "Blind mode hides the ticker symbol. It sounds small but it makes a real difference — if you know you're looking at NVDA in late 2023, you're going to read that chart differently than if you just see an unlabelled series. It forces you to work with what's actually in front of you." },
  { q: 'What does noise injection do?',
    a: "It adds tiny random adjustments to each bar's OHLC values. The chart still behaves like the original dataset but looks slightly different every time. Mainly useful if you've been through a dataset before and don't want to accidentally remember specific sequences." },
  { q: 'Can I review my trades after a session?',
    a: 'Yes. The session summary lists every trade you mapped with the entry, TP, SL, exit price, R:R, and outcome. You can click into any trade and it takes you back to the bar where you entered — then you step forward from there and watch how it actually played out.' },
  { q: 'How will the leaderboard work?',
    a: "We're ranking by weekly directional accuracy, but only counting sessions where you made at least 30 calls. One lucky session shouldn't be enough to top the board. The rankings reset every Monday at midnight UTC." },
] as const;

// ─── Page ──────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <>
      {/* The chart runs fixed behind everything */}
      <ChartBackground />

      {/* Overlay: parchment vignette top/bottom for panel contrast */}
      <div aria-hidden="true" style={{
        position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: `
          linear-gradient(to bottom,
            rgba(245,240,232,0.72) 0%,
            rgba(245,240,232,0.0) 15%,
            rgba(245,240,232,0.0) 85%,
            rgba(245,240,232,0.55) 100%
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
          background: 'rgba(245,240,232,0.88)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${C.glassBorder}`,
        }}>
          <a href="/" style={{ textDecoration: 'none', marginRight: 'auto' }}>
            <span style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 700,
                           letterSpacing: '0.04em', color: C.text }}>
              Empyrean
            </span>
          </a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
            {[['#method','Method'],['#datasets','Datasets'],['#blog','Blog'],['#faq','FAQ'],['/blog/','All articles']].map(([h,l]) => (
              <a key={h} href={h} style={{ fontSize: 12, color: C.muted, textDecoration: 'none' }}>
                {l}
              </a>
            ))}
            <a href="/app/" style={{
              fontSize: 12, fontWeight: 600,
              background: C.maroon, color: '#F5F0E8',
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
              Most chart practice builds hindsight, not skill.
            </h1>

            <p style={{ fontSize: 15, lineHeight: 1.8, color: C.muted, marginBottom: 32 }}>
              The problem is you never have to commit before the outcome is visible.
              This trainer changes that — every call is locked before the bar reveals,
              and your accuracy is tracked across 200-plus decisions per session.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
              <a href="/app/" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                fontSize: 14, fontWeight: 600,
                background: C.maroon, color: '#F5F0E8',
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
                border: `1px solid ${C.glassBorder}`,
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
              decisions per session — each one locked before the bar reveals
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
              Watching charts feels like practice because it's time-consuming and it requires
              attention. But you can rationalise any move in hindsight without ever
              having predicted it — there's no feedback signal unless you're forced to commit
              first. That's what this does.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {STEPS.map((s, i) => (
                <div key={s.n} style={{
                  display: 'grid', gridTemplateColumns: '36px 1fr', gap: 20,
                  padding: '24px 0',
                  borderTop: `1px solid ${C.glassBorder}`,
                  ...(i === STEPS.length - 1 ? { borderBottom: `1px solid ${C.glassBorder}` } : {}),
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
              The most useful number to watch is the gap between your bull accuracy and
              your bear accuracy. If there's a consistent 15–20 point difference, that's
              a real pattern in how you're reading the chart — and it's something you can
              actually work on once you can see it.
            </p>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: 1,
              background: C.glassBorder,
              border: `1px solid ${C.glassBorder}`,
              borderRadius: 6, overflow: 'hidden',
            }}>
              {STATS.map(({ label, val, col }) => (
                <div key={label} style={{
                  padding: '20px 18px',
                  background: 'rgba(245,240,232,0.92)',
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
              We're adding a weekly leaderboard ranked by directional accuracy.
              Only sessions with 30 or more calls count — so one lucky run
              doesn't put you at the top.
            </p>

            {/* Mock table headers */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '40px 1fr 80px 64px 64px 72px',
              padding: '8px 0',
              borderTop: `1px solid ${C.glassBorder}`,
              borderBottom: `1px solid ${C.glassBorder}`,
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
                borderBottom: `1px solid ${C.glassBorder}`,
                alignItems: 'center',
                opacity: 0.22 - i * 0.05,
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
                background: C.maroon, color: '#F5F0E8',
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
              gap: 1, background: C.glassBorder,
              border: `1px solid ${C.glassBorder}`,
              borderRadius: 6, overflow: 'hidden', marginBottom: 10,
            }}>
              {DATASETS.map(({ cls, ex, count, range }) => (
                <div key={cls} style={{
                  padding: '18px 16px',
                  background: 'rgba(245,240,232,0.92)',
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

        {/* ── BLOG ─────────────────────────────────────────────────────── */}
        <section id="blog" style={{
          padding: `80px ${PX}`,
          display: 'flex', justifyContent: 'center',
        }}>
          <div style={{ ...panel({ padding: '40px 40px', maxWidth: 740, width: '100%' }) }}>
            <div style={{
              display: 'flex', alignItems: 'baseline',
              justifyContent: 'space-between', marginBottom: 36, flexWrap: 'wrap', gap: 12,
            }}>
              <p style={{
                fontFamily: MONO, fontSize: 9, fontWeight: 600,
                letterSpacing: '0.18em', textTransform: 'uppercase',
                color: C.faint,
              }}>
                Writing
              </p>
              <a href="/blog/" style={{
                fontFamily: MONO, fontSize: 10, color: C.maroon,
                letterSpacing: '0.06em', textDecoration: 'none',
              }}>
                All articles →
              </a>
            </div>

            {[
              {
                tag: 'Fundamentals',
                title: 'How to read candlestick charts — a complete beginner\'s guide',
                desc: 'Every candlestick is a compressed record of a fight between buyers and sellers. Learn to read the open, high, low, and close, understand what wicks reveal about rejection, and recognise the patterns that show up across every market.',
                href: '/blog/how-to-read-candlestick-charts.html',
                time: '8 min',
              },
              {
                tag: 'Methodology',
                title: 'Price action vs technical indicators — why traders go bare chart',
                desc: 'Most traders start with indicators. Many of the best eventually strip them off. This explains what indicators actually measure, why they lag, and what you see on a clean chart that gets hidden beneath a forest of lines.',
                href: '/blog/price-action-vs-indicators.html',
                time: '10 min',
              },
              {
                tag: 'Skill Building',
                title: 'Deliberate practice for traders — how to actually get better at reading charts',
                desc: 'Watching charts for hours feels productive but rarely builds skill in the way deliberate practice does. Here\'s the specific structure — borrowed from cognitive science — that actually improves price action reading.',
                href: '/blog/deliberate-practice-trading.html',
                time: '12 min',
              },
            ].map((post, i, arr) => (
              <a key={post.href} href={post.href} style={{ textDecoration: 'none', display: 'block' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 48px',
                  gap: 20,
                  padding: '24px 0',
                  borderTop: `1px solid ${C.glassBorder}`,
                  ...(i === arr.length - 1 ? { borderBottom: `1px solid ${C.glassBorder}` } : {}),
                  cursor: 'pointer',
                }}>
                  <div>
                    <p style={{
                      fontFamily: MONO, fontSize: 9, fontWeight: 600,
                      textTransform: 'uppercase', letterSpacing: '0.12em',
                      color: C.maroon, marginBottom: 8,
                    }}>
                      {post.tag}
                    </p>
                    <p style={{
                      fontFamily: SERIF, fontSize: 15, fontWeight: 400,
                      color: C.text, lineHeight: 1.35,
                      letterSpacing: '-0.01em', marginBottom: 8,
                    }}>
                      {post.title}
                    </p>
                    <p style={{ fontSize: 13, lineHeight: 1.7, color: C.muted }}>
                      {post.desc}
                    </p>
                  </div>
                  <div style={{
                    fontFamily: MONO, fontSize: 10, color: C.faint,
                    textAlign: 'right', paddingTop: 2,
                  }}>
                    {post.time}
                  </div>
                </div>
              </a>
            ))}
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
                borderTop: i === 0 ? `1px solid ${C.glassBorder}` : 'none',
                borderBottom: `1px solid ${C.glassBorder}`,
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
              Pick a dataset and start reading.
            </h2>
            <p style={{
              fontSize: 15, lineHeight: 1.75, color: C.muted,
              marginBottom: 36,
            }}>
              No download, no sign-up needed. Your first session will tell you something
              real about how you read price — probably something you hadn't noticed before.
            </p>
            <a href="/app/" style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              fontSize: 15, fontWeight: 600,
              background: C.maroon, color: '#F5F0E8',
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
          borderTop: `1px solid ${C.glassBorder}`,
          background: 'rgba(245,240,232,0.92)',
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
