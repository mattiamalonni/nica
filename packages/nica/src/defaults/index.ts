import { NicaError, NicaErrorCode } from "../errors";
import { ProviderConfig } from "../types";

/* -------------------------------------------------------------------------- */
/*                             PKCE / state helpers                           */
/* -------------------------------------------------------------------------- */

function generateRandomBase64Url(byteLength: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return btoa(Array.from(bytes).map((b) => String.fromCharCode(b)).join(""))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(Array.from(new Uint8Array(digest)).map((b) => String.fromCharCode(b)).join(""))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/* -------------------------------------------------------------------------- */
/*                           Default factory functions                        */
/* -------------------------------------------------------------------------- */

export const createExchangeCodeForTokensFunction =
  ({ tokenUrl, clientId, clientSecret, redirectUri }: Pick<Required<ProviderConfig>, "tokenUrl" | "clientId" | "clientSecret" | "redirectUri">) =>
  async (code: string, codeVerifier?: string) => {
    const body: Record<string, string> = {
      grant_type: "authorization_code",
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
    };

    if (codeVerifier) body.code_verifier = codeVerifier;

    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams(body).toString(),
    });

    if (!response.ok) throw new NicaError(`Failed to exchange code for tokens: ${response.statusText}`, { code: NicaErrorCode.TOKEN_EXCHANGE_FAILED });

    return response.json();
  };

export const createGetAuthUrlFunction =
  ({ authorizationUrl, clientId, redirectUri, scopes, pkce = true }: Pick<Required<ProviderConfig>, "authorizationUrl" | "clientId" | "redirectUri" | "scopes"> & { pkce?: boolean }) =>
  async (): Promise<{ url: string; state: string; codeVerifier?: string }> => {
    const state = generateRandomBase64Url(32);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scopes.join(" "),
      state,
    });

    let codeVerifier: string | undefined;
    if (pkce) {
      codeVerifier = generateRandomBase64Url(48);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      params.set("code_challenge", codeChallenge);
      params.set("code_challenge_method", "S256");
    }

    return { url: `${authorizationUrl}?${params.toString()}`, state, codeVerifier };
  };

