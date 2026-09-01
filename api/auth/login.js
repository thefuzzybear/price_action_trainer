// POST /api/auth/login
// Body: { email, password }
// Returns access_token + refresh_token.

import { supabaseAnon, corsPrelight } from '../_supabase.js';

export default async function handler(req, res) {
  corsPrelight(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: 'email and password required' });

  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (error) return res.status(401).json({ error: error.message });

  return res.status(200).json({
    user:          data.user,
    access_token:  data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
}
