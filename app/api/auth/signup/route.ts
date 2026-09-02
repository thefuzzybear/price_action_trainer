import { NextResponse } from 'next/server';
import { anonClient, CORS_HEADERS } from '@/lib/supabase';

export async function OPTIONS() { return new NextResponse(null, { status: 200, headers: CORS_HEADERS }); }

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) return NextResponse.json({ error: 'email and password required' }, { status: 400 });
  if (password.length < 8)  return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });

  const { data, error } = await anonClient().auth.signUp({ email, password });
  if (error) return NextResponse.json({ error: error.message }, { status: 400, headers: CORS_HEADERS });

  return NextResponse.json({
    user:          data.user,
    access_token:  data.session?.access_token  ?? null,
    refresh_token: data.session?.refresh_token ?? null,
  }, { headers: CORS_HEADERS });
}
