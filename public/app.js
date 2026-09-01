/* ─────────────────────────────────────────────────────────────────────────────
   Price Action Trainer — app.js
   Vercel + Supabase edition
   ───────────────────────────────────────────────────────────────────────────── */

'use strict';

// ── Auth state ────────────────────────────────────────────────────────────────
let authToken    = localStorage.getItem('pat_token')   || null;
let authUser     = JSON.parse(localStorage.getItem('pat_user') || 'null');
let currentDatasetId = null;

// ── Chart state ───────────────────────────────────────────────────────────────
let allBars      = [];
let rawBars      = [];
let visibleN     = 0;
let chart        = null;
let candleSeries = null;
let volumeSeries = null;

// ── Prediction state ──────────────────────────────────────────────────────────
let predMode          = 'idle';
let pendingPrediction = null;
let predictionResults = [];

// ── Trade state ───────────────────────────────────────────────────────────────
let activeTrade    = null;
let resolvedTrades = [];
let tpLine = null, slLine = null, entryLine = null;
let _tradeDirection = 'long';

// ── Review mode ───────────────────────────────────────────────────────────────
let reviewMode      = false;
let reviewReturnBar = null;
let reviewRefLines  = [];

// ── Notes ─────────────────────────────────────────────────────────────────────
let notes = {};
let noteTargetBar = null;

// ── Session ───────────────────────────────────────────────────────────────────
let sessionActive = false;
let _pendingLoad  = null;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const datasetSelect   = document.getElementById('datasetSelect');
const datasetMeta     = document.getElementById('datasetMeta');
const startBarIn      = document.getElementById('startBar');
const noiseToggle     = document.getElementById('noiseToggle');
const noiseRange      = document.getElementById('noiseRange');
const noiseVal        = document.getElementById('noiseVal');
const blindToggle     = document.getElementById('blindToggle');
const loadBtn         = document.getElementById('loadBtn');
const statusMsg       = document.getElementById('statusMsg');
const chartContainer  = document.getElementById('chartContainer');
const symbolLabel     = document.getElementById('symbolLabel');
const intervalLabel   = document.getElementById('intervalLabel');
const barInfo         = document.getElementById('barInfo');
const ohlcInfo        = document.getElementById('ohlcInfo');
const scoreStrip      = document.getElementById('scoreStrip');
const predOverlay     = document.getElementById('predOverlay');
const sessionModal    = document.getElementById('sessionModal');
const sessionModalClose = document.getElementById('sessionModalClose');
const scoreBtn        = document.getElementById('scoreBtn');
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
const notePanel       = document.getElementById('notePanel');
const noteTextarea    = document.getElementById('noteTextarea');
const noteSaveBtn     = document.getElementById('noteSaveBtn');
const noteCancelBtn   = document.getElementById('noteCancelBtn');
const noteBarLabel    = document.getElementById('noteBarLabel');
const resumePrompt    = document.getElementById('resumePrompt');
const resumeYesBtn    = document.getElementById('resumeYesBtn');
const resumeNoBtn     = document.getElementById('resumeNoBtn');
const userBadge       = document.getElementById('userBadge');
const userEmail       = document.getElementById('userEmail');
const logoutBtn       = document.getElementById('logoutBtn');
const authPromptBlock = document.getElementById('authPromptBlock');
const openAuthBtn     = document.getElementById('openAuthBtn');
const authModal       = document.getElementById('authModal');
const authModalClose  = document.getElementById('authModalClose');
const authModalTitle  = document.getElementById('authModalTitle');
const authEmail       = document.getElementById('authEmail');
const authPassword    = document.getElementById('authPassword');
const authSubmitBtn   = document.getElementById('authSubmitBtn');
const authSwitchBtn   = document.getElementById('authSwitchBtn');
const authSwitchText  = document.getElementById('authSwitchText');
const authError       = document.getElementById('authError');

noiseRange.addEventListener('input', () => {
  noiseVal.textContent = parseFloat(noiseRange.value).toFixed(1);
});

// ═══════════════════════════════════════════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

function apiHeaders() {
  const h = { 'Content-Type': 'application/json' };
  if (authToken) h['Authorization'] = `Bearer ${authToken}`;
  return h;
}

