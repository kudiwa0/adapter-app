"use client";

import type { AuthSession } from "./types";

const SESSION_KEY = "adapter-admin-session";

export function getStoredSession(): AuthSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(SESSION_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    window.localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

export function storeSession(session: AuthSession) {
  window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
}

export function authHeaders() {
  const session = getStoredSession();

  if (!session?.access) {
    return {};
  }

  return {
    Authorization: `Bearer ${session.access}`,
  };
}
