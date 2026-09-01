/* ─────────────────────────────────────────────────────────────────────────────
   Price Action Trainer — Renderer
   Features: candlestick replay · prediction mode · blind mode · session score
             trade mapping (TP/SL) · bar notes · session persistence
   ───────────────────────────────────────────────────────────────────────────── */

'use strict';

// ── Chart state ───────────────────────────────────────────────────────────────
let allBars      = [];
let rawBars      = [];
let visibleN     = 0;
let chart        = null;
let candleSeries = null;
let volumeSeries = null;

// ── Prediction state ──────────────────────────────────────────────────────────
let predMode          = 'idle';   // 'idle' | 'committed' | 'skip'
let pendingPrediction = null;
let predictionResults = [];

// ── Trade state ───────────────────────────────────────────────────────────────
// activeTrade: null | { entryBar, entryPrice, tp, sl, direction }
// resolvedTrades: [{ entryBar, entryPrice, tp, sl, direction, exitBar, exitPrice, outcome }]
let activeTrade    = null;
let resolvedTrades = [];
let tpLine         = null;   // lightweight-charts price line
let slLine         = null;
let entryLine      = null;

// ── Review mode ───────────────────────────────────────────────────────────────
// When reviewing a resolved trade, we stash the live visibleN here and
// draw reference lines for that trade without affecting session state.
let reviewMode        = false;
let reviewReturnBar   = null;  // visibleN to restore on exit
let reviewRefLines    = [];    // extra price lines drawn during review

// ── Notes state ───────────────────────────────────────────────────────────────
// notes: { [barIndex]: string }
let notes = {};

// ── Session persistence ───────────────────────────────────────────────────────
let currentCacheKey = null;   // key for the loaded dataset
let sessionActive   = false;

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
// Trade panel — now a persistent broker ticket top-left of chart
const tradeTicket     = document.getElementById('tradeTicket');
const ticketForm      = document.getElementById('ticketForm');
const ticketDirection = document.getElementById('ticketDirection');
const buyBtn          = document.getElementById('buyBtn');
const sellBtn         = document.getElementById('sellBtn');
const tradeEntryPrice = document.getElementById('tradeEntryPrice');
const tradeTpInput    = document.getElementById('tradeTpInput');
const tradeSlInput    = document.getElementById('tradeSlInput');
const tradeConfirmBtn = document.getElementById('tradeConfirmBtn');
const tradeCancelBtn  = document.getElementById('tradeCancelBtn');
// Note panel
const notePanel       = document.getElementById('notePanel');
const noteTextarea    = document.getElementById('noteTextarea');
const noteSaveBtn     = document.getElementById('noteSaveBtn');
const noteCancelBtn   = document.getElementById('noteCancelBtn');
const noteBarLabel    = document.getElementById('noteBarLabel');
// Resume prompt
const resumePrompt    = document.getElementById('resumePrompt');
const resumeYesBtn    = document.getElementById('resumeYesBtn');
const resumeNoBtn     = document.getElementById('resumeNoBtn');

// ── Defaults ──────────────────────────────────────────────────────────────────
endDateIn.value = new Date().toISOString().slice(0, 10);
noiseRange.addEventListener('input', () => {
  noiseVal.textContent = parseFloat(noiseRange.value).toFixed(1);
});

// ═══════════════════════════════════════════════════════════════════════════════
// CHART
// ═══════════════════════════════════════════════════════════════════════════════

function initChart() {
  if (chart) { chart.remove(); chart = null; candleSeries = null; volumeSeries = null; }
  tpLine = null; slLine = null; entryLine = null;

  const es = document.getElementById('emptyState');
  if (es) es.remove();

  chart = LightweightCharts.createChart(chartContainer, {
    width:  chartContainer.clientWidth,
    height: chartContainer.clientHeight,
    layout: { background: { color: '#0d1117' }, textColor: '#e6edf3' },
    grid:   { vertLines: { color: '#161b22' }, horzLines: { color: '#161b22' } },
    crosshair: { mode: LightweightCharts.CrosshairMode.Normal },
    rightPriceScale: { borderColor: '#21262d' },
    timeScale: { borderColor: '#21262d', timeVisible: true, secondsVisible: false },
  });

  volumeSeries = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: 'vol', color: '#3fb950' });
  chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.80, bottom: 0 } });

  candleSeries = chart.addCandlestickSeries({
    upColor: '#3fb950', downColor: '#f85149',
    borderUpColor: '#3fb950', borderDownColor: '#f85149',
    wickUpColor: '#3fb950', wickDownColor: '#f85149',
    priceScaleId: 'right',
  });
  chart.priceScale('right').applyOptions({ scaleMargins: { top: 0.05, bottom: 0.22 } });

  chart.subscribeCrosshairMove((param) => {
    if (!param || !param.time || !candleSeries) return;
    const d = param.seriesData.get(candleSeries);
    if (d) updateOhlcDisplay(d);
  });

  const ro = new ResizeObserver(() => {
    if (chart) chart.applyOptions({ width: chartContainer.clientWidth, height: chartContainer.clientHeight });
  });
  ro.observe(chartContainer);
}

