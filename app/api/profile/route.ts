import { NextResponse } from 'next/server';
import { userClient, getBearerToken, CORS_HEADERS } from '@/lib/supabase';

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

// GET /api/profile — fetch the authenticated user's profile (or empty object if not yet created)
export async function GET(req: Request) {
  const jwt = getBearerToken(req);
  if (!jwt) return NextResponse.json({ error: 'Auth required' }, { status: 401, headers: CORS_HEADERS });

  const client = userClient(jwt);
  const { data: { user }, error: uErr } = await client.auth.getUser();
  if (uErr || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: CORS_HEADERS });

  const { data, error } = await client
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  return NextResponse.json({ profile: data ?? null }, { headers: CORS_HEADERS });
}

// PATCH /api/profile — upsert nickname, bio, avatar_initial
export async function PATCH(req: Request) {
  const jwt = getBearerToken(req);
  if (!jwt) return NextResponse.json({ error: 'Auth required' }, { status: 401, headers: CORS_HEADERS });

  const client = userClient(jwt);
  const { data: { user }, error: uErr } = await client.auth.getUser();
  if (uErr || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: CORS_HEADERS });

  const body = await req.json();
  const { nickname, bio } = body as { nickname?: string; bio?: string };

  if (nickname !== undefined && (typeof nickname !== 'string' || nickname.length > 32)) {
    return NextResponse.json({ error: 'Nickname must be 32 characters or fewer' }, { status: 400, headers: CORS_HEADERS });
  }
  if (bio !== undefined && (typeof bio !== 'string' || bio.length > 200)) {
    return NextResponse.json({ error: 'Bio must be 200 characters or fewer' }, { status: 400, headers: CORS_HEADERS });
  }

  // Derive avatar initial from nickname or email
  const initial = (nickname?.trim()?.[0] ?? user.email?.[0] ?? '?').toUpperCase();

  const { data, error } = await client.from('profiles').upsert({
    id:             user.id,
    nickname:       nickname?.trim() ?? null,
    bio:            bio?.trim() ?? null,
    avatar_initial: initial,
    updated_at:     new Date().toISOString(),
  }, { onConflict: 'id' }).select().maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });
  return NextResponse.json({ profile: data }, { headers: CORS_HEADERS });
}
