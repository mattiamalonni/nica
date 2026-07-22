"use client";

import type { SessionPayload } from "nica";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { SessionContextProvider, useSession } from "./context";

type UseNicaOptions = {
  getSession: () => Promise<SessionPayload<Record<string, unknown>> | undefined>;
};

type UseNicaResult<T extends object> = {
  SessionProvider: ({ children }: { children: ReactNode }) => React.ReactElement;
  useSession: () => {
    session: SessionPayload<T> | undefined;
  };
};

export function useNica<T extends object>(options: UseNicaOptions): UseNicaResult<T> {
  const { getSession } = options;

  function SessionProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<SessionPayload<T> | undefined>(undefined);
    const getSessionRef = useRef(getSession);
    useEffect(() => {
      getSessionRef.current = getSession;
    });

    useEffect(() => {
      getSessionRef
        .current()
        .then((session) => {
          setData(session as SessionPayload<T> | undefined);
        })
        .catch(() => {
          setData(undefined);
        });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
      <SessionContextProvider
        value={{
          data: data as SessionPayload<Record<string, unknown>> | undefined,
        }}
      >
        {children}
      </SessionContextProvider>
    );
  }

  const typedUseSession = () => useSession<T>();

  return { SessionProvider, useSession: typedUseSession } as UseNicaResult<T>;
}