function render() {
  if (!candleSeries || allBars.length === 0) return;
  const slice = allBars.slice(0, visibleN);

  candleSeries.setData(slice);
  volumeSeries.setData(slice.map(b => ({
    time: b.time, value: b.volume,
    color: b.close >= b.open ? '#3fb95033' : '#f8514933',
  })));

  renderPredMarkers(slice);
  renderNoteMarkers(slice);
  chart.timeScale().scrollToPosition(0, false);

  barInfo.textContent = `${visibleN} / ${allBars.length}`;
  if (slice.length > 0) updateOhlcDisplay(slice[slice.length - 1]);
  updateScoreStrip();
  updateTradeStatus();
}

function updateOhlcDisplay(d) {
  const dir  = d.close >= d.open ? 'val-up' : 'val-down';
  const chg  = (((d.close - d.open) / d.open) * 100).toFixed(2);
  const sign = chg >= 0 ? '+' : '';
  ohlcInfo.innerHTML = `
    <span><span class="lbl">O</span><span class="${dir}">${d.open.toFixed(2)}</span></span>
    <span><span class="lbl">H</span><span class="${dir}">${d.high.toFixed(2)}</span></span>
    <span><span class="lbl">L</span><span class="${dir}">${d.low.toFixed(2)}</span></span>
    <span><span class="lbl">C</span><span class="${dir}">${d.close.toFixed(2)}</span></span>
    <span><span class="lbl">Chg</span><span class="${dir}">${sign}${chg}%</span></span>
  `;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREDICTION
// ═══════════════════════════════════════════════════════════════════════════════

function renderPredMarkers(slice) {
  if (!candleSeries) return;
  const markers = predictionResults
    .filter(r => r.barIndex < slice.length)
    .map(r => {
      const bar = slice[r.barIndex];
      return {
        time:     bar.time,
        position: r.prediction === 'bull' ? 'aboveBar' : 'belowBar',
        color:    r.correct ? '#3fb950' : '#f85149',
        shape:    r.correct ? 'arrowUp' : 'arrowDown',
        size:     1,
        text:     '',
      };
    });
  candleSeries.setMarkers(markers);
}

function updateScoreStrip() {
  if (!sessionActive || predictionResults.length === 0) {
    scoreStrip.innerHTML = '<span class="score-idle">Press <kbd>B</kbd> Bull · <kbd>L</kbd> Bear before a bar</span>';
    return;
  }
  const total   = predictionResults.length;
  const correct = predictionResults.filter(r => r.correct).length;
  const pct     = Math.round((correct / total) * 100);
  const bulls   = predictionResults.filter(r => r.prediction === 'bull');
  const bears   = predictionResults.filter(r => r.prediction === 'bear');
  const bullPct = bulls.length ? Math.round(bulls.filter(r => r.correct).length / bulls.length * 100) : '—';
  const bearPct = bears.length ? Math.round(bears.filter(r => r.correct).length / bears.length * 100) : '—';
  let streak = 0;
  for (let i = predictionResults.length - 1; i >= 0; i--) {
    if (predictionResults[i].correct) streak++; else break;
  }
  const cls = pct >= 60 ? 'score-good' : pct >= 45 ? 'score-mid' : 'score-bad';
  scoreStrip.innerHTML = `
    <span class="score-item ${cls}">${pct}%</span>
    <span class="score-sep">·</span>
    <span class="score-item">${correct}/${total}</span>
    <span class="score-sep">·</span>
    <span class="score-item score-bull">B ${bullPct}%</span>
    <span class="score-sep">·</span>
    <span class="score-item score-bear">L ${bearPct}%</span>
    ${streak >= 3 ? `<span class="score-sep">·</span><span class="score-item score-streak">${streak}✦</span>` : ''}
  `;
}

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
  if (predMode !== 'committed' || pendingPrediction === null) {
    hidePredOverlay(); predMode = 'idle'; return;
  }
  const newBar  = allBars[visibleN - 1];
  const prevBar = allBars[visibleN - 2];
  if (!newBar || !prevBar) { hidePredOverlay(); return; }

  const correct = (pendingPrediction === 'bull') === (newBar.close >= prevBar.close);
  predictionResults.push({ barIndex: visibleN - 1, prediction: pendingPrediction, correct });

  predMode = 'idle';
  pendingPrediction = null;
  showPredOverlay('result', null, correct);
  updateScoreStrip();
  setTimeout(hidePredOverlay, 800);
}

function showPredOverlay(state, extra, correct) {
  predOverlay.className = 'pred-overlay';
  if (state === 'committed') {
    predOverlay.classList.add('pred-waiting');
    predOverlay.querySelector('.pred-result').style.display    = 'none';
    const el = predOverlay.querySelector('.pred-committed');
    el.style.display = '';
    const lbl = el.querySelector('.pred-committed-label');
    lbl.textContent = extra === 'bull' ? '▲  Bullish' : '▼  Bearish';
    lbl.className   = 'pred-committed-label ' + (extra === 'bull' ? 'bull' : 'bear');
  } else if (state === 'result') {
    predOverlay.classList.add(correct ? 'pred-correct' : 'pred-wrong');
    predOverlay.querySelector('.pred-committed').style.display = 'none';
    const el = predOverlay.querySelector('.pred-result');
    el.style.display = '';
    el.textContent   = correct ? '✓' : '✗';
    el.className     = 'pred-result ' + (correct ? 'correct' : 'wrong');
  }
  predOverlay.style.display = 'flex';
}

