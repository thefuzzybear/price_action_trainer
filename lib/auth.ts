// Shared auth utilities used by both the trainer and the dashboard.
// All token storage uses localStorage keys prefixed with "pat_".

export type AuthUser = { id: string; email: string };

export const TOKEN_KEY   = 'pat_token';
export const REFRESH_KEY = 'pat_refresh';
export const USER_KEY    = 'pat_user';

export function getToken():   string | null { return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY)   : null; }
export function getRefresh(): string | null { return typeof window !== 'undefined' ? localStorage.getItem(REFRESH_KEY) : null; }
export function getUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); } catch { return null; }
}

export function saveAuth(user: AuthUser, accessToken: string, refreshToken?: string) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(USER_KEY,  JSON.stringify(user));
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

// Attempt a silent token refresh. Returns the new access token on success,
// or null if the refresh token is missing or has also expired.
async function tryRefresh(): Promise<string | null> {
  const refreshToken = getRefresh();
  if (!refreshToken) return null;
  try {
    const res  = await fetch('/api/auth/refresh', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) {
      // Refresh token is invalid or expired — clear everything so the
      // UI shows the auth gate rather than looping on 401.
      clearAuth();
      return null;
    }
    const data = await res.json();
    saveAuth(data.user, data.access_token, data.refresh_token);
    return data.access_token as string;
  } catch {
    return null;
  }
}

// apiFetch with automatic 401 → refresh → retry behaviour.
// On the first 401, attempts a silent refresh and retries once.
// If the retry also fails (refresh expired), clears auth and throws.
export async function apiFetch(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<any> {
  const makeHeaders = (tok: string | null | undefined) => {
    const h: Record<string, string> = { 'Content-Type': 'application/json' };
    if (tok) h['Authorization'] = `Bearer ${tok}`;
    return h;
  };

  const tok = token ?? getToken();
  const res = await fetch(path, { headers: makeHeaders(tok), ...options });

  // Happy path
  if (res.ok) return res.json();

  // On 401, try refreshing the token once then retry
  if (res.status === 401) {
    const newToken = await tryRefresh();
    if (newToken) {
      const retry = await fetch(path, { headers: makeHeaders(newToken), ...options });
      const json  = await retry.json();
      if (!retry.ok) throw new Error(json.error || `HTTP ${retry.status}`);
      return json;
    }
    // Refresh failed — surface a clear error so the UI can show the auth gate
    throw new Error('Session expired. Please sign in again.');
  }

  const json = await res.json();
  throw new Error(json.error || `HTTP ${res.status}`);
}
