"use client";

import type { SessionPayload } from "nica";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { SessionContextProvider, createUseSession } from "./context";

export function withReactSession<T extends object>(fetchFn: () => Promise<SessionPayload<T> | undefined>) {
  const useSession = createUseSession<T>();

  function SessionProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<SessionPayload<T> | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      fetchFn()
        .then((session) => {
          setData(session);
          setIsLoading(false);
        })
        .catch(() => {
          setData(undefined);
          setIsLoading(false);
        });
    }, []);

    return (
      <SessionContextProvider value={{ data: data as SessionPayload<Record<string, unknown>> | undefined, isLoading }}>
        {children}
      </SessionContextProvider>
    );
  }

  return { SessionProvider, useSession };
}
