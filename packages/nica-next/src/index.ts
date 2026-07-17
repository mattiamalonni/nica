import type { CreateNextAuthParams } from "./server";
import { build } from "./server";
export { createSession } from "./server";
export type { CreateNextAuthParams, SessionConfig, SessionContext, SessionMethods } from "./server";

const globalSymbol = Symbol.for("nica-next");

export function nica<T extends object>(params: CreateNextAuthParams<T>) {
  const g = globalThis as typeof globalThis & { [key: symbol]: unknown };
  if (g[globalSymbol]) return g[globalSymbol] as ReturnType<typeof build<T>>;

  const instance = build<T>(params);

  // In development, persist across HMR re-evaluations
  if (process.env.NODE_ENV !== "production") g[globalSymbol] = instance;

  return instance;
}

export default nica;