async function apiFetch(path, options = {}) {
  const res = await fetch(path, { headers: apiHeaders(), ...options });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════════

let authMode = 'login'; // 'login' | 'signup'

function updateAuthUI() {
  if (authUser) {
    userBadge.style.display       = '';
    userEmail.textContent         = authUser.email;
    authPromptBlock.style.display = 'none';
  } else {
    userBadge.style.display       = 'none';
    authPromptBlock.style.display = '';
  }
}

function openAuthModal(mode = 'login') {
  authMode = mode;
  authModalTitle.textContent = mode === 'login' ? 'Sign in' : 'Create account';
  authSubmitBtn.textContent  = mode === 'login' ? 'Sign in' : 'Create account';
  authSwitchText.textContent = mode === 'login' ? "Don't have an account?" : 'Already have an account?';
  authSwitchBtn.textContent  = mode === 'login' ? 'Register' : 'Sign in';
  authError.style.display    = 'none';
  authEmail.value = authPassword.value = '';
  authModal.style.display = 'flex';
  authEmail.focus();
}

async function submitAuth() {
  const email    = authEmail.value.trim();
  const password = authPassword.value;
  if (!email || !password) { showAuthError('Email and password required'); return; }

  authSubmitBtn.disabled = true;
  const authSuccess = document.getElementById('authSuccess');
  authSuccess.style.display = 'none';

  try {
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
    const data = await apiFetch(endpoint, {
      method: 'POST',
      body:   JSON.stringify({ email, password }),
    });

    // Supabase email confirmation: signup returns user but no session token yet
    if (authMode === 'signup' && !data.access_token) {
      document.getElementById('authFields').style.display = 'none';
      authSuccess.textContent  = '✓ Check your email to confirm your account, then sign in.';
      authSuccess.style.display = '';
      return;
    }

    authToken = data.access_token;
    authUser  = data.user;
    // Also store refresh token for silent re-auth
    if (data.refresh_token) localStorage.setItem('pat_refresh', data.refresh_token);
    localStorage.setItem('pat_token', authToken);
    localStorage.setItem('pat_user',  JSON.stringify(authUser));
    authModal.style.display = 'none';
    document.getElementById('authFields').style.display = '';
    updateAuthUI();
    setStatus('Signed in', 'ok');
  } catch (err) {
    showAuthError(err.message);
  } finally {
    authSubmitBtn.disabled = false;
  }
}

function showAuthError(msg) {
  authError.textContent   = msg;
  authError.style.display = '';
}

// ── Token refresh ─────────────────────────────────────────────────────────────
// Attempt a silent token refresh using the stored refresh_token.
// Called on app init and whenever a 401 is received.
async function refreshAuthToken() {
  const refresh = localStorage.getItem('pat_refresh');
  if (!refresh) return false;
  try {
    const data = await apiFetch('/api/auth/refresh', {
      method: 'POST',
      body:   JSON.stringify({ refresh_token: refresh }),
    });
    if (data.access_token) {
      authToken = data.access_token;
      authUser  = data.user || authUser;
      localStorage.setItem('pat_token', authToken);
      if (data.refresh_token) localStorage.setItem('pat_refresh', data.refresh_token);
      localStorage.setItem('pat_user', JSON.stringify(authUser));
      return true;
    }
  } catch { /* refresh failed — user needs to log in again */ }
  return false;
}

// Wrap apiFetch to auto-retry once after a 401 with a refreshed token
const _apiFetch = apiFetch;
async function apiFetchWithRefresh(path, options = {}) {
  try {
    return await _apiFetch(path, options);
  } catch (err) {
    if (err.message && err.message.includes('401')) {
      const refreshed = await refreshAuthToken();
      if (refreshed) {
        // Rebuild headers with new token and retry once
        return await fetch(path, { headers: apiHeaders(), ...options }).then(async r => {
          const j = await r.json();
          if (!r.ok) throw new Error(j.error || `HTTP ${r.status}`);
          return j;
        });
      }
      // Refresh failed — clear auth state
      authToken = null; authUser = null;
      localStorage.removeItem('pat_token');
      localStorage.removeItem('pat_refresh');
      localStorage.removeItem('pat_user');
      updateAuthUI();
    }
    throw err;
  }
}

async function logout() {
  try { await apiFetch('/api/auth/logout', { method: 'POST' }); } catch {}
  authToken = null; authUser = null;
  localStorage.removeItem('pat_token');
  localStorage.removeItem('pat_user');
  updateAuthUI();
  setStatus('Signed out', '');
}

openAuthBtn.addEventListener('click',    () => openAuthModal('login'));
authModalClose.addEventListener('click', () => { authModal.style.display = 'none'; });
authModal.addEventListener('click',      (e) => { if (e.target === authModal) authModal.style.display = 'none'; });
authSwitchBtn.addEventListener('click',  () => openAuthModal(authMode === 'login' ? 'signup' : 'login'));
authSubmitBtn.addEventListener('click',  submitAuth);
authPassword.addEventListener('keydown', (e) => { if (e.key === 'Enter') submitAuth(); });
logoutBtn.addEventListener('click', logout);

// ═══════════════════════════════════════════════════════════════════════════════
// DATASET PICKER
// ═══════════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════════
// DATASET PICKER — with search/filter and loading spinner
// ═══════════════════════════════════════════════════════════════════════════════

const datasetSearch  = document.getElementById('datasetSearch');
const datasetSpinner = document.getElementById('datasetSpinner');
let _allDatasets = [];   // full list, never filtered in-place

async function loadDatasetList() {
  try {
    const { datasets } = await apiFetch('/api/datasets');
    _allDatasets = datasets;
    renderDatasetOptions(_allDatasets);
  } catch (err) {
    setStatus(`Could not load datasets: ${err.message}`, 'err');
  }
}

function renderDatasetOptions(list) {
  datasetSelect.innerHTML = '';
  if (!list.length) {
    const o = document.createElement('option');
    o.value = ''; o.textContent = '— no results —';
    datasetSelect.appendChild(o);
    return;
  }
  // Group by interval so the list has natural sections
  const groups = { '1d': [], '1wk': [], '1mo': [] };
  list.forEach(d => { (groups[d.interval] || groups['1d']).push(d); });
  const labels = { '1d': 'Daily', '1wk': 'Weekly', '1mo': 'Monthly' };
  Object.entries(groups).forEach(([interval, items]) => {
    if (!items.length) return;
    const og = document.createElement('optgroup');
    og.label = labels[interval] || interval;
    items.forEach(d => {
      const opt = document.createElement('option');
      opt.value       = d.id;
      opt.textContent = d.label || `${d.symbol} ${d.interval}`;
      opt.dataset.symbol   = d.symbol;
      opt.dataset.interval = d.interval;
      og.appendChild(opt);
    });
    datasetSelect.appendChild(og);
  });
}

// Live filter as user types
datasetSearch.addEventListener('input', () => {
  const q = datasetSearch.value.trim().toLowerCase();
  if (!q) { renderDatasetOptions(_allDatasets); return; }
  const filtered = _allDatasets.filter(d =>
    (d.label || '').toLowerCase().includes(q) ||
    d.symbol.toLowerCase().includes(q)
  );
  renderDatasetOptions(filtered);
});

// Clear search on Escape
datasetSearch.addEventListener('keydown', e => {
  if (e.key === 'Escape') { datasetSearch.value = ''; renderDatasetOptions(_allDatasets); }
});

datasetSelect.addEventListener('change', () => {
  const id = datasetSelect.value;
  if (!id) { datasetMeta.textContent = ''; return; }
  const opt = datasetSelect.selectedOptions[0];
  datasetMeta.textContent = opt.textContent;
});

// ═══════════════════════════════════════════════════════════════════════════════
// LOAD DATA
// ═══════════════════════════════════════════════════════════════════════════════

async function loadData() {
  const datasetId = datasetSelect.value;
  if (!datasetId) { setStatus('Select a dataset first.', 'err'); return; }

  const startBar = Math.max(5, parseInt(startBarIn.value, 10) || 50);

  loadBtn.disabled = true;
  datasetSpinner.style.display = '';
  setStatus('', '');

  try {
    const { dataset } = await apiFetch(`/api/datasets/${datasetId}`);

    rawBars = dataset.bars;
    rebuildAllBars();

    if (allBars.length === 0) { setStatus('No bars in this dataset.', 'warn'); return; }

    currentDatasetId = datasetId;

    // Check for saved session (only if logged in)
    if (authToken) {
      const res = await apiFetch(`/api/sessions/${datasetId}`);
      if (res.exists && res.session) {
        _pendingLoad = { saved: res.session, startBar, dataset };
        showResumePrompt(res.session);
        return;
      }
    }

    startFreshSession(startBar, dataset);

  } catch (err) {
    setStatus(`Error: ${err.message}`, 'err');
  } finally {
    loadBtn.disabled = false;
    datasetSpinner.style.display = 'none';
  }
}

function showResumePrompt(saved) {
  const d = new Date(saved.saved_at);
  document.getElementById('resumeInfo').textContent =
    `Bar ${saved.visible_n} · ${(saved.prediction_results || []).length} predictions · saved ${d.toLocaleDateString()}`;
  resumePrompt.style.display = 'flex';
}

resumeYesBtn.addEventListener('click', () => {
  resumePrompt.style.display = 'none';
  if (!_pendingLoad) return;
  const { saved, dataset } = _pendingLoad;
  visibleN          = Math.min(saved.visible_n || 50, allBars.length);
  predictionResults = saved.prediction_results || [];
  resolvedTrades    = saved.resolved_trades    || [];
  notes             = saved.notes              || {};
  activeTrade       = saved.active_trade       || null;
  sessionActive     = true;
  initChart();
  render();
  if (activeTrade) drawTradeLines();
  setSymbolLabel(dataset.symbol);
  intervalLabel.textContent = dataset.interval;
  setStatus(`Resumed · ${allBars.length} bars`, 'ok');
  loadBtn.disabled = false;
});

resumeNoBtn.addEventListener('click', () => {
  resumePrompt.style.display = 'none';
  if (!_pendingLoad) return;
  startFreshSession(_pendingLoad.startBar, _pendingLoad.dataset);
  loadBtn.disabled = false;
});

function startFreshSession(startBar, dataset) {
  predictionResults = []; pendingPrediction = null; predMode = 'idle';
  activeTrade = null; resolvedTrades = []; notes = {};
  hidePredOverlay(); clearTradeLines();
  sessionActive = true;
  visibleN = Math.min(startBar, allBars.length);
  initChart();
  render();
  setSymbolLabel(dataset.symbol);
  intervalLabel.textContent = dataset.interval;
  setStatus(`${allBars.length} bars`, 'ok');
  updateTradeStatus();
  saveSession();
}

function setSymbolLabel(symbol) {
  symbolLabel.textContent = blindToggle.checked ? '████' : symbol;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION PERSISTENCE
// ═══════════════════════════════════════════════════════════════════════════════

let _saveTimer = null;
function saveSession() {
  if (!authToken || !currentDatasetId || !sessionActive) return;
  clearTimeout(_saveTimer);
  _saveTimer = setTimeout(async () => {
    try {
      await apiFetch(`/api/sessions/${currentDatasetId}`, {
        method: 'POST',
        body:   JSON.stringify({
          visible_n:          visibleN,
          prediction_results: predictionResults,
          resolved_trades:    resolvedTrades,
          notes,
          active_trade:       activeTrade,
        }),
      });
    } catch { /* non-fatal */ }
  }, 1000); // debounce — save at most once per second
}

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

  volumeSeries = chart.addHistogramSeries({ priceFormat: { type: 'volume' }, priceScaleId: 'vol' });
  chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.80, bottom: 0 } });

  candleSeries = chart.addCandlestickSeries({
    upColor: '#3fb950', downColor: '#f85149',
    borderUpColor: '#3fb950', borderDownColor: '#f85149',
    wickUpColor: '#3fb950', wickDownColor: '#f85149',
    priceScaleId: 'right',
  });
  chart.priceScale('right').applyOptions({ scaleMargins: { top: 0.05, bottom: 0.22 } });

  chart.subscribeCrosshairMove((param) => {
    if (!param?.time || !candleSeries) return;
    const d = param.seriesData.get(candleSeries);
    if (d) updateOhlcDisplay(d);
  });

  const ro = new ResizeObserver(() => {
    if (chart) chart.applyOptions({ width: chartContainer.clientWidth, height: chartContainer.clientHeight });
  });
  ro.observe(chartContainer);
}

