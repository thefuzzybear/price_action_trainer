'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import '../trainer.css';

// ── Types ─────────────────────────────────────────────────────────────────────
type Bar = { time: number; open: number; high: number; low: number; close: number; volume: number };
type Dataset = { id: string; symbol: string; interval: string; label: string; bar_count?: number };
type PredResult = { barIndex: number; prediction: 'bull' | 'bear'; correct: boolean };
type Trade = { entryBar: number; entryPrice: number; tp: number; sl: number; direction: 'long' | 'short' };
type ResolvedTrade = Trade & { exitBar: number; exitPrice: number; outcome: 'tp' | 'sl' | 'manual' };
type AuthUser = { id: string; email: string };

// ── Auth helpers ──────────────────────────────────────────────────────────────
function getToken()   { return typeof window !== 'undefined' ? localStorage.getItem('pat_token')   : null; }
function getRefresh() { return typeof window !== 'undefined' ? localStorage.getItem('pat_refresh') : null; }
function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem('pat_user') || 'null'); } catch { return null; }
}

async function apiFetch(path: string, options: RequestInit = {}, token?: string | null) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const tok = token ?? getToken();
  if (tok) headers['Authorization'] = `Bearer ${tok}`;
  const res  = await fetch(path, { headers, ...options });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}

// ── Noise utility ─────────────────────────────────────────────────────────────
function applyNoise(bars: Bar[], pct: number): Bar[] {
  const f = pct / 100;
  return bars.map(b => {
    const j = () => 1 + (Math.random() * 2 - 1) * f;
    const o = b.open * j(), h = b.high * j(), l = b.low * j(), c = b.close * j();
    return { ...b, open: +o.toFixed(4), high: +Math.max(o,h,l,c).toFixed(4), low: +Math.min(o,h,l,c).toFixed(4), close: +c.toFixed(4) };
  });
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TrainerPage() {
  // Chart refs
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef        = useRef<any>(null);
  const candleRef       = useRef<any>(null);
  const volumeRef       = useRef<any>(null);
  const tpLineRef       = useRef<any>(null);
  const slLineRef       = useRef<any>(null);
  const entryLineRef    = useRef<any>(null);
  const reviewLines     = useRef<any[]>([]);
  const seriesMarkersRef = useRef<any>(null);  // v5 createSeriesMarkers primitive

  // Data state
  const [rawBars,  setRawBars]  = useState<Bar[]>([]);
  const [allBars,  setAllBars]  = useState<Bar[]>([]);
  const [visibleN, setVisibleN] = useState(0);

  // Dataset
  const [datasets,        setDatasets]        = useState<Dataset[]>([]);
  const [datasetSearch,   setDatasetSearch]   = useState('');
  const [selectedDataset, setSelectedDataset] = useState('');
  const [currentDataset,  setCurrentDataset]  = useState<Dataset | null>(null);
  const [startBar,        setStartBar]        = useState(50);
  const [loadingBars,     setLoadingBars]     = useState(false);
  const [status,          setStatus]          = useState<{ msg: string; type: string }>({ msg: '', type: '' });

  // Session
  const [sessionActive, setSessionActive] = useState(false);
  const currentDatasetIdRef = useRef<string | null>(null);

  // Toggles
  const [blindMode,    setBlindMode]    = useState(false);
  const [noiseEnabled, setNoiseEnabled] = useState(false);
  const [noisePct,     setNoisePct]     = useState(1.0);

  // Predictions
  const [predMode,          setPredMode]          = useState<'idle' | 'committed' | 'skip'>('idle');
  const [pendingPrediction, setPendingPrediction] = useState<'bull' | 'bear' | null>(null);
  const [predictionResults, setPredictionResults] = useState<PredResult[]>([]);
  const [predOverlayState,  setPredOverlayState]  = useState<'hidden' | 'committed' | 'result'>('hidden');
  const [predOverlayDir,    setPredOverlayDir]    = useState<'bull' | 'bear'>('bull');
  const [predResultCorrect, setPredResultCorrect] = useState(false);

  // Trades
  const [activeTrade,    setActiveTrade]    = useState<Trade | null>(null);
  const [resolvedTrades, setResolvedTrades] = useState<ResolvedTrade[]>([]);
  const [tradeDirection, setTradeDirection] = useState<'long' | 'short'>('long');
  const [ticketOpen,     setTicketOpen]     = useState(false);
  const [tradeEntry,     setTradeEntry]     = useState('');
  const [tradeTp,        setTradeTp]        = useState('');
  const [tradeSl,        setTradeSl]        = useState('');
  const [tradeFlash,     setTradeFlash]     = useState<{ text: string; type: 'tp' | 'sl' } | null>(null);

  // Review mode
  const [reviewMode,      setReviewMode]      = useState(false);
  const [reviewReturnBar, setReviewReturnBar] = useState<number | null>(null);
  const [reviewTrade,     setReviewTrade]     = useState<{ trade: ResolvedTrade; idx: number } | null>(null);

  // Notes
  const [notes,         setNotes]         = useState<Record<number, string>>({});
  const [noteOpen,      setNoteOpen]      = useState(false);
  const [noteTargetBar, setNoteTargetBar] = useState<number | null>(null);
  const [noteText,      setNoteText]      = useState('');

  // OHLC display
  const [ohlc, setOhlc] = useState<{ o: number; h: number; l: number; c: number; chg: number } | null>(null);

  // Session modal
  const [modalOpen,   setModalOpen]   = useState(false);
  const [resumeState, setResumeState] = useState<{ session: any; dataset: Dataset; startBar: number } | null>(null);

  // Auth
  const [authUser,        setAuthUser]        = useState<AuthUser | null>(() => getUser());
  const [authToken,       setAuthToken]       = useState<string | null>(() => getToken());
  const [authModalOpen,   setAuthModalOpen]   = useState(false);
  const [authMode,        setAuthMode]        = useState<'login' | 'signup'>('login');
  const [authEmail,       setAuthEmail]       = useState('');
  const [authPassword,    setAuthPassword]    = useState('');
  const [authError,       setAuthError]       = useState('');
  const [authSuccess,     setAuthSuccess]     = useState('');

  // ── Derived ──────────────────────────────────────────────────────────────────
  const visibleNRef   = useRef(visibleN);
  const allBarsRef    = useRef(allBars);
  const predModeRef   = useRef(predMode);
  const pendingPredRef = useRef(pendingPrediction);
  const activeTradeRef = useRef(activeTrade);
  const sessionActiveRef = useRef(sessionActive);

  useEffect(() => { visibleNRef.current    = visibleN;        }, [visibleN]);
  useEffect(() => { allBarsRef.current     = allBars;         }, [allBars]);
  useEffect(() => { predModeRef.current    = predMode;        }, [predMode]);
  useEffect(() => { pendingPredRef.current = pendingPrediction; }, [pendingPrediction]);
  useEffect(() => { activeTradeRef.current = activeTrade;     }, [activeTrade]);
  useEffect(() => { sessionActiveRef.current = sessionActive; }, [sessionActive]);

  // Rebuild allBars when raw or noise settings change
  useEffect(() => {
    if (!rawBars.length) return;
    setAllBars(noiseEnabled ? applyNoise(rawBars, noisePct) : rawBars.slice());
  }, [rawBars, noiseEnabled, noisePct]);

  // ── Load dataset list ─────────────────────────────────────────────────────
  useEffect(() => {
    apiFetch('/api/datasets', {}, authToken)
      .then(({ datasets }) => setDatasets(datasets))
      .catch(err => setStatus({ msg: err.message, type: 'err' }));
  }, [authToken]);

  // ── Chart init ────────────────────────────────────────────────────────────
  const initChart = useCallback(() => {
    if (!chartContainerRef.current) return;
    // Dynamic import to avoid SSR issues
    import('lightweight-charts').then((LC: any) => {
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
      seriesMarkersRef.current = null;

      const chart = LC.createChart(chartContainerRef.current!, {
        width:  chartContainerRef.current!.clientWidth,
        height: chartContainerRef.current!.clientHeight,
        layout: { background: { color: '#0d1117' }, textColor: '#e6edf3' },
        grid:   { vertLines: { color: '#161b22' }, horzLines: { color: '#161b22' } },
        crosshair: { mode: 1 },
        rightPriceScale: { borderColor: '#21262d' },
        timeScale: { borderColor: '#21262d', timeVisible: true, secondsVisible: false },
      });
      chartRef.current = chart;

      const vol = chart.addSeries(LC.HistogramSeries, {
        priceFormat:  { type: 'volume' },
        priceScaleId: 'vol',
        color:        '#3fb950',
      });
      chart.priceScale('vol').applyOptions({ scaleMargins: { top: 0.80, bottom: 0 } });
      volumeRef.current = vol;

      const candle = chart.addSeries(LC.CandlestickSeries, {
        upColor:         '#3fb950',
        downColor:       '#f85149',
        borderUpColor:   '#3fb950',
        borderDownColor: '#f85149',
        wickUpColor:     '#3fb950',
        wickDownColor:   '#f85149',
        priceScaleId:    'right',
      });
      chart.priceScale('right').applyOptions({ scaleMargins: { top: 0.05, bottom: 0.22 } });
      candleRef.current = candle;

      // v5 markers primitive — created once per chart instance, updated via setMarkers()
      seriesMarkersRef.current = LC.createSeriesMarkers(candle, []);

      chart.subscribeCrosshairMove((param: any) => {
        if (!param?.time || !candleRef.current) return;
        const d = param.seriesData.get(candleRef.current);
        if (d) setOhlc({ o: d.open, h: d.high, l: d.low, c: d.close, chg: ((d.close - d.open) / d.open) * 100 });
      });

      const ro = new ResizeObserver(() => {
        if (chartRef.current && chartContainerRef.current) {
          chartRef.current.applyOptions({
            width:  chartContainerRef.current.clientWidth,
            height: chartContainerRef.current.clientHeight,
          });
        }
      });
      ro.observe(chartContainerRef.current!);
    });
  }, []);

  // ── Render chart ──────────────────────────────────────────────────────────
  const renderChart = useCallback((bars: Bar[], n: number, preds: PredResult[], notesMap: Record<number, string>, resolvedTrs: ResolvedTrade[], activeTr: Trade | null) => {
    const candle = candleRef.current;
    const vol    = volumeRef.current;
    const chart  = chartRef.current;
    if (!candle || !vol || !chart) return;

    const slice = bars.slice(0, n);
    candle.setData(slice);
    vol.setData(slice.map((b: Bar) => ({
      time: b.time, value: b.volume,
      color: b.close >= b.open ? '#3fb95033' : '#f8514933',
    })));

    // Markers
    const predMarkers = preds.filter(r => r.barIndex < slice.length).map(r => ({
      time: slice[r.barIndex].time,
      position: r.prediction === 'bull' ? 'aboveBar' : 'belowBar',
      color: r.correct ? '#3fb950' : '#f85149',
      shape: r.correct ? 'arrowUp' : 'arrowDown',
      size: 1, text: '',
    }));
    const noteMarkers = Object.entries(notesMap).filter(([i]) => +i < slice.length).map(([i]) => ({
      time: slice[+i].time, position: 'aboveBar', color: '#58a6ff', shape: 'circle', size: 0, text: '·',
    }));
    const tradeMarkers = resolvedTrs.filter(t => t.exitBar < slice.length).map(t => ({
      time: slice[t.exitBar].time,
      position: t.outcome === 'tp' ? 'aboveBar' : 'belowBar',
      color: t.outcome === 'tp' ? '#3fb950' : t.outcome === 'sl' ? '#f85149' : '#7d8590',
      shape: t.outcome === 'tp' ? 'arrowUp' : 'arrowDown',
      size: 2, text: t.outcome === 'tp' ? 'TP' : t.outcome === 'sl' ? 'SL' : 'X',
    }));
    const allMarkers = [...predMarkers, ...noteMarkers, ...tradeMarkers].sort((a: any, b: any) => a.time - b.time);
    if (seriesMarkersRef.current) {
      seriesMarkersRef.current.setMarkers(allMarkers);
    }

    // Price lines
    clearPriceLines();
    if (activeTr) {
      entryLineRef.current = candle.createPriceLine({ price: activeTr.entryPrice, color: '#7d8590', lineWidth: 1, lineStyle: 2, title: 'Entry' });
      tpLineRef.current    = candle.createPriceLine({ price: activeTr.tp,         color: '#3fb950', lineWidth: 1, lineStyle: 2, title: 'TP' });
      slLineRef.current    = candle.createPriceLine({ price: activeTr.sl,         color: '#f85149', lineWidth: 1, lineStyle: 2, title: 'SL' });
    }

    chart.timeScale().scrollToPosition(0, false);
    if (slice.length) {
      const last = slice[slice.length - 1];
      setOhlc({ o: last.open, h: last.high, l: last.low, c: last.close, chg: ((last.close - last.open) / last.open) * 100 });
    }
  }, []);

  function clearPriceLines() {
    const candle = candleRef.current;
    if (!candle) return;
    [tpLineRef, slLineRef, entryLineRef].forEach(ref => {
      if (ref.current) { try { candle.removePriceLine(ref.current); } catch {} ref.current = null; }
    });
  }

  // ── Session save (debounced) ──────────────────────────────────────────────
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveSession = useCallback((overrides?: Partial<{ visibleN: number; predictionResults: PredResult[]; resolvedTrades: ResolvedTrade[]; notes: Record<number, string>; activeTrade: Trade | null }>) => {
    if (!authToken || !currentDatasetIdRef.current || !sessionActiveRef.current) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      apiFetch(`/api/sessions/${currentDatasetIdRef.current}`, {
        method: 'POST',
        body: JSON.stringify({
          visible_n:          overrides?.visibleN          ?? visibleNRef.current,
          prediction_results: overrides?.predictionResults ?? predictionResults,
          resolved_trades:    overrides?.resolvedTrades    ?? resolvedTrades,
          notes:              overrides?.notes             ?? notes,
          active_trade:       overrides?.activeTrade       ?? activeTrade,
        }),
      }, authToken).catch(() => {});
    }, 1000);
  }, [authToken, predictionResults, resolvedTrades, notes, activeTrade]);

  // ── Load dataset ──────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!selectedDataset) { setStatus({ msg: 'Select a dataset first.', type: 'err' }); return; }
    setLoadingBars(true);
    setStatus({ msg: '', type: '' });
    try {
      const { dataset } = await apiFetch(`/api/datasets/${selectedDataset}`, {}, authToken);
      const raw: Bar[] = dataset.bars;
      setRawBars(raw);
      const bars = noiseEnabled ? applyNoise(raw, noisePct) : raw.slice();
      setAllBars(bars);
      currentDatasetIdRef.current = selectedDataset;

      if (authToken) {
        const res = await apiFetch(`/api/sessions/${selectedDataset}`, {}, authToken);
        if (res.exists && res.session) {
          setResumeState({ session: res.session, dataset, startBar });
          return;
        }
      }
      doStartFresh(bars, dataset, startBar);
    } catch (err: any) {
      setStatus({ msg: err.message, type: 'err' });
    } finally {
      setLoadingBars(false);
    }
  }, [selectedDataset, authToken, noiseEnabled, noisePct, startBar]);

  function doStartFresh(bars: Bar[], dataset: Dataset, sb: number) {
    setPredictionResults([]);
    setPendingPrediction(null);
    setPredMode('idle');
    setActiveTrade(null);
    setResolvedTrades([]);
    setNotes({});
    setPredOverlayState('hidden');
    clearPriceLines();
    setSessionActive(true);
    setCurrentDataset(dataset);
    const n = Math.min(sb, bars.length);
    setVisibleN(n);
    initChart();
    setTimeout(() => renderChart(bars, n, [], {}, [], null), 50);
    setStatus({ msg: `${bars.length} bars loaded`, type: 'ok' });
  }

  function doResume(bars: Bar[], session: any, dataset: Dataset) {
    const preds   = session.prediction_results || [];
    const trades  = session.resolved_trades    || [];
    const notesMap = session.notes             || {};
    const active  = session.active_trade       || null;
    const n       = Math.min(session.visible_n || 50, bars.length);
    setPredictionResults(preds);
    setResolvedTrades(trades);
    setNotes(notesMap);
    setActiveTrade(active);
    setPredMode('idle');
    setPredOverlayState('hidden');
    setSessionActive(true);
    setCurrentDataset(dataset);
    setVisibleN(n);
    initChart();
    setTimeout(() => renderChart(bars, n, preds, notesMap, trades, active), 50);
    setStatus({ msg: `Resumed · ${bars.length} bars`, type: 'ok' });
  }

  // ── Prediction ────────────────────────────────────────────────────────────
  const commitPrediction = useCallback((dir: 'bull' | 'bear') => {
    setPendingPrediction(dir);
    setPredMode('committed');
    setPredOverlayDir(dir);
    setPredOverlayState('committed');
  }, []);

  const skipPrediction = useCallback(() => {
    setPredMode('skip');
    setPendingPrediction(null);
    setPredOverlayState('hidden');
  }, []);

  const resolvePrediction = useCallback((n: number, bars: Bar[], pending: 'bull' | 'bear' | null, mode: string) => {
    if (mode !== 'committed' || !pending) {
      setPredOverlayState('hidden');
      setPredMode('idle');
      return null;
    }
    const newBar  = bars[n - 1];
    const prevBar = bars[n - 2];
    if (!newBar || !prevBar) { setPredOverlayState('hidden'); return null; }
    const correct = (pending === 'bull') === (newBar.close >= prevBar.close);
    const result: PredResult = { barIndex: n - 1, prediction: pending, correct };
    setPredMode('idle');
    setPendingPrediction(null);
    setPredResultCorrect(correct);
    setPredOverlayState('result');
    setTimeout(() => setPredOverlayState('hidden'), 800);
    return result;
  }, []);

  // ── Trade resolution ──────────────────────────────────────────────────────
  const checkTradeResolution = useCallback((n: number, bars: Bar[], trade: Trade | null): ResolvedTrade | null => {
    if (!trade) return null;
    const bar = bars[n - 1];
    if (!bar) return null;
    const { tp, sl, direction, entryPrice, entryBar } = trade;
    let outcome: 'tp' | 'sl' | null = null;
    let exitPrice = 0;
    if (direction === 'long') {
      if (bar.low  <= sl) { outcome = 'sl'; exitPrice = sl; }
      if (bar.high >= tp && !outcome) { outcome = 'tp'; exitPrice = tp; }
    } else {
      if (bar.high >= sl) { outcome = 'sl'; exitPrice = sl; }
      if (bar.low  <= tp && !outcome) { outcome = 'tp'; exitPrice = tp; }
    }
    if (!outcome) return null;
    return { entryBar, entryPrice, tp, sl, direction, exitBar: n - 1, exitPrice, outcome };
  }, []);

  // ── Advance / retreat ─────────────────────────────────────────────────────
  const advanceBar = useCallback(() => {
    const bars  = allBarsRef.current;
    const n     = visibleNRef.current;
    const mode  = predModeRef.current;
    const pend  = pendingPredRef.current;
    const trade = activeTradeRef.current;
    if (n >= bars.length) return;

    const newMode = mode === 'idle' ? 'skip' : mode;
    const newN    = n + 1;

    // Resolve prediction
    const predResult = resolvePrediction(newN, bars, pend, newMode);

    // Check trade
    const resolved = checkTradeResolution(newN, bars, trade);

    setVisibleN(newN);
    setPredictionResults(prev => {
      const next = predResult ? [...prev, predResult] : prev;
      return next;
    });
    if (resolved) {
      setActiveTrade(null);
      clearPriceLines();
      setResolvedTrades(prev => [...prev, resolved]);
      setTradeFlash({ text: resolved.outcome === 'tp' ? '✓ TP Hit' : '✗ SL Hit', type: resolved.outcome as 'tp' | 'sl' });
      setTimeout(() => setTradeFlash(null), 1200);
    }

    setTimeout(() => {
      const updatedPreds   = predResult ? [...predictionResults, predResult] : predictionResults;
      const updatedTrades  = resolved ? [...resolvedTrades, resolved] : resolvedTrades;
      const updatedActive  = resolved ? null : trade;
      renderChart(bars, newN, updatedPreds, notes, updatedTrades, updatedActive);
      saveSession({ visibleN: newN, predictionResults: updatedPreds, resolvedTrades: updatedTrades, activeTrade: updatedActive });
    }, 0);
  }, [resolvePrediction, checkTradeResolution, renderChart, saveSession, predictionResults, resolvedTrades, notes]);

  const retreatBar = useCallback(() => {
    const n = visibleNRef.current;
    if (n <= 1) return;
    const newN = n - 1;
    setPredOverlayState('hidden');
    setPredMode('idle');
    setVisibleN(newN);
    setTimeout(() => {
      renderChart(allBarsRef.current, newN, predictionResults, notes, resolvedTrades, activeTradeRef.current);
      saveSession({ visibleN: newN });
    }, 0);
  }, [renderChart, saveSession, predictionResults, notes, resolvedTrades]);

  const jumpBars = useCallback((delta: number) => {
    const n    = visibleNRef.current;
    const bars = allBarsRef.current;
    const newN = Math.max(1, Math.min(bars.length, n + delta));
    setPredOverlayState('hidden');
    setPredMode('idle');
    setVisibleN(newN);
    setTimeout(() => {
      renderChart(bars, newN, predictionResults, notes, resolvedTrades, activeTradeRef.current);
      saveSession({ visibleN: newN });
    }, 0);
  }, [renderChart, saveSession, predictionResults, notes, resolvedTrades]);

  const randomiseStart = useCallback(() => {
    const bars = allBarsRef.current;
    if (!bars.length) return;
    const min = 10, max = bars.length - 5;
    if (max <= min) return;
    const newN = Math.floor(Math.random() * (max - min + 1)) + min;
    setPredOverlayState('hidden');
    setPredMode('idle');
    setVisibleN(newN);
    setTimeout(() => {
      renderChart(bars, newN, predictionResults, notes, resolvedTrades, activeTradeRef.current);
      saveSession({ visibleN: newN });
    }, 0);
  }, [renderChart, saveSession, predictionResults, notes, resolvedTrades]);

  // ── Trade panel ───────────────────────────────────────────────────────────
  function openTradeTicket(dir: 'long' | 'short') {
    if (!sessionActiveRef.current || !allBarsRef.current.length || activeTradeRef.current) return;
    const n   = visibleNRef.current;
    const bar = allBarsRef.current[n - 1];
    const lb  = allBarsRef.current.slice(Math.max(0, n - 14), n);
    const avg = lb.reduce((s, b) => s + (b.high - b.low), 0) / lb.length;
    setTradeDirection(dir);
    setTradeEntry(bar.close.toFixed(2));
    setTradeTp(dir === 'long' ? (bar.close + avg * 1.5).toFixed(2) : (bar.close - avg * 1.5).toFixed(2));
    setTradeSl(dir === 'long' ? (bar.close - avg * 0.8).toFixed(2) : (bar.close + avg * 0.8).toFixed(2));
    setTicketOpen(true);
  }

  function confirmTrade() {
    const e = parseFloat(tradeEntry), tp = parseFloat(tradeTp), sl = parseFloat(tradeSl);
    if (isNaN(e) || isNaN(tp) || isNaN(sl)) return;
    const trade: Trade = { entryBar: visibleNRef.current - 1, entryPrice: e, tp, sl, direction: tradeDirection };
    setActiveTrade(trade);
    setTicketOpen(false);
    // Draw lines after state settles
    setTimeout(() => renderChart(allBarsRef.current, visibleNRef.current, predictionResults, notes, resolvedTrades, trade), 0);
    saveSession({ activeTrade: trade });
  }

  function closeTradeManually() {
    const trade = activeTradeRef.current;
    if (!trade) return;
    const bar = allBarsRef.current[visibleNRef.current - 1];
    if (!bar) return;
    const ep = bar.close;
    const outcome = trade.direction === 'long' ? (ep > trade.entryPrice ? 'tp' : 'sl') : (ep < trade.entryPrice ? 'tp' : 'sl');
    const resolved: ResolvedTrade = { ...trade, exitBar: visibleNRef.current - 1, exitPrice: ep, outcome: 'manual' };
    setActiveTrade(null);
    clearPriceLines();
    setResolvedTrades(prev => {
      const next = [...prev, resolved];
      saveSession({ resolvedTrades: next, activeTrade: null });
      return next;
    });
  }

  // ── Notes ─────────────────────────────────────────────────────────────────
  function openNote() {
    if (!sessionActiveRef.current || !allBarsRef.current.length) return;
    const idx = visibleNRef.current - 1;
    setNoteTargetBar(idx);
    setNoteText(notes[idx] || '');
    setNoteOpen(true);
  }

  function saveNote() {
    if (noteTargetBar === null) return;
    const text = noteText.trim();
    setNotes(prev => {
      const next = { ...prev };
      if (text) next[noteTargetBar] = text;
      else delete next[noteTargetBar];
      saveSession({ notes: next });
      setTimeout(() => renderChart(allBarsRef.current, visibleNRef.current, predictionResults, next, resolvedTrades, activeTradeRef.current), 0);
      return next;
    });
    setNoteOpen(false);
    setNoteTargetBar(null);
  }

  // ── Trade review ──────────────────────────────────────────────────────────
  function enterTradeReview(idx: number) {
    const trade = resolvedTrades[idx];
    if (!trade) return;
    setModalOpen(false);
    setReviewReturnBar(visibleNRef.current);
    setReviewMode(true);
    setReviewTrade({ trade, idx });
    const n = Math.max(1, trade.entryBar - 20 + 1);
    setVisibleN(n);
    setTimeout(() => {
      renderChart(allBarsRef.current, n, predictionResults, notes, resolvedTrades, null);
      // Draw reference lines
      const candle = candleRef.current;
      if (candle) {
        reviewLines.current = [
          candle.createPriceLine({ price: trade.entryPrice, color: '#7d859099', lineWidth: 1, lineStyle: 1, title: `Entry ${trade.direction === 'long' ? '▲' : '▼'}` }),
          candle.createPriceLine({ price: trade.tp,         color: '#3fb95099', lineWidth: 1, lineStyle: 1, title: 'TP' }),
          candle.createPriceLine({ price: trade.sl,         color: '#f8514999', lineWidth: 1, lineStyle: 1, title: 'SL' }),
        ];
      }
    }, 0);
  }

  function exitTradeReview() {
    setReviewMode(false);
    setReviewTrade(null);
    const candle = candleRef.current;
    if (candle) {
      reviewLines.current.forEach(l => { try { candle.removePriceLine(l); } catch {} });
      reviewLines.current = [];
    }
    if (reviewReturnBar !== null) {
      const n = reviewReturnBar;
      setVisibleN(n);
      setReviewReturnBar(null);
      setTimeout(() => renderChart(allBarsRef.current, n, predictionResults, notes, resolvedTrades, activeTradeRef.current), 0);
    }
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  async function submitAuth() {
    setAuthError(''); setAuthSuccess('');
    if (!authEmail || !authPassword) { setAuthError('Email and password required'); return; }
    try {
      const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/signup';
      const data = await apiFetch(endpoint, { method: 'POST', body: JSON.stringify({ email: authEmail, password: authPassword }) });
      if (authMode === 'signup' && !data.access_token) {
        setAuthSuccess('✓ Check your email to confirm your account, then sign in.');
        return;
      }
      setAuthToken(data.access_token);
      setAuthUser(data.user);
      localStorage.setItem('pat_token', data.access_token);
      localStorage.setItem('pat_user', JSON.stringify(data.user));
      if (data.refresh_token) localStorage.setItem('pat_refresh', data.refresh_token);
      setAuthModalOpen(false);
      setAuthEmail(''); setAuthPassword('');
    } catch (err: any) { setAuthError(err.message); }
  }

  function logout() {
    setAuthToken(null); setAuthUser(null);
    localStorage.removeItem('pat_token');
    localStorage.removeItem('pat_refresh');
    localStorage.removeItem('pat_user');
  }

  // ── Keyboard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTicketOpen(false); setNoteOpen(false);
        setPredOverlayState('hidden'); setPredMode('idle');
        setAuthModalOpen(false);
        return;
      }
      const tag = (e.target as HTMLElement).tagName;
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tag)) return;
      if (modalOpen) { if (e.key === 'Escape' || e.key === 'Tab') { e.preventDefault(); setModalOpen(false); } return; }

      const k = e.key.toLowerCase();
      if (sessionActiveRef.current && allBarsRef.current.length) {
        if (k === 'b') { e.preventDefault(); commitPrediction('bull'); return; }
        if (k === 'l') { e.preventDefault(); commitPrediction('bear'); return; }
        if (k === 's') { e.preventDefault(); skipPrediction(); return; }
        if (k === 'e') { e.preventDefault(); openTradeTicket('long'); return; }
        if (k === 'x') { e.preventDefault(); closeTradeManually(); return; }
        if (k === 'n') { e.preventDefault(); openNote(); return; }
        if (k === 'r') { e.preventDefault(); if (reviewMode) exitTradeReview(); else setModalOpen(true); return; }
      }
      if (e.key === 'Tab') { e.preventDefault(); if (sessionActiveRef.current) setModalOpen(true); return; }
      if (!allBarsRef.current.length) return;
      switch (e.key) {
        case 'ArrowRight': e.preventDefault(); advanceBar(); break;
        case 'ArrowLeft':  e.preventDefault(); retreatBar(); break;
        case 'ArrowUp':    e.preventDefault(); jumpBars(10); break;
        case 'ArrowDown':  e.preventDefault(); jumpBars(-10); break;
        case ' ':          e.preventDefault(); randomiseStart(); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [advanceBar, retreatBar, jumpBars, randomiseStart, commitPrediction, skipPrediction, modalOpen, reviewMode]);

  // ── Score strip data ──────────────────────────────────────────────────────
  const scoreData = (() => {
    if (!predictionResults.length) return null;
    const total   = predictionResults.length;
    const correct = predictionResults.filter(r => r.correct).length;
    const pct     = Math.round(correct / total * 100);
    const bulls   = predictionResults.filter(r => r.prediction === 'bull');
    const bears   = predictionResults.filter(r => r.prediction === 'bear');
    const bPct    = bulls.length ? Math.round(bulls.filter(r => r.correct).length / bulls.length * 100) : null;
    const lPct    = bears.length ? Math.round(bears.filter(r => r.correct).length / bears.length * 100) : null;
    let streak = 0;
    for (let i = predictionResults.length - 1; i >= 0; i--) { if (predictionResults[i].correct) streak++; else break; }
    return { total, correct, pct, bPct, lPct, streak };
  })();

  // ── Filtered datasets ──────────────────────────────────────────────────────
  const filteredDatasets = datasetSearch.trim()
    ? datasets.filter(d => (d.label || '').toLowerCase().includes(datasetSearch.toLowerCase()) || d.symbol.toLowerCase().includes(datasetSearch.toLowerCase()))
    : datasets;

  const groupedDatasets = (() => {
    const groups: Record<string, Dataset[]> = { '1d': [], '1wk': [], '1mo': [] };
    filteredDatasets.forEach(d => { (groups[d.interval] || groups['1d']).push(d); });
    return groups;
  })();

  // ── Render ────────────────────────────────────────────────────────────────
  const symbolDisplay = currentDataset ? (blindMode ? '████' : currentDataset.symbol) : '—';
  const pctCls = scoreData ? (scoreData.pct >= 60 ? 'score-good' : scoreData.pct >= 45 ? 'score-mid' : 'score-bad') : '';

  return (
    <>
      {/* ── Sidebar ── */}
      <aside id="sidebar">
        <div className="sidebar-header">
          <div className="app-name">Price Action Trainer</div>
          {authUser ? (
            <div className="user-badge">
              <span className="user-email">{authUser.email}</span>
              <button className="logout-btn" onClick={logout}>Sign out</button>
            </div>
          ) : null}
        </div>

        <div className="sidebar-body">
          <div className="field-group">
            <div className="field-label">Dataset</div>
            <input
              type="text"
              placeholder="Search symbol or name…"
              value={datasetSearch}
              onChange={e => setDatasetSearch(e.target.value)}
              onKeyDown={e => { if (e.key === 'Escape') setDatasetSearch(''); }}
              autoComplete="off"
            />
            {loadingBars && (
              <div className="dataset-spinner">
                <span className="spinner-ring"></span> Loading bars…
              </div>
            )}
            <select
              id="datasetSelect"
              size={6}
              value={selectedDataset}
              onChange={e => setSelectedDataset(e.target.value)}
            >
              {Object.entries({ '1d': 'Daily', '1wk': 'Weekly', '1mo': 'Monthly' }).map(([interval, label]) =>
                groupedDatasets[interval]?.length ? (
                  <optgroup key={interval} label={label}>
                    {groupedDatasets[interval].map(d => (
                      <option key={d.id} value={d.id}>{d.label || `${d.symbol} ${d.interval}`}</option>
                    ))}
                  </optgroup>
                ) : null
              )}
            </select>
            <div className="field-hint">
              {selectedDataset ? (datasets.find(d => d.id === selectedDataset)?.label ?? '') : ''}
            </div>
          </div>

          <div className="field-group">
            <div className="field-label">Starting bars</div>
            <input type="number" value={startBar} min={5} max={5000} onChange={e => setStartBar(+e.target.value)} />
            <div className="field-hint">Bars visible at session start</div>
          </div>

          <div className="divider"></div>

          <div className="field-group">
            <div className="toggle-field">
              <div className="toggle-info">
                <div className="toggle-title">Blind mode</div>
                <div className="toggle-sub">Hides ticker symbol</div>
              </div>
              <label className="switch">
                <input type="checkbox" checked={blindMode} onChange={e => setBlindMode(e.target.checked)} />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div className="field-group">
            <div className="toggle-field">
              <div className="toggle-info">
                <div className="toggle-title">Noise {noisePct.toFixed(1)}%</div>
                <div className="toggle-sub">OHLC jitter</div>
              </div>
              <label className="switch">
                <input type="checkbox" checked={noiseEnabled} onChange={e => setNoiseEnabled(e.target.checked)} />
                <span className="slider"></span>
              </label>
            </div>
            <input type="range" min={0.1} max={5} step={0.1} value={noisePct} onChange={e => setNoisePct(+e.target.value)} style={{ marginTop: '6px' }} />
          </div>

          <div className="divider"></div>

          <button className="load-btn" disabled={loadingBars} onClick={loadData}>Load Dataset</button>
          <div className={`status-msg ${status.type}`}>{status.msg}</div>

          {!authUser && (
            <div className="auth-inline">
              {!authModalOpen ? (
                <button className="auth-inline-trigger" onClick={() => { setAuthModalOpen(true); setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}>
                  Save sessions across devices →
                </button>
              ) : (
                <div className="auth-inline-form">
                  <div className="auth-inline-tabs">
                    <button
                      className={`auth-tab ${authMode === 'login' ? 'active' : ''}`}
                      onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }}
                    >Sign in</button>
                    <button
                      className={`auth-tab ${authMode === 'signup' ? 'active' : ''}`}
                      onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthSuccess(''); }}
                    >Register</button>
                    <button className="auth-inline-close" onClick={() => setAuthModalOpen(false)}>✕</button>
                  </div>
                  {authError   && <div className="auth-error">{authError}</div>}
                  {authSuccess && <div className="auth-success">{authSuccess}</div>}
                  {!authSuccess && (
                    <>
                      <input
                        type="email"
                        placeholder="Email"
                        value={authEmail}
                        onChange={e => setAuthEmail(e.target.value)}
                        autoComplete="email"
                        onKeyDown={e => { if (e.key === 'Enter') submitAuth(); }}
                      />
                      <input
                        type="password"
                        placeholder="Password"
                        value={authPassword}
                        onChange={e => setAuthPassword(e.target.value)}
                        autoComplete={authMode === 'login' ? 'current-password' : 'new-password'}
                        onKeyDown={e => { if (e.key === 'Enter') submitAuth(); }}
                      />
                      <button className={`auth-submit-btn ${authMode}`} onClick={submitAuth}>
                        {authMode === 'login' ? 'Sign in' : 'Create account'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sidebar-footer">
          <a href="https://buymeacoffee.com/thefuzzybear" target="_blank" rel="noopener noreferrer" className="bmc-link">
            <span className="bmc-icon">☕</span>
            <span className="bmc-text">Buy me a coffee</span>
          </a>
        </div>
      </aside>

      {/* ── Chart area ── */}
      <main id="chartArea">
        <div id="topBar">
          <span id="symbolLabel">{symbolDisplay}</span>
          {currentDataset && <span id="intervalLabel">{currentDataset.interval}</span>}
          <div id="scoreStrip">
            {scoreData ? (
              <>
                <span className={`score-item ${pctCls}`}>{scoreData.pct}%</span>
                <span className="score-sep">·</span>
                <span className="score-item">{scoreData.correct}/{scoreData.total}</span>
                <span className="score-sep">·</span>
                <span className="score-item score-bull">B {scoreData.bPct !== null ? scoreData.bPct + '%' : '—'}</span>
                <span className="score-sep">·</span>
                <span className="score-item score-bear">L {scoreData.lPct !== null ? scoreData.lPct + '%' : '—'}</span>
                {scoreData.streak >= 3 && <><span className="score-sep">·</span><span className="score-item score-streak">{scoreData.streak}✦</span></>}
              </>
            ) : (
              <span className="score-idle">Press <kbd>B</kbd> Bull · <kbd>L</kbd> Bear before a bar</span>
            )}
          </div>
          {activeTrade && (
            <>
              <span id="tradeStatus">
                <span className={`ts-open ${activeTrade.direction}`}>{activeTrade.direction === 'long' ? '▲' : '▼'} {activeTrade.direction === 'long' ? 'BUY' : 'SELL'}</span>
                <span className="ts-sep">·</span>
                <span className="ts-price">@ {activeTrade.entryPrice.toFixed(2)}</span>
                <span className="ts-sep">·</span>
                <span className="ts-rr">R:R {(Math.abs(activeTrade.tp - activeTrade.entryPrice) / Math.abs(activeTrade.entryPrice - activeTrade.sl)).toFixed(1)}</span>
              </span>
              <button className="trade-close-btn" onClick={closeTradeManually}>Close trade</button>
            </>
          )}
          {ohlc && (
            <span id="ohlcInfo">
              {(['O', 'H', 'L', 'C'] as const).map((k, i) => {
                const v = [ohlc.o, ohlc.h, ohlc.l, ohlc.c][i];
                const cls = ohlc.c >= ohlc.o ? 'val-up' : 'val-down';
                return <span key={k}><span className="lbl">{k}</span><span className={cls}>{v.toFixed(2)}</span></span>;
              })}
              <span><span className="lbl">Chg</span><span className={ohlc.chg >= 0 ? 'val-up' : 'val-down'}>{ohlc.chg >= 0 ? '+' : ''}{ohlc.chg.toFixed(2)}%</span></span>
            </span>
          )}
          {allBars.length > 0 && <span id="barInfo">{visibleN} / {allBars.length}</span>}
          <button className="score-btn" onClick={() => { if (sessionActive) setModalOpen(true); }}>Summary</button>
        </div>

        <div id="chartContainer" ref={chartContainerRef}>
          {/* Empty state */}
          {!sessionActive && (
            <div id="emptyState">
              <svg className="empty-icon" viewBox="0 0 32 32" fill="none">
                <rect x="4" y="20" width="4" height="8" rx="1" fill="currentColor"/>
                <rect x="10" y="14" width="4" height="14" rx="1" fill="currentColor"/>
                <rect x="16" y="8" width="4" height="20" rx="1" fill="currentColor"/>
                <rect x="22" y="16" width="4" height="12" rx="1" fill="currentColor"/>
              </svg>
              <p>Select a dataset and click <strong>Load Dataset</strong></p>
            </div>
          )}

          {/* Prediction overlay */}
          {predOverlayState !== 'hidden' && (
            <div id="predOverlay" style={{ display: 'flex' }}>
              {predOverlayState === 'committed' && (
                <div className="pred-committed" style={{ display: 'flex' }}>
                  <div className={`pred-committed-label ${predOverlayDir}`}>{predOverlayDir === 'bull' ? '▲  Bullish' : '▼  Bearish'}</div>
                  <div className="pred-committed-hint">Press → to reveal</div>
                </div>
              )}
              {predOverlayState === 'result' && (
                <div className={`pred-result ${predResultCorrect ? 'correct' : 'wrong'}`} style={{ display: 'block' }}>
                  {predResultCorrect ? '✓' : '✗'}
                </div>
              )}
            </div>
          )}

          {/* Trade flash */}
          {tradeFlash && (
            <div className={`trade-flash ${tradeFlash.type}`} style={{ display: 'flex' }}>{tradeFlash.text}</div>
          )}

          {/* Trade ticket */}
          {sessionActive && (
            <div id="tradeTicket">
              <div id="ticketButtons">
                <button className="ticket-btn buy" onClick={() => openTradeTicket('long')} disabled={!!activeTrade}>Buy</button>
                <button className="ticket-btn sell" onClick={() => openTradeTicket('short')} disabled={!!activeTrade}>Sell</button>
              </div>
              {ticketOpen && (
                <div id="ticketForm" style={{ display: 'flex' }}>
                  <div id="ticketDirection" className={`ticket-direction-label ${tradeDirection}`}>{tradeDirection === 'long' ? '▲ Buy' : '▼ Sell'}</div>
                  <div className="ticket-field-row">
                    <div className="ticket-field">
                      <div className="ticket-field-label">Entry</div>
                      <input className="ticket-input" type="number" step="0.01" value={tradeEntry} onChange={e => setTradeEntry(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') confirmTrade(); if (e.key === 'Escape') setTicketOpen(false); }} />
                    </div>
                  </div>
                  <div className="ticket-field-row">
                    <div className="ticket-field">
                      <div className="ticket-field-label tp-lbl">Take Profit</div>
                      <input className="ticket-input tp-input" type="number" step="0.01" value={tradeTp} onChange={e => setTradeTp(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') confirmTrade(); }} />
                    </div>
                    <div className="ticket-field">
                      <div className="ticket-field-label sl-lbl">Stop Loss</div>
                      <input className="ticket-input sl-input" type="number" step="0.01" value={tradeSl} onChange={e => setTradeSl(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') confirmTrade(); }} />
                    </div>
                  </div>
                  <div className="ticket-actions">
                    <button className={`ticket-confirm-btn ${tradeDirection}`} onClick={confirmTrade}>Place</button>
                    <button className="ticket-cancel-btn" onClick={() => setTicketOpen(false)}>✕</button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Note panel */}
          {noteOpen && (
            <div className="note-panel" style={{ display: 'flex' }}>
              <div className="panel-title-row">
                <div className="panel-title">Note</div>
                <div className="note-bar-label">
                  {noteTargetBar !== null ? `Bar ${noteTargetBar + 1} · ${new Date((allBars[noteTargetBar]?.time ?? 0) * 1000).toLocaleDateString()}` : ''}
                </div>
              </div>
              <textarea
                placeholder="What do you see? Structure, context, bias…"
                rows={4}
                value={noteText}
                onChange={e => setNoteText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) { e.preventDefault(); saveNote(); }
                  if (e.key === 'Escape') { setNoteOpen(false); setNoteTargetBar(null); }
                }}
                autoFocus
              />
              <div className="panel-actions">
                <button className="panel-confirm-btn" onClick={saveNote}>Save <span className="kbd-hint">⌘↵</span></button>
                <button className="panel-cancel-btn" onClick={() => { setNoteOpen(false); setNoteTargetBar(null); }}>Cancel</button>
              </div>
            </div>
          )}

          {/* Resume prompt */}
          {resumeState && (
            <div className="resume-prompt" style={{ display: 'flex' }}>
              <div className="resume-box">
                <div className="resume-title">Resume session?</div>
                <div className="resume-info">
                  Bar {resumeState.session.visible_n} · {(resumeState.session.prediction_results || []).length} predictions · saved {new Date(resumeState.session.saved_at).toLocaleDateString()}
                </div>
                <div className="resume-actions">
                  <button className="panel-confirm-btn" onClick={() => {
                    const { session, dataset } = resumeState;
                    setResumeState(null);
                    doResume(allBars.length ? allBars : rawBars, session, dataset);
                  }}>Resume</button>
                  <button className="panel-cancel-btn" onClick={() => {
                    const { startBar: sb, dataset } = resumeState;
                    setResumeState(null);
                    doStartFresh(allBars.length ? allBars : rawBars, dataset, sb);
                  }}>Start fresh</button>
                </div>
              </div>
            </div>
          )}

          {/* Review banner */}
          {reviewMode && reviewTrade && (
            <div id="reviewBanner" style={{ display: 'flex' }}>
              <span className="review-label">Reviewing trade {reviewTrade.idx + 1}</span>
              <span className="review-sep">·</span>
              <span className={`review-dir ${reviewTrade.trade.direction === 'long' ? 'bull' : 'bear'}`}>
                {reviewTrade.trade.direction === 'long' ? '▲ BUY' : '▼ SELL'}
              </span>
              <span className="review-sep">·</span>
              <span className="review-price">@ {reviewTrade.trade.entryPrice.toFixed(2)}</span>
              <span className="review-sep">·</span>
              <span className="review-rr">R:R {(Math.abs(reviewTrade.trade.tp - reviewTrade.trade.entryPrice) / Math.abs(reviewTrade.trade.entryPrice - reviewTrade.trade.sl)).toFixed(1)}</span>
              <span className="review-sep">·</span>
              <span className={`review-outcome ${reviewTrade.trade.outcome === 'tp' ? 'bull' : 'bear'}`}>
                {reviewTrade.trade.outcome === 'tp' ? 'TP ✓' : reviewTrade.trade.outcome === 'sl' ? 'SL ✗' : 'Manual'}
              </span>
              <button className="exit-review-btn" onClick={exitTradeReview}>Exit Review</button>
            </div>
          )}
        </div>

        <div id="bottomBar">
          {[['←','back'],['→','reveal'],['↑↓','±10'],['B','bull'],['L','bear'],['S','skip'],['E','trade'],['X','close'],['N','note'],['R','review'],['Tab','summary']].map(([k, a], i, arr) => (
            <span key={k}>
              <span className="key-hint"><span className="key">{k}</span><span className="action">{a}</span></span>
              {i < arr.length - 1 && <span className="hint-sep"></span>}
            </span>
          ))}
        </div>
      </main>

      {/* ── Session modal ── */}
      {modalOpen && (
        <div id="sessionModal" style={{ display: 'flex' }} onClick={e => { if (e.target === e.currentTarget) setModalOpen(false); }}>
          <div className="modal-box">
            <div className="modal-header">
              <div className="modal-title">Session Summary</div>
              <button className="modal-close" onClick={() => setModalOpen(false)}>✕</button>
            </div>
            <div id="modalContent">
              {scoreData ? (
                <>
                  <div className="modal-symbol">
                    {blindMode ? 'hidden' : currentDataset?.symbol ?? '—'}
                    {currentDataset && <span className="modal-interval">{currentDataset.interval}</span>}
                  </div>
                  <div className="modal-stats">
                    <div className="modal-stat"><div className={`modal-stat-val ${scoreData.pct >= 60 ? 'good' : scoreData.pct >= 45 ? 'mid' : 'bad'}`}>{scoreData.pct}%</div><div className="modal-stat-lbl">Overall</div></div>
                    <div className="modal-stat"><div className="modal-stat-val">{scoreData.correct}/{scoreData.total}</div><div className="modal-stat-lbl">Correct</div></div>
                    <div className="modal-stat"><div className="modal-stat-val score-streak">{scoreData.streak}</div><div className="modal-stat-lbl">Best streak</div></div>
                  </div>
                  <div className="modal-breakdown">
                    {[['bull', '▲ Bull', scoreData.bPct, predictionResults.filter(r=>r.prediction==='bull').length],
                      ['bear', '▼ Bear', scoreData.lPct, predictionResults.filter(r=>r.prediction==='bear').length]].map(([cls, lbl, pct, cnt]) => (
                      <div key={cls as string} className="modal-dir">
                        <div className={`modal-dir-label ${cls}`}>{lbl}</div>
                        <div className="modal-dir-bar"><div className={`modal-dir-fill ${cls}`} style={{ width: `${pct ?? 0}%` }}></div></div>
                        <div className="modal-dir-pct">{cnt} · {pct !== null ? pct + '%' : '—'}</div>
                      </div>
                    ))}
                  </div>
                  <div className="modal-bias">
                    {predictionResults.filter(r=>r.prediction==='bull').length > predictionResults.filter(r=>r.prediction==='bear').length * 2
                      ? 'Upside bias detected — called bull more often.'
                      : predictionResults.filter(r=>r.prediction==='bear').length > predictionResults.filter(r=>r.prediction==='bull').length * 2
                      ? 'Downside bias detected — called bear more often.'
                      : 'Directional mix looks balanced.'}
                  </div>
                </>
              ) : (
                <p className="modal-empty">No predictions yet.<br />Press <kbd>B</kbd> or <kbd>L</kbd> before advancing.</p>
              )}

              {/* Trade log */}
              {resolvedTrades.length > 0 && (
                <div className="modal-trades">
                  <div className="modal-section-title">Trade Log</div>
                  <div className="trade-log">
                    <div className="trade-log-header">
                      <span>#</span><span>Dir</span><span>Entry</span><span>TP</span><span>SL</span><span>Exit</span><span>R:R</span><span>Result</span><span></span>
                    </div>
                    {resolvedTrades.map((t, i) => {
                      const rr  = (Math.abs(t.tp - t.entryPrice) / Math.abs(t.entryPrice - t.sl)).toFixed(1);
                      const pnl = (t.direction === 'long' ? (t.exitPrice - t.entryPrice) : (t.entryPrice - t.exitPrice)) / t.entryPrice * 100;
                      return (
                        <div key={i} className="trade-log-row">
                          <span className="tl-num">{i+1}</span>
                          <span className={`tl-dir ${t.direction === 'long' ? 'bull' : 'bear'}`}>{t.direction === 'long' ? '▲' : '▼'}</span>
                          <span className="tl-price">{t.entryPrice.toFixed(2)}</span>
                          <span className="tl-tp">{t.tp.toFixed(2)}</span>
                          <span className="tl-sl">{t.sl.toFixed(2)}</span>
                          <span className="tl-exit">{t.exitPrice.toFixed(2)}</span>
                          <span className="tl-rr">{rr}</span>
                          <span className={`tl-outcome ${t.outcome === 'tp' ? 'bull' : 'bear'}`}>
                            {t.outcome === 'tp' ? 'TP ✓' : t.outcome === 'sl' ? 'SL ✗' : 'X'}
                            {' '}<span className={`tl-pnl ${pnl >= 0 ? 'bull' : 'bear'}`}>{pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}%</span>
                          </span>
                          <button className="tl-review-btn" onClick={() => enterTradeReview(i)}>Review</button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              {Object.keys(notes).length > 0 && (
                <div className="modal-notes-summary">
                  <div className="modal-section-title">Notes</div>
                  {Object.entries(notes).map(([idx, text]) => (
                    <div key={idx} className="modal-note-item">
                      <span className="modal-note-bar">Bar {+idx + 1}</span>
                      <span className="modal-note-text">{text}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </>
  );
}
