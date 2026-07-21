"use client";

import type { SessionPayload } from "nica";
import type { ReactNode } from "react";
import { createContext, useContext } from "react";

type SessionContextData = {
  data: SessionPayload<Record<string, unknown>> | undefined;
  isLoading: boolean;
  refreshSession: () => Promise<SessionPayload<Record<string, unknown>> | undefined>;
  deleteSession: (() => Promise<void>) | undefined;
};

type SessionContextValue = SessionContextData | typeof NO_PROVIDER;

const NO_PROVIDER = Symbol("nica.no_provider");

const SessionContext = createContext<SessionContextValue>(NO_PROVIDER);

export function SessionContextProvider({
  value,
  children,
}: {
  value: SessionContextData;
  children: ReactNode;
}) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function createUseSession<T extends object>() {
  return function useSession(): {
    session: SessionPayload<T> | undefined;
    isLoading: boolean;
    refreshSession: () => Promise<SessionPayload<T> | undefined>;
    deleteSession: (() => Promise<void>) | undefined;
  } {
    const value = useContext(SessionContext);
    if (value === NO_PROVIDER) {
      throw new Error(
        "[nica-react] useSession() must be called inside <SessionProvider>. Add <SessionProvider> to your root layout.",
      );
    }
    return {
      session: value.data as SessionPayload<T> | undefined,
      isLoading: value.isLoading,
      refreshSession: value.refreshSession as () => Promise<SessionPayload<T> | undefined>,
      deleteSession: value.deleteSession,
    };
  };
}
