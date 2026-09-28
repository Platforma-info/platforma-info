"use client";

import { useMemo, useSyncExternalStore } from "react";

/**
 * Reading progress is kept in localStorage (per browser) so the theory section
 * works for anonymous visitors too. The value is a comma-separated list of
 * "track/slug" ids; the raw string is the snapshot so it is referentially stable.
 */
const KEY = "pyinfo:theory:completed";
const listeners = new Set<() => void>();

function read(): string {
  try {
    return window.localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  window.addEventListener("storage", callback);
  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", callback);
  };
}

export function useCompleted(): Set<string> {
  const raw = useSyncExternalStore(subscribe, read, () => "");
  return useMemo(() => new Set(raw ? raw.split(",") : []), [raw]);
}

export function toggleCompleted(id: string) {
  const set = new Set(read() ? read().split(",") : []);
  if (set.has(id)) set.delete(id);
  else set.add(id);
  try {
    window.localStorage.setItem(KEY, [...set].join(","));
  } catch {
    // storage unavailable (private mode / quota): progress just isn't saved
  }
  listeners.forEach((l) => l());
}
