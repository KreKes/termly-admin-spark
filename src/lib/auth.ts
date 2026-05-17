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

const listeners = new Set<() => void>();ID
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
  return window.localStorage.getItem(TOKEN_KEY);
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

  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    const message =
      payload?.error ||
      payload?.detail ||
      payload?.message ||
      (typeof payload === "object" && payload
        ? Object.values(payload).flat().join(" ")
        : null) ||
      `Login failed (${res.status})`;
    throw new Error(typeof message === "string" ? message : "Login failed");
  }

  const user = payload?.user ?? {};
  const token = payload?.access ?? payload?.access_token ?? payload?.token ?? payload?.key;
  const refresh = payload?.refresh ?? payload?.refresh_token;

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
  const token = getToken();
  const headers = new Headers(init.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (
    init.body &&
    !headers.has("Content-Type") &&
    !(typeof FormData !== "undefined" && init.body instanceof FormData)
  ) {
    headers.set("Content-Type", "application/json");
  }
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  const res = await fetch(url, { ...init, headers });
  if (res.status === 401) {
    setSession(null);
  }
  return res;
}
