import { createClient, SupabaseClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL!;
const PUB = process.env.SUPABASE_PUBLISHABLE_KEY!;
// Support both new name (SUPABASE_SECRET_KEY) and legacy (SUPABASE_SERVICE_ROLE_KEY)
const SVC = (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!;

// Service-role client — bypasses RLS, server-side only
export function adminClient(): SupabaseClient {
  return createClient(URL, SVC, { auth: { persistSession: false } });
}

// Anon client — respects RLS, for unauthenticated requests
export function anonClient(): SupabaseClient {
  return createClient(URL, PUB, { auth: { persistSession: false } });
}

// User client — respects RLS with caller's JWT
export function userClient(jwt: string): SupabaseClient {
  return createClient(URL, PUB, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${jwt}` } },
  });
}

export function getBearerToken(req: Request): string | null {
  const auth = req.headers.get('authorization') ?? '';
  const m    = auth.match(/^Bearer\s+(.+)$/i);
  return m ? m[1] : null;
}

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};