function hidePredOverlay() {
  predOverlay.style.display = 'none';
  predMode = 'idle';
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRADE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

let _tradeDirection = 'long'; // set by Buy/Sell buttons

function openTradePanel(direction) {
  if (!sessionActive || allBars.length === 0) return;
  _tradeDirection = direction;
  const bar = allBars[visibleN - 1];
  tradeEntryPrice.value = bar.close.toFixed(2);
  const lookback = allBars.slice(Math.max(0, visibleN - 14), visibleN);
  const avgRange = lookback.reduce((s, b) => s + (b.high - b.low), 0) / lookback.length;
  if (direction === 'long') {
    tradeTpInput.value = (bar.close + avgRange * 1.5).toFixed(2);
    tradeSlInput.value = (bar.close - avgRange * 0.8).toFixed(2);
  } else {
    tradeTpInput.value = (bar.close - avgRange * 1.5).toFixed(2);
    tradeSlInput.value = (bar.close + avgRange * 0.8).toFixed(2);
  }
  ticketDirection.textContent = direction === 'long' ? '▲ Buy' : '▼ Sell';
  ticketDirection.className   = 'ticket-direction-label ' + direction;
  // Style confirm button to match direction
  tradeConfirmBtn.className   = 'ticket-confirm-btn ' + direction;
  ticketForm.style.display    = '';
  tradeTpInput.focus();
}

function confirmTrade() {
  const entryPrice = parseFloat(tradeEntryPrice.value);
  const tp         = parseFloat(tradeTpInput.value);
  const sl         = parseFloat(tradeSlInput.value);
  if (isNaN(entryPrice) || isNaN(tp) || isNaN(sl)) return;

  activeTrade = { entryBar: visibleN - 1, entryPrice, tp, sl, direction: _tradeDirection };
  ticketForm.style.display = 'none';
  drawTradeLines();
  saveSession();
}

function drawTradeLines() {
  if (!candleSeries || !activeTrade) return;
  // Remove existing lines
  clearTradeLines();
  entryLine = candleSeries.createPriceLine({ price: activeTrade.entryPrice, color: '#7d8590',    lineWidth: 1, lineStyle: 2, title: 'Entry' });
  tpLine    = candleSeries.createPriceLine({ price: activeTrade.tp,         color: '#3fb950',    lineWidth: 1, lineStyle: 2, title: 'TP'    });
  slLine    = candleSeries.createPriceLine({ price: activeTrade.sl,         color: '#f85149',    lineWidth: 1, lineStyle: 2, title: 'SL'    });
}

function clearTradeLines() {
  if (!candleSeries) return;
  if (tpLine)    { try { candleSeries.removePriceLine(tpLine);    } catch {} tpLine    = null; }
  if (slLine)    { try { candleSeries.removePriceLine(slLine);    } catch {} slLine    = null; }
  if (entryLine) { try { candleSeries.removePriceLine(entryLine); } catch {} entryLine = null; }
}

// Called after each bar reveal — check if TP or SL was hit
function checkTradeResolution() {
  if (!activeTrade) return;
  const bar = allBars[visibleN - 1];
  if (!bar) return;

  const { tp, sl, direction, entryPrice, entryBar } = activeTrade;
  let outcome   = null;
  let exitPrice = null;

  if (direction === 'long') {
    if (bar.low <= sl)  { outcome = 'sl'; exitPrice = sl; }
    if (bar.high >= tp) { outcome = outcome ? 'sl' : 'tp'; exitPrice = outcome === 'sl' ? sl : tp; }
    // If both hit on same bar, SL wins (worst case)
  } else {
    if (bar.high >= sl) { outcome = 'sl'; exitPrice = sl; }
    if (bar.low <= tp)  { outcome = outcome ? 'sl' : 'tp'; exitPrice = outcome === 'sl' ? sl : tp; }
  }

  if (outcome) {
    resolvedTrades.push({ entryBar, entryPrice, tp, sl, direction, exitBar: visibleN - 1, exitPrice, outcome });
    activeTrade = null;
    clearTradeLines();
    flashTradeResult(outcome);
    saveSession();
  }
}

function closeTradeManually() {
  if (!activeTrade) return;
  const bar = allBars[visibleN - 1];
  if (!bar) return;
  const exitPrice = bar.close;
  const outcome   = activeTrade.direction === 'long'
    ? (exitPrice > activeTrade.entryPrice ? 'tp' : 'sl')
    : (exitPrice < activeTrade.entryPrice ? 'tp' : 'sl');
  resolvedTrades.push({ ...activeTrade, exitBar: visibleN - 1, exitPrice, outcome: 'manual' });
  activeTrade = null;
  clearTradeLines();
  updateTradeStatus();
  saveSession();
}

// ── Trade review ──────────────────────────────────────────────────────────────

function enterTradeReview(tradeIndex) {
  const trade = resolvedTrades[tradeIndex];
  if (!trade || !sessionActive) return;

  closeSessionModal();

  // Stash where we are
  reviewReturnBar = visibleN;
  reviewMode      = true;

  // Clear any active trade lines first
  clearTradeLines();
  clearReviewLines();

  // Set visibleN to entry bar + small lookback so you see the setup
  const lookback = 20;
  visibleN = Math.max(1, trade.entryBar - lookback + 1);

  // Render up to entry bar initially — user steps forward from there
  render();

  // Draw reference lines for this trade (dashed, labelled)
  if (candleSeries) {
    reviewRefLines.push(
      candleSeries.createPriceLine({ price: trade.entryPrice, color: '#7d8590aa', lineWidth: 1, lineStyle: 1, title: `Entry ${trade.direction === 'long' ? '▲' : '▼'}` }),
      candleSeries.createPriceLine({ price: trade.tp,         color: '#3fb95099', lineWidth: 1, lineStyle: 1, title: 'TP'    }),
      candleSeries.createPriceLine({ price: trade.sl,         color: '#f8514999', lineWidth: 1, lineStyle: 1, title: 'SL'    }),
    );
  }

  // Show review banner
  showReviewBanner(trade, tradeIndex);
}

function exitTradeReview() {
  reviewMode = false;
  clearReviewLines();
  hideReviewBanner();
  if (reviewReturnBar !== null) {
    visibleN = reviewReturnBar;
    reviewReturnBar = null;
  }
  // Restore active trade lines if there's an active trade
  if (activeTrade) drawTradeLines();
  render();
}

function clearReviewLines() {
  if (!candleSeries) { reviewRefLines = []; return; }
  for (const line of reviewRefLines) {
    try { candleSeries.removePriceLine(line); } catch {}
  }
  reviewRefLines = [];
}

function showReviewBanner(trade, idx) {
  let banner = document.getElementById('reviewBanner');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'reviewBanner';
    chartContainer.appendChild(banner);
  }
  const dir     = trade.direction === 'long' ? '▲ BUY' : '▼ SELL';
  const dirCls  = trade.direction === 'long' ? 'bull' : 'bear';
  const rr      = (Math.abs(trade.tp - trade.entryPrice) / Math.abs(trade.entryPrice - trade.sl)).toFixed(1);
  const outCls  = trade.outcome === 'tp' ? 'bull' : 'bear';
  const outLbl  = trade.outcome === 'tp' ? 'TP ✓' : trade.outcome === 'sl' ? 'SL ✗' : 'Manual';
  banner.innerHTML = `
    <span class="review-label">Reviewing trade ${idx + 1}</span>
    <span class="review-sep">·</span>
    <span class="review-dir ${dirCls}">${dir}</span>
    <span class="review-sep">·</span>
    <span class="review-price">@ ${trade.entryPrice.toFixed(2)}</span>
    <span class="review-sep">·</span>
    <span class="review-rr">R:R ${rr}</span>
    <span class="review-sep">·</span>
    <span class="review-outcome ${outCls}">${outLbl}</span>
    <button id="exitReviewBtn" class="exit-review-btn">Exit Review</button>
  `;
  banner.style.display = 'flex';
  document.getElementById('exitReviewBtn').addEventListener('click', exitTradeReview);
}

