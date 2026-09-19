"use client";

import { ApiError } from "@/lib/api/client";
import { useAdminToken } from "@/hooks/use-admin-token";
import { useEffect, useRef, useState } from "react";

/** Load a single admin resource; yields before setState to satisfy effect lint rules. */
export function useAdminQuery<T>(loader: (token: string) => Promise<T>, deps: unknown[] = []) {
  const token = useAdminToken();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const loaderRef = useRef(loader);
  const depsKey = JSON.stringify(deps);

  useEffect(() => {
    loaderRef.current = loader;
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!token) {
        await Promise.resolve();
        if (cancelled) return;
        setData(null);
        setError("Missing admin session token. Sign in again.");
        setLoading(false);
        return;
      }
      await Promise.resolve();
      if (cancelled) return;
      setLoading(true);
      setError(null);
      try {
        const result = await loaderRef.current(token);
        if (cancelled) return;
        setData(result);
      } catch (err) {
        if (cancelled) return;
        setData(null);
        setError(err instanceof ApiError ? err.message : err instanceof Error ? err.message : "Failed to load");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // depsKey captures serialized deps; reloadTick forces refresh
  }, [token, depsKey, reloadTick]);

  return {
    token,
    data,
    setData,
    loading,
    error,
    reload: () => setReloadTick((n) => n + 1),
  };
}
