"use client";

import { useEffect, useState } from "react";
import type { SessionMethods } from "../session";

export type UseSessionReturn<T extends object> = {
  session: T | undefined;
  loading: boolean;
  error: Error | null;
};

export function withReactSession<T extends object = {}>(session: SessionMethods<T>) {
  function useSession(): UseSessionReturn<T> {
    const [data, setData] = useState<T | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
      let mounted = true;

      const load = async () => {
        try {
          setError(null);
          const result = await session.get();
          if (mounted) setData(result);
        } catch (err) {
          if (mounted) {
            setError(err instanceof Error ? err : new Error(String(err)));
          }
        } finally {
          if (mounted) setLoading(false);
        }
      };

      load();
      return () => {
        mounted = false;
      };
    }, []);

    return { session: data, loading, error };
  }

  return { useSession };
}
