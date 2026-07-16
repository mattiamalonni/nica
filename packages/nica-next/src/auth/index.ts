import type { AuthCallback, CreateAuthParams, SupportedProviderName } from "nica";
import { nica } from "nica";
import type { SessionConfig, SessionContext } from "../session";
import { createSession } from "../session";

type CreateNextAuthParams<T extends object> = {
  providers: CreateAuthParams["providers"];
  session: SessionConfig;
  onProfile: (data: AuthCallback) => Promise<T>;
};

export function nicaNext<T extends object>({ providers, session: sessionConfig, onProfile }: CreateNextAuthParams<T>) {
  const auth = nica({ providers });
  const session = createSession<T>(sessionConfig);

  const getRedirectUrl = (provider: SupportedProviderName) => auth.getRedirectUrl(provider);

  const authenticate = async (provider: SupportedProviderName, code: string, context?: SessionContext): Promise<T> => {
    const data = await auth.authenticate(provider, code);
    const sessionData = await onProfile(data);
    await session.create(sessionData, context);
    return sessionData;
  };

  return { getRedirectUrl, authenticate, session };
}
