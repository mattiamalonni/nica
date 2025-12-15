"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { SessionPayload, SessionContext, AuthWithSession } from "../with-session";

export type UseSessionReturn<T = SessionPayload> = {
  session: T | undefined;
  loading: boolean;
  error: Error | null;
};

export type UseAuthReturn = {
  signIn: (provider: string) => Promise<void>;
  signOut: (options?: { redirectTo?: string }) => Promise<void>;
};

export function withReact<T = SessionPayload>(auth: AuthWithSession<T>) {
  function useSession(): UseSessionReturn<T> {
    const [session, setSession] = useState<T | undefined>(undefined);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
      let mounted = true;

      const fetchSession = async () => {
        try {
          setError(null);
          const data = await auth.session.get();

          if (mounted) {
            setSession(data as T | undefined);
          }
        } catch (err) {
          if (mounted) {
            setError(err instanceof Error ? err : new Error(String(err)));
          }
        } finally {
          if (mounted) {
            setLoading(false);
          }
        }
      };

      fetchSession();

      return () => {
        mounted = false;
      };
    }, []);

    return { session, loading, error };
  }

  function useAuth() {
    const router = useRouter();
    return {
      signIn: async (provider: string) => {
        const url = auth.getAuthUrl(provider);
        router.push(url);
      },
      signOut: async (options?: { redirectTo?: string }) => {
        await auth.session.destroy();
        router.push(options?.redirectTo || "/");
      },
    };
  }

  return { useSession, useAuth };
}

export type { SessionPayload, SessionContext };
