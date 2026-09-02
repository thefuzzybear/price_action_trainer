import type { Metadata } from 'next';
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

// ─── Empyrean colour tokens ───────────────────────────────────────────────────
// Parchment cream on near-black, maroon as the sole accent.
// Green/red for bull/bear are trading conventions — not brand colours.
const E = {
  bg:       '#0D0B09',   // near-black with warmth
  surface:  '#13100D',   // card / panel surfaces
  raised:   '#1C1713',   // nav, titlebar
  parchment:'#F5F0E8',   // primary text — warm cream
  cream:    '#E8E0D0',   // secondary text
  muted:    '#9E8E7A',   // supporting text
  faint:    '#5A4F43',   // labels, borders light
  maroon:   '#6B1A2A',   // Empyrean accent — the only colour
  maroonFg: '#E8B4BE',   // maroon-on-dark readable text
  border:   'rgba(107,26,42,0.2)',  // maroon-tinted fine rule
  borderSub:'rgba(245,240,232,0.06)', // ultra-faint warm rule
  bull:     '#22c55e',
  bear:     '#ef4444',
  amber:    '#C8941A',   // warm gold for streak
} as const;

// Serif stack — classical feel, zero font loading
const SERIF = '"Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif';
const MONO  = '"SF Mono", "Fira Code", Consolas, monospace';
const SANS  = '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", system-ui, sans-serif';

// ─── Shared micro-components ──────────────────────────────────────────────────
function OmegaMark({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      className={className}
      style={{ fontFamily: SERIF, fontSize: size, color: E.maroon, lineHeight: 1, fontWeight: 700, userSelect: 'none' }}
      aria-hidden="true"
    >
      Ω
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[10px] font-semibold uppercase tracking-[0.14em] mb-3"
      style={{ fontFamily: MONO, color: E.faint }}
    >
      {children}
    </p>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="mb-10 leading-[1.15]"
      style={{
        fontFamily: SERIF,
        fontSize: 'clamp(1.6rem, 3vw, 2.4rem)',
        fontWeight: 400,               // serifs read beautifully at regular weight
        letterSpacing: '-0.01em',
        color: E.parchment,
      }}
    >
      {children}
    </h2>
  );
}

function Rule() {
  return <hr className="border-none h-px" style={{ background: E.borderSub }} />;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd
      style={{
        fontFamily: MONO, fontSize: 10, color: E.muted,
        background: E.raised, border: `1px solid ${E.border}`,
        borderBottomWidth: 2, borderRadius: 3,
        padding: '1px 6px', lineHeight: 1.6,
      }}
    >
      {children}
    </kbd>
  );
}

// Chip-style label (inspired by HeroUI Chip secondary variant, custom maroon palette)
function EyebrowChip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.12em] rounded-[4px] px-3 py-[4px] mb-7"
      style={{
        fontFamily: MONO,
        color: E.maroonFg,
        background: 'rgba(107,26,42,0.12)',
        border: `1px solid rgba(107,26,42,0.35)`,
      }}
    >
      <OmegaMark size={11} />
      {children}
    </span>
  );
}

// Primary CTA button — maroon fill
function BtnPrimary({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 text-[13px] font-semibold rounded-[5px] px-5 py-[10px] transition-opacity hover:opacity-85"
      style={{ background: E.maroon, color: E.parchment, fontFamily: SANS }}
    >
      {children}
    </a>
  );
}

// Ghost button — parchment border
function BtnGhost({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-2 text-[13px] rounded-[5px] px-4 py-[9px] transition-colors hover:border-[rgba(245,240,232,0.2)]"
      style={{ color: E.muted, border: `1px solid ${E.borderSub}`, fontFamily: SANS }}
    >
      {children}
    </a>
  );
}

const Arrow = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path d="M1.5 6h9M6.5 1.5L11 6l-4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

