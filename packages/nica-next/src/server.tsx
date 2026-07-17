export type { CreateNextAuthParams } from "./auth";
export { createSession } from "./session";
export type { SessionConfig, SessionContext, SessionMethods } from "./session";

import type { SessionPayload } from "nica";
import { SessionContextProvider, createUseSession } from "nica-react";
import type { ReactNode } from "react";
import type { CreateNextAuthParams } from "./auth";
import { createNicaNextCore } from "./auth";

export function build<T extends object>(params: CreateNextAuthParams<T>) {
  const core = createNicaNextCore<T>(params);
  const useSession = createUseSession<T>();

  async function SessionProvider({ children }: { children: ReactNode }) {
    let data: SessionPayload<T> | undefined;
    try {
      data = await core.session.get();
    } catch {
      data = undefined;
    }
    return (
      <SessionContextProvider value={{ data: data as SessionPayload<Record<string, unknown>> | undefined, isLoading: false }}>
        {children}
      </SessionContextProvider>
    );
  }

  return { ...core, SessionProvider, useSession };
}
