/* ─────────────────────────────────────────────────────────────────────────────
   Price Action Trainer — Renderer
   ───────────────────────────────────────────────────────────────────────────── */

'use strict';

// ── State ─────────────────────────────────────────────────────────────────────
let allBars  = [];   // full dataset (noise applied if enabled)
let rawBars  = [];   // original data, never mutated
let visibleN = 0;    // bars currently revealed
let chart    = null;
let candleSeries = null;
let volumeSeries = null;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const symbolInput    = document.getElementById('symbolInput');
const intervalSel    = document.getElementById('intervalSelect');
const startDateIn    = document.getElementById('startDate');
const endDateIn      = document.getElementById('endDate');
const startBarIn     = document.getElementById('startBar');
const noiseToggle    = document.getElementById('noiseToggle');
const noiseRange     = document.getElementById('noiseRange');
const noiseVal       = document.getElementById('noiseVal');
const loadBtn        = document.getElementById('loadBtn');
const randomBtn      = document.getElementById('randomBtn');
const statusMsg      = document.getElementById('statusMsg');
const chartContainer = document.getElementById('chartContainer');
const symbolLabel    = document.getElementById('symbolLabel');
const intervalLabel  = document.getElementById('intervalLabel');
const barInfo        = document.getElementById('barInfo');
const ohlcInfo       = document.getElementById('ohlcInfo');
const cacheList      = document.getElementById('cacheList');
const refreshCacheBtn = document.getElementById('refreshCacheBtn');

// ── Defaults ──────────────────────────────────────────────────────────────────
endDateIn.value = new Date().toISOString().slice(0, 10);

// ── Noise range label ─────────────────────────────────────────────────────────
noiseRange.addEventListener('input', () => {
  noiseVal.textContent = parseFloat(noiseRange.value).toFixed(1);
});

// ── Chart initialisation ──────────────────────────────────────────────────────
function initChart() {
  if (chart) { chart.remove(); chart = null; candleSeries = null; volumeSeries = null; }

  const es = document.getElementById('emptyState');
  if (es) es.remove();

  chart = LightweightCharts.createChart(chartContainer, {
    width:  chartContainer.clientWidth,
    height: chartContainer.clientHeight,
    layout: {
      background: { color: '#131722' },
      textColor:  '#d1d4dc',
    },
    grid: {
      vertLines: { color: '#1e222d' },
      horzLines: { color: '#1e222d' },
    },
    crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
    rightPriceScale: { borderColor: '#363a45' },
    timeScale: {
      borderColor:    '#363a45',
      timeVisible:    true,
      secondsVisible: false,
    },
  });

  // Volume occupies the bottom 20% of the chart — isolated price scale
  // so its bars never grow into the candle area
  volumeSeries = chart.addHistogramSeries({
    priceFormat:  { type: 'volume' },
    priceScaleId: 'vol',
    color:        '#26a69a',
  });
  chart.priceScale('vol').applyOptions({
    scaleMargins: { top: 0.80, bottom: 0 },
  });

  // Candles use the remaining 80%, leaving a small top gap
  candleSeries = chart.addCandlestickSeries({
    upColor:         '#26a69a',
    downColor:       '#ef5350',
    borderUpColor:   '#26a69a',
    borderDownColor: '#ef5350',
    wickUpColor:     '#26a69a',
    wickDownColor:   '#ef5350',
    priceScaleId:    'right',
  });
  chart.priceScale('right').applyOptions({
    scaleMargins: { top: 0.05, bottom: 0.22 },
  });

  chart.subscribeCrosshairMove((param) => {
    if (!param || !param.time || !candleSeries) return;
    const d = param.seriesData.get(candleSeries);
    if (d) updateOhlcInfo(d);
  });

  // Resize
  const ro = new ResizeObserver(() => {
    if (chart) chart.applyOptions({
      width:  chartContainer.clientWidth,
      height: chartContainer.clientHeight,
    });
  });
  ro.observe(chartContainer);
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  if (!candleSeries || allBars.length === 0) return;

  const slice = allBars.slice(0, visibleN);

  candleSeries.setData(slice);
  volumeSeries.setData(slice.map(b => ({
    time:  b.time,
    value: b.volume,
    color: b.close >= b.open ? '#26a69a55' : '#ef535055',
  })));

  // Hard right edge — always pin latest bar to the right
  chart.timeScale().scrollToPosition(0, false);

  barInfo.textContent = `Bar ${visibleN} / ${allBars.length}`;
  if (slice.length > 0) updateOhlcInfo(slice[slice.length - 1]);
}

