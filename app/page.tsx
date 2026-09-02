import type { Metadata } from 'next';
import AnimatedChart from './components/landing/AnimatedChartLoader';

export const metadata: Metadata = {
  title: 'Price Action Trainer — Practice Reading Charts Without Waiting for the Market',
  description:
    'Step through real historical candlestick data bar by bar, commit a directional prediction before each reveal, and track your accuracy across 500+ instruments.',
  openGraph: {
    title: 'Price Action Trainer',
    description:
      'Step through real historical candlestick data bar by bar. Commit before the reveal. Build genuine pattern recognition.',
    url: 'https://price-action-trainer.vercel.app',
    type: 'website',
  },
  twitter: { card: 'summary_large_image' },
  alternates: { canonical: 'https://price-action-trainer.vercel.app/' },
};

// ─── Design tokens ────────────────────────────────────────────────────────────
// All colour decisions live here so they're easy to change.
// bg / surface / raised match the trainer itself for a consistent look.
const T = {
  bg:      '#0a0a0b',
  surface: '#111114',
  raised:  '#18181c',
  border:  'rgba(255,255,255,0.08)',
  text:    '#f0f0f2',
  muted:   '#8a8a94',
  faint:   '#44444c',
  bull:    '#22c55e',
  bear:    '#ef4444',
  amber:   '#f59e0b',
} as const;

// ─── Small shared components ──────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[#44444c] mb-3">
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-[clamp(1.5rem,3vw,2.2rem)] font-bold tracking-[-0.03em] leading-[1.15] text-[#f0f0f2] mb-10">
      {children}
    </h2>
  );
}

