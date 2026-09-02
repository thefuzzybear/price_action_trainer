import { NextResponse } from 'next/server';
import { anonClient, CORS_HEADERS } from '@/lib/supabase';

export async function OPTIONS() { return new NextResponse(null, { status: 200, headers: CORS_HEADERS }); }

export async function POST(req: Request) {
  const { refresh_token } = await req.json();
  if (!refresh_token) return NextResponse.json({ error: 'refresh_token required' }, { status: 400 });

  const { data, error } = await anonClient().auth.refreshSession({ refresh_token });
  if (error || !data.session) return NextResponse.json({ error: error?.message ?? 'Refresh failed' }, { status: 401, headers: CORS_HEADERS });

  return NextResponse.json({
    access_token:  data.session.access_token,
    refresh_token: data.session.refresh_token,
    user:          data.user,
  }, { headers: CORS_HEADERS });
}
