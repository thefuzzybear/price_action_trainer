// Shared Supabase client factory for API functions.
// Uses the SERVICE ROLE key so functions can read all datasets regardless of RLS.
// User-scoped operations pass the user's JWT to create an authed client.

import { createClient } from '@supabase/supabase-js';

const URL  = process.env.SUPABASE_URL;
const ANON = process.env.SUPABASE_ANON_KEY;
const SVC  = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!URL || !ANON || !SVC) {
  throw new Error('Missing SUPABASE_URL / SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY env vars');
}

// Service-role client — bypasses RLS. Use only server-side.
export const supabaseAdmin = createClient(URL, SVC, {
  auth: { persistSession: false },
});

// Anon client — respects RLS.
export const supabaseAnon = createClient(URL, ANON, {
  auth: { persistSession: false },
});

// User-scoped client — respects RLS with the user's JWT.
export function supabaseUser(jwt) {
  return createClient(URL, ANON, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}

// Extract Bearer token from Authorization header.
export function getBearerToken(req) {
  const header = req.headers['authorization'] || '';
  const match  = header.match(/^Bearer\s+(.+)$/i);
  return match ? match[1] : null;
}

// CORS headers — allow the Vercel frontend origin.
export const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

export function corsPrelight(res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
}
