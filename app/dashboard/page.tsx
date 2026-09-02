'use client';

import { useEffect, useRef, useState } from 'react';
import { apiFetch, getToken, getUser, saveAuth, clearAuth } from '@/lib/auth';
import type { AuthUser } from '@/lib/auth';

// ─── Tokens ────────────────────────────────────────────────────────────────
const C = {
  bg:          '#F5F0E8',
  surface:     '#EDE8DF',
  raised:      '#E5DECE',
  text:        '#1A1208',
  muted:       '#6B5E52',
  faint:       '#A89880',
  rule:        'rgba(42,26,10,0.12)',
  maroon:      '#6B1A2A',
  bull:        '#16a34a',
  bear:        '#dc2626',
  glassBorder: 'rgba(42,26,10,0.14)',
} as const;

const SERIF = 'Georgia,"Times New Roman",serif';
const MONO  = '"SF Mono","Fira Code",Consolas,monospace';
const SANS  = '-apple-system,BlinkMacSystemFont,"Inter",system-ui,sans-serif';

// ─── Types ─────────────────────────────────────────────────────────────────
interface Profile {
  id: string; nickname: string | null; bio: string | null;
  avatar_initial: string | null; joined_at: string;
}
interface Message {
  id: string; body: string; created_at: string; user_id: string;
  profiles: { nickname: string | null; avatar_initial: string | null } | null;
}

// ─── Utils ─────────────────────────────────────────────────────────────────
function timeAgo(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function Monogram({ letter, size = 32 }: { letter: string; size?: number }) {
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: C.maroon, color: '#F5F0E8',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: SERIF, fontSize: Math.round(size * 0.44), fontWeight: 700,
      flexShrink: 0, userSelect: 'none' as const,
    }}>
      {letter.toUpperCase()}
    </div>
  );
}

