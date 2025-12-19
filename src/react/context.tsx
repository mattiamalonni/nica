"use client";

import { createContext, PropsWithChildren, useContext, useEffect, useState } from "react";
import type { SessionMethods, SessionPayload } from "../next/session";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type UseSessionReturn<T extends object> = {
  session: SessionPayload<T> | undefined;
  loading: boolean;
  error: Error | null;
};

type SessionContextType<T extends object> = SessionMethods<T> | undefined;

/* -------------------------------------------------------------------------- */
/*                              Context Creation                              */
/* -------------------------------------------------------------------------- */

const SessionContext = createContext<SessionContextType<any>>(undefined);

/* -------------------------------------------------------------------------- */
/*                                 Provider                                   */
/* -------------------------------------------------------------------------- */

export interface SessionProviderProps<T extends object> extends PropsWithChildren {
  session: SessionMethods<T>;
}

export function SessionProvider<T extends object = {}>({ session, children }: SessionProviderProps<T>) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

/* -------------------------------------------------------------------------- */
/*                                    Hook                                    */
/* -------------------------------------------------------------------------- */

export function useSession<T extends object = {}>(): UseSessionReturn<T> {
  const sessionMethods = useContext(SessionContext) as SessionMethods<T> | undefined;

  if (!sessionMethods) {
    throw new Error("useSession must be used within a SessionProvider");
  }

  const [session, setSession] = useState<SessionPayload<T> | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchSession = async () => {
      setError(null);
      try {
        const data = await sessionMethods.get();
        if (mounted) setSession(data);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error(String(err)));
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchSession();

    return () => {
      mounted = false;
    };
  }, [sessionMethods]);

  return { session, loading, error };
}
