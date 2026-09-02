import type { Metadata } from 'next';
import type React from 'react';
import AnimatedChart from './components/landing/AnimatedChartLoader';

export const metadata: Metadata = {
  title: 'Empyrean — Price Action Trainer',
  description:
    'A price action training platform by Empyrean. Step through historical candlestick data bar by bar, commit a directional call before each reveal, and find the patterns in your own reading.',
  openGraph: {
    title: 'Empyrean Price Action Trainer',
    description: 'Commit before the reveal. Build genuine pattern recognition.',
    url: 'https://price-action-trainer.vercel.app',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
  alternates: { canonical: 'https://price-action-trainer.vercel.app/' },
};

// ─── Design tokens ────────────────────────────────────────────────────────────
const E = {
  bg:       '#0D0B09',
  surface:  '#13100D',
  raised:   '#1C1713',
  parchment:'#F5F0E8',
  cream:    '#E8E0D0',
  muted:    '#9E8E7A',
  faint:    '#5A4F43',
  maroon:   '#6B1A2A',
  maroonFg: '#E8B4BE',
  border:   'rgba(107,26,42,0.22)',
  borderSub:'rgba(245,240,232,0.07)',
  bull:     '#22c55e',
  bear:     '#ef4444',
  amber:    '#C8941A',
} as const;

const SERIF = '"Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
const MONO  = '"SF Mono", "Fira Code", Consolas, monospace';
const SANS  = '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif';

// ─── Reusable style objects ───────────────────────────────────────────────────
const S = {
  // Layout helpers
  flex:        { display: 'flex' } as React.CSSProperties,
  flexCenter:  { display: 'flex', alignItems: 'center' } as React.CSSProperties,
  flexBetween: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' } as React.CSSProperties,
  flexWrap:    { display: 'flex', flexWrap: 'wrap' as const },
  col:         { display: 'flex', flexDirection: 'column' as const },

  // Text helpers
  label: {
    fontFamily: MONO, fontSize: 10, fontWeight: 600,
    textTransform: 'uppercase' as const, letterSpacing: '0.14em',
    color: E.faint, marginBottom: 12,
  } as React.CSSProperties,

  sectionTitle: {
    fontFamily: SERIF, fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
    fontWeight: 400, letterSpacing: '-0.01em', lineHeight: 1.15,
    color: E.parchment, marginBottom: 40,
  } as React.CSSProperties,

  monoStat: {
    fontFamily: MONO, fontSize: 26, fontWeight: 700,
    letterSpacing: '-0.02em', marginBottom: 4,
  } as React.CSSProperties,

  // Border rule
  rule: { height: 1, background: E.borderSub, border: 'none' } as React.CSSProperties,
  ruleFull: { height: 1, background: E.borderSub, border: 'none', margin: 0 } as React.CSSProperties,

  // Kbd
  kbd: {
    fontFamily: MONO, fontSize: 10, color: E.muted,
    background: E.raised, border: `1px solid ${E.border}`,
    borderBottomWidth: 2, borderRadius: 3,
    padding: '1px 6px', lineHeight: 1.6,
  } as React.CSSProperties,
} as const;

// ─── Shared micro-components ──────────────────────────────────────────────────
function OmegaMark({ size = 16 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      style={{ fontFamily: SERIF, fontSize: size, color: E.maroon,
               lineHeight: 1, fontWeight: 700, userSelect: 'none',
               display: 'inline-block' }}
    >
      Ω
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p style={S.label}>{children}</p>;
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 style={S.sectionTitle}>{children}</h2>;
}

function Rule() {
  return <hr style={S.ruleFull} />;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return <kbd style={S.kbd}>{children}</kbd>;
}

function EyebrowChip({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      fontFamily: MONO, fontSize: 10, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.12em',
      color: E.maroonFg,
      background: 'rgba(107,26,42,0.12)',
      border: `1px solid rgba(107,26,42,0.35)`,
      borderRadius: 4, padding: '4px 12px',
      marginBottom: 28,
    }}>
      <OmegaMark size={11} />
      {children}
    </div>
  );
}

function BtnPrimary({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      fontFamily: SANS, fontSize: 13, fontWeight: 600,
      background: E.maroon, color: E.parchment,
      borderRadius: 5, padding: '10px 20px',
      textDecoration: 'none',
    }}>
      {children}
    </a>
  );
}

