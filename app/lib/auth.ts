"use client";

import type { AuthSession } from "./types";

const SESSION_KEY = "adapter-admin-session";

type Listener = () => void;
const listeners = new Set<Listener>();

function notifyListeners() {
  listeners.forEach((fn) => fn());
}

let cachedRaw: string | null = null;
let cachedSession: AuthSession | null = null;

function readSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);

  if (raw === cachedRaw) {
    return cachedSession;
  }

  cachedRaw = raw;

  if (!raw) {
    cachedSession = null;
    return null;
  }

  try {
    cachedSession = JSON.parse(raw) as AuthSession;
    return cachedSession;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    cachedRaw = null;
    cachedSession = null;
    return null;
  }
}

export function getStoredSession(): AuthSession | null {
  const session = readSession();
  if (session) {
    console.log("✅ Session retrieved from localStorage:", session.user?.username);
  } else {
    console.log("❌ No session found in localStorage");
  }
  return session;
}

export function storeSession(session: AuthSession) {
  try {
    const sessionStr = JSON.stringify(session);
    window.localStorage.setItem(SESSION_KEY, sessionStr);
    console.log("✅ Session saved to localStorage:", session.user?.username);
    cachedRaw = sessionStr;
    cachedSession = session;
    notifyListeners();
  } catch (error) {
    console.error("❌ Failed to save session:", error);
  }
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
  cachedRaw = null;
  cachedSession = null;
  notifyListeners();
}

export function subscribeToSessionStore(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

export function authHeaders(): Record<string, string> {
  const session = getStoredSession();
  if (session?.token) {
    return {
      Authorization: `Token ${session.token}`,
    };
  }
  return {};
}
