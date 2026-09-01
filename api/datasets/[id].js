// GET /api/datasets/[id]
// Returns the full bars array for a single dataset.
// RLS enforces access: anon gets public only, authed gets all.

import { supabaseUser, supabaseAnon, getBearerToken, corsPrelight } from '../_supabase.js';

export default async function handler(req, res) {
  corsPrelight(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { id }  = req.query;
  if (!id) return res.status(400).json({ error: 'Missing dataset id' });

  const jwt    = getBearerToken(req);
  const client = jwt ? supabaseUser(jwt) : supabaseAnon;

  const { data, error } = await client
    .from('datasets')
    .select('id, symbol, interval, label, bars')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return res.status(404).json({ error: 'Dataset not found' });
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ dataset: data });
}