function BtnGhost({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} style={{
      display: 'inline-flex', alignItems: 'center', gap: 8,
      fontFamily: SANS, fontSize: 13, color: E.muted,
      border: `1px solid ${E.borderSub}`,
      borderRadius: 5, padding: '9px 16px',
      textDecoration: 'none',
    }}>
      {children}
    </a>
  );
}

const ArrowRight = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M1.5 6h9M6.5 1.5L11 6l-4.5 4.5" stroke="currentColor" strokeWidth="1.6"
          strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── Page data ────────────────────────────────────────────────────────────────
const HOW_STEPS = [
  { n: '01', title: 'Pick a dataset',
    body: '500+ instruments including equities, forex, crypto, ETFs, and global indices — across daily, weekly, and monthly timeframes.' },
  { n: '02', title: 'Hard right edge only',
    body: "The chart loads at a random point in history. You see 50 bars, nothing beyond the current one. Blind mode hides the ticker so prior knowledge of a stock's history can't influence your read." },
  { n: '03', title: 'Commit before the reveal',
    body: "Press B for bullish or L for bearish. Then press → to reveal the next bar. Your call is locked the moment you press — there's no amending it after you see the outcome." },
  { n: '04', title: 'Map a trade',
    body: 'Set entry, take-profit, and stop-loss. The levels draw on the chart as dashed lines and resolve automatically as you step through bars.' },
  { n: '05', title: 'Review the session',
    body: 'Accuracy, bull/bear split, streak data, and a full trade log — showing where your calls are systematically off, not just whether the last session went well.' },
] as const;

const COMPARE_ROWS: [string, string][] = [
  ['Outcome always visible',        'Hard right edge — nothing beyond the current bar'],
  ['No commitment required',         'Prediction locked before the bar reveals'],
  ['Hindsight explains everything', 'Immediate right/wrong signal on every call'],
  ['1 bar per day on daily charts', '200-plus decisions in a single session'],
  ['Biases stay invisible',          'Bull/bear accuracy split surfaces them directly'],
];

const METRICS = [
  { key: 'Overall accuracy',   val: '67%',     color: E.bull,      desc: 'Rolling directional prediction rate across the session' },
  { key: 'Bull call accuracy', val: '71%',     color: E.bull,      desc: 'How often your bullish calls prove correct' },
  { key: 'Bear call accuracy', val: '52%',     color: E.bear,      desc: 'A consistent gap here is a detectable — and fixable — bias' },
  { key: 'Current streak',     val: '4 ✦',     color: E.amber,     desc: 'Consecutive correct predictions this session' },
  { key: 'Trade log',          val: '3 / 5',   color: E.parchment, desc: 'TP hits vs total mapped trades this session' },
  { key: 'Best R:R taken',     val: '1 : 3.1', color: E.parchment, desc: 'Risk-reward on the best resolved trade this session' },
] as const;

const DATASETS = [
  { cls: 'US Equities',    ex: 'AAPL · MSFT · NVDA · TSLA · AMZN · META',   count: '160+', range: '2000–2025' },
  { cls: 'ETFs & Indices', ex: 'SPY · QQQ · IWM · GLD · TLT · XLK · ARKK',  count: '80+',  range: '1995–2025' },
  { cls: 'Forex',          ex: 'EUR/USD · GBP/USD · USD/JPY · AUD/USD',      count: '60+',  range: '2000–2025' },
  { cls: 'Crypto',         ex: 'BTC · ETH · SOL · BNB · DOGE · XRP · AVAX', count: '50+',  range: '2017–2025' },
  { cls: 'Commodities',    ex: 'Gold · Silver · Crude Oil · Natural Gas',    count: '20+',  range: '2005–2025' },
  { cls: 'Global Indices', ex: 'FTSE · DAX · Nikkei · Hang Seng · ASX 200', count: '15+',  range: '2010–2025' },
] as const;

