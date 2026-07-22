"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import type { SessionPayload } from "../session";

type SessionContextData = {
  data: SessionPayload<Record<string, unknown>> | undefined;
};

type SessionContextValue = SessionContextData | typeof NO_PROVIDER;

const NO_PROVIDER = Symbol("nica.no_provider");

const SessionContext = createContext<SessionContextValue>(NO_PROVIDER);

export function SessionContextProvider({ value, children }: { value: SessionContextData; children: ReactNode }) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession<T extends object = Record<string, unknown>>(): {
  session: SessionPayload<T> | undefined;
} {
  const value = useContext(SessionContext);
  if (value === NO_PROVIDER) {
    throw new Error("[nica-next] useSession() must be called inside <SessionProvider>. Add <SessionProvider> to your root layout.");
  }
  return {
    session: value.data as SessionPayload<T> | undefined,
  };
}