function render() {
  if (!candleSeries || !allBars.length) return;
  const slice = allBars.slice(0, visibleN);
  candleSeries.setData(slice);
  volumeSeries.setData(slice.map(b => ({
    time: b.time, value: b.volume,
    color: b.close >= b.open ? '#3fb95033' : '#f8514933',
  })));
  renderAllMarkers(slice);
  if (activeTrade) drawTradeLines();
  chart.timeScale().scrollToPosition(0, false);
  barInfo.textContent = `${visibleN} / ${allBars.length}`;
  if (slice.length) updateOhlcDisplay(slice[slice.length - 1]);
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
// MARKERS
// ═══════════════════════════════════════════════════════════════════════════════

function renderAllMarkers(slice) {
  if (!candleSeries) return;
  const pred = predictionResults.filter(r => r.barIndex < slice.length).map(r => ({
    time: slice[r.barIndex].time,
    position: r.prediction === 'bull' ? 'aboveBar' : 'belowBar',
    color: r.correct ? '#3fb950' : '#f85149',
    shape: r.correct ? 'arrowUp' : 'arrowDown',
    size: 1, text: '',
  }));
  const noteMarks = Object.entries(notes).filter(([i]) => +i < slice.length).map(([i]) => ({
    time: slice[+i].time, position: 'aboveBar', color: '#58a6ff', shape: 'circle', size: 0, text: '·',
  }));
  const tradeMarks = resolvedTrades.filter(t => t.exitBar < slice.length).map(t => ({
    time: slice[t.exitBar].time,
    position: t.outcome === 'tp' ? 'aboveBar' : 'belowBar',
    color: t.outcome === 'tp' ? '#3fb950' : t.outcome === 'sl' ? '#f85149' : '#7d8590',
    shape: t.outcome === 'tp' ? 'arrowUp' : 'arrowDown',
    size: 2,
    text: t.outcome === 'tp' ? 'TP' : t.outcome === 'sl' ? 'SL' : 'X',
  }));
  candleSeries.setMarkers([...pred, ...noteMarks, ...tradeMarks].sort((a, b) => a.time - b.time));
}

// ═══════════════════════════════════════════════════════════════════════════════
// PREDICTION
// ═══════════════════════════════════════════════════════════════════════════════

function updateScoreStrip() {
  if (!sessionActive || !predictionResults.length) {
    scoreStrip.innerHTML = '<span class="score-idle">Press <kbd>B</kbd> Bull · <kbd>L</kbd> Bear before a bar</span>';
    return;
  }
  const total   = predictionResults.length;
  const correct = predictionResults.filter(r => r.correct).length;
  const pct     = Math.round(correct / total * 100);
  const bulls   = predictionResults.filter(r => r.prediction === 'bull');
  const bears   = predictionResults.filter(r => r.prediction === 'bear');
  const bPct    = bulls.length ? Math.round(bulls.filter(r=>r.correct).length/bulls.length*100) : '—';
  const lPct    = bears.length ? Math.round(bears.filter(r=>r.correct).length/bears.length*100) : '—';
  let streak = 0;
  for (let i = predictionResults.length-1; i >= 0; i--) { if (predictionResults[i].correct) streak++; else break; }
  const cls = pct >= 60 ? 'score-good' : pct >= 45 ? 'score-mid' : 'score-bad';
  scoreStrip.innerHTML = `
    <span class="score-item ${cls}">${pct}%</span><span class="score-sep">·</span>
    <span class="score-item">${correct}/${total}</span><span class="score-sep">·</span>
    <span class="score-item score-bull">B ${bPct}%</span><span class="score-sep">·</span>
    <span class="score-item score-bear">L ${lPct}%</span>
    ${streak >= 3 ? `<span class="score-sep">·</span><span class="score-item score-streak">${streak}✦</span>` : ''}
  `;
}

function commitPrediction(dir) { pendingPrediction = dir; predMode = 'committed'; showPredOverlay('committed', dir); }
function skipPrediction()      { predMode = 'skip'; pendingPrediction = null; hidePredOverlay(); }

function resolvePrediction() {
  if (predMode !== 'committed' || !pendingPrediction) { hidePredOverlay(); predMode = 'idle'; return; }
  const newBar = allBars[visibleN-1], prevBar = allBars[visibleN-2];
  if (!newBar || !prevBar) { hidePredOverlay(); return; }
  const correct = (pendingPrediction === 'bull') === (newBar.close >= prevBar.close);
  predictionResults.push({ barIndex: visibleN-1, prediction: pendingPrediction, correct });
  predMode = 'idle'; pendingPrediction = null;
  showPredOverlay('result', null, correct);
  updateScoreStrip();
  setTimeout(hidePredOverlay, 800);
}

function showPredOverlay(state, extra, correct) {
  predOverlay.className = 'pred-overlay';
  if (state === 'committed') {
    predOverlay.classList.add('pred-waiting');
    predOverlay.querySelector('.pred-result').style.display = 'none';
    const el = predOverlay.querySelector('.pred-committed');
    el.style.display = '';
    const lbl = el.querySelector('.pred-committed-label');
    lbl.textContent = extra === 'bull' ? '▲  Bullish' : '▼  Bearish';
    lbl.className   = 'pred-committed-label ' + (extra === 'bull' ? 'bull' : 'bear');
  } else if (state === 'result') {
    predOverlay.classList.add(correct ? 'pred-correct' : 'pred-wrong');
    predOverlay.querySelector('.pred-committed').style.display = 'none';
    const el = predOverlay.querySelector('.pred-result');
    el.style.display = ''; el.textContent = correct ? '✓' : '✗';
    el.className = 'pred-result ' + (correct ? 'correct' : 'wrong');
  }
  predOverlay.style.display = 'flex';
}

function hidePredOverlay() { predOverlay.style.display = 'none'; predMode = 'idle'; }

// ═══════════════════════════════════════════════════════════════════════════════
// TRADE ENGINE
// ═══════════════════════════════════════════════════════════════════════════════

function openTradePanel(dir) {
  if (!sessionActive || !allBars.length || activeTrade) return;
  _tradeDirection = dir;
  const bar = allBars[visibleN-1];
  const lb  = allBars.slice(Math.max(0, visibleN-14), visibleN);
  const avg = lb.reduce((s,b) => s+(b.high-b.low), 0) / lb.length;
  tradeEntryPrice.value = bar.close.toFixed(2);
  tradeTpInput.value    = dir === 'long' ? (bar.close+avg*1.5).toFixed(2) : (bar.close-avg*1.5).toFixed(2);
  tradeSlInput.value    = dir === 'long' ? (bar.close-avg*0.8).toFixed(2) : (bar.close+avg*0.8).toFixed(2);
  ticketDirection.textContent = dir === 'long' ? '▲ Buy' : '▼ Sell';
  ticketDirection.className   = 'ticket-direction-label ' + dir;
  tradeConfirmBtn.className   = 'ticket-confirm-btn ' + dir;
  ticketForm.style.display    = '';
  tradeTpInput.focus();
}

function confirmTrade() {
  const e = parseFloat(tradeEntryPrice.value), tp = parseFloat(tradeTpInput.value), sl = parseFloat(tradeSlInput.value);
  if (isNaN(e)||isNaN(tp)||isNaN(sl)) return;
  activeTrade = { entryBar: visibleN-1, entryPrice: e, tp, sl, direction: _tradeDirection };
  ticketForm.style.display = 'none';
  drawTradeLines(); saveSession();
}

function drawTradeLines() {
  if (!candleSeries || !activeTrade) return;
  clearTradeLines();
  entryLine = candleSeries.createPriceLine({ price: activeTrade.entryPrice, color: '#7d8590', lineWidth: 1, lineStyle: 2, title: 'Entry' });
  tpLine    = candleSeries.createPriceLine({ price: activeTrade.tp,         color: '#3fb950', lineWidth: 1, lineStyle: 2, title: 'TP'    });
  slLine    = candleSeries.createPriceLine({ price: activeTrade.sl,         color: '#f85149', lineWidth: 1, lineStyle: 2, title: 'SL'    });
}

function clearTradeLines() {
  if (!candleSeries) return;
  [tpLine, slLine, entryLine].forEach(l => { if (l) { try { candleSeries.removePriceLine(l); } catch {} } });
  tpLine = slLine = entryLine = null;
}

function checkTradeResolution() {
  if (!activeTrade) return;
  const bar = allBars[visibleN-1]; if (!bar) return;
  const { tp, sl, direction, entryPrice, entryBar } = activeTrade;
  let outcome = null, exitPrice = null;
  if (direction === 'long') {
    if (bar.low  <= sl) { outcome = 'sl'; exitPrice = sl; }
    if (bar.high >= tp) { if (!outcome) { outcome = 'tp'; exitPrice = tp; } }
  } else {
    if (bar.high >= sl) { outcome = 'sl'; exitPrice = sl; }
    if (bar.low  <= tp) { if (!outcome) { outcome = 'tp'; exitPrice = tp; } }
  }
  if (outcome) {
    resolvedTrades.push({ entryBar, entryPrice, tp, sl, direction, exitBar: visibleN-1, exitPrice, outcome });
    activeTrade = null; clearTradeLines();
    flashTradeResult(outcome); saveSession();
  }
}

function closeTradeManually() {
  if (!activeTrade) return;
  const bar = allBars[visibleN-1]; if (!bar) return;
  const ep = bar.close;
  const outcome = activeTrade.direction === 'long' ? (ep > activeTrade.entryPrice ? 'tp' : 'sl') : (ep < activeTrade.entryPrice ? 'tp' : 'sl');
  resolvedTrades.push({ ...activeTrade, exitBar: visibleN-1, exitPrice: ep, outcome: 'manual' });
  activeTrade = null; clearTradeLines(); updateTradeStatus(); saveSession();
}

function flashTradeResult(outcome) {
  const el = document.getElementById('tradeFlash'); if (!el) return;
  el.textContent = outcome === 'tp' ? '✓ TP Hit' : '✗ SL Hit';
  el.className   = 'trade-flash ' + (outcome === 'tp' ? 'tp' : 'sl');
  el.style.display = 'flex';
  setTimeout(() => { el.style.display = 'none'; }, 1200);
}

function updateTradeStatus() {
  const ts  = document.getElementById('tradeStatus');
  const tcb = document.getElementById('tradeCloseBtn');
  if (!ts) return;
  if (!activeTrade) {
    ts.innerHTML = resolvedTrades.length
      ? `<span class="ts-idle">${resolvedTrades.length} trade${resolvedTrades.length>1?'s':''} · ${resolvedTrades.filter(t=>t.outcome==='tp').length} TP / ${resolvedTrades.filter(t=>t.outcome==='sl').length} SL</span>`
      : '';
    if (tcb) tcb.style.display = 'none';
    return;
  }
  const { direction: d, entryPrice: ep, tp, sl } = activeTrade;
  const rr = Math.abs(tp-ep)/Math.abs(ep-sl);
  ts.innerHTML = `<span class="ts-open ${d}">${d==='long'?'▲':'▼'} ${d==='long'?'BUY':'SELL'}</span><span class="ts-sep">·</span><span class="ts-price">@ ${ep.toFixed(2)}</span><span class="ts-sep">·</span><span class="ts-rr">R:R ${rr.toFixed(1)}</span>`;
  if (tcb) tcb.style.display = '';
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRADE REVIEW
// ═══════════════════════════════════════════════════════════════════════════════

function enterTradeReview(idx) {
  const trade = resolvedTrades[idx]; if (!trade || !sessionActive) return;
  closeSessionModal();
  reviewReturnBar = visibleN; reviewMode = true;
  clearTradeLines(); clearReviewLines();
  visibleN = Math.max(1, trade.entryBar - 20 + 1);
  render();
  if (candleSeries) {
    reviewRefLines.push(
      candleSeries.createPriceLine({ price: trade.entryPrice, color: '#7d859099', lineWidth: 1, lineStyle: 1, title: `Entry ${trade.direction==='long'?'▲':'▼'}` }),
      candleSeries.createPriceLine({ price: trade.tp,         color: '#3fb95099', lineWidth: 1, lineStyle: 1, title: 'TP' }),
      candleSeries.createPriceLine({ price: trade.sl,         color: '#f8514999', lineWidth: 1, lineStyle: 1, title: 'SL' }),
    );
  }
  showReviewBanner(trade, idx);
}

function exitTradeReview() {
  reviewMode = false; clearReviewLines(); hideReviewBanner();
  if (reviewReturnBar !== null) { visibleN = reviewReturnBar; reviewReturnBar = null; }
  if (activeTrade) drawTradeLines();
  render();
}

function clearReviewLines() {
  if (!candleSeries) { reviewRefLines = []; return; }
  reviewRefLines.forEach(l => { try { candleSeries.removePriceLine(l); } catch {} });
  reviewRefLines = [];
}

function showReviewBanner(trade, idx) {
  let b = document.getElementById('reviewBanner');
  if (!b) { b = document.createElement('div'); b.id = 'reviewBanner'; chartContainer.appendChild(b); }
  const rr = (Math.abs(trade.tp-trade.entryPrice)/Math.abs(trade.entryPrice-trade.sl)).toFixed(1);
  const oc = trade.outcome === 'tp' ? 'bull' : 'bear';
  const ol = trade.outcome === 'tp' ? 'TP ✓' : trade.outcome === 'sl' ? 'SL ✗' : 'Manual';
  b.innerHTML = `
    <span class="review-label">Reviewing trade ${idx+1}</span>
    <span class="review-sep">·</span>
    <span class="review-dir ${trade.direction==='long'?'bull':'bear'}">${trade.direction==='long'?'▲ BUY':'▼ SELL'}</span>
    <span class="review-sep">·</span><span class="review-price">@ ${trade.entryPrice.toFixed(2)}</span>
    <span class="review-sep">·</span><span class="review-rr">R:R ${rr}</span>
    <span class="review-sep">·</span><span class="review-outcome ${oc}">${ol}</span>
    <button id="exitReviewBtn" class="exit-review-btn">Exit Review</button>
  `;
  b.style.display = 'flex';
  document.getElementById('exitReviewBtn').addEventListener('click', exitTradeReview);
}

function hideReviewBanner() { const b = document.getElementById('reviewBanner'); if (b) b.style.display = 'none'; }

// ═══════════════════════════════════════════════════════════════════════════════
// BAR NOTES
// ═══════════════════════════════════════════════════════════════════════════════

function openNotePanel() {
  if (!sessionActive || !allBars.length) return;
  noteTargetBar = visibleN - 1;
  const bar = allBars[noteTargetBar];
  noteBarLabel.textContent = `Bar ${noteTargetBar+1} · ${new Date(bar.time*1000).toLocaleDateString()}`;
  noteTextarea.value = notes[noteTargetBar] || '';
  notePanel.style.display = 'flex';
  noteTextarea.focus();
}

function saveNote() {
  if (noteTargetBar === null) return;
  const text = noteTextarea.value.trim();
  if (text) notes[noteTargetBar] = text; else delete notes[noteTargetBar];
  notePanel.style.display = 'none'; noteTargetBar = null;
  render(); saveSession();
}

// ═══════════════════════════════════════════════════════════════════════════════
// SESSION MODAL
// ═══════════════════════════════════════════════════════════════════════════════

function openSessionModal() {
  const total = predictionResults.length;
  const mc    = document.getElementById('modalContent');

  const tradeHtml = resolvedTrades.length ? `
    <div class="modal-trades">
      <div class="modal-section-title">Trade Log</div>
      <div class="trade-log">
        <div class="trade-log-header">
          <span>#</span><span>Dir</span><span>Entry</span><span>TP</span>
          <span>SL</span><span>Exit</span><span>R:R</span><span>Result</span><span></span>
        </div>
        ${resolvedTrades.map((t,i) => {
          const rr  = (Math.abs(t.tp-t.entryPrice)/Math.abs(t.entryPrice-t.sl)).toFixed(1);
          const pnl = t.direction==='long'
            ? ((t.exitPrice-t.entryPrice)/t.entryPrice*100).toFixed(2)
            : ((t.entryPrice-t.exitPrice)/t.entryPrice*100).toFixed(2);
          return `<div class="trade-log-row">
            <span class="tl-num">${i+1}</span>
            <span class="tl-dir ${t.direction==='long'?'bull':'bear'}">${t.direction==='long'?'▲':'▼'}</span>
            <span class="tl-price">${t.entryPrice.toFixed(2)}</span>
            <span class="tl-tp">${t.tp.toFixed(2)}</span>
            <span class="tl-sl">${t.sl.toFixed(2)}</span>
            <span class="tl-exit">${t.exitPrice.toFixed(2)}</span>
            <span class="tl-rr">${rr}</span>
            <span class="tl-outcome ${t.outcome==='tp'?'bull':'bear'}">${t.outcome==='tp'?'TP ✓':t.outcome==='sl'?'SL ✗':'X'} <span class="tl-pnl ${parseFloat(pnl)>=0?'bull':'bear'}">${parseFloat(pnl)>=0?'+':''}${pnl}%</span></span>
            <button class="tl-review-btn" data-idx="${i}">Review</button>
          </div>`;
        }).join('')}
      </div>
    </div>` : '';

  const notesHtml = Object.keys(notes).length ? `
    <div class="modal-notes-summary">
      <div class="modal-section-title">Notes</div>
      ${Object.entries(notes).map(([idx,text]) =>
        `<div class="modal-note-item"><span class="modal-note-bar">Bar ${+idx+1}</span><span class="modal-note-text">${text}</span></div>`
      ).join('')}
    </div>` : '';

  if (total === 0) {
    mc.innerHTML = `<p class="modal-empty">No predictions yet.<br>Press <kbd>B</kbd> or <kbd>L</kbd> before advancing.</p>${tradeHtml}${notesHtml}`;
  } else {
    const correct = predictionResults.filter(r=>r.correct).length;
    const pct     = Math.round(correct/total*100);
    const bulls   = predictionResults.filter(r=>r.prediction==='bull');
    const bears   = predictionResults.filter(r=>r.prediction==='bear');
    const bPct    = bulls.length ? Math.round(bulls.filter(r=>r.correct).length/bulls.length*100) : null;
    const lPct    = bears.length ? Math.round(bears.filter(r=>r.correct).length/bears.length*100) : null;
    let maxS=0,cur=0; for(const r of predictionResults){if(r.correct){cur++;maxS=Math.max(maxS,cur);}else cur=0;}
    const bias = bulls.length > bears.length*2 ? 'Upside bias detected — called bull more often.'
               : bears.length > bulls.length*2 ? 'Downside bias detected — called bear more often.'
               : 'Directional mix looks balanced.';
    mc.innerHTML = `
      <div class="modal-symbol">${blindToggle.checked?'hidden':symbolLabel.textContent} <span class="modal-interval">${intervalLabel.textContent}</span></div>
      <div class="modal-stats">
        <div class="modal-stat"><div class="modal-stat-val ${pct>=60?'good':pct>=45?'mid':'bad'}">${pct}%</div><div class="modal-stat-lbl">Overall</div></div>
        <div class="modal-stat"><div class="modal-stat-val">${correct}/${total}</div><div class="modal-stat-lbl">Correct</div></div>
        <div class="modal-stat"><div class="modal-stat-val score-streak">${maxS}</div><div class="modal-stat-lbl">Best streak</div></div>
      </div>
      <div class="modal-breakdown">
        <div class="modal-dir"><div class="modal-dir-label bull">▲ Bull</div><div class="modal-dir-bar"><div class="modal-dir-fill bull" style="width:${bPct??0}%"></div></div><div class="modal-dir-pct">${bulls.length} · ${bPct!==null?bPct+'%':'—'}</div></div>
        <div class="modal-dir"><div class="modal-dir-label bear">▼ Bear</div><div class="modal-dir-bar"><div class="modal-dir-fill bear" style="width:${lPct??0}%"></div></div><div class="modal-dir-pct">${bears.length} · ${lPct!==null?lPct+'%':'—'}</div></div>
      </div>
      <div class="modal-bias">${bias}</div>
      ${tradeHtml}${notesHtml}
    `;
  }

  sessionModal.style.display = 'flex';
  document.querySelectorAll('.tl-review-btn').forEach(btn => {
    btn.addEventListener('click', () => enterTradeReview(+btn.dataset.idx));
  });
}

function closeSessionModal() { sessionModal.style.display = 'none'; }
sessionModalClose.addEventListener('click', closeSessionModal);
sessionModal.addEventListener('click', e => { if (e.target===sessionModal) closeSessionModal(); });
scoreBtn.addEventListener('click', () => { if (sessionActive) openSessionModal(); });

// ═══════════════════════════════════════════════════════════════════════════════
// KEYBOARD
// ═══════════════════════════════════════════════════════════════════════════════

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { ticketForm.style.display='none'; notePanel.style.display='none'; hidePredOverlay(); authModal.style.display='none'; return; }
  if (['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName)) return;
  if (sessionModal.style.display !== 'none') { if (e.key==='Escape'||e.key==='Tab') closeSessionModal(); return; }
  const k = e.key.toLowerCase();
  if (sessionActive && allBars.length) {
    if (k==='b') { e.preventDefault(); commitPrediction('bull'); return; }
    if (k==='l') { e.preventDefault(); commitPrediction('bear'); return; }
    if (k==='s') { e.preventDefault(); skipPrediction(); return; }
    if (k==='e') { e.preventDefault(); openTradePanel('long'); return; }
    if (k==='x') { e.preventDefault(); closeTradeManually(); return; }
    if (k==='n') { e.preventDefault(); openNotePanel(); return; }
    if (k==='r') { e.preventDefault(); if (reviewMode) exitTradeReview(); else openSessionModal(); return; }
  }
  if (e.key==='Tab') { e.preventDefault(); if (sessionActive) openSessionModal(); return; }
  if (!allBars.length) return;
  switch (e.key) {
    case 'ArrowRight': e.preventDefault(); if (visibleN<allBars.length){ if(predMode==='idle')predMode='skip'; visibleN++; render(); resolvePrediction(); checkTradeResolution(); saveSession(); } break;
    case 'ArrowLeft':  e.preventDefault(); hidePredOverlay(); predMode='idle'; if(visibleN>1){ visibleN--; render(); saveSession(); } break;
    case 'ArrowUp':    e.preventDefault(); hidePredOverlay(); predMode='idle'; visibleN=Math.min(allBars.length,visibleN+10); render(); saveSession(); break;
    case 'ArrowDown':  e.preventDefault(); hidePredOverlay(); predMode='idle'; visibleN=Math.max(1,visibleN-10); render(); saveSession(); break;
    case ' ':          e.preventDefault(); randomiseStart(); break;
  }
});

function randomiseStart() {
  if (!allBars.length) return;
  hidePredOverlay(); predMode='idle';
  const min=10, max=allBars.length-5; if(max<=min)return;
  visibleN = Math.floor(Math.random()*(max-min+1))+min;
  render(); saveSession();
}

// ═══════════════════════════════════════════════════════════════════════════════
// BINDINGS
// ═══════════════════════════════════════════════════════════════════════════════

loadBtn.addEventListener('click', loadData);
buyBtn.addEventListener('click',  () => openTradePanel('long'));
sellBtn.addEventListener('click', () => openTradePanel('short'));
tradeConfirmBtn.addEventListener('click', confirmTrade);
tradeCancelBtn.addEventListener('click',  () => { ticketForm.style.display='none'; });
[tradeTpInput,tradeSlInput,tradeEntryPrice].forEach(el => {
  el.addEventListener('keydown', e => { if(e.key==='Enter')confirmTrade(); if(e.key==='Escape')ticketForm.style.display='none'; });
});
noteSaveBtn.addEventListener('click',   saveNote);
noteCancelBtn.addEventListener('click', () => { notePanel.style.display='none'; noteTargetBar=null; });
noteTextarea.addEventListener('keydown', e => {
  if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){ e.preventDefault(); saveNote(); }
  if(e.key==='Escape'){ notePanel.style.display='none'; noteTargetBar=null; }
});
blindToggle.addEventListener('change', () => {
  if (!sessionActive) return;
  const opt = datasetSelect.selectedOptions[0];
  const sym = opt ? opt.textContent.split(' ')[0] : '';
  symbolLabel.textContent = blindToggle.checked ? '████' : sym;
});
noiseToggle.addEventListener('change',  () => { if (rawBars.length) { rebuildAllBars(); render(); } });
noiseRange.addEventListener('change',   () => { if (noiseToggle.checked && rawBars.length) { rebuildAllBars(); render(); } });

function applyNoise(bars, pct) {
  const f = pct/100;
  return bars.map(b => {
    const j=()=>1+(Math.random()*2-1)*f, o=b.open*j(), h=b.high*j(), l=b.low*j(), c=b.close*j();
    return {...b, open:+o.toFixed(4), high:+Math.max(o,h,l,c).toFixed(4), low:+Math.min(o,h,l,c).toFixed(4), close:+c.toFixed(4)};
  });
}
function rebuildAllBars() {
  allBars = noiseToggle.checked ? applyNoise(rawBars, parseFloat(noiseRange.value)) : rawBars.slice();
}

function setStatus(msg, type) { statusMsg.textContent=msg; statusMsg.className='status-msg '+(type||''); }

// ── Empty state ───────────────────────────────────────────────────────────────
(function() {
  const div = document.createElement('div'); div.id='emptyState';
  div.innerHTML = `
    <svg class="empty-icon" viewBox="0 0 32 32" fill="none">
      <rect x="4" y="20" width="4" height="8" rx="1" fill="currentColor"/>
      <rect x="10" y="14" width="4" height="14" rx="1" fill="currentColor"/>
      <rect x="16" y="8" width="4" height="20" rx="1" fill="currentColor"/>
      <rect x="22" y="16" width="4" height="12" rx="1" fill="currentColor"/>
    </svg>
    <p>Select a dataset and click <strong>Load Dataset</strong></p>
  `;
  chartContainer.appendChild(div);
})();

// ── Init ──────────────────────────────────────────────────────────────────────
updateAuthUI();
loadDatasetList();