function hideReviewBanner() {
  const banner = document.getElementById('reviewBanner');
  if (banner) banner.style.display = 'none';
}

function flashTradeResult(outcome) {
  const el = document.getElementById('tradeFlash');
  if (!el) return;
  el.textContent  = outcome === 'tp' ? '✓ TP Hit' : '✗ SL Hit';
  el.className    = 'trade-flash ' + (outcome === 'tp' ? 'tp' : 'sl');
  el.style.display = 'flex';
  setTimeout(() => { el.style.display = 'none'; }, 1200);
}

function updateTradeStatus() {
  const tradeStatus   = document.getElementById('tradeStatus');
  const tradeCloseBtn = document.getElementById('tradeCloseBtn');
  if (!tradeStatus) return;

  if (!activeTrade) {
    tradeStatus.innerHTML = resolvedTrades.length > 0
      ? `<span class="ts-idle">${resolvedTrades.length} trade${resolvedTrades.length > 1 ? 's' : ''} · ${resolvedTrades.filter(t=>t.outcome==='tp').length} TP / ${resolvedTrades.filter(t=>t.outcome==='sl').length} SL / ${resolvedTrades.filter(t=>t.outcome==='manual').length} manual</span>`
      : '';
    if (tradeCloseBtn) tradeCloseBtn.style.display = 'none';
    return;
  }
  const { direction, entryPrice, tp, sl } = activeTrade;
  const rr = Math.abs(tp - entryPrice) / Math.abs(entryPrice - sl);
  tradeStatus.innerHTML = `
    <span class="ts-open ${direction}">${direction === 'long' ? '▲' : '▼'} ${direction === 'long' ? 'BUY' : 'SELL'}</span>
    <span class="ts-sep">·</span>
    <span class="ts-price">@ ${entryPrice.toFixed(2)}</span>
    <span class="ts-sep">·</span>
    <span class="ts-rr">R:R ${rr.toFixed(1)}</span>
  `;
  if (tradeCloseBtn) tradeCloseBtn.style.display = '';
}

