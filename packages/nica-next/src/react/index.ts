import type { ReactNode } from "react";
import type { SessionMethods, SessionPayload } from "../session";
import { SessionContextProvider, createUseSession } from "nica-react";

export * from "nica-react";

export function withServerSession<T extends object>(session: SessionMethods<T>) {
  const useSession = createUseSession<T>();

  async function SessionProvider({ children }: { children: ReactNode }) {
    let data: SessionPayload<T> | undefined;
    try {
      data = await session.get();
    } catch {
      data = undefined;
    }
    return <SessionContextProvider value={data as SessionPayload<Record<string, unknown>> | undefined}>{children}</SessionContextProvider>;
  }

  return { SessionProvider, useSession };
}

