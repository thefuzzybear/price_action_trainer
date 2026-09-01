// GET /api/datasets
// Returns list of available datasets for the current user.
// Authenticated users see all datasets; anonymous users see only is_public=true.

import { supabaseUser, supabaseAnon, getBearerToken, corsPrelight } from '../_supabase.js';

export default async function handler(req, res) {
  corsPrelight(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const jwt    = getBearerToken(req);
  const client = jwt ? supabaseUser(jwt) : supabaseAnon;

  const { data, error } = await client
    .from('datasets')
    .select('id, symbol, interval, period_start, period_end, label, bar_count, is_public, created_at')
    .order('symbol')
    .order('period_start');

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ datasets: data });
}