// ─── Page data ────────────────────────────────────────────────────────────────
const HOW_STEPS = [
  {
    n: '01',
    title: 'Pick a dataset',
    body: '500+ instruments including equities, forex, crypto, ETFs, and global indices — across daily, weekly, and monthly timeframes.',
  },
  {
    n: '02',
    title: 'Hard right edge only',
    body: "The chart loads at a random point in history. You see 50 bars, nothing beyond the current one. Blind mode hides the ticker so prior knowledge of a stock's history can't influence your read.",
  },
  {
    n: '03',
    title: 'Commit before the reveal',
    body: "Press B for bullish or L for bearish. Then press → to reveal the next bar. Your call is locked the moment you press — there's no amending it after you see the outcome.",
  },
  {
    n: '04',
    title: 'Map a trade',
    body: 'Set entry, take-profit, and stop-loss. The levels draw on the chart as dashed lines and resolve automatically as you step through bars.',
  },
  {
    n: '05',
    title: 'Review the session',
    body: 'Accuracy, bull/bear split, streak data, and a full trade log — showing where your calls are systematically off, not just whether the last session went well.',
  },
] as const;

const METRICS = [
  { key: 'Overall accuracy',    val: '67%',    color: E.bull,   desc: 'Rolling directional prediction rate across the session' },
  { key: 'Bull call accuracy',  val: '71%',    color: E.bull,   desc: 'How often your bullish calls prove correct' },
  { key: 'Bear call accuracy',  val: '52%',    color: E.bear,   desc: 'A consistent gap here is a detectable bias — and a fixable one' },
  { key: 'Current streak',      val: '4 ✦',    color: E.amber,  desc: 'Consecutive correct predictions this session' },
  { key: 'Trade log',           val: '3 / 5',  color: E.parchment, desc: 'TP hits vs total mapped trades this session' },
  { key: 'Best R:R taken',      val: '1 : 3.1',color: E.parchment, desc: 'Risk-reward on the best resolved trade this session' },
] as const;

const DATASETS = [
  { cls: 'US Equities',    ex: 'AAPL · MSFT · NVDA · TSLA · AMZN · META',  count: '160+', range: '2000–2025' },
  { cls: 'ETFs & Indices', ex: 'SPY · QQQ · IWM · GLD · TLT · XLK · ARKK', count: '80+',  range: '1995–2025' },
  { cls: 'Forex',          ex: 'EUR/USD · GBP/USD · USD/JPY · AUD/USD',     count: '60+',  range: '2000–2025' },
  { cls: 'Crypto',         ex: 'BTC · ETH · SOL · BNB · DOGE · XRP · AVAX',count: '50+',  range: '2017–2025' },
  { cls: 'Commodities',    ex: 'Gold · Silver · Crude Oil · Natural Gas',   count: '20+',  range: '2005–2025' },
  { cls: 'Global Indices', ex: 'FTSE · DAX · Nikkei · Hang Seng · ASX 200',count: '15+',  range: '2010–2025' },
] as const;

