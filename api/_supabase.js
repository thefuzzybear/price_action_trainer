// Shared Supabase client factory for Vercel API functions.
// Uses the SERVICE ROLE key server-side for admin operations.
// Uses the PUBLISHABLE key for user-scoped operations (respects RLS).

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL        = process.env.SUPABASE_URL;
const PUBLISHABLE_KEY     = process.env.SUPABASE_PUBLISHABLE_KEY;
const SERVICE_ROLE_KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !PUBLISHABLE_KEY || !SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing env vars: SUPABASE_URL / SUPABASE_PUBLISHABLE_KEY / SUPABASE_SERVICE_ROLE_KEY'
  );
}

// Service-role client — bypasses RLS. Only used server-side.
export const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

// Publishable-key client — respects RLS. Safe for anonymous access.
export const supabaseAnon = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
  auth: { persistSession: false },
});

// User-scoped client — respects RLS with the user's JWT.
export function supabaseUser(jwt) {
  return createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
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

// CORS headers
export const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};

export function corsPrelight(res) {
  Object.entries(CORS).forEach(([k, v]) => res.setHeader(k, v));
}
