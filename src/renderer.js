/* ─────────────────────────────────────────────────────────────────────────────
   Price Action Trainer — Renderer
   Features: candlestick replay · prediction mode · blind mode · session score
   ───────────────────────────────────────────────────────────────────────────── */

'use strict';

// ── Chart state ───────────────────────────────────────────────────────────────
let allBars      = [];
let rawBars      = [];
let visibleN     = 0;
let chart        = null;
let candleSeries = null;
let volumeSeries = null;
let markerSeries = null;   // overlay series for prediction result dots

// ── Prediction state ──────────────────────────────────────────────────────────
// pending: null | 'bull' | 'bear'   — what the user has committed before the next bar
// results: [{ bar, prediction, correct }]
let pendingPrediction = null;
let predictionResults = [];   // full history for the session

// ── Session state ─────────────────────────────────────────────────────────────
let sessionActive = false;    // true once data is loaded

// ── DOM refs ──────────────────────────────────────────────────────────────────
const symbolInput     = document.getElementById('symbolInput');
const intervalSel     = document.getElementById('intervalSelect');
const startDateIn     = document.getElementById('startDate');
const endDateIn       = document.getElementById('endDate');
const startBarIn      = document.getElementById('startBar');
const noiseToggle     = document.getElementById('noiseToggle');
const noiseRange      = document.getElementById('noiseRange');
const noiseVal        = document.getElementById('noiseVal');
const blindToggle     = document.getElementById('blindToggle');
const loadBtn         = document.getElementById('loadBtn');
const randomBtn       = document.getElementById('randomBtn');
const statusMsg       = document.getElementById('statusMsg');
const chartContainer  = document.getElementById('chartContainer');
const symbolLabel     = document.getElementById('symbolLabel');
const intervalLabel   = document.getElementById('intervalLabel');
const barInfo         = document.getElementById('barInfo');
const ohlcInfo        = document.getElementById('ohlcInfo');
const scoreStrip      = document.getElementById('scoreStrip');
const cacheList       = document.getElementById('cacheList');
const refreshCacheBtn = document.getElementById('refreshCacheBtn');
const predOverlay     = document.getElementById('predOverlay');
const sessionModal    = document.getElementById('sessionModal');
const sessionModalClose = document.getElementById('sessionModalClose');
const scoreBtn        = document.getElementById('scoreBtn');

// ── Defaults ──────────────────────────────────────────────────────────────────
endDateIn.value = new Date().toISOString().slice(0, 10);

noiseRange.addEventListener('input', () => {
  noiseVal.textContent = parseFloat(noiseRange.value).toFixed(1);
});

// ── Chart init ────────────────────────────────────────────────────────────────
function initChart() {
  if (chart) { chart.remove(); chart = null; candleSeries = null; volumeSeries = null; markerSeries = null; }

  const es = document.getElementById('emptyState');
  if (es) es.remove();

  chart = LightweightCharts.createChart(chartContainer, {
    width:  chartContainer.clientWidth,
    height: chartContainer.clientHeight,
    layout: {
      background: { color: '#0d1117' },
      textColor:  '#e6edf3',
    },
    grid: {
      vertLines: { color: '#161b22' },
      horzLines: { color: '#161b22' },
    },
    crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
    rightPriceScale: { borderColor: '#21262d' },
    timeScale: {
      borderColor:    '#21262d',
      timeVisible:    true,
      secondsVisible: false,
    },
  });

  // Volume — isolated bottom 20%
  volumeSeries = chart.addHistogramSeries({
    priceFormat:  { type: 'volume' },
    priceScaleId: 'vol',
    color:        '#3fb950',
  });
  chart.priceScale('vol').applyOptions({
    scaleMargins: { top: 0.80, bottom: 0 },
  });

  // Candles — top 78%, leaving room for volume
  candleSeries = chart.addCandlestickSeries({
    upColor:         '#3fb950',
    downColor:       '#f85149',
    borderUpColor:   '#3fb950',
    borderDownColor: '#f85149',
    wickUpColor:     '#3fb950',
    wickDownColor:   '#f85149',
    priceScaleId:    'right',
  });
  chart.priceScale('right').applyOptions({
    scaleMargins: { top: 0.05, bottom: 0.22 },
  });

  // Crosshair OHLC display
  chart.subscribeCrosshairMove((param) => {
    if (!param || !param.time || !candleSeries) return;
    const d = param.seriesData.get(candleSeries);
    if (d) updateOhlcDisplay(d);
  });

  // Resize observer
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
    color: b.close >= b.open ? '#3fb95033' : '#f8514933',
  })));

  // Render prediction result markers
  renderMarkers(slice);

  chart.timeScale().scrollToPosition(0, false);

  barInfo.textContent = `${visibleN} / ${allBars.length}`;
  if (slice.length > 0) updateOhlcDisplay(slice[slice.length - 1]);
  updateScoreStrip();
}