const FAQS = [
  {
    q: 'Is it free?',
    a: 'Yes. The trainer runs in your browser with no account required. Creating an account saves session progress across devices — your predictions, trades, notes, and position in the dataset. The leaderboard requires an account so sessions can be attributed.',
  },
  {
    q: 'How is this different from paper trading?',
    a: "Paper trading in real time means waiting for each bar to form. On a daily chart that's one bar per trading day. Historical replay gives you 200-plus decisions per session. More importantly, you commit a prediction before seeing the outcome — which is what creates a genuine feedback signal. Watching charts in real time lets you stay vague about your expectations, which means you never get the clear right/wrong signal needed to build pattern recognition.",
  },
  {
    q: 'What is blind mode?',
    a: "Blind mode hides the ticker symbol. If you know you're looking at AAPL in 2021, some part of your brain will factor in what you already know about that period. Blind mode removes that shortcut and forces you to read what's actually on the chart.",
  },
  {
    q: 'What does noise injection do?',
    a: "It adds small random perturbations to each bar's OHLC values. This prevents you from recognising a specific historical sequence you've already worked through, keeping sessions novel even on datasets you've used before.",
  },
  {
    q: 'Can I review trades after a session?',
    a: 'Yes. The session summary shows entry, TP, SL, exit price, R:R, and outcome for every mapped trade. Clicking Review on any trade jumps the chart back to your entry bar so you can step forward and watch the move play out against your levels.',
  },
  {
    q: 'How will the leaderboard work?',
    a: 'The weekly leaderboard will rank users by directional accuracy across sessions with 30 or more predictions — a floor to prevent a single lucky session from gaming the rankings. Streak data, total sessions, and best R:R will also be tracked. The board resets at midnight UTC each Monday.',
  },
  {
    q: 'What is price action trading?',
    a: "Price action trading means making decisions based on how price moves rather than on derived indicators like RSI or MACD. The core skills are reading market structure — higher highs and lows, support and resistance zones — and understanding what different candlestick shapes and wick lengths indicate about the balance between buyers and sellers.",
  },
] as const;

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  const px = 'px-[clamp(20px,5vw,80px)]';

  return (
    <div
      className="min-h-screen"
      style={{ background: E.bg, color: E.parchment, fontFamily: SANS }}
    >

      {/* ── Nav ────────────────────────────────────────────────────────── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 h-12 flex items-center ${px}`}
        style={{
          background: `rgba(13,11,9,0.9)`,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${E.border}`,
        }}
      >
        {/* Logotype */}
        <a href="/" className="flex items-center gap-2 mr-auto group" aria-label="Empyrean home">
          <OmegaMark size={18} />
          <span
            className="text-[13px] font-semibold tracking-[0.18em] uppercase"
            style={{ fontFamily: SERIF, color: E.cream, letterSpacing: '0.18em' }}
          >
            Empyrean
          </span>
        </a>

        <div className="flex items-center gap-6">
          {[
            ['#how',         'Method'],
            ['#leaderboard', 'Rankings'],
            ['/blog/',       'Blog'],
            ['#faq',         'FAQ'],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="text-[12px] tracking-wide transition-colors hover:text-[#E8E0D0] hidden sm:block"
              style={{ color: E.muted, fontFamily: SANS }}
            >
              {label}
            </a>
          ))}
          <a
            href="/app/"
            className="text-[12px] font-semibold rounded-[4px] px-4 py-[5px] tracking-wide transition-opacity hover:opacity-85"
            style={{ background: E.maroon, color: E.parchment }}
          >
            Open trainer
          </a>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section
        className={`min-h-screen grid items-center pt-24 pb-20 ${px} relative overflow-hidden`}
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '64px' }}
      >
        {/* Fine grid — parchment lines at extremely low opacity */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: [
              `linear-gradient(rgba(245,240,232,0.03) 1px, transparent 1px)`,
              `linear-gradient(90deg, rgba(245,240,232,0.03) 1px, transparent 1px)`,
            ].join(', '),
            backgroundSize: '52px 52px',
            maskImage: 'radial-gradient(ellipse 85% 75% at 15% 50%, black 15%, transparent 72%)',
            WebkitMaskImage: 'radial-gradient(ellipse 85% 75% at 15% 50%, black 15%, transparent 72%)',
          }}
          aria-hidden="true"
        />
        {/* Maroon vignette from top — barely perceptible depth */}
        <div
          className="absolute top-0 left-0 right-0 h-[1px] pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${E.maroon}, transparent)`, opacity: 0.4 }}
          aria-hidden="true"
        />

        {/* Left — copy */}
        <div className="relative z-10 max-w-[520px]">
          <EyebrowChip>Price Action · Deliberate Practice</EyebrowChip>

          <h1
            className="mb-5 leading-[1.08]"
            style={{
              fontFamily: SERIF,
              fontSize: 'clamp(2.6rem, 5.5vw, 4.4rem)',
              fontWeight: 400,
              letterSpacing: '-0.02em',
              color: E.parchment,
            }}
          >
            Learn to read charts
            <span
              className="block mt-2"
              style={{
                fontSize: '0.58em',
                color: E.muted,
                fontWeight: 400,
                letterSpacing: '0',
                lineHeight: 1.35,
              }}
            >
              by making predictions,<br />not rationalising outcomes.
            </span>
          </h1>

          <p
            className="leading-[1.75] mb-8 max-w-[440px]"
            style={{ fontSize: 15, color: E.muted }}
          >
            Most chart practice is passive — you watch a move happen and construct an explanation
            after the fact. This trainer forces you to commit a directional call before each bar
            reveals. You get 200-plus locked decisions per session and a running score that shows
            precisely where your reading breaks down.
          </p>

          <div className="flex items-center gap-3 mb-8 flex-wrap">
            <BtnPrimary href="/app/">
              Start training <Arrow />
            </BtnPrimary>
            <BtnGhost href="#how">How it works</BtnGhost>
          </div>

          {/* Keyboard controls — product identity */}
          <div className="flex items-center gap-[6px] flex-wrap" aria-label="Trainer keyboard shortcuts">
            {[['→','reveal'],['B','bullish'],['L','bearish'],['E','set trade'],['Tab','summary']].map(([k, l], i, a) => (
              <span key={k} className="flex items-center gap-[6px]">
                <span className="flex items-center gap-[5px] text-[11px]" style={{ color: E.faint }}>
                  <Kbd>{k}</Kbd> {l}
                </span>
                {i < a.length - 1 && <span style={{ color: E.faint }} aria-hidden="true">·</span>}
              </span>
            ))}
          </div>
        </div>

        {/* Right — animated chart preview */}
        <div className="relative z-10 flex justify-end items-center">
          <AnimatedChart />
        </div>
      </section>

      <Rule />

      {/* ── How a session works ─────────────────────────────────────────── */}
      <section id="how" className={`max-w-[1080px] mx-auto ${px} py-20`}>
        <SectionLabel>Method</SectionLabel>
        <SectionTitle>How a session works</SectionTitle>

        <div
          className="rounded-[6px] overflow-hidden"
          style={{ border: `1px solid ${E.border}` }}
        >
          {HOW_STEPS.map((step, i) => (
            <div
              key={step.n}
              className="flex gap-5 px-5 py-5 transition-colors hover:bg-[rgba(107,26,42,0.04)]"
              style={{ borderBottom: i < HOW_STEPS.length - 1 ? `1px solid ${E.border}` : 'none' }}
            >
              <span
                className="text-[10px] font-semibold flex-shrink-0 mt-[3px] w-6 tabular-nums"
                style={{ fontFamily: MONO, color: E.maroon, opacity: 0.7 }}
              >
                {step.n}
              </span>
              <div>
                <h3
                  className="text-[14px] font-semibold mb-[5px]"
                  style={{ fontFamily: SERIF, fontWeight: 600, color: E.cream }}
                >
                  {step.title}
                </h3>
                <p className="text-[13px] leading-[1.65]" style={{ color: E.muted }}>
                  {step.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Rule />

      {/* ── Why it works ────────────────────────────────────────────────── */}
      <section className={`max-w-[1080px] mx-auto ${px} py-20`}>
        <SectionLabel>Principle</SectionLabel>
        <SectionTitle>
          Familiarity is not skill.
          <span style={{ color: E.muted }}> The difference is commitment.</span>
        </SectionTitle>

        <div className="grid gap-14" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          <div className="space-y-5">
            <p className="text-[15px] leading-[1.8]" style={{ color: E.muted }}>
              When the outcome is already visible on the chart, you can construct a plausible
              explanation for any move without ever having predicted it. That's not skill — it's
              hindsight narrative. The feedback loop is zero.
            </p>
            <p className="text-[15px] leading-[1.8]" style={{ color: E.muted }}>
              Real-time paper trading is better, but a daily chart gives you one bar per trading
              day. Getting to 200 meaningful reps would take roughly eight months, and you'd still
              have no mechanism for forcing the commitment before a bar closes.
            </p>
            <p className="text-[15px] leading-[1.8]" style={{ color: E.muted }}>
              The trainer compresses time and imposes the commitment. Every <Kbd>→</Kbd> is a
              judgment — right or wrong, permanently recorded. That's the signal your brain needs
              to build genuine pattern recognition in price structure.
            </p>
          </div>

          {/* Passive vs deliberate — fine-ruled comparison table */}
          <div
            className="rounded-[6px] overflow-hidden text-[12px]"
            style={{ border: `1px solid ${E.border}` }}
            aria-label="Passive watching compared with deliberate practice"
          >
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              {/* Column headers */}
              <div
                className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ fontFamily: MONO, color: E.bear, borderBottom: `1px solid ${E.border}`, borderRight: `1px solid ${E.border}` }}
              >
                Passive watching
              </div>
              <div
                className="px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.1em]"
                style={{ fontFamily: MONO, color: E.bull, borderBottom: `1px solid ${E.border}` }}
              >
                This trainer
              </div>

              {[
                ['Outcome always visible',        'Hard right edge — nothing beyond the current bar'],
                ['No commitment required',         'Prediction locked before the bar reveals'],
                ['Hindsight explains everything', 'Immediate right/wrong signal on every call'],
                ['1 bar per day on daily charts', '200-plus decisions in a single session'],
                ['Biases stay invisible',          'Bull/bear accuracy split surfaces them directly'],
              ].map(([bad, good], i, arr) => (
                <div key={i} className="contents">
                  <div
                    className="flex items-start gap-2 px-4 py-3"
                    style={{
                      borderRight: `1px solid ${E.border}`,
                      borderBottom: i < arr.length - 1 ? `1px solid ${E.border}` : 'none',
                    }}
                  >
                    <span style={{ color: E.bear, flexShrink: 0, marginTop: 1 }}>✕</span>
                    <span style={{ color: E.muted, lineHeight: 1.55 }}>{bad}</span>
                  </div>
                  <div
                    className="flex items-start gap-2 px-4 py-3"
                    style={{ borderBottom: i < arr.length - 1 ? `1px solid ${E.border}` : 'none' }}
                  >
                    <span style={{ color: E.bull, flexShrink: 0, marginTop: 1 }}>✓</span>
                    <span style={{ color: E.muted, lineHeight: 1.55 }}>{good}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <Rule />

      {/* ── Session metrics ──────────────────────────────────────────────── */}
      <section className={`max-w-[1080px] mx-auto ${px} py-20`}>
        <SectionLabel>Tracking</SectionLabel>
        <SectionTitle>
          Find the biases
          <span style={{ color: E.muted }}> you didn't know you had.</span>
        </SectionTitle>

        <div
          className="grid rounded-[6px] overflow-hidden"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 1,
            background: E.border,
            border: `1px solid ${E.border}`,
          }}
        >
          {METRICS.map(({ key, val, color, desc }) => (
            <div key={key} className="p-5" style={{ background: E.bg }}>
              <p
                className="text-[9px] font-semibold uppercase tracking-[0.1em] mb-2"
                style={{ fontFamily: MONO, color: E.faint }}
              >
                {key}
              </p>
              <p
                className="text-[26px] font-bold tracking-[-0.02em] mb-1"
                style={{ fontFamily: MONO, color }}
              >
                {val}
              </p>
              <p className="text-[11px] leading-[1.5]" style={{ color: E.faint }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <Rule />

      {/* ── Leaderboard empty state ──────────────────────────────────────── */}
      <section id="leaderboard" className={`max-w-[1080px] mx-auto ${px} py-20`}>
        <SectionLabel>Rankings</SectionLabel>
        <SectionTitle>
          Weekly accuracy.
          <span style={{ color: E.muted }}> Be among the first.</span>
        </SectionTitle>

        <div className="rounded-[6px] overflow-hidden" style={{ border: `1px solid ${E.border}` }}>
          {/* Column headers */}
          <div
            className="grid px-4 py-[9px] text-[9px] font-semibold uppercase tracking-[0.09em]"
            style={{
              fontFamily: MONO,
              gridTemplateColumns: '40px 1fr 80px 70px 70px 70px',
              background: E.raised,
              borderBottom: `1px solid ${E.border}`,
              color: E.faint,
            }}
            aria-hidden="true"
          >
            {['#','Trader','Accuracy','Sessions','Streak','Best R:R'].map(h => (
              <span key={h}>{h}</span>
            ))}
          </div>

          {/* Honest empty state */}
          <div className="flex flex-col items-center text-center px-6 py-16 gap-4">
            <OmegaMark size={32} />
            <p className="text-[15px] font-semibold" style={{ fontFamily: SERIF, fontWeight: 600, color: E.cream }}>
              No rankings yet
            </p>
            <p className="text-[13px] leading-[1.7] max-w-[380px]" style={{ color: E.muted }}>
              The leaderboard ranks weekly directional accuracy across sessions with 30 or more
              predictions. Create an account so your sessions are counted toward the rankings.
            </p>
            <BtnPrimary href="/app/">
              Train now to claim your spot <Arrow />
            </BtnPrimary>
          </div>

          <div
            className="px-4 py-[10px] text-[10px] leading-[1.5]"
            style={{
              fontFamily: MONO,
              borderTop: `1px solid ${E.border}`,
              color: E.faint,
            }}
          >
            Resets midnight UTC each Monday · Minimum 30 predictions per session · Account required
          </div>
        </div>
      </section>

      <Rule />

      {/* ── Dataset library ──────────────────────────────────────────────── */}
      <section className={`max-w-[1080px] mx-auto ${px} py-20`}>
        <SectionLabel>Instruments</SectionLabel>
        <SectionTitle>
          500+ datasets, pre-loaded.
          <span style={{ color: E.muted }}> No API key. No setup.</span>
        </SectionTitle>

        <div
          className="grid rounded-[6px] overflow-hidden mb-3"
          style={{
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 1,
            background: E.border,
            border: `1px solid ${E.border}`,
          }}
        >
          {DATASETS.map(({ cls, ex, count, range }) => (
            <div
              key={cls}
              className="p-5 transition-colors hover:bg-[rgba(107,26,42,0.04)]"
              style={{ background: E.bg }}
            >
              <p className="text-[13px] font-semibold mb-[6px]" style={{ fontFamily: SERIF, color: E.cream }}>
                {cls}
              </p>
              <p className="text-[10px] leading-[1.75] mb-[10px]" style={{ fontFamily: MONO, color: E.faint }}>
                {ex}
              </p>
              <div className="flex items-baseline gap-[10px]">
                <span className="text-[14px] font-bold" style={{ fontFamily: MONO, color: E.parchment }}>
                  {count}
                </span>
                <span className="text-[10px]" style={{ fontFamily: MONO, color: E.faint }}>{range}</span>
              </div>
            </div>
          ))}
        </div>
        <p className="text-[11px]" style={{ fontFamily: MONO, color: E.faint }}>
          Daily · Weekly · Monthly timeframes. Historical coverage varies by instrument.
        </p>
      </section>

      <Rule />

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section id="faq" className={`max-w-[1080px] mx-auto ${px} py-20`}>
        <SectionLabel>Questions</SectionLabel>
        <div className="max-w-[700px]">
          {FAQS.map(({ q, a }, i) => (
            <details
              key={q}
              className="group"
              style={{
                borderBottom: `1px solid ${E.border}`,
                ...(i === 0 ? { borderTop: `1px solid ${E.border}` } : {}),
              }}
            >
              <summary
                className="flex justify-between items-center py-[17px] text-[14px] cursor-pointer list-none select-none"
                style={{ fontFamily: SERIF, fontWeight: 600, color: E.cream }}
              >
                {q}
                <span
                  className="flex-shrink-0 ml-4 text-[16px] font-light transition-transform group-open:rotate-45"
                  style={{ color: E.faint }}
                  aria-hidden="true"
                >
                  +
                </span>
              </summary>
              <p className="pb-5 text-[13px] leading-[1.8]" style={{ color: E.muted }}>
                {a}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${E.border}` }}>
        <div className={`max-w-[1080px] mx-auto ${px} py-28`}>
          <div className="max-w-[500px]">
            <OmegaMark size={36} className="mb-5 block" />
            <h2
              className="mb-4 leading-[1.1]"
              style={{
                fontFamily: SERIF,
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 400,
                letterSpacing: '-0.02em',
                color: E.parchment,
              }}
            >
              200 predictions per session.
            </h2>
            <p className="text-[15px] leading-[1.75] mb-8" style={{ color: E.muted }}>
              No download, no sign-up required. Pick a dataset, press <Kbd>→</Kbd>, and start
              building the kind of reading that only comes from making calls with something at
              stake — even if that something is just your score.
            </p>
            <div className="flex gap-3 flex-wrap">
              <BtnPrimary href="/app/">
                Open the trainer <Arrow />
              </BtnPrimary>
              <BtnGhost href="/blog/">Read the blog</BtnGhost>
            </div>
          </div>
        </div>
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer
        className={`flex justify-between items-center flex-wrap gap-4 ${px} py-6`}
        style={{ borderTop: `1px solid ${E.border}` }}
      >
        <div className="flex items-center gap-2">
          <OmegaMark size={14} />
          <span
            className="text-[11px] tracking-[0.14em] uppercase"
            style={{ fontFamily: SERIF, color: E.faint }}
          >
            Empyrean
          </span>
          <span className="text-[11px]" style={{ fontFamily: MONO, color: E.faint }}>
            · © 2026
          </span>
        </div>
        <div className="flex items-center gap-6">
          {[['/blog/', 'Blog'],['/app/', 'Train'],['#faq', 'FAQ']].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="text-[12px] transition-colors hover:text-[#9E8E7A]"
              style={{ color: E.faint }}
            >
              {label}
            </a>
          ))}
          <a
            href="https://buymeacoffee.com/YOUR_BMC_USERNAME"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-[5px] text-[11px] font-bold px-[10px] py-[4px] rounded-[3px] transition-opacity hover:opacity-85"
            style={{ background: '#FFDD00', color: '#000' }}
          >
            ☕ Support
          </a>
        </div>
      </footer>

      {/* Page-scoped global styles */}
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
