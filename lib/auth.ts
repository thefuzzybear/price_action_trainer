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
  localStorage.setItem(TOKEN_KEY,  accessToken);
  localStorage.setItem(USER_KEY,   JSON.stringify(user));
  if (refreshToken) localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function apiFetch(
  path: string,
  options: RequestInit = {},
  token?: string | null,
): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const tok = token ?? getToken();
  if (tok) headers['Authorization'] = `Bearer ${tok}`;
  const res  = await fetch(path, { headers, ...options });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
  return json;
}
