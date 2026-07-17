import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthCallback, CreateAuthParams } from "nica";
import { nica, NicaError, NicaErrorCode } from "nica";
import { signData, verifySignedData } from "../crypto";
import type { SessionConfig, SessionMethods } from "../session";
import { createSession } from "../session";

const PKCE_COOKIE_TTL = 600; // 10 minutes

export type CreateNextAuthParams<T extends object> = {
  providers: CreateAuthParams["providers"];
  session: SessionConfig;
  onProfile: (data: AuthCallback) => Promise<T>;
};

export type NicaNextCore<T extends object> = {
  redirect: (provider: string) => Promise<NextResponse>;
  callback: (req: NextRequest, provider: string) => Promise<{ data: T; response: NextResponse }>;
  session: SessionMethods<T>;
};

export function createNicaNextCore<T extends object>({ providers, session: sessionConfig, onProfile }: CreateNextAuthParams<T>): NicaNextCore<T> {
  const auth = nica({ providers });
  const session = createSession<T>(sessionConfig);

  const redirect = async (provider: string): Promise<NextResponse> => {
    const { url, state, codeVerifier } = await auth.getRedirectUrl(provider);
    const payload = btoa(JSON.stringify({ state, codeVerifier }));
    const signed = await signData(payload, sessionConfig.secret);

    const response = NextResponse.redirect(url);
    response.cookies.set(`nica_pkce_${provider}`, signed, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: PKCE_COOKIE_TTL,
      path: "/",
    });
    return response;
  };

  const callback = async (req: NextRequest, provider: string): Promise<{ data: T; response: NextResponse }> => {
    const cookieName = `nica_pkce_${provider}`;
    const pkceCookie = req.cookies.get(cookieName)?.value;

    if (!pkceCookie) {
      throw new NicaError(`PKCE cookie missing for provider: ${provider}`, { code: NicaErrorCode.PKCE_COOKIE_MISSING, provider });
    }

    const verified = await verifySignedData(pkceCookie, sessionConfig.secret);
    if (!verified) {
      throw new NicaError(`Invalid PKCE cookie for provider: ${provider}`, { code: NicaErrorCode.INVALID_STATE, provider });
    }

    const { state: savedState, codeVerifier } = JSON.parse(atob(verified)) as { state: string; codeVerifier: string };
    const incomingState = req.nextUrl.searchParams.get("state");

    if (!incomingState || incomingState !== savedState) {
      throw new NicaError(`State mismatch for provider: ${provider}`, { code: NicaErrorCode.INVALID_STATE, provider });
    }

    const code = req.nextUrl.searchParams.get("code");
    if (!code) {
      throw new NicaError(`Missing authorization code for provider: ${provider}`, { code: NicaErrorCode.TOKEN_EXCHANGE_FAILED, provider });
    }

    const authData = await auth.authenticate(provider, code, codeVerifier);
    const sessionData = await onProfile(authData);

    const response = new NextResponse();
    await session.create(sessionData, { response });
    response.cookies.delete(cookieName);

    return { data: sessionData, response };
  };

  return { redirect, callback, session };
}
