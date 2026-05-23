import { useSyncExternalStore } from "react";

export const API_BASE_URL = "https://web-production-20a1c.up.railway.app";
const SESSION_KEY = "termly.session";
const TOKEN_KEY = "termly.token";
const REFRESH_KEY = "termly.refresh";

export type Session = {
  user: {
    id?: number | string;
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    role?: string;
    school_name?: string;
    [key: string]: unknown;
  };
  token?: string;
  refresh?: string;
};

type LoginPayload = Record<string, unknown> & {
  access?: unknown;
  access_token?: unknown;
  token?: unknown;
  key?: unknown;
  refresh?: unknown;
  refresh_token?: unknown;
  user?: unknown;
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

const listeners = new Set<() => void>();
let cachedRaw: string | null = null;
let cachedSession: Session | null = null;

const emit = () => {
  // Invalidate cache so next getSession re-reads from storage
  cachedRaw = null;
  listeners.forEach((l) => l());
};

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    if (raw === cachedRaw) return cachedSession;
    cachedRaw = raw;
    cachedSession = raw ? (JSON.parse(raw) as Session) : null;
    return cachedSession;
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(TOKEN_KEY);
  if (token) return token;

  // Backward-compatible fallback for sessions created before termly.token existed.
  return getSession()?.token ?? null;
}

/**
 * Decode a JWT and return its `exp` claim (seconds), or null if absent/invalid.
 */
function getTokenExpiry(token: string): number | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json =
      typeof atob === "function"
        ? atob(padded)
        : Buffer.from(padded, "base64").toString("utf-8");
    const decoded = JSON.parse(json) as { exp?: unknown };
    return typeof decoded.exp === "number" ? decoded.exp : null;
  } catch {
    return null;
  }
}

export function isTokenExpired(token?: string | null): boolean {
  const t = token ?? getToken();
  if (!t) return false;
  const exp = getTokenExpiry(t);
  if (exp === null) return false;
  // 5s skew so calls don't fire right at the boundary.
  return Date.now() / 1000 >= exp - 5;
}

/**
 * Clear the session and send the user to the login page. Safe to call from
 * anywhere; no-ops on the server and avoids redirect loops on /login.
 */
export function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  setSession(null);
  if (window.location.pathname !== "/login") {
    window.location.assign("/login");
  }
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_KEY);
}

export function setSession(s: Session | null) {
  if (typeof window === "undefined") return;
  if (s) {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    if (s.token) window.localStorage.setItem(TOKEN_KEY, s.token);
    else window.localStorage.removeItem(TOKEN_KEY);
    if (s.refresh) window.localStorage.setItem(REFRESH_KEY, s.refresh);
    else window.localStorage.removeItem(REFRESH_KEY);
  } else {
    window.localStorage.removeItem(SESSION_KEY);
    window.localStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(REFRESH_KEY);
  }
  emit();
}

export function useSession(): Session | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    getSession,
    () => null,
  );
}

export async function login(username: string, password: string): Promise<Session> {
  const res = await fetch(`${API_BASE_URL}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ username, password }),
  });

  let payload: LoginPayload | null = null;
  try {
    const json = await res.json();
    payload = isRecord(json) ? json : null;
  } catch {
    // ignore
  }

  if (!res.ok) {
    const message =
      payload?.error ||
      payload?.detail ||
      payload?.message ||
      (payload ? Object.values(payload).flat().join(" ") : null) ||
      `Login failed (${res.status})`;
    throw new Error(typeof message === "string" ? message : "Login failed");
  }

  const tokenValue = payload?.access ?? payload?.access_token ?? payload?.token ?? payload?.key;
  const refreshValue = payload?.refresh ?? payload?.refresh_token;
  const token = typeof tokenValue === "string" ? tokenValue : null;
  const refresh = typeof refreshValue === "string" ? refreshValue : undefined;
  // User fields may be nested under `user` or returned at the top level.
  const {
    access,
    access_token,
    token: _t,
    key,
    refresh: _r,
    refresh_token,
    user: nestedUser,
    ...rest
  } = payload ?? {};
  const user = { ...rest, ...(isRecord(nestedUser) ? nestedUser : {}) };

  if (!token) {
    throw new Error("Login response did not include an access token.");
  }

  const session: Session = {
    user: { username, ...user },
    token,
    refresh,
  };
  setSession(session);
  return session;
}

export function logout() {
  setSession(null);
}

/**
 * Fetch wrapper that attaches the Bearer token from localStorage for
 * authenticated API calls. Accepts a path (joined to API_BASE_URL) or full URL.
 */
export async function apiFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const url = input.startsWith("http") ? input : `${API_BASE_URL}${input}`;
  const token = getToken()
    ?.replace(/^Bearer\s+/i, "")
    .trim();

  // No token — bounce to login before making the request.
  if (!token) {
    redirectToLogin();
    throw new Error("Not authenticated. Please sign in.");
  }

  // Proactively redirect if the token is expired.
  if (isTokenExpired(token)) {
    redirectToLogin();
    throw new Error("Session expired. Please sign in again.");
  }

  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (
    init.body &&
    !headers.has("Content-Type") &&
    !(typeof FormData !== "undefined" && init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(url, { ...init, headers });
  if (res.status === 401) {
    redirectToLogin();
  }
  return res;
}
