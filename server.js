// Local development server — serves /src with the old Express API.
// For production, use Vercel + /api functions instead.
// Run with: npm run dev

import express  from 'express';
import path     from 'path';
import fs       from 'fs';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

const app      = express();
const PORT     = process.env.PORT || 3001;
const DATA_DIR = path.join(__dirname, 'src', 'data');

app.use(express.json({ limit: '2mb' }));

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// ── Yahoo Finance (lazy singleton) ────────────────────────────────────────────
let _yf = null;
async function getYF() {
  if (_yf) return _yf;
  const mod = await import('yahoo-finance2');
  _yf = new mod.default();
  return _yf;
}

// ── Static files ──────────────────────────────────────────────────────────────
app.use(express.static(path.join(__dirname, 'src')));
app.use(
  '/vendor/lightweight-charts.js',
  express.static(
    path.join(__dirname, 'node_modules', 'lightweight-charts', 'dist',
      'lightweight-charts.standalone.production.js')
  )
);

// ── API: Fetch OHLCV (with local file cache) ──────────────────────────────────
app.get('/api/fetch', async (req, res) => {
  const { symbol, period1, period2, interval } = req.query;
  if (!symbol || !period1 || !period2 || !interval)
    return res.status(400).json({ ok: false, error: 'Missing required query params' });

  const cacheKey  = `${symbol}_${interval}_${period1}_${period2}`.replace(/[^a-zA-Z0-9_-]/g, '_');
  const cacheFile = path.join(DATA_DIR, `${cacheKey}.json`);

  if (fs.existsSync(cacheFile)) {
    try {
      return res.json({ ok: true, data: JSON.parse(fs.readFileSync(cacheFile, 'utf8')), fromCache: true });
    } catch { /* fall through */ }
  }

  try {
    const yf     = await getYF();
    const result = await yf.chart(symbol.toUpperCase(), { period1, period2, interval });
    const quotes = result.quotes
      .filter(q => q.open != null && q.high != null && q.low != null && q.close != null)
      .map(q => ({
        time:   Math.floor(new Date(q.date).getTime() / 1000),
        open:   +q.open.toFixed(4),  high: +q.high.toFixed(4),
        low:    +q.low.toFixed(4),   close: +q.close.toFixed(4),
        volume: q.volume || 0,
      }));
    if (!quotes.length) return res.json({ ok: false, error: 'No data returned — check symbol and date range' });
    fs.writeFileSync(cacheFile, JSON.stringify(quotes), 'utf8');
    return res.json({ ok: true, data: quotes, fromCache: false });
  } catch (err) {
    return res.status(500).json({ ok: false, error: err.message });
  }
});

// ── API: List / delete cached files ──────────────────────────────────────────
app.get('/api/cache', (_req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR)
      .filter(f => f.endsWith('.json') && !f.endsWith('.session.json'))
      .map(f => { const s = fs.statSync(path.join(DATA_DIR, f)); return { name: f, size: s.size, mtime: s.mtime }; })
      .sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
    res.json(files);
  } catch { res.json([]); }
});

app.delete('/api/cache/:filename', (req, res) => {
  try {
    const fp = path.join(DATA_DIR, path.basename(req.params.filename));
    if (fs.existsSync(fp)) fs.unlinkSync(fp);
    const sf = fp.replace(/\.json$/, '.session.json');
    if (fs.existsSync(sf)) fs.unlinkSync(sf);
    res.json({ ok: true });
  } catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ── API: Session state ────────────────────────────────────────────────────────
app.get('/api/session', (req, res) => {
  const safe = path.basename(req.query.cacheKey || '');
  if (!safe) return res.status(400).json({ ok: false, error: 'Missing cacheKey' });
  const fp = path.join(DATA_DIR, `${safe}.session.json`);
  if (!fs.existsSync(fp)) return res.json({ ok: false, exists: false });
  try { res.json({ ok: true, exists: true, data: JSON.parse(fs.readFileSync(fp, 'utf8')) }); }
  catch { res.json({ ok: false, exists: false }); }
});

app.post('/api/session', (req, res) => {
  const { cacheKey, state } = req.body || {};
  if (!cacheKey || !state) return res.status(400).json({ ok: false, error: 'Missing cacheKey or state' });
  const fp = path.join(DATA_DIR, `${path.basename(cacheKey)}.session.json`);
  try { fs.writeFileSync(fp, JSON.stringify(state), 'utf8'); res.json({ ok: true }); }
  catch (err) { res.status(500).json({ ok: false, error: err.message }); }
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n  Price Action Trainer (local) → http://localhost:${PORT}\n`);
});
