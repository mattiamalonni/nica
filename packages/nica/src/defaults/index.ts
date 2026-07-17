import { AuthCallback, ProviderConfig } from "../types";

/* -------------------------------------------------------------------------- */
/*                             PKCE / state helpers                           */
/* -------------------------------------------------------------------------- */

function generateRandomBase64Url(byteLength: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteLength));
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
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

    if (!response.ok) throw new Error(`Failed to exchange code for tokens: ${response.statusText}`);

    return response.json();
  };

export const createGetAuthUrlFunction =
  ({ authorizationUrl, clientId, redirectUri, scopes }: Pick<Required<ProviderConfig>, "authorizationUrl" | "clientId" | "redirectUri" | "scopes">) =>
  async (): Promise<{ url: string; state: string; codeVerifier: string }> => {
    const state = generateRandomBase64Url(32);
    const codeVerifier = generateRandomBase64Url(48);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scopes.join(" "),
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return { url: `${authorizationUrl}?${params.toString()}`, state, codeVerifier };
  };

export const createHandleCallbackFunction =
  ({
    providerName,
    clientId,
    exchangeCodeForTokens,
    normalizeTokens,
    fetchProfile,
    normalizeProfile,
  }: {
    providerName: string;
    clientId: string;
    exchangeCodeForTokens: Required<ProviderConfig>["exchangeCodeForTokens"];
    normalizeTokens: Required<ProviderConfig>["normalizeTokens"];
    fetchProfile: Required<ProviderConfig>["fetchProfile"];
    normalizeProfile: Required<ProviderConfig>["normalizeProfile"];
  }) =>
  async (code: string, codeVerifier?: string): Promise<AuthCallback> => {
    const rawTokens = await exchangeCodeForTokens(code, codeVerifier);
    const tokens = normalizeTokens(rawTokens);

    const rawProfile = await fetchProfile(tokens.accessToken, clientId);
    const profile = normalizeProfile(rawProfile);
    return { tokens, profile, provider: providerName as any };
  };