// ═══════════════════════════════════════════════════════════════════════════════
// BAR NOTES
// ═══════════════════════════════════════════════════════════════════════════════

let noteTargetBar = null;

function openNotePanel() {
  if (!sessionActive || allBars.length === 0) return;
  noteTargetBar = visibleN - 1;
  const bar = allBars[noteTargetBar];
  const d   = new Date(bar.time * 1000);
  noteBarLabel.textContent = `Bar ${noteTargetBar + 1} · ${d.toLocaleDateString()}`;
  noteTextarea.value = notes[noteTargetBar] || '';
  notePanel.style.display = 'flex';
  noteTextarea.focus();
}

function saveNote() {
  if (noteTargetBar === null) return;
  const text = noteTextarea.value.trim();
  if (text) notes[noteTargetBar] = text;
  else      delete notes[noteTargetBar];
  notePanel.style.display = 'none';
  noteTargetBar = null;
  render();
  saveSession();
}

function renderNoteMarkers(slice) {
  // Draw small dot markers on bars that have notes
  // We merge these with pred markers — candleSeries.setMarkers replaces all,
  // so we combine both sets in renderPredMarkers and call it there.
  // Instead, use a separate series: a line series with no line, only markers.
  // Lightweight-charts v4 doesn't support a dedicated marker series, so we
  // draw note markers as part of the combined setMarkers call.
  // This function builds note marker objects and returns them.
  return Object.entries(notes)
    .filter(([idx]) => parseInt(idx) < slice.length)
    .map(([idx]) => {
      const bar = slice[parseInt(idx)];
      return {
        time:     bar.time,
        position: 'belowBar',
        color:    '#58a6ff',
        shape:    'circle',
        size:     0,
        text:     '●',
      };
    });
}

// Override renderPredMarkers to merge note markers
function renderAllMarkers(slice) {
  if (!candleSeries) return;
  const predMarkers = predictionResults
    .filter(r => r.barIndex < slice.length)
    .map(r => {
      const bar = slice[r.barIndex];
      return {
        time:     bar.time,
        position: r.prediction === 'bull' ? 'aboveBar' : 'belowBar',
        color:    r.correct ? '#3fb950' : '#f85149',
        shape:    r.correct ? 'arrowUp' : 'arrowDown',
        size:     1,
        text:     '',
      };
    });

  const noteMarkers = Object.entries(notes)
    .filter(([idx]) => parseInt(idx) < slice.length)
    .map(([idx]) => {
      const bar = slice[parseInt(idx)];
      return { time: bar.time, position: 'aboveBar', color: '#58a6ff', shape: 'circle', size: 0, text: '·' };
    });

  // Trade resolved markers
  const tradeMarkers = resolvedTrades
    .filter(t => t.exitBar < slice.length)
    .map(t => {
      const bar = slice[t.exitBar];
      return {
        time:     bar.time,
        position: t.outcome === 'tp' ? 'aboveBar' : 'belowBar',
        color:    t.outcome === 'tp' ? '#3fb950' : t.outcome === 'sl' ? '#f85149' : '#7d8590',
        shape:    t.outcome === 'tp' ? 'arrowUp' : 'arrowDown',
        size:     2,
        text:     t.outcome === 'tp' ? 'TP' : t.outcome === 'sl' ? 'SL' : 'X',
      };
    });

  // Merge and sort by time
  const all = [...predMarkers, ...noteMarkers, ...tradeMarkers]
    .sort((a, b) => a.time - b.time);

  candleSeries.setMarkers(all);
}

// Patch render() to use renderAllMarkers
const _origRender = render;

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION PERSISTENCE
// ═══════════════════════════════════════════════════════════════════════════════

function buildSessionState() {
  return {
    visibleN,
    predictionResults,
    activeTrade,
    resolvedTrades,
    notes,
    savedAt: Date.now(),
  };
}

async function saveSession() {
  if (!currentCacheKey || !sessionActive) return;
  try {
    await fetch('/api/session', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ cacheKey: currentCacheKey, state: buildSessionState() }),
    });
  } catch { /* non-fatal */ }
}

async function checkForSavedSession(cacheKey) {
  try {
    const res = await fetch(`/api/session?cacheKey=${encodeURIComponent(cacheKey)}`);
    const j   = await res.json();
    if (j.ok && j.exists && j.data) return j.data;
  } catch {}
  return null;
}