// ── Prediction markers ────────────────────────────────────────────────────────
// Each resolved prediction gets a coloured dot above/below the bar it landed on.
// ✓ green above = called bull correctly
// ✓ green below = called bear correctly
// ✗ red above/below = wrong
function renderMarkers(slice) {
  if (!candleSeries) return;

  const markers = predictionResults
    .filter(r => r.barIndex < slice.length)
    .map(r => {
      const bar = slice[r.barIndex];
      const correct = r.correct;
      const bullCall = r.prediction === 'bull';
      return {
        time:     bar.time,
        position: bullCall ? 'aboveBar' : 'belowBar',
        color:    correct ? '#3fb950' : '#f85149',
        shape:    correct ? 'arrowUp' : 'arrowDown',
        size:     1,
        text:     '',
      };
    });

  candleSeries.setMarkers(markers);
}

// ── OHLC display ──────────────────────────────────────────────────────────────
function updateOhlcDisplay(d) {
  const dir = d.close >= d.open ? 'val-up' : 'val-down';
  const chg = (((d.close - d.open) / d.open) * 100).toFixed(2);
  const sign = chg >= 0 ? '+' : '';
  ohlcInfo.innerHTML = `
    <span><span class="lbl">O</span><span class="${dir}">${d.open.toFixed(2)}</span></span>
    <span><span class="lbl">H</span><span class="${dir}">${d.high.toFixed(2)}</span></span>
    <span><span class="lbl">L</span><span class="${dir}">${d.low.toFixed(2)}</span></span>
    <span><span class="lbl">C</span><span class="${dir}">${d.close.toFixed(2)}</span></span>
    <span><span class="lbl">Chg</span><span class="${dir}">${sign}${chg}%</span></span>
  `;
}

// ── Score strip ───────────────────────────────────────────────────────────────
function updateScoreStrip() {
  if (!sessionActive || predictionResults.length === 0) {
    scoreStrip.innerHTML = '<span class="score-idle">Press <kbd>B</kbd> Bull · <kbd>L</kbd> Bear before each bar</span>';
    return;
  }

  const total   = predictionResults.length;
  const correct = predictionResults.filter(r => r.correct).length;
  const pct     = Math.round((correct / total) * 100);

  const bulls    = predictionResults.filter(r => r.prediction === 'bull');
  const bears    = predictionResults.filter(r => r.prediction === 'bear');
  const bullPct  = bulls.length  ? Math.round(bulls.filter(r => r.correct).length  / bulls.length  * 100) : '—';
  const bearPct  = bears.length  ? Math.round(bears.filter(r => r.correct).length  / bears.length  * 100) : '—';

  // Streak
  let streak = 0;
  for (let i = predictionResults.length - 1; i >= 0; i--) {
    if (predictionResults[i].correct) streak++;
    else break;
  }

  const pctClass = pct >= 60 ? 'score-good' : pct >= 45 ? 'score-mid' : 'score-bad';

  scoreStrip.innerHTML = `
    <span class="score-item ${pctClass}">${pct}%</span>
    <span class="score-sep">·</span>
    <span class="score-item">${correct}/${total}</span>
    <span class="score-sep">·</span>
    <span class="score-item score-bull">B ${bullPct}%</span>
    <span class="score-sep">·</span>
    <span class="score-item score-bear">L ${bearPct}%</span>
    ${streak >= 3 ? `<span class="score-sep">·</span><span class="score-item score-streak">${streak} streak</span>` : ''}
  `;
}

// ── Prediction flow ───────────────────────────────────────────────────────────
// State machine:
//   idle → user presses B/L → pendingPrediction set → overlay shows commitment
//   user presses → to reveal bar → outcome evaluated → result stored → overlay clears
//   user presses S (skip) → no result recorded, bar reveals freely

