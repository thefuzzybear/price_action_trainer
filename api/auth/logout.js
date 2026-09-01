// POST /api/auth/logout — invalidates the session server-side
import { supabaseUser, getBearerToken, corsPrelight } from '../_supabase.js';

export default async function handler(req, res) {
  corsPrelight(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const jwt = getBearerToken(req);
  if (jwt) {
    const client = supabaseUser(jwt);
    await client.auth.signOut();
  }
  return res.status(200).json({ ok: true });
}
