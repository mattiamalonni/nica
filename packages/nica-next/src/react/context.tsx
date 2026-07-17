"use client";

import type { ReactNode } from "react";
import { createContext, useContext } from "react";
import type { SessionPayload } from "../session";

const NO_PROVIDER = Symbol("nica.no_provider");

const SessionContext = createContext<SessionPayload<Record<string, unknown>> | undefined | typeof NO_PROVIDER>(NO_PROVIDER);

export function SessionContextProvider({
  value,
  children,
}: {
  value: SessionPayload<Record<string, unknown>> | undefined;
  children: ReactNode;
}) {
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function createUseSession<T extends object>() {
  return function useSession(): { session: SessionPayload<T> | undefined } {
    const value = useContext(SessionContext);
    if (value === NO_PROVIDER) {
      throw new Error(
        "[nica-next] useSession() must be called inside <SessionProvider>. Add <SessionProvider> to your root layout.",
      );
    }
    return { session: value as SessionPayload<T> | undefined };
  };
}