function applySessionState(state) {
  visibleN          = Math.min(state.visibleN || 50, allBars.length);
  predictionResults = state.predictionResults || [];
  resolvedTrades    = state.resolvedTrades    || [];
  notes             = state.notes             || {};
  activeTrade       = state.activeTrade       || null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// KEYBOARD
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener('keydown', (e) => {
  // Always let Escape close open panels
  if (e.key === 'Escape') {
    ticketForm.style.display = 'none';
    notePanel.style.display  = 'none';
    hidePredOverlay();
    return;
  }

  // Don't intercept typing in inputs
  if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) return;

  if (sessionModal.style.display !== 'none') {
    if (e.key === 'Escape' || e.key === 'Tab') closeSessionModal();
    return;
  }

  const key = e.key.toLowerCase();

  if (sessionActive && allBars.length > 0) {
    if (key === 'b') { e.preventDefault(); commitPrediction('bull'); return; }
    if (key === 'l') { e.preventDefault(); commitPrediction('bear'); return; }
    if (key === 's') { e.preventDefault(); skipPrediction(); return; }
    if (key === 'e') { e.preventDefault(); openTradePanel('long'); return; }
    if (key === 'x') { e.preventDefault(); closeTradeManually(); return; }
    if (key === 'n') { e.preventDefault(); openNotePanel(); return; }
    if (key === 'r') { e.preventDefault(); if (reviewMode) exitTradeReview(); else openSessionModal(); return; }
  }

  if (e.key === 'Tab') { e.preventDefault(); if (sessionActive) openSessionModal(); return; }
  if (allBars.length === 0) return;

  switch (e.key) {
    case 'ArrowRight': {
      e.preventDefault();
      if (visibleN >= allBars.length) return;
      if (predMode === 'idle') predMode = 'skip';
      visibleN++;
      render();
      resolvePrediction();
      checkTradeResolution();
      saveSession();
      break;
    }
    case 'ArrowLeft':
      e.preventDefault();
      hidePredOverlay(); predMode = 'idle';
      if (visibleN > 1) { visibleN--; render(); saveSession(); }
      break;
    case 'ArrowUp':
      e.preventDefault();
      hidePredOverlay(); predMode = 'idle';
      visibleN = Math.min(allBars.length, visibleN + 10);
      render(); saveSession();
      break;
    case 'ArrowDown':
      e.preventDefault();
      hidePredOverlay(); predMode = 'idle';
      visibleN = Math.max(1, visibleN - 10);
      render(); saveSession();
      break;
    case ' ':
      e.preventDefault();
      randomiseStart();
      break;
  }
});

function randomiseStart() {
  if (allBars.length === 0) return;
  hidePredOverlay(); predMode = 'idle';
  const min = 10, max = allBars.length - 5;
  if (max <= min) return;
  visibleN = Math.floor(Math.random() * (max - min + 1)) + min;
  render(); saveSession();
}

// ═══════════════════════════════════════════════════════════════════════════════
// RENDER — override to merge all markers
// ═══════════════════════════════════════════════════════════════════════════════

// Re-define render() so it calls renderAllMarkers instead of renderPredMarkers
function render() {  // eslint-disable-line no-redeclare
  if (!candleSeries || allBars.length === 0) return;
  const slice = allBars.slice(0, visibleN);

  candleSeries.setData(slice);
  volumeSeries.setData(slice.map(b => ({
    time: b.time, value: b.volume,
    color: b.close >= b.open ? '#3fb95033' : '#f8514933',
  })));

  renderAllMarkers(slice);

  // Redraw trade lines if active trade exists
  if (activeTrade && candleSeries) drawTradeLines();

  chart.timeScale().scrollToPosition(0, false);
  barInfo.textContent = `${visibleN} / ${allBars.length}`;
  if (slice.length > 0) updateOhlcDisplay(slice[slice.length - 1]);
  updateScoreStrip();
  updateTradeStatus();
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOAD DATA
// ═══════════════════════════════════════════════════════════════════════════════

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

    currentCacheKey = `${symbol}_${interval}_${period1}_${period2}`.replace(/[^a-zA-Z0-9_-]/g, '_');

    // Check for saved session
    const saved = await checkForSavedSession(currentCacheKey);
    if (saved) {
      // Show resume prompt — stash startBar for fresh start fallback
      _pendingLoad = { saved, startBar, symbol, interval };
      showResumePrompt(saved);
      return;
    }

    startFreshSession(startBar, symbol, interval);

  } catch (err) {
    setStatus(`Network error: ${err.message}`, 'err');
  } finally {
    loadBtn.disabled = false;
  }
}

let _pendingLoad = null;

function showResumePrompt(saved) {
  const d = new Date(saved.savedAt);
  document.getElementById('resumeInfo').textContent =
    `${saved.visibleN} bars · ${predictionResults.length} predictions · saved ${d.toLocaleDateString()}`;
  resumePrompt.style.display = 'flex';
}

resumeYesBtn.addEventListener('click', () => {
  resumePrompt.style.display = 'none';
  if (!_pendingLoad) return;
  const { saved, symbol, interval } = _pendingLoad;
  applySessionState(saved);
  sessionActive = true;
  initChart();
  render();
  if (activeTrade) drawTradeLines();
  symbolLabel.textContent   = blindToggle.checked ? '████' : symbol;
  intervalLabel.textContent = interval;
  setStatus(`Session resumed · ${allBars.length} bars`, 'ok');
  refreshCache();
  loadBtn.disabled = false;
});

