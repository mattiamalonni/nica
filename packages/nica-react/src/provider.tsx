"use client";

import type { SessionPayload } from "nica";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SessionContextProvider, createUseSession } from "./context";

type UseNicaOptions<TDelete extends (() => Promise<void>) | undefined> = {
  getSession: () => Promise<SessionPayload<Record<string, unknown>> | undefined>;
  deleteSession?: TDelete;
};

type UseNicaResult<T extends object, TDelete extends (() => Promise<void>) | undefined> = {
  SessionProvider: ({ children }: { children: ReactNode }) => React.ReactElement;
  useSession: () => {
    session: SessionPayload<T> | undefined;
    isLoading: boolean;
    refreshSession: () => Promise<SessionPayload<T> | undefined>;
    deleteSession: TDelete;
  };
};

export function useNica<T extends object, TDelete extends (() => Promise<void>) | undefined = undefined>(
  options: UseNicaOptions<TDelete>,
): UseNicaResult<T, TDelete> {
  const { getSession, deleteSession: deleteSessionFn } = options;
  const _useSession = createUseSession<T>();

  function SessionProvider({ children }: { children: ReactNode }) {
    const [data, setData] = useState<SessionPayload<T> | undefined>(undefined);
    const [isLoading, setIsLoading] = useState(true);
    const getSessionRef = useRef(getSession);
    useEffect(() => { getSessionRef.current = getSession; });

    useEffect(() => {
      getSessionRef.current()
        .then((session) => {
          setData(session as SessionPayload<T> | undefined);
          setIsLoading(false);
        })
        .catch(() => {
          setData(undefined);
          setIsLoading(false);
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const refreshSession = useCallback(async (): Promise<SessionPayload<T> | undefined> => {
      const session = await getSessionRef.current();
      setData(session as SessionPayload<T> | undefined);
      return session as SessionPayload<T> | undefined;
    }, []);

    const deleteSession = useMemo(
      () =>
        deleteSessionFn
          ? async () => {
              await deleteSessionFn();
              setData(undefined);
            }
          : undefined,
      [deleteSessionFn],
    ) as TDelete;

    return (
      <SessionContextProvider
        value={{
          data: data as SessionPayload<Record<string, unknown>> | undefined,
          isLoading,
          refreshSession: refreshSession as () => Promise<SessionPayload<Record<string, unknown>> | undefined>,
          deleteSession: deleteSession as (() => Promise<void>) | undefined,
        }}
      >
        {children}
      </SessionContextProvider>
    );
  }

  const useSession = () => {
    const inner = _useSession();
    return {
      ...inner,
      deleteSession: inner.deleteSession as TDelete,
    };
  };

  return { SessionProvider, useSession } as UseNicaResult<T, TDelete>;
}