function Divider() {
  return <hr className="border-none h-px bg-white/[0.08] mx-[clamp(16px,4vw,64px)]" />;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="font-mono text-[10px] text-[#8a8a94] bg-[#18181c] border border-white/[0.08] border-b-[2px] rounded px-[5px] py-[1px]">
      {children}
    </kbd>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const HOW_STEPS = [
  {
    n: '01',
    title: 'Pick a dataset',
    body: '500+ instruments including stocks, forex, crypto, ETFs, and indices — daily, weekly, and monthly timeframes.',
  },
  {
    n: '02',
    title: 'Hard right edge only',
    body: 'The chart loads at a random point in history. You see 50 bars. Nothing beyond the current bar is visible. Blind mode hides the ticker so prior knowledge of a stock\'s history can\'t bias your read.',
  },
  {
    n: '03',
    title: 'Commit before the reveal',
    body: 'Press B for bullish or L for bearish. Then press → to reveal. Your call is locked the moment you press — there\'s no amending it after you see the outcome.',
  },
  {
    n: '04',
    title: 'Map a trade',
    body: 'Set an entry, take-profit, and stop-loss. The levels draw on the chart as dashed lines and resolve automatically as you step through bars.',
  },
  {
    n: '05',
    title: 'Review your session',
    body: 'Accuracy, bull/bear split, streak data, and a full trade log — showing where your calls are systematically off, not just whether you won or lost.',
  },
] as const;

const METRICS = [
  {
    key: 'Overall accuracy',
    val: '67%',
    cls: 'text-[#22c55e]',
    desc: 'Rolling directional prediction rate across the session',
  },
  {
    key: 'Bull call accuracy',
    val: '71%',
    cls: 'text-[#22c55e]',
    desc: 'How often your bullish calls prove correct',
  },
  {
    key: 'Bear call accuracy',
    val: '52%',
    cls: 'text-[#ef4444]',
    desc: 'A consistent gap here is a detectable bias — and a fixable one',
  },
  {
    key: 'Current streak',
    val: '4 ✦',
    cls: 'text-[#f59e0b]',
    desc: 'Consecutive correct predictions this session',
  },
  {
    key: 'Trade log',
    val: '3 / 5',
    cls: 'text-[#f0f0f2]',
    desc: 'TP hits vs total mapped trades this session',
  },
  {
    key: 'Best R:R taken',
    val: '1 : 3.1',
    cls: 'text-[#f0f0f2]',
    desc: 'Risk-reward ratio on the best resolved trade',
  },
] as const;

const DATASETS = [
  { cls: 'US Equities',     ex: 'AAPL · MSFT · NVDA · TSLA · AMZN · META',  count: '160+', range: '2000–2025' },
  { cls: 'ETFs & Indices',  ex: 'SPY · QQQ · IWM · GLD · TLT · XLK · ARKK', count: '80+',  range: '1995–2025' },
  { cls: 'Forex',           ex: 'EUR/USD · GBP/USD · USD/JPY · AUD/USD',      count: '60+',  range: '2000–2025' },
  { cls: 'Crypto',          ex: 'BTC · ETH · SOL · BNB · DOGE · XRP · AVAX', count: '50+',  range: '2017–2025' },
  { cls: 'Commodities',     ex: 'Gold · Silver · Crude Oil · Natural Gas',    count: '20+',  range: '2005–2025' },
  { cls: 'Global Indices',  ex: 'FTSE · DAX · Nikkei · Hang Seng · ASX 200', count: '15+',  range: '2010–2025' },
] as const;

const FAQS = [
  {
    q: 'Is it free?',
    a: 'Yes. The trainer runs in your browser with no account required. Creating an account saves session progress across devices — your predictions, trades, notes, and position in the dataset. The leaderboard requires an account so sessions can be attributed to you.',
  },
  {
    q: 'How is this different from paper trading?',
    a: 'Paper trading in real time means waiting for each bar to form. On a daily chart that\'s one bar per trading day. Historical replay gives you 200-plus decisions per session. More importantly, you commit a prediction before seeing the outcome — which is what creates a genuine feedback signal. Watching charts in real time lets you stay vague about your expectations, which means you never get the clear right/wrong signal your brain needs to build pattern recognition.',
  },
  {
    q: 'What is blind mode?',
    a: 'Blind mode hides the ticker symbol. If you know you\'re looking at AAPL in 2021, some part of your brain will factor in what you already know about that period. Blind mode removes that shortcut and forces you to read what\'s actually on the chart.',
  },
  {
    q: 'What does noise injection do?',
    a: 'It adds small random perturbations to each bar\'s OHLC values. This prevents you from recognising a specific historical sequence you\'ve already worked through, keeping sessions novel even on datasets you\'ve used before.',
  },
  {
    q: 'Can I review my trades after a session?',
    a: 'Yes. The session summary shows entry, TP, SL, exit price, R:R, and outcome for every mapped trade. Clicking Review on any trade jumps the chart back to your entry bar so you can step forward and watch the move play out against your levels.',
  },
  {
    q: 'How will the leaderboard work?',
    a: 'The weekly leaderboard will rank users by directional accuracy across sessions with 30 or more predictions — a floor to prevent a single lucky session from gaming the rankings. Streak data, total sessions, and best R:R will also be tracked. The board resets at midnight UTC each Monday.',
  },
  {
    q: 'What is price action trading?',
    a: 'Price action trading means making decisions based on how price moves rather than on derived indicators like RSI or MACD. The core skills are reading market structure (higher highs and lows, lower highs and lows), identifying support and resistance levels, and understanding what different candlestick shapes and wick lengths indicate about the balance between buyers and sellers.',
  },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: T.bg, color: T.text, fontFamily: '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif' }}
    >
      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 h-12 flex items-center px-[clamp(16px,4vw,64px)] border-b"
        style={{
          background: 'rgba(10,10,11,0.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderColor: T.border,
        }}
      >
        <a href="/" className="flex items-center gap-2 font-mono text-[12px] font-semibold mr-auto" style={{ color: T.muted }}>
          {/* Pulse dot — signals the app is live, nothing more */}
          <span
            className="w-[6px] h-[6px] rounded-full flex-shrink-0"
            style={{ background: T.bull, animation: 'pulse 2.8s ease-in-out infinite' }}
            aria-hidden="true"
          />
          price-action-trainer
        </a>
        <div className="flex items-center gap-5">
          {[['#how','How it works'],['#leaderboard','Leaderboard'],['/blog/','Blog'],['#faq','FAQ']].map(([href, label]) => (
            <a key={href} href={href} className="text-[13px] transition-colors duration-120 hidden sm:block" style={{ color: T.muted }}>
              {label}
            </a>
          ))}
          <a
            href="/app/"
            className="text-[13px] font-semibold rounded-[6px] px-[14px] py-[5px] transition-opacity duration-120"
            style={{ background: T.text, color: T.bg }}
          >
            Open trainer →
          </a>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section
        className="min-h-screen grid items-center pt-20 pb-16 px-[clamp(16px,4vw,64px)] relative overflow-hidden"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px' }}
      >
        {/* Grid texture — structural, not decorative */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse 90% 80% at 20% 50%, black 20%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(ellipse 90% 80% at 20% 50%, black 20%, transparent 75%)',
          }}
          aria-hidden="true"
        />

        {/* Left column */}
        <div className="relative z-10 max-w-[540px]">
          <div
            className="inline-flex items-center gap-[6px] font-mono text-[10px] font-semibold uppercase tracking-[0.1em] border rounded-[6px] px-[9px] py-[3px] mb-7"
            style={{ color: T.muted, borderColor: T.border }}
          >
            Price action · Deliberate practice
          </div>

          <h1
            className="font-extrabold leading-[1.06] tracking-[-0.04em] mb-5"
            style={{ fontSize: 'clamp(2.4rem, 5vw, 4rem)' }}
          >
            Learn to read charts
            <span
              className="block font-normal mt-2 leading-[1.25]"
              style={{ fontSize: '0.6em', color: T.muted, letterSpacing: '-0.02em' }}
            >
              by making real predictions,<br />not watching outcomes.
            </span>
          </h1>

          <p className="text-[15px] leading-[1.7] mb-8 max-w-[440px]" style={{ color: T.muted }}>
            Most chart practice is passive — you watch a move happen and reason about it after the fact.
            This trainer forces you to commit a directional call before each bar reveals.
            You get 200-plus locked predictions per session, and a running score that shows exactly
            where your reading breaks down.
          </p>

          <div className="flex items-center gap-3 mb-9 flex-wrap">
            <a
              href="/app/"
              className="inline-flex items-center gap-2 text-[14px] font-semibold rounded-[6px] px-[22px] py-[10px] transition-opacity"
              style={{ background: T.text, color: T.bg }}
            >
              Start training
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                <path d="M2 6.5h9M7 2l4.5 4.5L7 11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a
              href="#how"
              className="inline-flex items-center gap-2 text-[13px] rounded-[6px] px-[16px] py-[9px] border transition-colors"
              style={{ color: T.muted, borderColor: T.border }}
            >
              How it works
            </a>
          </div>

          {/* Keyboard shortcuts row — product identity */}
          <div className="flex items-center gap-[6px] flex-wrap" aria-label="Keyboard shortcuts in the trainer">
            {[['→','reveal bar'],['B','bullish'],['L','bearish'],['E','set trade'],['Tab','summary']].map(([key, label], i, arr) => (
              <span key={key} className="flex items-center gap-[6px]">
                <span className="flex items-center gap-[5px] text-[11px]" style={{ color: T.faint }}>
                  <Kbd>{key}</Kbd> {label}
                </span>
                {i < arr.length - 1 && <span style={{ color: T.faint }} aria-hidden="true">·</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Right column — animated trainer preview */}
        <div className="relative z-10 flex justify-end items-center">
          <AnimatedChart />
        </div>
      </section>

      <Divider />

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section
        id="how"
        className="max-w-[1080px] mx-auto px-[clamp(16px,4vw,64px)] py-20"
      >
        <SectionLabel>How a session works</SectionLabel>
        <SectionTitle>Five steps. No hand-holding.</SectionTitle>

        <div
          className="border rounded-lg overflow-hidden"
          style={{ borderColor: T.border }}
        >
          {HOW_STEPS.map((step, i) => (
            <div
              key={step.n}
              className="flex gap-4 px-[18px] py-[22px] transition-colors"
              style={{
                borderBottom: i < HOW_STEPS.length - 1 ? `1px solid ${T.border}` : 'none',
              }}
            >
              <span
                className="font-mono text-[10px] font-semibold flex-shrink-0 mt-[2px] w-6"
                style={{ color: T.faint }}
              >
                {step.n}
              </span>
              <div>
                <h3 className="text-[13px] font-bold mb-[5px]">{step.title}</h3>
                <p className="text-[12px] leading-[1.6]" style={{ color: T.muted }}>
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── Why it works ─────────────────────────────────────────────────── */}
      <section className="max-w-[1080px] mx-auto px-[clamp(16px,4vw,64px)] py-20">
        <SectionLabel>Why it works</SectionLabel>
        <SectionTitle>
          Watching charts builds familiarity.{' '}
          <span style={{ color: T.muted }}>Committing before the reveal builds skill.</span>
        </SectionTitle>

        <div className="grid gap-12" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div className="space-y-4">
            <p className="text-[15px] leading-[1.75]" style={{ color: T.muted }}>
              When the outcome is already visible on the chart, you can construct a plausible explanation
              for any move without ever having predicted it. That's not a skill — it's hindsight narrative.
              The feedback loop is zero.
            </p>
            <p className="text-[15px] leading-[1.75]" style={{ color: T.muted }}>
              Real-time paper trading is better, but a daily chart gives you one bar per trading day.
              Getting to 200 meaningful reps would take roughly eight months, and you'd still have no
              mechanism for forcing yourself to commit before the bar closes.
            </p>
            <p className="text-[15px] leading-[1.75]" style={{ color: T.muted }}>
              The trainer compresses time and imposes the commitment. Every <Kbd>→</Kbd> keypress is a
              judgment — right or wrong, permanently recorded. That's the signal your brain actually
              needs to develop pattern recognition in price structure.
            </p>
          </div>

          {/* Passive vs deliberate comparison */}
          <div
            className="border rounded-lg overflow-hidden text-[12px]"
            style={{ borderColor: T.border }}
            aria-label="Comparison of passive watching versus deliberate practice"
          >
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {/* Headers */}
              <div
                className="px-[18px] pt-[16px] pb-[12px] border-b border-r font-mono text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ borderColor: T.border, color: T.bear }}
              >
                Passive watching
              </div>
              <div
                className="px-[18px] pt-[16px] pb-[12px] border-b font-mono text-[10px] font-semibold uppercase tracking-[0.08em]"
                style={{ borderColor: T.border, color: T.bull }}
              >
                This trainer
              </div>

              {/* Rows */}
              {[
                ['Outcome always visible',          'Hard right edge — nothing beyond the current bar'],
                ['No commitment required',           'Prediction locked before the bar reveals'],
                ['Hindsight explains everything',   'Immediate right/wrong signal on every call'],
                ['1 bar per day on daily charts',   '200-plus decisions in a single session'],
                ['Biases stay invisible',            'Bull/bear accuracy split surfaces them directly'],
              ].map(([bad, good], i, arr) => (
                <div key={i} className="contents">
                  <div
                    className="flex items-start gap-2 px-[18px] py-[12px] border-r"
                    style={{
                      borderColor: T.border,
                      borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none',
                    }}
                  >
                    <span style={{ color: T.bear, flexShrink: 0 }} aria-hidden="true">✕</span>
                    <span style={{ color: T.muted, lineHeight: 1.55 }}>{bad}</span>
                  </div>
                  <div
                    className="flex items-start gap-2 px-[18px] py-[12px]"
                    style={{
                      borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none',
                      borderColor: T.border,
                    }}
                  >
                    <span style={{ color: T.bull, flexShrink: 0 }} aria-hidden="true">✓</span>
                    <span style={{ color: T.muted, lineHeight: 1.55 }}>{good}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Session tracking ──────────────────────────────────────────────── */}
      <section className="max-w-[1080px] mx-auto px-[clamp(16px,4vw,64px)] py-20">
        <SectionLabel>Session tracking</SectionLabel>
        <SectionTitle>
          Find the biases{' '}
          <span style={{ color: T.muted }}>you didn't know you had.</span>
        </SectionTitle>

        <div
          className="grid rounded-lg overflow-hidden border"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 1,
            background: T.border,
            borderColor: T.border,
          }}
        >
          {METRICS.map(({ key, val, cls, desc }) => (
            <div key={key} className="p-[22px]" style={{ background: T.bg }}>
              <p className="font-mono text-[9px] font-semibold uppercase tracking-[0.08em] mb-2" style={{ color: T.faint }}>
                {key}
              </p>
              <p className={`font-mono text-[26px] font-bold tracking-[-0.02em] mb-1 ${cls}`}>
                {val}
              </p>
              <p className="text-[11px] leading-[1.5]" style={{ color: T.faint }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Divider />

      {/* ── Leaderboard — honest empty state ─────────────────────────────── */}
      <section
        id="leaderboard"
        className="max-w-[1080px] mx-auto px-[clamp(16px,4vw,64px)] py-20"
      >
        <SectionLabel>Community leaderboard</SectionLabel>
        <SectionTitle>
          Weekly accuracy rankings.{' '}
          <span style={{ color: T.muted }}>Be among the first.</span>
        </SectionTitle>

        <div className="border rounded-lg overflow-hidden" style={{ borderColor: T.border }}>
          {/* Column headers */}
          <div
            className="grid px-4 py-[9px] border-b font-mono text-[9px] font-semibold uppercase tracking-[0.07em]"
            style={{
              gridTemplateColumns: '40px 1fr 80px 70px 70px 70px',
              borderColor: T.border,
              background: T.raised,
              color: T.faint,
            }}
            aria-hidden="true"
          >
            <span>#</span>
            <span>Trader</span>
            <span>Accuracy</span>
            <span>Sessions</span>
            <span>Streak</span>
            <span>Best R:R</span>
          </div>

          {/* Empty state */}
          <div className="flex flex-col items-center text-center px-6 py-14 gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center text-lg border"
              style={{ borderColor: T.border }}
              aria-hidden="true"
            >
              📊
            </div>
            <p className="text-[14px] font-semibold">No rankings yet</p>
            <p className="text-[13px] leading-[1.65] max-w-[360px]" style={{ color: T.muted }}>
              The leaderboard ranks weekly directional accuracy across sessions with 30 or more predictions.
              Create an account so your sessions are counted.
            </p>
            <a
              href="/app/"
              className="inline-flex items-center gap-2 text-[13px] font-semibold rounded-[6px] px-[18px] py-[8px] mt-1 transition-opacity"
              style={{ background: T.text, color: T.bg }}
            >
              Train now to claim your spot
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                <path d="M1.5 6h9M6.5 1.5L11 6l-4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
          </div>

          {/* Footer note */}
          <div
            className="px-4 py-[10px] border-t font-mono text-[10px] leading-[1.5]"
            style={{ borderColor: T.border, color: T.faint }}
          >
            Resets midnight UTC each Monday · Minimum 30 predictions per session · Account required
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Datasets ─────────────────────────────────────────────────────── */}
      <section className="max-w-[1080px] mx-auto px-[clamp(16px,4vw,64px)] py-20">
        <SectionLabel>Dataset library</SectionLabel>
        <SectionTitle>
          500+ instruments, pre-loaded.{' '}
          <span style={{ color: T.muted }}>No API key. No setup.</span>
        </SectionTitle>

        <div
          className="grid rounded-lg overflow-hidden border mb-3"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 1,
            background: T.border,
            borderColor: T.border,
          }}
        >
          {DATASETS.map(({ cls, ex, count, range }) => (
            <div
              key={cls}
              className="p-5 transition-colors"
              style={{ background: T.bg }}
            >
              <p className="text-[13px] font-bold mb-[6px]">{cls}</p>
              <p className="font-mono text-[10px] leading-[1.7] mb-[10px]" style={{ color: T.faint }}>
                {ex}
              </p>
              <div className="flex items-center gap-[10px]">
                <span className="font-mono text-[14px] font-bold">{count}</span>
                <span className="font-mono text-[10px]" style={{ color: T.faint }}>{range}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="font-mono text-[11px]" style={{ color: T.faint }}>
          Daily · Weekly · Monthly timeframes. Historical ranges vary by instrument.
        </p>
      </section>

      <Divider />

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section
        id="faq"
        className="max-w-[1080px] mx-auto px-[clamp(16px,4vw,64px)] py-20"
      >
        <SectionLabel>Questions</SectionLabel>
        <div className="max-w-[700px]">
          {FAQS.map(({ q, a }, i) => (
            <details
              key={q}
              className="group"
              style={{ borderBottom: `1px solid ${T.border}`, ...(i === 0 ? { borderTop: `1px solid ${T.border}` } : {}) }}
            >
              <summary
                className="flex justify-between items-center py-[17px] text-[14px] font-semibold cursor-pointer list-none select-none"
                style={{ color: T.text }}
              >
                {q}
                <span
                  className="text-[17px] font-light flex-shrink-0 ml-4 transition-transform group-open:rotate-45"
                  style={{ color: T.faint }}
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p
                className="pb-[18px] text-[14px] leading-[1.75]"
                style={{ color: T.muted }}
              >
                {a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${T.border}` }}>
        <div className="max-w-[1080px] mx-auto px-[clamp(16px,4vw,64px)] py-24">
          <div className="max-w-[520px]">
            <h2
              className="font-extrabold tracking-[-0.04em] leading-[1.08] mb-4"
              style={{ fontSize: 'clamp(2rem,4vw,3rem)' }}
            >
              200 reps per session.
            </h2>
            <p
              className="text-[15px] leading-[1.7] mb-8"
              style={{ color: T.muted }}
            >
              No download, no sign-up required. Pick a dataset, press <Kbd>→</Kbd>, and start building
              the kind of reading ability that only comes from making predictions with skin in the game.
            </p>
            <div className="flex gap-3 flex-wrap">
              <a
                href="/app/"
                className="inline-flex items-center gap-2 text-[14px] font-semibold rounded-[6px] px-[22px] py-[10px] transition-opacity"
                style={{ background: T.text, color: T.bg }}
              >
                Open the trainer
                <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <path d="M2 6.5h9M7 2l4.5 4.5L7 11" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
              <a
                href="/blog/"
                className="inline-flex items-center gap-2 text-[13px] rounded-[6px] px-[16px] py-[9px] border transition-colors"
                style={{ color: T.muted, borderColor: T.border }}
              >
                Read the blog
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer
        className="flex justify-between items-center flex-wrap gap-3 px-[clamp(16px,4vw,64px)] py-6"
        style={{ borderTop: `1px solid ${T.border}` }}
      >
        <span className="font-mono text-[11px]" style={{ color: T.faint }}>
          © 2026 price-action-trainer.vercel.app
        </span>
        <div className="flex items-center gap-5">
          {[['/blog/', 'Blog'],['/app/', 'Train'],['#faq', 'FAQ']].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="text-[12px] transition-colors"
              style={{ color: T.faint }}
            >
              {label}
            </a>
          ))}
          <a
            href="https://buymeacoffee.com/YOUR_BMC_USERNAME"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-[5px] text-[11px] font-bold px-[10px] py-[4px] rounded transition-opacity"
            style={{ background: '#FFDD00', color: '#000' }}
          >
            ☕ Support
          </a>
        </div>
      </footer>

      {/* Global styles scoped to this page */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.35; }
        }
        details summary::-webkit-details-marker { display: none; }
        details[open] summary > span { transform: rotate(45deg); }
      `}</style>
    </div>
  );
}
