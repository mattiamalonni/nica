export { nicaNext } from "./auth";
export { createSession } from "./session";

import type { SessionPayload } from "nica-react";
import { SessionContextProvider, createUseSession } from "nica-react";
import type { ReactNode } from "react";
import type { SessionMethods } from "./session";

export function withServerSession<T extends object>(session: SessionMethods<T>) {
  const useSession = createUseSession<T>();

  async function SessionProvider({ children }: { children: ReactNode }) {
    let data: SessionPayload<T> | undefined;
    try {
      data = await session.get();
    } catch {
      data = undefined;
    }
    return <SessionContextProvider value={{ data: data as SessionPayload<Record<string, unknown>> | undefined, isLoading: false }}>{children}</SessionContextProvider>;
  }

  return { SessionProvider, useSession };
}
