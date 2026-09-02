import { NextResponse } from 'next/server';
import { anonClient, userClient, getBearerToken, CORS_HEADERS } from '@/lib/supabase';

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function GET(req: Request) {
  const jwt    = getBearerToken(req);
  const client = jwt ? userClient(jwt) : anonClient();

  const { data, error } = await client
    .from('datasets')
    .select('id, symbol, interval, period_start, period_end, label, bar_count, is_public, created_at')
    .order('symbol')
    .order('period_start');

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  return NextResponse.json({ datasets: data }, { headers: CORS_HEADERS });
}