resumeNoBtn.addEventListener('click', () => {
  resumePrompt.style.display = 'none';
  if (!_pendingLoad) return;
  const { startBar, symbol, interval } = _pendingLoad;
  startFreshSession(startBar, symbol, interval);
  loadBtn.disabled = false;
});

function startFreshSession(startBar, symbol, interval) {
  // Reset all session state
  predictionResults = [];
  pendingPrediction = null;
  predMode          = 'idle';
  activeTrade       = null;
  resolvedTrades    = [];
  notes             = {};
  hidePredOverlay();
  clearTradeLines();
  sessionActive     = true;

  visibleN = Math.min(startBar, allBars.length);
  initChart();
  render();

  symbolLabel.textContent   = blindToggle.checked ? '████' : symbol;
  intervalLabel.textContent = interval;
  setStatus(`${allBars.length} bars loaded`, 'ok');
  refreshCache();
  updateTradeStatus();
  saveSession();
}

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function openSessionModal() {
  const total = predictionResults.length;
  if (total === 0) {
    document.getElementById('modalContent').innerHTML =
      '<p class="modal-empty">No predictions yet.<br>Press <kbd>B</kbd> or <kbd>L</kbd> before advancing.</p>';
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
  let maxStreak = 0, cur = 0;
  for (const r of predictionResults) { if (r.correct) { cur++; maxStreak = Math.max(maxStreak, cur); } else cur = 0; }
  const bias = bulls.length > bears.length * 2
    ? 'Called bullish much more often — watch for upside bias.'
    : bears.length > bulls.length * 2
    ? 'Called bearish much more often — watch for downside bias.'
    : 'Directional call mix looks balanced.';

  const symbol = blindToggle.checked ? 'hidden' : (symbolLabel.textContent || '?');

  // Trade log — full table with Review buttons
  const tradeHtml = resolvedTrades.length > 0 ? `
    <div class="modal-trades">
      <div class="modal-section-title">Trade Log</div>
      <div class="trade-log">
        <div class="trade-log-header">
          <span>#</span><span>Dir</span><span>Entry</span>
          <span>TP</span><span>SL</span><span>Exit</span>
          <span>R:R</span><span>Result</span><span></span>
        </div>
        ${resolvedTrades.map((t, i) => {
          const rr      = (Math.abs(t.tp - t.entryPrice) / Math.abs(t.entryPrice - t.sl)).toFixed(1);
          const dirCls  = t.direction === 'long' ? 'bull' : 'bear';
          const dirLbl  = t.direction === 'long' ? '▲' : '▼';
          const outCls  = t.outcome === 'tp' ? 'bull' : 'bear';
          const outLbl  = t.outcome === 'tp' ? 'TP ✓' : t.outcome === 'sl' ? 'SL ✗' : 'X';
          const pnl     = t.direction === 'long'
            ? ((t.exitPrice - t.entryPrice) / t.entryPrice * 100).toFixed(2)
            : ((t.entryPrice - t.exitPrice) / t.entryPrice * 100).toFixed(2);
          const pnlCls  = parseFloat(pnl) >= 0 ? 'bull' : 'bear';
          return `<div class="trade-log-row">
            <span class="tl-num">${i + 1}</span>
            <span class="tl-dir ${dirCls}">${dirLbl}</span>
            <span class="tl-price">${t.entryPrice.toFixed(2)}</span>
            <span class="tl-tp">${t.tp.toFixed(2)}</span>
            <span class="tl-sl">${t.sl.toFixed(2)}</span>
            <span class="tl-exit">${t.exitPrice.toFixed(2)}</span>
            <span class="tl-rr">${rr}</span>
            <span class="tl-outcome ${outCls}">${outLbl} <span class="tl-pnl ${pnlCls}">${parseFloat(pnl) >= 0 ? '+' : ''}${pnl}%</span></span>
            <button class="tl-review-btn" data-idx="${i}">Review</button>
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  // Notes summary
  const noteCount  = Object.keys(notes).length;
  const notesHtml  = noteCount > 0
    ? `<div class="modal-notes-summary"><div class="modal-section-title">Notes</div>
       ${Object.entries(notes).map(([idx, text]) => `
         <div class="modal-note-item"><span class="modal-note-bar">Bar ${parseInt(idx)+1}</span><span class="modal-note-text">${text}</span></div>
       `).join('')}</div>`
    : '';

  document.getElementById('modalContent').innerHTML = `
    <div class="modal-symbol">${symbol} <span class="modal-interval">${intervalSel.value}</span></div>
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
        <div class="modal-dir-bar"><div class="modal-dir-fill bull" style="width:${bullPct ?? 0}%"></div></div>
        <div class="modal-dir-pct">${bulls.length} calls · ${bullPct !== null ? bullPct + '%' : '—'} correct</div>
      </div>
      <div class="modal-dir">
        <div class="modal-dir-label bear">▼ Bear calls</div>
        <div class="modal-dir-bar"><div class="modal-dir-fill bear" style="width:${bearPct ?? 0}%"></div></div>
        <div class="modal-dir-pct">${bears.length} calls · ${bearPct !== null ? bearPct + '%' : '—'} correct</div>
      </div>
    </div>
    <div class="modal-bias">${bias}</div>
    ${tradeHtml}
    ${notesHtml}
  `;
  sessionModal.style.display = 'flex';

  // Wire Review buttons in trade log
  document.querySelectorAll('.tl-review-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      enterTradeReview(parseInt(btn.dataset.idx));
    });
  });
}