const FAQS = [
  { q: 'Is it free?',
    a: 'Yes. The trainer runs in your browser with no account required. Creating an account saves session progress across devices — your predictions, trades, notes, and position in the dataset. The leaderboard requires an account so sessions can be attributed.' },
  { q: 'How is this different from paper trading?',
    a: "Paper trading in real time means waiting for each bar to form. On a daily chart that's one bar per trading day. Historical replay gives you 200-plus decisions per session. More importantly, you commit a prediction before seeing the outcome — which is what creates a genuine feedback signal. Watching charts in real time lets you stay vague about your expectations, which means you never get the clear right/wrong signal needed to build pattern recognition." },
  { q: 'What is blind mode?',
    a: "Blind mode hides the ticker symbol. If you know you're looking at AAPL in 2021, some part of your brain will factor in what you already know about that period. Blind mode removes that shortcut and forces you to read what's actually on the chart." },
  { q: 'What does noise injection do?',
    a: "It adds small random perturbations to each bar's OHLC values. This prevents you from recognising a specific historical sequence you've already worked through, keeping sessions novel even on datasets you've used before." },
  { q: 'Can I review trades after a session?',
    a: 'Yes. The session summary shows entry, TP, SL, exit price, R:R, and outcome for every mapped trade. Clicking Review on any trade jumps the chart back to your entry bar so you can step forward and watch the move play out against your levels.' },
  { q: 'How will the leaderboard work?',
    a: 'The weekly leaderboard will rank users by directional accuracy across sessions with 30 or more predictions — a floor to prevent a single lucky session from gaming the rankings. Streak data, total sessions, and best R:R will also be tracked. The board resets at midnight UTC each Monday.' },
  { q: 'What is price action trading?',
    a: "Price action trading means making decisions based on how price moves rather than on derived indicators like RSI or MACD. The core skills are reading market structure — higher highs and lows, support and resistance zones — and understanding what different candlestick shapes and wick lengths indicate about the balance between buyers and sellers." },
] as const;

