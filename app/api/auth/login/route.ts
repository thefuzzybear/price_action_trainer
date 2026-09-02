import { NextResponse } from 'next/server';
import { anonClient, CORS_HEADERS } from '@/lib/supabase';

export async function OPTIONS() { return new NextResponse(null, { status: 200, headers: CORS_HEADERS }); }

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: 'email and password required' }, { status: 400 });

  const { data, error } = await anonClient().auth.signInWithPassword({ email, password });
  if (error) return NextResponse.json({ error: error.message }, { status: 401, headers: CORS_HEADERS });

  return NextResponse.json({
    user:          data.user,
    access_token:  data.session!.access_token,
    refresh_token: data.session!.refresh_token,
  }, { headers: CORS_HEADERS });
}
