export type { SessionConfig, SessionContext, SessionMethods } from "../session";

import type { SessionPayload } from "nica";
import { NicaError } from "nica";
import { SessionContextProvider } from "nica-react";
import type { SessionMethods } from "../session";

type SessionProviderProps<T extends object> = React.PropsWithChildren<{
  session: SessionMethods<T>;
}>;

export async function SessionProvider<T extends object>({ session, children }: SessionProviderProps<T>) {
  let data: SessionPayload<T> | undefined;
  try {
    data = await session.get();
  } catch (err) {
    if (!(err instanceof NicaError)) throw err;
    data = undefined;
  }

  return <SessionContextProvider value={{ data }}>{children}</SessionContextProvider>;
}