let predMode = 'idle'; // 'idle' | 'committed' | 'skip'

function commitPrediction(direction) {
  pendingPrediction = direction;
  predMode = 'committed';
  showPredOverlay('committed', direction);
}

function skipPrediction() {
  predMode = 'skip';
  pendingPrediction = null;
  hidePredOverlay();
}

function resolvePrediction() {
  // Called after the new bar has been set into visibleN
  if (predMode !== 'committed' || pendingPrediction === null) {
    hidePredOverlay();
    predMode = 'idle';
    return;
  }

  const newBar  = allBars[visibleN - 1];  // the bar just revealed
  const prevBar = allBars[visibleN - 2];  // the bar before it
  if (!newBar || !prevBar) { hidePredOverlay(); return; }

  const actualBull = newBar.close >= prevBar.close;
  const correct    = (pendingPrediction === 'bull') === actualBull;

  predictionResults.push({
    barIndex:   visibleN - 1,
    prediction: pendingPrediction,
    correct,
  });

  predMode = 'idle';
  pendingPrediction = null;
  showPredOverlay('result', correct ? 'correct' : 'wrong', correct, allBars[visibleN - 1]);
  updateScoreStrip();

  // Auto-dismiss result overlay after 800ms
  setTimeout(() => {
    hidePredOverlay();
  }, 800);
}

// ── Prediction overlay ────────────────────────────────────────────────────────
function showPredOverlay(state, extra, correct) {
  predOverlay.className = 'pred-overlay';

  if (state === 'committed') {
    predOverlay.classList.add('pred-waiting');
    predOverlay.querySelector('.pred-result').style.display = 'none';
    const el = predOverlay.querySelector('.pred-committed');
    el.style.display = '';
    el.querySelector('.pred-committed-label').textContent =
      extra === 'bull' ? '▲  Bullish' : '▼  Bearish';
    el.querySelector('.pred-committed-label').className =
      'pred-committed-label ' + (extra === 'bull' ? 'bull' : 'bear');
  } else if (state === 'result') {
    predOverlay.classList.add(correct ? 'pred-correct' : 'pred-wrong');
    predOverlay.querySelector('.pred-committed').style.display = 'none';
    const el = predOverlay.querySelector('.pred-result');
    el.style.display = '';
    el.textContent = correct ? '✓' : '✗';
    el.className = 'pred-result ' + (correct ? 'correct' : 'wrong');
  }

  predOverlay.style.display = 'flex';
}

function hidePredOverlay() {
  predOverlay.style.display = 'none';
  predMode = 'idle';
}

// ── Keyboard ──────────────────────────────────────────────────────────────────
document.addEventListener('keydown', (e) => {
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;
  if (sessionModal.style.display !== 'none') {
    if (e.key === 'Escape' || e.key === 'Tab') closeSessionModal();
    return;
  }

  const key = e.key.toLowerCase();

  // Prediction keys — always available when session is active
  if (sessionActive && allBars.length > 0) {
    if (key === 'b') { e.preventDefault(); commitPrediction('bull'); return; }
    if (key === 'l') { e.preventDefault(); commitPrediction('bear'); return; }
    if (key === 's') { e.preventDefault(); skipPrediction(); return; }
  }

  if (e.key === 'Tab') {
    e.preventDefault();
    if (sessionActive) openSessionModal();
    return;
  }

  if (allBars.length === 0) return;

  switch (e.key) {
    case 'ArrowRight': {
      e.preventDefault();
      if (visibleN >= allBars.length) return;
      // If the user already committed a prediction, resolve it.
      // If they haven't called B/L, just advance freely — no blocking.
      if (predMode === 'idle') {
        predMode = 'skip'; // treat as skipped so resolvePrediction no-ops
      }
      visibleN++;
      render();
      resolvePrediction();
      break;
    }
    case 'ArrowLeft':
      e.preventDefault();
      hidePredOverlay();
      predMode = 'idle';
      if (visibleN > 1) { visibleN--; render(); }
      break;
    case 'ArrowUp':
      e.preventDefault();
      hidePredOverlay();
      predMode = 'idle';
      visibleN = Math.min(allBars.length, visibleN + 10);
      render();
      break;
    case 'ArrowDown':
      e.preventDefault();
      hidePredOverlay();
      predMode = 'idle';
      visibleN = Math.max(1, visibleN - 10);
      render();
      break;
    case ' ':
      e.preventDefault();
      randomiseStart();
      break;
  }
});

