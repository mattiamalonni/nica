export type { CreateNextAuthParams } from "./auth";
export { createSession } from "./session";
export type { SessionConfig, SessionContext, SessionMethods } from "./session";

import type { SessionPayload } from "nica";
import { NicaError } from "nica";
import { SessionContextProvider } from "nica-react";
import type { CreateNextAuthParams } from "./auth";
import { createNicaNextCore } from "./auth";

export function build<T extends object>(params: CreateNextAuthParams<T>) {
  const core = createNicaNextCore<T>(params);

  async function SessionProvider({ children }: React.PropsWithChildren) {
    let data: SessionPayload<T> | undefined;
    try {
      data = await core.session.get();
    } catch (err) {
      if (!(err instanceof NicaError)) throw err;
      data = undefined;
    }

    async function refreshSession(): Promise<SessionPayload<Record<string, unknown>> | undefined> {
      "use server";
      try {
        return (await core.session.get()) as SessionPayload<Record<string, unknown>> | undefined;
      } catch {
        return undefined;
      }
    }

    async function deleteSession(): Promise<void> {
      "use server";
      await core.session.destroy();
    }

    return (
      <SessionContextProvider
        value={{
          data: data as SessionPayload<Record<string, unknown>> | undefined,
          isLoading: false,
          refreshSession,
          deleteSession,
        }}
      >
        {children}
      </SessionContextProvider>
    );
  }

  return { ...core, SessionProvider };
}
