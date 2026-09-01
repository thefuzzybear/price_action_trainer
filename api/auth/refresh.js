// POST /api/auth/refresh
// Body: { refresh_token }
// Returns a new access_token + refresh_token pair.

import { supabaseAnon, corsPrelight } from '../_supabase.js';

export default async function handler(req, res) {
  corsPrelight(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { refresh_token } = req.body || {};
  if (!refresh_token) return res.status(400).json({ error: 'refresh_token required' });

  const { data, error } = await supabaseAnon.auth.refreshSession({ refresh_token });
  if (error || !data.session) return res.status(401).json({ error: error?.message || 'Refresh failed' });

  return res.status(200).json({
    access_token:  data.session.access_token,
    refresh_token: data.session.refresh_token,
    user:          data.user,
  });
}
