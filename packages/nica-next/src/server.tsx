export type { CreateNicaNextParams } from "./auth";
export type { SessionConfig, SessionContext, SessionMethods } from "./session";

import type { SessionPayload } from "nica";
import { NicaError } from "nica";
import { SessionContextProvider } from "nica-react";
import type { CreateNicaNextParams } from "./auth";
import { createNicaNextCore } from "./auth";

const globalSymbol = Symbol.for("nica-next");

function buildNicaNextInstance<T extends object>(params: CreateNicaNextParams<T>) {
  const core = createNicaNextCore<T>(params);
  const { session } = params;

  async function SessionProvider({ children }: React.PropsWithChildren) {
    let data: SessionPayload<T> | undefined;
    try {
      data = await session.get();
    } catch (err) {
      if (!(err instanceof NicaError)) throw err;
      data = undefined;
    }

    return <SessionContextProvider value={{ data }}>{children}</SessionContextProvider>;
  }

  return { ...core, SessionProvider };
}

export function createNicaNext<T extends object>(params: CreateNicaNextParams<T>) {
  const g = globalThis as typeof globalThis & { [key: symbol]: unknown };
  if (g[globalSymbol]) return g[globalSymbol] as ReturnType<typeof buildNicaNextInstance<T>>;

  const instance = buildNicaNextInstance<T>(params);

  // In development, persist across HMR re-evaluations
  if (process.env.NODE_ENV !== "production") g[globalSymbol] = instance;

  return instance;
}
