import { NextResponse } from 'next/server';
import { userClient, getBearerToken, CORS_HEADERS } from '@/lib/supabase';

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

// In-memory rate limiter — 1 write per 2s per user per serverless instance
const lastWrite = new Map<string, number>();
const RATE_MS   = 2000;

type Params = { params: Promise<{ id: string }> };

export async function GET(req: Request, { params }: Params) {
  const { id: datasetId } = await params;
  const jwt = getBearerToken(req);
  if (!jwt) return NextResponse.json({ error: 'Auth required' }, { status: 401, headers: CORS_HEADERS });

  const client = userClient(jwt);
  const { data: { user }, error: uErr } = await client.auth.getUser();
  if (uErr || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: CORS_HEADERS });

  const { data, error } = await client
    .from('sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('dataset_id', datasetId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  if (!data)  return NextResponse.json({ exists: false }, { headers: CORS_HEADERS });
  return NextResponse.json({ exists: true, session: data }, { headers: CORS_HEADERS });
}

export async function POST(req: Request, { params }: Params) {
  const { id: datasetId } = await params;
  const jwt = getBearerToken(req);
  if (!jwt) return NextResponse.json({ error: 'Auth required' }, { status: 401, headers: CORS_HEADERS });

  const client = userClient(jwt);
  const { data: { user }, error: uErr } = await client.auth.getUser();
  if (uErr || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: CORS_HEADERS });

  // Rate limit
  const now  = Date.now();
  const last = lastWrite.get(user.id) ?? 0;
  if (now - last < RATE_MS) return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: CORS_HEADERS });
  lastWrite.set(user.id, now);

  const body = await req.json();
  const { visible_n, prediction_results, resolved_trades, notes, active_trade } = body;

  const { error } = await client.from('sessions').upsert({
    user_id: user.id, dataset_id: datasetId,
    visible_n:          visible_n          ?? 50,
    prediction_results: prediction_results ?? [],
    resolved_trades:    resolved_trades    ?? [],
    notes:              notes              ?? {},
    active_trade:       active_trade       ?? null,
    saved_at:           new Date().toISOString(),
  }, { onConflict: 'user_id,dataset_id' });

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  return NextResponse.json({ ok: true }, { headers: CORS_HEADERS });
}
