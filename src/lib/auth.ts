import { useSyncExternalStore } from "react";

export const API_BASE_URL = "https://web-production-20a1c.up.railway.app";
const STORAGE_KEY = "termly.session";

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
};

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export function getSession(): Session | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function setSession(s: Session | null) {
  if (typeof window === "undefined") return;
  if (s) window.localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  else window.localStorage.removeItem(STORAGE_KEY);
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

  const user = payload?.user ?? payload;
  const token = payload?.token ?? payload?.access ?? payload?.key;
  const session: Session = { user: { username, ...user }, token };
  setSession(session);
  return session;
}

export function logout() {
  setSession(null);
}