// ─── Auth gate — split-panel ────────────────────────────────────────────────
function AuthGate({ onAuth }: { onAuth: (u: AuthUser, t: string) => void }) {
  const [mode,  setMode]  = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [pass,  setPass]  = useState('');
  const [err,   setErr]   = useState('');
  const [ok,    setOk]    = useState('');
  const [busy,  setBusy]  = useState(false);

  async function submit() {
    setErr(''); setOk(''); setBusy(true);
    try {
      const d = await apiFetch(mode === 'login' ? '/api/auth/login' : '/api/auth/signup', {
        method: 'POST', body: JSON.stringify({ email, password: pass }),
      });
      if (mode === 'signup' && !d.access_token) {
        setOk('Account created — check your email to confirm, then sign in.');
        setMode('login'); return;
      }
      saveAuth(d.user, d.access_token, d.refresh_token);
      onAuth(d.user, d.access_token);
    } catch (e: any) { setErr(e.message); }
    finally { setBusy(false); }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: C.bg, fontFamily: SANS }}>
      {/* Left — context */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: '60px clamp(40px,6vw,100px)',
        background: C.surface, borderRight: `1px solid ${C.rule}`,
      }}>
        <a href="/" style={{ textDecoration: 'none', marginBottom: 48, display: 'inline-block' }}>
          <span style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 700, letterSpacing: '0.06em', color: C.maroon }}>Empyrean</span>
        </a>
        <h2 style={{ fontFamily: SERIF, fontSize: 'clamp(1.4rem,2.5vw,2rem)', fontWeight: 400, letterSpacing: '-0.02em', lineHeight: 1.25, color: C.text, marginBottom: 16 }}>
          Your workspace for learning price action
        </h2>
        <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.8, maxWidth: 380, marginBottom: 32 }}>
          A free account ties your sessions to you across devices and gives you access to the community board, leaderboard, and webinars as they open up.
        </p>
        {['Sessions saved and resumable across devices', 'Community board with other members', 'Weekly leaderboard ranked by accuracy', 'Live webinars and recordings'].map(t => (
          <div key={t} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 8 }}>
            <div style={{ width: 4, height: 4, borderRadius: '50%', background: C.maroon, marginTop: 8, flexShrink: 0 }} />
            <span style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{t}</span>
          </div>
        ))}
        <p style={{ fontSize: 12, color: C.faint, marginTop: 32 }}>
          Want to practice first?{' '}
          <a href="/app/" style={{ color: C.maroon }}>Open the trainer without an account</a> — sessions won't save.
        </p>
      </div>

      {/* Right — form */}
      <div style={{ width: 'clamp(360px,38%,460px)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 48px' }}>
        <div style={{ width: '100%' }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 400, color: C.text, marginBottom: 6, letterSpacing: '-0.01em' }}>
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p style={{ fontSize: 13, color: C.muted, marginBottom: 28 }}>
            {mode === 'login' ? 'Sign in to your workspace.' : "It's free — no credit card needed."}
          </p>

          {err && <div style={{ fontSize: 13, color: C.bear, marginBottom: 16, padding: '10px 14px', background: 'rgba(220,38,38,0.05)', borderRadius: 5, border: '1px solid rgba(220,38,38,0.18)' }}>{err}</div>}
          {ok  && <div style={{ fontSize: 13, color: C.bull, marginBottom: 16, padding: '10px 14px', background: 'rgba(22,163,74,0.05)', borderRadius: 5, border: '1px solid rgba(22,163,74,0.18)' }}>{ok}</div>}

          {[
            { label: 'Email',    type: 'email',    val: email, set: setEmail,  ph: 'you@example.com' },
            { label: 'Password', type: 'password', val: pass,  set: setPass,   ph: mode === 'signup' ? 'At least 8 characters' : '' },
          ].map(({ label, type, val, set, ph }) => (
            <div key={label} style={{ marginBottom: 14 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: C.faint, marginBottom: 6 }}>{label}</div>
              <input type={type} value={val} placeholder={ph} onChange={e => set(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') submit(); }}
                style={{ width: '100%', fontFamily: SANS, fontSize: 14, color: C.text, background: C.bg, border: `1px solid ${C.glassBorder}`, borderRadius: 5, padding: '10px 14px', outline: 'none' }} />
            </div>
          ))}

          <button onClick={submit} disabled={busy} style={{ width: '100%', padding: '11px 0', background: C.maroon, color: '#F5F0E8', fontFamily: SANS, fontSize: 14, fontWeight: 600, border: 'none', borderRadius: 5, cursor: busy ? 'not-allowed' : 'pointer', opacity: busy ? 0.7 : 1, marginTop: 6, marginBottom: 18 }}>
            {busy ? '…' : mode === 'login' ? 'Sign in' : 'Create free account'}
          </button>

          <p style={{ fontSize: 13, color: C.muted, textAlign: 'center' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setErr(''); setOk(''); }}
              style={{ background: 'none', border: 'none', color: C.maroon, fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: SANS }}>
              {mode === 'login' ? 'Create one free' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard shell ────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [user,    setUser]    = useState<AuthUser | null>(null);
  const [token,   setToken]   = useState<string | null>(null);
  const [ready,   setReady]   = useState(false);

  // Profile
  const [profile,      setProfile]      = useState<Profile | null>(null);
  const [nickname,     setNickname]     = useState('');
  const [bio,          setBio]          = useState('');
  const [savingP,      setSavingP]      = useState(false);
  const [savedP,       setSavedP]       = useState(false);
  const [errP,         setErrP]         = useState('');
  const [profileOpen,  setProfileOpen]  = useState(false);

  // Messages
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft,    setDraft]    = useState('');
  const [sending,  setSending]  = useState(false);
  const [msgErr,   setMsgErr]   = useState('');
  const [msgLoad,  setMsgLoad]  = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setUser(getUser()); setToken(getToken()); setReady(true);
  }, []);

  useEffect(() => {
    if (!token) return;
    apiFetch('/api/profile', {}, token).then(d => {
      setProfile(d.profile);
      setNickname(d.profile?.nickname ?? '');
      setBio(d.profile?.bio ?? '');
    }).catch(() => {});
    apiFetch('/api/messages?limit=80', {}, token)
      .then(d => setMessages(d.messages ?? []))
      .catch(e => setMsgErr(e.message))
      .finally(() => setMsgLoad(false));
  }, [token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  function logout() { clearAuth(); setUser(null); setToken(null); }

  async function saveProfile() {
    if (!token) return;
    setSavingP(true); setErrP(''); setSavedP(false);
    try {
      const { profile: p } = await apiFetch('/api/profile', { method: 'PATCH', body: JSON.stringify({ nickname, bio }) }, token);
      setProfile(p); setSavedP(true); setTimeout(() => setSavedP(false), 3000);
    } catch (e: any) { setErrP(e.message); }
    finally { setSavingP(false); }
  }

  async function postMessage() {
    const body = draft.trim();
    if (!body || !token) return;
    setSending(true); setMsgErr('');
    try {
      const { message: m } = await apiFetch('/api/messages', { method: 'POST', body: JSON.stringify({ body }) }, token);
      setMessages(p => [...p, m]); setDraft('');
    } catch (e: any) { setMsgErr(e.message); }
    finally { setSending(false); }
  }

  if (!ready) return null;
  if (!user || !token) return <AuthGate onAuth={(u, t) => { setUser(u); setToken(t); }} />;

  const initial     = (nickname.trim()[0] ?? user.email[0] ?? '?').toUpperCase();
  const displayName = nickname.trim() || user.email.split('@')[0];

  // ── Layout: sidebar | left-col | right-col (community) ─────────────────
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: C.bg, fontFamily: SANS }}>

      {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
      <aside style={{
        width: 200, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        background: C.surface, borderRight: `1px solid ${C.rule}`,
        overflow: 'hidden',
      }}>
        {/* Brand */}
        <div style={{ padding: '18px 18px 14px', borderBottom: `1px solid ${C.rule}` }}>
          <a href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 700, letterSpacing: '0.04em', color: C.text }}>Empyrean</span>
          </a>
        </div>

        {/* Nav */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
          <SideLabel>Workspace</SideLabel>
          <SideLink href="/app/" label="Trainer" />
          <SideLink href="/blog/" label="Blog" />

          <div style={{ height: 1, background: C.rule, margin: '10px 14px' }} />

          <SideLabel>Coming soon</SideLabel>
          {['Session history', 'Leaderboard', 'Webinars'].map(l => (
            <div key={l} style={{ padding: '6px 18px', fontSize: 12, color: C.faint }}>{l}</div>
          ))}
        </div>

        {/* User */}
        <div style={{ padding: '14px 16px', borderTop: `1px solid ${C.rule}` }}>
          <button
            onClick={() => setProfileOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, width: '100%',
              background: 'none', border: 'none', cursor: 'pointer',
              padding: '6px 0', marginBottom: 8,
            }}
          >
            <Monogram letter={initial} size={28} />
            <div style={{ minWidth: 0, textAlign: 'left' }}>
              <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: C.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: C.faint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
            </div>
          </button>
          <button onClick={logout} style={{ width: '100%', fontFamily: SANS, fontSize: 12, color: C.muted, background: 'none', border: `1px solid ${C.glassBorder}`, borderRadius: 4, padding: '5px 0', cursor: 'pointer' }}>
            Sign out
          </button>
        </div>
      </aside>

      {/* ── LEFT COLUMN — trainer + profile ─────────────────────────────── */}
      <div style={{
        width: 340, flexShrink: 0,
        display: 'flex', flexDirection: 'column',
        borderRight: `1px solid ${C.rule}`,
        overflowY: 'auto',
      }}>
        {/* Trainer card */}
        <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${C.rule}` }}>
          <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: C.faint, marginBottom: 12 }}>
            Training
          </div>
          <h2 style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 400, letterSpacing: '-0.01em', color: C.text, marginBottom: 8 }}>
            Price action trainer
          </h2>
          <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 18 }}>
            200 decisions per session, each locked before the bar reveals. Sessions auto-save — pick up where you left off.
          </p>
          <a href="/app/" style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontFamily: SANS, fontSize: 13, fontWeight: 600, background: C.maroon, color: '#F5F0E8', borderRadius: 4, padding: '8px 18px', textDecoration: 'none' }}>
            Open trainer
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M1.5 6h9M6.5 1.5L11 6l-4.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </a>
        </div>

        {/* Profile panel — inline, not a tab */}
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.rule}` }}>
          <button
            onClick={() => setProfileOpen(o => !o)}
            style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0,
            }}
          >
            <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: C.faint }}>
              Profile
            </span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: C.faint }}>{profileOpen ? '−' : '+'}</span>
          </button>

          {profileOpen && (
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <Monogram letter={initial} size={36} />
                <div>
                  <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 600, color: C.text }}>{displayName}</div>
                  {profile?.joined_at && (
                    <div style={{ fontFamily: MONO, fontSize: 10, color: C.faint }}>
                      Since {new Date(profile.joined_at).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: C.faint, marginBottom: 5 }}>Nickname</div>
                <input value={nickname} maxLength={32} onChange={e => setNickname(e.target.value)}
                  placeholder="Your name in the community"
                  style={{ width: '100%', fontFamily: SANS, fontSize: 13, color: C.text, background: C.bg, border: `1px solid ${C.glassBorder}`, borderRadius: 4, padding: '8px 12px', outline: 'none' }} />
              </div>

              <div>
                <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: C.faint, marginBottom: 5 }}>Bio <span style={{ fontWeight: 400, textTransform: 'none' as const }}>(optional)</span></div>
                <textarea value={bio} maxLength={200} rows={2} onChange={e => setBio(e.target.value)}
                  placeholder="One line about what you're working on"
                  style={{ width: '100%', resize: 'none', fontFamily: SANS, fontSize: 13, color: C.text, background: C.bg, border: `1px solid ${C.glassBorder}`, borderRadius: 4, padding: '8px 12px', outline: 'none', lineHeight: 1.5 }} />
              </div>

              {errP  && <p style={{ fontSize: 12, color: C.bear, margin: 0 }}>{errP}</p>}
              {savedP && <p style={{ fontSize: 12, color: C.bull, margin: 0 }}>Saved.</p>}

              <button onClick={saveProfile} disabled={savingP}
                style={{ alignSelf: 'flex-start', fontFamily: SANS, fontSize: 13, fontWeight: 600, background: C.maroon, color: '#F5F0E8', border: 'none', borderRadius: 4, padding: '8px 20px', cursor: savingP ? 'not-allowed' : 'pointer', opacity: savingP ? 0.7 : 1 }}>
                {savingP ? 'Saving…' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {/* Coming soon — compact list */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: C.faint, marginBottom: 12 }}>
            Coming soon
          </div>
          {[
            { label: 'Session history',    desc: 'Accuracy trends across all sessions' },
            { label: 'Leaderboard',        desc: 'Weekly ranking by directional accuracy' },
            { label: 'Webinars',           desc: 'Live sessions and recordings' },
          ].map(({ label, desc }) => (
            <div key={label} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: `1px solid ${C.rule}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 2 }}>{label}</div>
              <div style={{ fontSize: 11, color: C.faint, lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT COLUMN — community board (full height) ─────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

        {/* Header */}
        <div style={{
          padding: '14px 24px', borderBottom: `1px solid ${C.rule}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: C.surface, flexShrink: 0,
        }}>
          <div>
            <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.14em', color: C.faint }}>
              Community board
            </span>
          </div>
          <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint }}>
            {messages.length} posts
          </span>
        </div>

        {/* Messages scroll area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0' }}>
          {msgLoad && (
            <p style={{ fontFamily: MONO, fontSize: 11, color: C.faint, padding: '24px 24px' }}>Loading…</p>
          )}
          {!msgLoad && messages.length === 0 && (
            <div style={{ padding: '60px 24px', textAlign: 'center' }}>
              <p style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 400, color: C.text, marginBottom: 6 }}>Nothing here yet</p>
              <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.65, maxWidth: 320, margin: '0 auto' }}>
                Post something below — introduce yourself, share a session result, or ask a question.
              </p>
            </div>
          )}
          {messages.map((msg, i) => {
            const isOwn = msg.user_id === user.id;
            const name  = msg.profiles?.nickname ?? 'Anonymous';
            const init  = (msg.profiles?.avatar_initial ?? msg.profiles?.nickname?.[0] ?? '?').toUpperCase();
            return (
              <div key={msg.id} style={{
                display: 'grid', gridTemplateColumns: '36px 1fr',
                gap: 12, padding: '14px 24px',
                borderBottom: `1px solid ${C.rule}`,
                background: isOwn ? 'rgba(107,26,42,0.03)' : 'transparent',
              }}>
                <Monogram letter={init} size={32} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: isOwn ? C.maroon : C.text }}>
                      {isOwn ? 'You' : name}
                    </span>
                    <span style={{ fontFamily: MONO, fontSize: 10, color: C.faint }}>{timeAgo(msg.created_at)}</span>
                  </div>
                  <p style={{ fontSize: 14, color: C.text, lineHeight: 1.65, margin: 0, wordBreak: 'break-word' as const }}>
                    {msg.body}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Compose — pinned to bottom */}
        <div style={{ borderTop: `1px solid ${C.rule}`, background: C.surface, flexShrink: 0 }}>
          {msgErr && (
            <div style={{ fontSize: 12, color: C.bear, padding: '8px 24px', borderBottom: `1px solid ${C.rule}` }}>{msgErr}</div>
          )}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, padding: '12px 20px' }}>
            <Monogram letter={initial} size={28} />
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); postMessage(); } }}
              placeholder="Post to the community… (Enter to send)"
              rows={2}
              style={{
                flex: 1, resize: 'none',
                fontFamily: SANS, fontSize: 13, color: C.text,
                background: C.bg, border: `1px solid ${C.glassBorder}`,
                borderRadius: 5, padding: '9px 12px', outline: 'none', lineHeight: 1.5,
              }}
            />
            <button
              onClick={postMessage}
              disabled={sending || !draft.trim()}
              style={{
                fontFamily: SANS, fontSize: 13, fontWeight: 600,
                background: C.maroon, color: '#F5F0E8',
                border: 'none', borderRadius: 5, padding: '9px 20px',
                cursor: sending || !draft.trim() ? 'not-allowed' : 'pointer',
                opacity: sending || !draft.trim() ? 0.55 : 1,
                flexShrink: 0, alignSelf: 'flex-end',
              }}
            >
              {sending ? '…' : 'Post'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar helpers ──────────────────────────────────────────────────────
function SideLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ padding: '6px 18px 6px', fontFamily: '"SF Mono","Fira Code",Consolas,monospace', fontSize: 9, fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: '#A89880' }}>
      {children}
    </div>
  );
}
function SideLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} style={{ display: 'block', padding: '7px 18px', fontSize: 13, color: '#6B5E52', textDecoration: 'none', borderLeft: '2px solid transparent' }}>
      {label}
    </a>
  );
}