function closeSessionModal() { sessionModal.style.display = 'none'; }
sessionModalClose.addEventListener('click', closeSessionModal);
sessionModal.addEventListener('click', (e) => { if (e.target === sessionModal) closeSessionModal(); });
scoreBtn.addEventListener('click', () => { if (sessionActive) openSessionModal(); });

// ═══════════════════════════════════════════════════════════════════════════════
// TRADE PANEL BINDINGS
// ═══════════════════════════════════════════════════════════════════════════════

buyBtn.addEventListener('click',  () => { if (sessionActive && !activeTrade) openTradePanel('long');  });
sellBtn.addEventListener('click', () => { if (sessionActive && !activeTrade) openTradePanel('short'); });
tradeConfirmBtn.addEventListener('click', confirmTrade);
tradeCancelBtn.addEventListener('click',  () => { ticketForm.style.display = 'none'; });

[tradeTpInput, tradeSlInput, tradeEntryPrice].forEach(el => {
  el.addEventListener('keydown', e => {
    if (e.key === 'Enter')  confirmTrade();
    if (e.key === 'Escape') ticketForm.style.display = 'none';
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// NOTE PANEL BINDINGS
// ═══════════════════════════════════════════════════════════════════════════════

noteSaveBtn.addEventListener('click',   saveNote);
noteCancelBtn.addEventListener('click', () => { notePanel.style.display = 'none'; noteTargetBar = null; });
noteTextarea.addEventListener('keydown', e => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); saveNote(); }
  if (e.key === 'Escape') { notePanel.style.display = 'none'; noteTargetBar = null; }
});

// ═══════════════════════════════════════════════════════════════════════════════
// MISC
// ═══════════════════════════════════════════════════════════════════════════════

function applyNoise(bars, pct) {
  const f = pct / 100;
  return bars.map(b => {
    const j = () => 1 + (Math.random() * 2 - 1) * f;
    const o = b.open * j(), h = b.high * j(), l = b.low * j(), c = b.close * j();
    return { ...b, open: +o.toFixed(4), high: +Math.max(o,h,l,c).toFixed(4), low: +Math.min(o,h,l,c).toFixed(4), close: +c.toFixed(4) };
  });
}

function rebuildAllBars() {
  allBars = noiseToggle.checked ? applyNoise(rawBars, parseFloat(noiseRange.value)) : rawBars.slice();
}

blindToggle.addEventListener('change', () => {
  if (!sessionActive) return;
  symbolLabel.textContent = blindToggle.checked ? '████' : symbolInput.value.trim().toUpperCase();
});
noiseToggle.addEventListener('change',  () => { if (rawBars.length) { rebuildAllBars(); render(); } });
noiseRange.addEventListener('change',   () => { if (noiseToggle.checked && rawBars.length) { rebuildAllBars(); render(); } });

loadBtn.addEventListener('click', loadData);
symbolInput.addEventListener('keydown', e => { if (e.key === 'Enter') loadData(); });
randomBtn.addEventListener('click', () => {
  if (typeof STOCKS !== 'undefined' && STOCKS.length)
    symbolInput.value = STOCKS[Math.floor(Math.random() * STOCKS.length)];
});

async function refreshCache() {
  try {
    const files = await fetch('/api/cache').then(r => r.json());
    // Filter out .session.json files from the visible list
    const dataFiles = files.filter(f => !f.name.endsWith('.session.json'));
    cacheList.innerHTML = '';
    if (!dataFiles.length) { cacheList.innerHTML = '<li class="empty-cache">No cached datasets yet</li>'; return; }
    dataFiles.forEach(f => {
      const li = document.createElement('li');
      const name = document.createElement('span');
      name.className = 'cache-name';
      name.textContent = f.name.replace('.json','').replace(/_/g,' ');
      name.title = f.name;
      const size = document.createElement('span');
      size.className = 'cache-size';
      size.textContent = `${(f.size/1024).toFixed(0)}k`;
      const del = document.createElement('span');
      del.className = 'cache-del';
      del.textContent = '✕';
      del.addEventListener('click', async () => {
        await fetch(`/api/cache/${encodeURIComponent(f.name)}`, { method: 'DELETE' });
        refreshCache();
      });
      li.appendChild(name); li.appendChild(size); li.appendChild(del);
      cacheList.appendChild(li);
    });
  } catch {}
}

refreshCacheBtn.addEventListener('click', refreshCache);

function setStatus(msg, type) { statusMsg.textContent = msg; statusMsg.className = 'status-msg ' + (type||''); }

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
