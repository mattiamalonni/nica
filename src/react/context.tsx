"use client";

import { createContext, ReactNode, useContext } from "react";
import type { SessionMethods } from "../next/session";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type UseSessionReturn<T extends object> = {
  session: T | undefined;
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

export interface SessionProviderProps<T extends object> {
  session: SessionMethods<T>;
  children: ReactNode;
}

export function SessionProvider<T extends object = {}>({ session, children }: SessionProviderProps<T>) {
  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>;
}

/* -------------------------------------------------------------------------- */
/*                                    Hook                                    */
/* -------------------------------------------------------------------------- */

export function useSession<T extends object = {}>(): UseSessionReturn<T> {
  const session = useContext(SessionContext) as SessionMethods<T> | undefined;

  if (!session) {
    throw new Error("useSession must be used within a SessionProvider");
  }

  // Return the session methods directly - the component using this hook
  // will need to call session.get() when needed
  return {
    session: undefined,
    loading: false,
    error: null,
  };
}