// ── Randomise start ───────────────────────────────────────────────────────────
function randomiseStart() {
  if (allBars.length === 0) return;
  hidePredOverlay();
  predMode = 'idle';
  const min = 10;
  const max = allBars.length - 5;
  if (max <= min) return;
  visibleN = Math.floor(Math.random() * (max - min + 1)) + min;
  render();
}

// ── Session modal ─────────────────────────────────────────────────────────────
function openSessionModal() {
  const total   = predictionResults.length;
  if (total === 0) {
    document.getElementById('modalContent').innerHTML =
      '<p class="modal-empty">No predictions made yet.<br>Press <kbd>B</kbd> or <kbd>L</kbd> before advancing a bar.</p>';
    sessionModal.style.display = 'flex';
    return;
  }

  const correct  = predictionResults.filter(r => r.correct).length;
  const pct      = Math.round((correct / total) * 100);
  const bulls    = predictionResults.filter(r => r.prediction === 'bull');
  const bears    = predictionResults.filter(r => r.prediction === 'bear');
  const bullCorr = bulls.filter(r => r.correct).length;
  const bearCorr = bears.filter(r => r.correct).length;
  const bullPct  = bulls.length ? Math.round(bullCorr / bulls.length * 100) : null;
  const bearPct  = bears.length ? Math.round(bearCorr / bears.length * 100) : null;

  // Longest streak
  let maxStreak = 0, cur = 0;
  for (const r of predictionResults) { if (r.correct) { cur++; maxStreak = Math.max(maxStreak, cur); } else cur = 0; }

  // Bias diagnosis
  let bias = '';
  if (bulls.length > bears.length * 2) bias = 'You called bullish significantly more often — watch for upside bias.';
  else if (bears.length > bulls.length * 2) bias = 'You called bearish significantly more often — watch for downside bias.';
  else bias = 'Directional call mix looks balanced.';

  const symbol  = blindToggle.checked ? 'hidden' : (symbolLabel.textContent || '?');
  const intv    = intervalSel.value;

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-symbol">${symbol} <span class="modal-interval">${intv}</span></div>

    <div class="modal-stats">
      <div class="modal-stat">
        <div class="modal-stat-val ${pct >= 60 ? 'good' : pct >= 45 ? 'mid' : 'bad'}">${pct}%</div>
        <div class="modal-stat-lbl">Overall</div>
      </div>
      <div class="modal-stat">
        <div class="modal-stat-val">${correct}/${total}</div>
        <div class="modal-stat-lbl">Correct</div>
      </div>
      <div class="modal-stat">
        <div class="modal-stat-val score-streak">${maxStreak}</div>
        <div class="modal-stat-lbl">Best streak</div>
      </div>
    </div>

    <div class="modal-breakdown">
      <div class="modal-dir">
        <div class="modal-dir-label bull">▲ Bull calls</div>
        <div class="modal-dir-bar">
          <div class="modal-dir-fill bull" style="width:${bullPct ?? 0}%"></div>
        </div>
        <div class="modal-dir-pct">${bulls.length} calls · ${bullPct !== null ? bullPct + '%' : '—'} correct</div>
      </div>
      <div class="modal-dir">
        <div class="modal-dir-label bear">▼ Bear calls</div>
        <div class="modal-dir-bar">
          <div class="modal-dir-fill bear" style="width:${bearPct ?? 0}%"></div>
        </div>
        <div class="modal-dir-pct">${bears.length} calls · ${bearPct !== null ? bearPct + '%' : '—'} correct</div>
      </div>
    </div>

    <div class="modal-bias">${bias}</div>
  `;

  sessionModal.style.display = 'flex';
}

function closeSessionModal() {
  sessionModal.style.display = 'none';
}

sessionModalClose.addEventListener('click', closeSessionModal);
sessionModal.addEventListener('click', (e) => { if (e.target === sessionModal) closeSessionModal(); });
scoreBtn.addEventListener('click', () => { if (sessionActive) openSessionModal(); });

// ── Noise ─────────────────────────────────────────────────────────────────────
function applyNoise(bars, pct) {
  const f = pct / 100;
  return bars.map(b => {
    const j = () => 1 + (Math.random() * 2 - 1) * f;
    const o = b.open  * j(), h = b.high * j(), l = b.low * j(), c = b.close * j();
    return { ...b, open: +o.toFixed(4), high: +Math.max(o,h,l,c).toFixed(4), low: +Math.min(o,h,l,c).toFixed(4), close: +c.toFixed(4) };
  });
}

function rebuildAllBars() {
  allBars = noiseToggle.checked ? applyNoise(rawBars, parseFloat(noiseRange.value)) : rawBars.slice();
}

// ── Load data ─────────────────────────────────────────────────────────────────
async function loadData() {
  const symbol   = symbolInput.value.trim().toUpperCase();
  const interval = intervalSel.value;
  const period1  = startDateIn.value;
  const period2  = endDateIn.value;
  const startBar = Math.max(5, parseInt(startBarIn.value, 10) || 50);

  if (!symbol || !period1 || !period2) { setStatus('Fill in symbol and dates.', 'err'); return; }

  loadBtn.disabled = true;
  setStatus('Fetching…', '');

  try {
    const params = new URLSearchParams({ symbol, period1, period2, interval });
    const result = await fetch(`/api/fetch?${params}`).then(r => r.json());

    if (!result.ok) { setStatus(`Error: ${result.error}`, 'err'); return; }

    rawBars = result.data;
    rebuildAllBars();

    if (allBars.length === 0) { setStatus('No bars in this range.', 'warn'); return; }

    // Reset session
    predictionResults = [];
    pendingPrediction = null;
    predMode = 'idle';
    hidePredOverlay();
    sessionActive = true;

    visibleN = Math.min(startBar, allBars.length);
    initChart();
    render();

    // Blind mode — hide symbol
    symbolLabel.textContent  = blindToggle.checked ? '████' : symbol;
    intervalLabel.textContent = interval;

    setStatus(`${allBars.length} bars ${result.fromCache ? '(cached)' : '(live)'}`, 'ok');
    refreshCache();
    updateScoreStrip();

  } catch (err) {
    setStatus(`Network error: ${err.message}`, 'err');
  } finally {
    loadBtn.disabled = false;
  }
}

// ── Blind mode toggle ─────────────────────────────────────────────────────────
blindToggle.addEventListener('change', () => {
  if (!sessionActive) return;
  const symbol = symbolInput.value.trim().toUpperCase();
  symbolLabel.textContent = blindToggle.checked ? '████' : symbol;
});

// ── Noise controls ────────────────────────────────────────────────────────────
noiseToggle.addEventListener('change', () => { if (rawBars.length) { rebuildAllBars(); render(); } });
noiseRange.addEventListener('change', () => { if (noiseToggle.checked && rawBars.length) { rebuildAllBars(); render(); } });

// ── UI bindings ───────────────────────────────────────────────────────────────
loadBtn.addEventListener('click', loadData);
symbolInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') loadData(); });

randomBtn.addEventListener('click', () => {
  if (typeof STOCKS !== 'undefined' && STOCKS.length)
    symbolInput.value = STOCKS[Math.floor(Math.random() * STOCKS.length)];
});

// ── Cache ─────────────────────────────────────────────────────────────────────
async function refreshCache() {
  try {
    const files = await fetch('/api/cache').then(r => r.json());
    cacheList.innerHTML = '';
    if (!files.length) {
      cacheList.innerHTML = '<li class="empty-cache">No cached datasets yet</li>';
      return;
    }
    files.forEach(f => {
      const li       = document.createElement('li');
      const name     = document.createElement('span');
      name.className = 'cache-name';
      name.textContent = f.name.replace('.json', '').replace(/_/g, ' ');
      name.title = f.name;
      const size     = document.createElement('span');
      size.className = 'cache-size';
      size.textContent = `${(f.size / 1024).toFixed(0)}k`;
      const del      = document.createElement('span');
      del.className  = 'cache-del';
      del.textContent = '✕';
      del.addEventListener('click', async () => {
        await fetch(`/api/cache/${encodeURIComponent(f.name)}`, { method: 'DELETE' });
        refreshCache();
      });
      li.appendChild(name); li.appendChild(size); li.appendChild(del);
      cacheList.appendChild(li);
    });
  } catch { /* server not ready */ }
}

refreshCacheBtn.addEventListener('click', refreshCache);

// ── Status ────────────────────────────────────────────────────────────────────
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
