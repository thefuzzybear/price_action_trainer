#!/usr/bin/env node
/* ─────────────────────────────────────────────────────────────────────────────
   Price Action Trainer — Dataset Ingest Script
   Fetches OHLCV data from Yahoo Finance and pushes it into Supabase.
   Run this locally — never in prod.

   Usage:
     node scripts/ingest.js --symbol AAPL --interval 1d --from 2020-01-01 --to 2025-01-01
     node scripts/ingest.js --file scripts/datasets.json   # bulk ingest from a list

   Requires:
     SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local
   ───────────────────────────────────────────────────────────────────────────── */

'use strict';

import { createClient }  from '@supabase/supabase-js';
import { parseArgs }     from 'node:util';
import { readFileSync }  from 'node:fs';
import { resolve }       from 'node:path';
import { config }        from 'dotenv';

// Load .env.local
config({ path: resolve(process.cwd(), '.env.local') });

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = process.env;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// ── CLI args ──────────────────────────────────────────────────────────────────
const { values: args } = parseArgs({
  options: {
    symbol:   { type: 'string' },
    interval: { type: 'string', default: '1d' },
    from:     { type: 'string' },
    to:       { type: 'string' },
    label:    { type: 'string' },
    public:   { type: 'string', default: 'true' },
    file:     { type: 'string' },  // path to JSON list of {symbol,interval,from,to,label}
  },
  strict: false,
});

// ── Fetch from Yahoo Finance ───────────────────────────────────────────────────
async function fetchBars(symbol, interval, from, to) {
  const mod = await import('yahoo-finance2');
  const yf  = new mod.default();

  const result = await yf.chart(symbol.toUpperCase(), {
    period1:  from,
    period2:  to,
    interval,
  });

  return result.quotes
    .filter(q => q.open != null && q.high != null && q.low != null && q.close != null)
    .map(q => ({
      time:   Math.floor(new Date(q.date).getTime() / 1000),
      open:   +q.open.toFixed(4),
      high:   +q.high.toFixed(4),
      low:    +q.low.toFixed(4),
      close:  +q.close.toFixed(4),
      volume: q.volume || 0,
    }));
}

// ── Push to Supabase ──────────────────────────────────────────────────────────
async function ingestOne({ symbol, interval, from, to, label, isPublic }) {
  console.log(`\n→ ${symbol} ${interval} ${from} → ${to}`);
  let bars;
  try {
    bars = await fetchBars(symbol, interval, from, to);
  } catch (err) {
    console.error(`  ❌ Fetch failed: ${err.message}`);
    return;
  }

  if (bars.length === 0) {
    console.warn('  ⚠️  No bars returned — skipping');
    return;
  }

  const displayLabel = label || `${symbol.toUpperCase()} ${interval} ${from} – ${to}`;

  // Upsert by symbol + interval + period — idempotent
  const { error } = await supabase
    .from('datasets')
    .upsert({
      symbol:       symbol.toUpperCase(),
      interval,
      period_start: from,
      period_end:   to,
      label:        displayLabel,
      bar_count:    bars.length,
      bars,
      is_public:    isPublic,
    }, { onConflict: 'symbol,interval,period_start,period_end' });

  if (error) {
    console.error(`  ❌ Supabase error: ${error.message}`);
  } else {
    console.log(`  ✓  ${bars.length} bars pushed (${displayLabel})`);
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  if (args.file) {
    // Bulk ingest from a JSON file
    const list = JSON.parse(readFileSync(args.file, 'utf8'));
    for (const entry of list) {
      await ingestOne({
        symbol:   entry.symbol,
        interval: entry.interval || '1d',
        from:     entry.from,
        to:       entry.to,
        label:    entry.label,
        isPublic: entry.public !== false,
      });
    }
  } else if (args.symbol && args.from && args.to) {
    await ingestOne({
      symbol:   args.symbol,
      interval: args.interval,
      from:     args.from,
      to:       args.to,
      label:    args.label,
      isPublic: args.public !== 'false',
    });
  } else {
    console.log(`
Usage:
  node scripts/ingest.js --symbol AAPL --interval 1d --from 2020-01-01 --to 2025-01-01
  node scripts/ingest.js --file scripts/datasets.json

datasets.json format:
  [
    { "symbol": "AAPL", "interval": "1d", "from": "2020-01-01", "to": "2025-01-01" },
    { "symbol": "MSFT", "interval": "1d", "from": "2020-01-01", "to": "2025-01-01" }
  ]
    `);
  }
}

main().catch(err => { console.error(err); process.exit(1); });
