import { NextResponse } from 'next/server';
import { userClient, adminClient, getBearerToken, CORS_HEADERS } from '@/lib/supabase';

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: CORS_HEADERS });
}

// Attach profile data to each message.
// We do this manually rather than via a Supabase relational join because
// messages.user_id → auth.users, not profiles — so the schema cache can't
// auto-follow the relationship.
async function attachProfiles(
  messages: { id: string; body: string; created_at: string; user_id: string }[],
) {
  if (messages.length === 0) return messages;

  const userIds = [...new Set(messages.map(m => m.user_id))];
  // Use adminClient so we can read profiles regardless of RLS for user_id list
  const { data: profiles } = await adminClient()
    .from('profiles')
    .select('id, nickname, avatar_initial')
    .in('id', userIds);

  const profileMap = Object.fromEntries(
    (profiles ?? []).map(p => [p.id, { nickname: p.nickname, avatar_initial: p.avatar_initial }]),
  );

  return messages.map(m => ({
    ...m,
    profiles: profileMap[m.user_id] ?? { nickname: null, avatar_initial: null },
  }));
}

// GET /api/messages?limit=40&before=<iso-timestamp>
export async function GET(req: Request) {
  const jwt = getBearerToken(req);
  if (!jwt) return NextResponse.json({ error: 'Auth required' }, { status: 401, headers: CORS_HEADERS });

  const client = userClient(jwt);
  const { data: { user }, error: uErr } = await client.auth.getUser();
  if (uErr || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: CORS_HEADERS });

  const url    = new URL(req.url);
  const limit  = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') ?? '40')));
  const before = url.searchParams.get('before');

  let query = client
    .from('messages')
    .select('id, body, created_at, user_id')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (before) query = query.lt('created_at', before);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });

  const enriched = await attachProfiles(data ?? []);
  // Return oldest-first so the chat renders chronologically
  return NextResponse.json({ messages: enriched.reverse() }, { headers: CORS_HEADERS });
}

// POST /api/messages
export async function POST(req: Request) {
  const jwt = getBearerToken(req);
  if (!jwt) return NextResponse.json({ error: 'Auth required' }, { status: 401, headers: CORS_HEADERS });

  const client = userClient(jwt);
  const { data: { user }, error: uErr } = await client.auth.getUser();
  if (uErr || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401, headers: CORS_HEADERS });

  const { body: msgBody } = await req.json() as { body?: string };
  if (!msgBody || msgBody.trim().length === 0)
    return NextResponse.json({ error: 'Message cannot be empty' }, { status: 400, headers: CORS_HEADERS });
  if (msgBody.length > 2000)
    return NextResponse.json({ error: 'Message too long (2000 chars max)' }, { status: 400, headers: CORS_HEADERS });

  const { data: msg, error } = await client
    .from('messages')
    .insert({ user_id: user.id, body: msgBody.trim() })
    .select('id, body, created_at, user_id')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS_HEADERS });

  // Fetch the poster's profile so the client has display name immediately
  const [enriched] = await attachProfiles([msg]);
  return NextResponse.json({ message: enriched }, { status: 201, headers: CORS_HEADERS });
}
