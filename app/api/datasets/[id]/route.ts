import { NextResponse } from 'next/server';
import { anonClient, userClient, getBearerToken, CORS_HEADERS } from '@/lib/supabase';

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const jwt    = getBearerToken(req);
  const client = jwt ? userClient(jwt) : anonClient();

  const { data, error } = await client
    .from('datasets')
    .select('id, symbol, interval, label, bars')
    .eq('id', id)
    .single();

  if (error) {
    const status = error.code === 'PGRST116' ? 404 : 500;
    return NextResponse.json({ error: error.message }, { status, headers: CORS_HEADERS });
  }
  return NextResponse.json({ dataset: data }, { headers: CORS_HEADERS });
}
