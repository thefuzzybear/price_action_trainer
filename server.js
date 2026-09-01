'use strict';

const express = require('express');
const path    = require('path');
const fs      = require('fs');

const app     = express();
const PORT    = 3000;
const DATA_DIR = path.join(__dirname, 'src', 'data');

// Ensure cache directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// yahoo-finance2 v4 requires instantiation — load once lazily
let _yf = null;
async function getYF() {
  if (_yf) return _yf;
  const mod = await import('yahoo-finance2');
  _yf = new mod.default();
  return _yf;
}

// ── Static files ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'src')));

// Serve lightweight-charts from node_modules
app.use(
  '/vendor/lightweight-charts.js',
  express.static(
    path.join(__dirname, 'node_modules', 'lightweight-charts', 'dist',
      'lightweight-charts.standalone.production.js')
  )
);

// ── API: Fetch OHLCV data (or return cache) ───────────────────────────────────
app.get('/api/fetch', async (req, res) => {
  const { symbol, period1, period2, interval } = req.query;

  if (!symbol || !period1 || !period2 || !interval) {
    return res.status(400).json({ ok: false, error: 'Missing required query params' });
  }

  const cacheKey  = `${symbol}_${interval}_${period1}_${period2}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const cacheFile = path.join(DATA_DIR, `${cacheKey}.json`);

  // Return cached data if available
  if (fs.existsSync(cacheFile)) {
    try {
      const data = JSON.parse(fs.readFileSync(cacheFile, 'utf8'));
      return res.json({ ok: true, data, fromCache: true });
    } catch {
      // Corrupted cache — fall through to re-fetch
    }
  }

  // Fetch from Yahoo Finance
  try {
    const yf     = await getYF();
    const result = await yf.chart(symbol.toUpperCase(), { period1, period2, interval });

    const quotes = result.quotes
      .filter(q => q.open != null && q.high != null && q.low != null && q.close != null)
      .map(q => ({
        time:   Math.floor(new Date(q.date).getTime() / 1000),
        open:   +q.open.toFixed(4),
        high:   +q.high.toFixed(4),
        low:    +q.low.toFixed(4),
        close:  +q.close.toFixed(4),
        volume: q.volume || 0,
      }));

    if (quotes.length === 0) {
      return res.json({ ok: false, error: 'No data returned — check symbol and date range' });
    }

    fs.writeFileSync(cacheFile, JSON.stringify(quotes), 'utf8');
    return res.json({ ok: true, data: quotes, fromCache: false });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── API: List cached datasets ─────────────────────────────────────────────────
app.get('/api/cache', (_req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        const stats = fs.statSync(path.join(DATA_DIR, f));
        return { name: f, size: stats.size, mtime: stats.mtime };
      })
      .sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
    res.json(files);
  } catch {
    res.json([]);
  }
});

// ── API: Delete a cached dataset ──────────────────────────────────────────────
app.delete('/api/cache/:filename', (req, res) => {
  try {
    const safe = path.basename(req.params.filename);
    const fp   = path.join(DATA_DIR, safe);
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    // Also remove associated session file if present
    const sessionFp = fp.replace(/\.json$/, '.session.json');
    if (fs.existsSync(sessionFp)) fs.unlinkSync(sessionFp);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── API: Load session state ───────────────────────────────────────────────────
app.get('/api/session', (req, res) => {
  const { cacheKey } = req.query;
  if (!cacheKey) return res.status(400).json({ ok: false, error: 'Missing cacheKey' });
  const safe = path.basename(cacheKey);
  const fp   = path.join(DATA_DIR, `${safe}.session.json`);
  if (!fs.existsSync(fp)) return res.json({ ok: false, exists: false });
  try {
    const data = JSON.parse(fs.readFileSync(fp, 'utf8'));
    res.json({ ok: true, exists: true, data });
  } catch {
    res.json({ ok: false, exists: false });
  }
});

// ── API: Save session state ───────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.post('/api/session', (req, res) => {
  const { cacheKey, state } = req.body;
  if (!cacheKey || !state) return res.status(400).json({ ok: false, error: 'Missing cacheKey or state' });
  const safe = path.basename(cacheKey);
  const fp   = path.join(DATA_DIR, `${safe}.session.json`);
  try {
    fs.writeFileSync(fp, JSON.stringify(state), 'utf8');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  Price Action Trainer running at http://localhost:${PORT}\n`);
});
