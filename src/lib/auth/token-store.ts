import { useSyncExternalStore } from "react";

// sessionStorage: dies with the tab, never sent automatically like a cookie
const STORAGE_KEY = "companies.access_token";

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  window.sessionStorage.setItem(STORAGE_KEY, token);
  notify();
}

export function clearToken() {
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // storage unavailable: nothing to clear
  }
  notify();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useIsSignedIn(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => getToken() !== null,
    () => false,
  );
}
