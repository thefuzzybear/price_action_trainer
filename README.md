# Price Action Trainer

Train your price action reading skills — candlestick replay, predictions, trade mapping, bar notes, and session persistence.

Built with vanilla JS + [lightweight-charts](https://github.com/tradingview/lightweight-charts), deployed on Vercel, data stored in Supabase.

---

## Setup

### 1. Clone and install

```bash
git clone <your-repo>
cd price_trainer
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project
2. Open **SQL Editor** → paste the contents of `scripts/schema.sql` → Run
3. Go to **Settings → API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` secret key

### 3. Configure environment

```bash
cp .env.local.example .env.local
# Fill in your SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SERVICE_ROLE_KEY
```

### 4. Ingest datasets

```bash
# Single dataset
node scripts/ingest.js --symbol AAPL --interval 1d --from 2020-01-01 --to 2025-01-01

# Bulk ingest from the starter list
node scripts/ingest.js --file scripts/datasets.json
```

This runs locally and pushes OHLCV data to Supabase. Users never call Yahoo Finance directly.

### 5. Local dev

The existing Express server still works for local testing:

```bash
npm run dev
# Open http://localhost:3000
```

---

## Deploy to Vercel

### First deploy

```bash
npm i -g vercel
vercel
```

### Set environment variables

In the Vercel dashboard → your project → Settings → Environment Variables, add:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | your project URL |
| `SUPABASE_PUBLISHABLE_KEY` | publishable key (from Settings → API) |
| `SUPABASE_SERVICE_ROLE_KEY` | service role secret key |

Then redeploy:

```bash
vercel --prod
```

---

## How it works

| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla HTML/CSS/JS, served as Vercel static output |
| API | Vercel serverless functions (`/api/*.js`) |
| Auth | Supabase Auth (email + password) |
| Data storage | Supabase Postgres |
| Charts | TradingView lightweight-charts v4 |
| Data ingest | yahoo-finance2 (local script only) |

### Data model

- **datasets** — OHLCV bars for curated instruments. You populate this via `scripts/ingest.js`. Row-level security: anonymous users see `is_public = true` rows; authenticated users see all.
- **sessions** — per-user, per-dataset state: bar position, predictions, trades, notes. RLS ensures users can only access their own rows.

### Controls

| Key | Action |
|-----|--------|
| → | Reveal next bar |
| ← | Remove last bar |
| ↑ / ↓ | Jump ±10 bars |
| B | Predict bullish |
| L | Predict bearish |
| S | Skip prediction |
| E | Open trade ticket (long) |
| X | Close active trade |
| N | Add bar note |
| R | Open session summary / exit review |
| Tab | Session summary |
| Space | Randomise start position |

---

## Buy Me a Coffee

If this helps your trading — [buy me a coffee ☕](https://buymeacoffee.com/thefuzzybear)

> Update the link in `public/index.html` with your actual buymeacoffee username.