function updateOhlcInfo(d) {
  const dir = d.close >= d.open ? 'val-up' : 'val-down';
  const chg = (((d.close - d.open) / d.open) * 100).toFixed(2);
  ohlcInfo.innerHTML = `
    <span><span class="lbl">O</span> <span class="${dir}">${d.open.toFixed(2)}</span></span>
    <span><span class="lbl">H</span> <span class="${dir}">${d.high.toFixed(2)}</span></span>
    <span><span class="lbl">L</span> <span class="${dir}">${d.low.toFixed(2)}</span></span>
    <span><span class="lbl">C</span> <span class="${dir}">${d.close.toFixed(2)}</span></span>
    <span><span class="lbl">Chg</span> <span class="${dir}">${chg >= 0 ? '+' : ''}${chg}%</span></span>
  `;
}

// ── Noise ─────────────────────────────────────────────────────────────────────
function applyNoise(bars, pct) {
  const f = pct / 100;
  return bars.map(b => {
    const j = () => 1 + (Math.random() * 2 - 1) * f;
    let o = b.open  * j();
    let h = b.high  * j();
    let l = b.low   * j();
    let c = b.close * j();
    const hi = Math.max(o, h, l, c);
    const lo = Math.min(o, h, l, c);
    return { ...b, open: +o.toFixed(4), high: +hi.toFixed(4), low: +lo.toFixed(4), close: +c.toFixed(4) };
  });
}

function rebuildAllBars() {
  const noiseOn  = noiseToggle.checked;
  const noisePct = parseFloat(noiseRange.value);
  allBars = noiseOn ? applyNoise(rawBars, noisePct) : rawBars.slice();
}

// ── Load data (calls Express API) ─────────────────────────────────────────────
async function loadData() {
  const symbol   = symbolInput.value.trim().toUpperCase();
  const interval = intervalSel.value;
  const period1  = startDateIn.value;
  const period2  = endDateIn.value;
  const startBar = Math.max(5, parseInt(startBarIn.value, 10) || 50);

  if (!symbol || !period1 || !period2) {
    setStatus('Please fill in symbol and dates.', 'err');
    return;
  }

  loadBtn.disabled = true;
  setStatus('Fetching…', '');

  try {
    const params = new URLSearchParams({ symbol, period1, period2, interval });
    const res    = await fetch(`/api/fetch?${params}`);
    const result = await res.json();

    if (!result.ok) {
      setStatus(`Error: ${result.error}`, 'err');
      return;
    }

    rawBars = result.data;
    rebuildAllBars();

    if (allBars.length === 0) {
      setStatus('No bars in this date range.', 'warn');
      return;
    }

    visibleN = Math.min(startBar, allBars.length);
    initChart();
    render();

    symbolLabel.textContent  = symbol;
    intervalLabel.textContent = interval;
    setStatus(`${allBars.length} bars loaded ${result.fromCache ? '(cached)' : '(live)'}`, 'ok');
    refreshCache();

  } catch (err) {
    setStatus(`Network error: ${err.message}`, 'err');
  } finally {
    loadBtn.disabled = false;
  }
}

