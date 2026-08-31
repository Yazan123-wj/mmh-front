"use client";

import { readJson, writeJson } from "@/lib/storage";
import { useCallback, useSyncExternalStore } from "react";

const listeners = new Map<string, Set<() => void>>();
const snapshotCache = new Map<string, { raw: string | null; value: unknown }>();

function emit(key: string) {
  listeners.get(key)?.forEach((listener) => listener());
}

function subscribeToKey(key: string) {
  return (onStoreChange: () => void) => {
    const set = listeners.get(key) ?? new Set<() => void>();
    set.add(onStoreChange);
    listeners.set(key, set);
    return () => {
      set.delete(onStoreChange);
    };
  };
}

function snapshotFor<T>(key: string, fallback: T): T {
  const raw = typeof window === "undefined" ? null : window.localStorage.getItem(key);
  const cached = snapshotCache.get(key);
  if (cached && cached.raw === raw) return cached.value as T;
  const value = readJson<T>(key, fallback);
  snapshotCache.set(key, { raw, value });
  return value;
}

export function persistJson<T>(key: string, value: T) {
  writeJson(key, value);
  snapshotCache.delete(key);
  emit(key);
}

export function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

export function useLocalStorage<T>(key: string, fallback: T): [T, (value: T | ((prev: T) => T)) => void] {
  const getSnapshot = () => snapshotFor<T>(key, fallback);
  const value = useSyncExternalStore(subscribeToKey(key), getSnapshot, () => fallback);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const resolved = typeof next === "function" ? (next as (prev: T) => T)(snapshotFor<T>(key, fallback)) : next;
      persistJson(key, resolved);
    },
    [key, fallback],
  );

  return [value, setValue];
}
