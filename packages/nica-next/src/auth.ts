import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import type { AuthCallback, NicaInstance } from "nica";
import { NicaError, NicaErrorCode } from "nica";
import type { SessionMethods } from "./session";

const PKCE_COOKIE_TTL = 600; // 10 minutes

export type CreateNicaNextParams<T extends object> = {
  nica: NicaInstance;
  session: SessionMethods<T>;
  onProfile: (data: AuthCallback) => Promise<T>;
};

export type NicaNextCore<T extends object> = {
  redirect: (provider: string) => Promise<NextResponse>;
  callback: (req: NextRequest, provider: string) => Promise<{ data: T; response: NextResponse }>;
};

export function createNicaAuth<T extends object>({ nica, session, onProfile }: CreateNicaNextParams<T>): NicaNextCore<T> {
  const redirect = async (provider: string): Promise<NextResponse> => {
    const { url, state, codeVerifier } = await nica.getRedirectUrl(provider);
    const payload = Buffer.from(JSON.stringify({ state, codeVerifier })).toString("base64");
    const signed = await session.sign(payload);

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

    const verified = await session.verify(pkceCookie);
    if (!verified) {
      throw new NicaError(`Invalid PKCE cookie for provider: ${provider}`, { code: NicaErrorCode.INVALID_STATE, provider });
    }

    let savedState: string;
    let codeVerifier: string | undefined;
    try {
      const parsed = JSON.parse(Buffer.from(verified, "base64").toString()) as { state: string; codeVerifier?: string };
      savedState = parsed.state;
      codeVerifier = parsed.codeVerifier;
    } catch {
      throw new NicaError(`Malformed PKCE cookie for provider: ${provider}`, { code: NicaErrorCode.INVALID_STATE, provider });
    }
    const incomingState = req.nextUrl.searchParams.get("state");

    if (!incomingState || incomingState !== savedState) {
      throw new NicaError(`State mismatch for provider: ${provider}`, { code: NicaErrorCode.INVALID_STATE, provider });
    }

    const code = req.nextUrl.searchParams.get("code");
    if (!code) {
      throw new NicaError(`Missing authorization code for provider: ${provider}`, { code: NicaErrorCode.TOKEN_EXCHANGE_FAILED, provider });
    }

    const authData = await nica.authenticate(provider, code, codeVerifier);
    const sessionData = await onProfile(authData);

    const response = new NextResponse();
    await session.create(sessionData, { response });
    response.cookies.set(cookieName, "", { httpOnly: true, secure: true, sameSite: "lax", maxAge: 0, path: "/" });

    return { data: sessionData, response };
  };

  return { redirect, callback };
}