// ── Keyboard navigation ───────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (allBars.length === 0) return;
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

  switch (e.key) {
    case 'ArrowRight':
      e.preventDefault();
      if (visibleN < allBars.length) { visibleN++; render(); }
      break;
    case 'ArrowLeft':
      e.preventDefault();
      if (visibleN > 1) { visibleN--; render(); }
      break;
    case 'ArrowUp':
      e.preventDefault();
      visibleN = Math.min(allBars.length, visibleN + 10);
      render();
      break;
    case 'ArrowDown':
      e.preventDefault();
      visibleN = Math.max(1, visibleN - 10);
      render();
      break;
    case ' ':
      e.preventDefault();
      randomiseStart();
      break;
  }
});

function randomiseStart() {
  if (allBars.length === 0) return;
  const min = 10;
  const max = allBars.length - 5;
  if (max <= min) return;
  visibleN = Math.floor(Math.random() * (max - min + 1)) + min;
  render();
}

// ── Random symbol ─────────────────────────────────────────────────────────────
randomBtn.addEventListener('click', () => {
  if (typeof STOCKS !== 'undefined' && STOCKS.length) {
    symbolInput.value = STOCKS[Math.floor(Math.random() * STOCKS.length)];
  }
});

// ── Load button / Enter key ───────────────────────────────────────────────────
loadBtn.addEventListener('click', loadData);
symbolInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') loadData(); });

// ── Noise controls ────────────────────────────────────────────────────────────
noiseToggle.addEventListener('change', () => {
  if (!rawBars.length) return;
  rebuildAllBars();
  render();
});

noiseRange.addEventListener('change', () => {
  if (!noiseToggle.checked || !rawBars.length) return;
  rebuildAllBars();
  render();
});

// ── Cache panel ───────────────────────────────────────────────────────────────
async function refreshCache() {
  try {
    const files = await fetch('/api/cache').then(r => r.json());
    cacheList.innerHTML = '';

    if (!files.length) {
      cacheList.innerHTML = '<li class="empty-cache">No cached datasets yet</li>';
      return;
    }

    files.forEach(f => {
      const li = document.createElement('li');

      const nameSpan = document.createElement('span');
      nameSpan.className = 'cache-name';
      nameSpan.textContent = f.name.replace('.json', '').replace(/_/g, ' ');
      nameSpan.title = f.name;

      const sizeSpan = document.createElement('span');
      sizeSpan.className = 'cache-size';
      sizeSpan.textContent = `${(f.size / 1024).toFixed(0)}k`;

      const delBtn = document.createElement('span');
      delBtn.className = 'cache-del';
      delBtn.textContent = '✕';
      delBtn.title = 'Delete';
      delBtn.addEventListener('click', async () => {
        await fetch(`/api/cache/${encodeURIComponent(f.name)}`, { method: 'DELETE' });
        refreshCache();
      });

      li.appendChild(nameSpan);
      li.appendChild(sizeSpan);
      li.appendChild(delBtn);
      cacheList.appendChild(li);
    });
  } catch {
    // Server not ready yet — ignore
  }
}

refreshCacheBtn.addEventListener('click', refreshCache);

// ── Status helper ─────────────────────────────────────────────────────────────
function setStatus(msg, type) {
  statusMsg.textContent = msg;
  statusMsg.className   = 'status-msg ' + (type || '');
}

// ── Empty state ───────────────────────────────────────────────────────────────
(function showEmptyState() {
  const div = document.createElement('div');
  div.id = 'emptyState';
  div.innerHTML = `
    <svg class="empty-icon" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="4" y="20" width="4" height="8" rx="1" fill="currentColor"/>
      <rect x="10" y="14" width="4" height="14" rx="1" fill="currentColor"/>
      <rect x="16" y="8" width="4" height="20" rx="1" fill="currentColor"/>
      <rect x="22" y="16" width="4" height="12" rx="1" fill="currentColor"/>
    </svg>
    <p>Pick a symbol and click <strong>Load Data</strong><br>then use arrow keys to step through bars</p>
  `;
  chartContainer.appendChild(div);
})();

refreshCache();