// ─── Shared layout values ─────────────────────────────────────────────────────
const PX = 'clamp(20px, 5vw, 80px)';  // horizontal padding
const MAX_W = 1080;

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', background: E.bg, color: E.parchment, fontFamily: SANS }}>

      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <nav style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
        height: 52, display: 'flex', alignItems: 'center',
        paddingLeft: PX, paddingRight: PX,
        background: 'rgba(13,11,9,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${E.border}`,
      }}>
        <a href="/" aria-label="Empyrean home" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          textDecoration: 'none', marginRight: 'auto',
        }}>
          <OmegaMark size={18} />
          <span style={{
            fontFamily: SERIF, fontSize: 13, fontWeight: 600,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: E.cream,
          }}>
            Empyrean
          </span>
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {[['#how','Method'],['#leaderboard','Rankings'],['/blog/','Blog'],['#faq','FAQ']].map(([href, label]) => (
            <a key={href} href={href} style={{
              fontFamily: SANS, fontSize: 12, color: E.muted,
              textDecoration: 'none', letterSpacing: '0.02em',
            }}>
              {label}
            </a>
          ))}
          <a href="/app/" style={{
            fontFamily: SANS, fontSize: 12, fontWeight: 600,
            background: E.maroon, color: E.parchment,
            borderRadius: 4, padding: '5px 14px',
            textDecoration: 'none',
          }}>
            Open trainer
          </a>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: 64,
        alignItems: 'center',
        paddingTop: 96,
        paddingBottom: 80,
        paddingLeft: PX,
        paddingRight: PX,
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Grid texture */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: [
            'linear-gradient(rgba(245,240,232,0.03) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(245,240,232,0.03) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '52px 52px',
          WebkitMaskImage: 'radial-gradient(ellipse 85% 75% at 15% 50%, black 15%, transparent 72%)',
          maskImage: 'radial-gradient(ellipse 85% 75% at 15% 50%, black 15%, transparent 72%)',
        }} />
        {/* Top maroon accent line */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 1,
          background: `linear-gradient(90deg, transparent, ${E.maroon}, transparent)`,
          opacity: 0.4,
        }} />

        {/* Left: copy */}
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 520 }}>
          <EyebrowChip>Price Action · Deliberate Practice</EyebrowChip>

          <h1 style={{
            fontFamily: SERIF,
            fontSize: 'clamp(2.4rem, 5.5vw, 4.2rem)',
            fontWeight: 400, letterSpacing: '-0.02em',
            lineHeight: 1.08, marginBottom: 20,
            color: E.parchment,
          }}>
            Learn to read charts
            <span style={{
              display: 'block', marginTop: 10,
              fontSize: '0.58em', color: E.muted,
              fontWeight: 400, lineHeight: 1.35,
            }}>
              by making predictions,<br />not rationalising outcomes.
            </span>
          </h1>

          <p style={{
            fontSize: 15, lineHeight: 1.75, color: E.muted,
            maxWidth: 440, marginBottom: 32,
          }}>
            Most chart practice is passive — you watch a move happen and construct an explanation
            after the fact. This trainer forces you to commit a directional call before each bar
            reveals. You get 200-plus locked decisions per session and a running score that shows
            precisely where your reading breaks down.
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
            <BtnPrimary href="/app/">Start training <ArrowRight /></BtnPrimary>
            <BtnGhost href="#how">How it works</BtnGhost>
          </div>

          {/* Keyboard shortcuts */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}
               aria-label="Trainer keyboard shortcuts">
            {[['→','reveal'],['B','bullish'],['L','bearish'],['E','set trade'],['Tab','summary']].map(([k, l], i, a) => (
              <span key={k} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5,
                               fontSize: 11, color: E.faint }}>
                  <Kbd>{k}</Kbd> {l}
                </span>
                {i < a.length - 1 && <span aria-hidden="true" style={{ color: E.faint }}>·</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Right: animated chart */}
        <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
          <AnimatedChart />
        </div>
      </section>

      <Rule />

      {/* ── How a session works ─────────────────────────────────────────── */}
      <section id="how" style={{ maxWidth: MAX_W, margin: '0 auto', padding: `80px ${PX}` }}>
        <SectionLabel>Method</SectionLabel>
        <SectionTitle>How a session works</SectionTitle>

        <div style={{ border: `1px solid ${E.border}`, borderRadius: 6, overflow: 'hidden' }}>
          {HOW_STEPS.map((step, i) => (
            <div key={step.n} style={{
              display: 'flex', gap: 20,
              padding: '20px 20px',
              borderBottom: i < HOW_STEPS.length - 1 ? `1px solid ${E.border}` : 'none',
            }}>
              <span style={{
                fontFamily: MONO, fontSize: 10, fontWeight: 600,
                flexShrink: 0, marginTop: 3, width: 24,
                color: E.maroon, opacity: 0.7,
              }}>
                {step.n}
              </span>
              <div>
                <h3 style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 600,
                             color: E.cream, marginBottom: 5 }}>
                  {step.title}
                </h3>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: E.muted }}>
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Rule />

      {/* ── Why it works ────────────────────────────────────────────────── */}
      <section style={{ maxWidth: MAX_W, margin: '0 auto', padding: `80px ${PX}` }}>
        <SectionLabel>Principle</SectionLabel>
        <SectionTitle>
          Familiarity is not skill.{' '}
          <span style={{ color: E.muted }}>The difference is commitment.</span>
        </SectionTitle>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 56,
          alignItems: 'start',
        }}>
          {/* Prose */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              "When the outcome is already visible on the chart, you can construct a plausible explanation for any move without ever having predicted it. That's not skill — it's hindsight narrative. The feedback loop is zero.",
              "Real-time paper trading is better, but a daily chart gives you one bar per trading day. Getting to 200 meaningful reps would take roughly eight months, and you'd still have no mechanism for forcing the commitment before a bar closes.",
            ].map((text, i) => (
              <p key={i} style={{ fontSize: 15, lineHeight: 1.8, color: E.muted }}>{text}</p>
            ))}
            <p style={{ fontSize: 15, lineHeight: 1.8, color: E.muted }}>
              The trainer compresses time and imposes the commitment. Every <Kbd>→</Kbd> is a
              judgment — right or wrong, permanently recorded. That's the signal your brain needs
              to build genuine pattern recognition in price structure.
            </p>
          </div>

          {/* Comparison table */}
          <div style={{ border: `1px solid ${E.border}`, borderRadius: 6, overflow: 'hidden' }}
               aria-label="Passive watching vs deliberate practice">
            {/* Headers */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
              <div style={{
                padding: '12px 16px',
                fontFamily: MONO, fontSize: 10, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                color: E.bear,
                borderBottom: `1px solid ${E.border}`,
                borderRight: `1px solid ${E.border}`,
              }}>
                Passive watching
              </div>
              <div style={{
                padding: '12px 16px',
                fontFamily: MONO, fontSize: 10, fontWeight: 600,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                color: E.bull,
                borderBottom: `1px solid ${E.border}`,
              }}>
                This trainer
              </div>
            </div>
            {/* Rows */}
            {COMPARE_ROWS.map(([bad, good], i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}>
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '11px 16px', fontSize: 12,
                  borderRight: `1px solid ${E.border}`,
                  borderBottom: i < COMPARE_ROWS.length - 1 ? `1px solid ${E.border}` : 'none',
                }}>
                  <span style={{ color: E.bear, flexShrink: 0 }}>✕</span>
                  <span style={{ color: E.muted, lineHeight: 1.55 }}>{bad}</span>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '11px 16px', fontSize: 12,
                  borderBottom: i < COMPARE_ROWS.length - 1 ? `1px solid ${E.border}` : 'none',
                }}>
                  <span style={{ color: E.bull, flexShrink: 0 }}>✓</span>
                  <span style={{ color: E.muted, lineHeight: 1.55 }}>{good}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Rule />

      {/* ── Session metrics ──────────────────────────────────────────────── */}
      <section style={{ maxWidth: MAX_W, margin: '0 auto', padding: `80px ${PX}` }}>
        <SectionLabel>Tracking</SectionLabel>
        <SectionTitle>
          Find the biases{' '}
          <span style={{ color: E.muted }}>you didn't know you had.</span>
        </SectionTitle>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 1,
          background: E.border,
          border: `1px solid ${E.border}`,
          borderRadius: 6,
          overflow: 'hidden',
        }}>
          {METRICS.map(({ key, val, color, desc }) => (
            <div key={key} style={{ background: E.bg, padding: 22 }}>
              <p style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600,
                          textTransform: 'uppercase', letterSpacing: '0.1em',
                          color: E.faint, marginBottom: 8 }}>
                {key}
              </p>
              <p style={{ ...S.monoStat, color }}>{val}</p>
              <p style={{ fontSize: 11, lineHeight: 1.5, color: E.faint }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <Rule />

      {/* ── Leaderboard empty state ──────────────────────────────────────── */}
      <section id="leaderboard" style={{ maxWidth: MAX_W, margin: '0 auto', padding: `80px ${PX}` }}>
        <SectionLabel>Rankings</SectionLabel>
        <SectionTitle>
          Weekly accuracy.{' '}
          <span style={{ color: E.muted }}>Be among the first.</span>
        </SectionTitle>

        <div style={{ border: `1px solid ${E.border}`, borderRadius: 6, overflow: 'hidden' }}>
          {/* Column headers */}
          <div aria-hidden="true" style={{
            display: 'grid',
            gridTemplateColumns: '40px 1fr 80px 70px 70px 70px',
            padding: '9px 16px',
            background: E.raised,
            borderBottom: `1px solid ${E.border}`,
            fontFamily: MONO, fontSize: 9, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.09em',
            color: E.faint,
          }}>
            {['#','Trader','Accuracy','Sessions','Streak','Best R:R'].map(h => (
              <span key={h}>{h}</span>
            ))}
          </div>

          {/* Empty state */}
          <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', textAlign: 'center',
            padding: '64px 24px', gap: 14,
          }}>
            <OmegaMark size={32} />
            <p style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: E.cream }}>
              No rankings yet
            </p>
            <p style={{ fontSize: 13, lineHeight: 1.7, color: E.muted, maxWidth: 380 }}>
              The leaderboard ranks weekly directional accuracy across sessions with 30 or more
              predictions. Create an account so your sessions are counted toward the rankings.
            </p>
            <BtnPrimary href="/app/">
              Train now to claim your spot <ArrowRight />
            </BtnPrimary>
          </div>

          <div style={{
            padding: '10px 16px',
            borderTop: `1px solid ${E.border}`,
            fontFamily: MONO, fontSize: 10, lineHeight: 1.5,
            color: E.faint,
          }}>
            Resets midnight UTC each Monday · Minimum 30 predictions per session · Account required
          </div>
        </div>
      </section>

      <Rule />

      {/* ── Datasets ─────────────────────────────────────────────────────── */}
      <section style={{ maxWidth: MAX_W, margin: '0 auto', padding: `80px ${PX}` }}>
        <SectionLabel>Instruments</SectionLabel>
        <SectionTitle>
          500+ datasets, pre-loaded.{' '}
          <span style={{ color: E.muted }}>No API key. No setup.</span>
        </SectionTitle>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: 1,
          background: E.border,
          border: `1px solid ${E.border}`,
          borderRadius: 6,
          overflow: 'hidden',
          marginBottom: 10,
        }}>
          {DATASETS.map(({ cls, ex, count, range }) => (
            <div key={cls} style={{ background: E.bg, padding: 20 }}>
              <p style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 600,
                          color: E.cream, marginBottom: 6 }}>
                {cls}
              </p>
              <p style={{ fontFamily: MONO, fontSize: 10, lineHeight: 1.75,
                          color: E.faint, marginBottom: 10 }}>
                {ex}
              </p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontFamily: MONO, fontSize: 14, fontWeight: 700,
                               color: E.parchment }}>
                  {count}
                </span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: E.faint }}>
                  {range}
                </span>
              </div>
            </div>
          ))}
        </div>
        <p style={{ fontFamily: MONO, fontSize: 11, color: E.faint }}>
          Daily · Weekly · Monthly timeframes. Historical coverage varies by instrument.
        </p>
      </section>

      <Rule />

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" style={{ maxWidth: MAX_W, margin: '0 auto', padding: `80px ${PX}` }}>
        <SectionLabel>Questions</SectionLabel>
        <div style={{ maxWidth: 700 }}>
          {FAQS.map(({ q, a }, i) => (
            <details
              key={q}
              style={{
                borderBottom: `1px solid ${E.border}`,
                ...(i === 0 ? { borderTop: `1px solid ${E.border}` } : {}),
              }}
            >
              <summary style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '17px 0',
                fontFamily: SERIF, fontSize: 14, fontWeight: 600,
                color: E.cream, cursor: 'pointer',
                listStyle: 'none',
              }}>
                {q}
                <span aria-hidden="true" style={{
                  flexShrink: 0, marginLeft: 16,
                  fontSize: 16, fontWeight: 300, color: E.faint,
                }}>+</span>
              </summary>
              <p style={{ paddingBottom: 18, fontSize: 13, lineHeight: 1.8, color: E.muted }}>
                {a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${E.border}` }}>
        <div style={{ maxWidth: MAX_W, margin: '0 auto', padding: `96px ${PX}` }}>
          <div style={{ maxWidth: 500 }}>
            <div style={{ marginBottom: 20 }}>
              <OmegaMark size={36} />
            </div>
            <h2 style={{
              fontFamily: SERIF, fontSize: 'clamp(2rem, 4vw, 3rem)',
              fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.1,
              color: E.parchment, marginBottom: 16,
            }}>
              200 predictions per session.
            </h2>
            <p style={{ fontSize: 15, lineHeight: 1.75, color: E.muted, marginBottom: 32 }}>
              No download, no sign-up required. Pick a dataset, press <Kbd>→</Kbd>, and start
              building the kind of reading that only comes from making calls with something at
              stake — even if that something is just your score.
            </p>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <BtnPrimary href="/app/">Open the trainer <ArrowRight /></BtnPrimary>
              <BtnGhost href="/blog/">Read the blog</BtnGhost>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12,
        padding: `22px ${PX}`,
        borderTop: `1px solid ${E.border}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <OmegaMark size={14} />
          <span style={{
            fontFamily: SERIF, fontSize: 11,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: E.faint,
          }}>
            Empyrean
          </span>
          <span style={{ fontFamily: MONO, fontSize: 11, color: E.faint }}>· © 2026</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          {[['/blog/','Blog'],['/app/','Train'],['#faq','FAQ']].map(([href, label]) => (
            <a key={href} href={href}
               style={{ fontSize: 12, color: E.faint, textDecoration: 'none' }}>
              {label}
            </a>
          ))}
          <a href="https://buymeacoffee.com/YOUR_BMC_USERNAME"
             target="_blank" rel="noopener noreferrer"
             style={{
               display: 'inline-flex', alignItems: 'center', gap: 5,
               fontSize: 11, fontWeight: 700,
               background: '#FFDD00', color: '#000',
               padding: '4px 10px', borderRadius: 3,
               textDecoration: 'none',
             }}>
            ☕ Support
          </a>
        </div>
      </footer>

      {/* Global styles for this page */}
      <style>{`
        details summary::-webkit-details-marker { display: none; }
        details[open] > summary > span:last-child { transform: rotate(45deg); display: inline-block; }
      `}</style>
    </div>
  );
}
