// POST /api/sessions/[id]  — upsert session state for dataset [id]
// Requires valid JWT (authenticated users only).
// Rate-limited to 1 write per 2 seconds per user (checked via X-RateLimit header pattern).

import { supabaseUser, getBearerToken, corsPrelight } from '../_supabase.js';

// In-memory rate limiter (per cold-start instance — good enough for Vercel serverless)
const _lastWrite = new Map();
const RATE_MS    = 2000;

export default async function handler(req, res) {
  corsPrelight(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  const jwt = getBearerToken(req);
  if (!jwt) return res.status(401).json({ error: 'Authentication required' });

  const client     = supabaseUser(jwt);
  const { id: datasetId } = req.query;
  if (!datasetId) return res.status(400).json({ error: 'Missing dataset id' });

  // Verify the JWT and get user id
  const { data: { user }, error: userErr } = await client.auth.getUser();
  if (userErr || !user) return res.status(401).json({ error: 'Invalid token' });

  // ── GET ──────────────────────────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await client
      .from('sessions')
      .select('*')
      .eq('user_id', user.id)
      .eq('dataset_id', datasetId)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!data)  return res.status(200).json({ exists: false });

    return res.status(200).json({ exists: true, session: data });
  }

  // ── POST ─────────────────────────────────────────────────────────────────────
  if (req.method === 'POST') {
    // Rate limit: max 1 write per RATE_MS per user
    const now  = Date.now();
    const last = _lastWrite.get(user.id) || 0;
    if (now - last < RATE_MS) {
      return res.status(429).json({ error: 'Too many requests — slow down' });
    }
    _lastWrite.set(user.id, now);
    const body = req.body || {};
    const { visible_n, prediction_results, resolved_trades, notes, active_trade } = body;

    const { error } = await client
      .from('sessions')
      .upsert({
        user_id:            user.id,
        dataset_id:         datasetId,
        visible_n:          visible_n          ?? 50,
        prediction_results: prediction_results ?? [],
        resolved_trades:    resolved_trades    ?? [],
        notes:              notes              ?? {},
        active_trade:       active_trade       ?? null,
        saved_at:           new Date().toISOString(),
      }, { onConflict: 'user_id,dataset_id' });

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
