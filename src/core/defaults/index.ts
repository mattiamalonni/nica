import { SupportedProviderName, AuthCallback, ProviderConfig } from "../types";

export const getDefaultRedirectUri = (providerName: SupportedProviderName) => `/api/auth/${providerName}/callback`;

export const createExchangeCodeForTokensFunction =
  ({ tokenUrl, clientId, clientSecret, redirectUri }: Pick<Required<ProviderConfig>, "tokenUrl" | "clientId" | "clientSecret" | "redirectUri">) =>
  async (code: string) => {
    const response = await fetch(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
      }).toString(),
    });

    if (!response.ok) throw new Error(`Failed to exchange code for tokens: ${response.statusText}`);

    return response.json();
  };

export const createGetAuthUrlFunction =
  ({ authorizationUrl, clientId, redirectUri, scopes }: Pick<Required<ProviderConfig>, "authorizationUrl" | "clientId" | "redirectUri" | "scopes">) =>
  () => {
    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: scopes.join(" "),
    });

    return `${authorizationUrl}?${params.toString()}`;
  };

export const createHandleCallbackFunction =
  ({
    providerName,
    exchangeCodeForTokens,
    normalizeTokens,
    fetchProfile,
    normalizeProfile,
  }: {
    providerName: string;
    exchangeCodeForTokens: Required<ProviderConfig>["exchangeCodeForTokens"];
    normalizeTokens: Required<ProviderConfig>["normalizeTokens"];
    fetchProfile: Required<ProviderConfig>["fetchProfile"];
    normalizeProfile: Required<ProviderConfig>["normalizeProfile"];
  }) =>
  async (code: string): Promise<AuthCallback> => {
    const rawTokens = await exchangeCodeForTokens(code);
    const tokens = normalizeTokens(rawTokens);

    const rawProfile = await fetchProfile(tokens.accessToken);
    const profile = normalizeProfile(rawProfile);
    return { tokens, profile, provider: providerName as any };
  };
