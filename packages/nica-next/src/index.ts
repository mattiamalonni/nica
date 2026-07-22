export { createNica } from "nica";
export type { NicaInstance } from "nica";

export { createNicaSession } from "./session";
export type { SessionConfig, SessionContext, SessionMethods } from "./session";

export type { CreateNicaNextParams } from "./auth";
import type { CreateNicaNextParams } from "./auth";
import { createNicaNextCore } from "./auth";

const globalSymbol = Symbol.for("nica-next");

function buildNicaNextInstance<T extends object>(params: CreateNicaNextParams<T>) {
  return createNicaNextCore<T>(params);
}

export function createNicaNext<T extends object>(params: CreateNicaNextParams<T>) {
  const g = globalThis as typeof globalThis & { [key: symbol]: unknown };
  if (g[globalSymbol]) return g[globalSymbol] as ReturnType<typeof buildNicaNextInstance<T>>;

  const instance = buildNicaNextInstance<T>(params);

  // In development, persist across HMR re-evaluations
  if (process.env.NODE_ENV !== "production") g[globalSymbol] = instance;

  return instance;
}
