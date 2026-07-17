export { NicaError, NicaErrorCode } from "./errors";
export type { AuthCallback, AuthProfile, AuthTokens, CreateAuthParams, SessionPayload, SupportedProviderName } from "./types";

import { createExchangeCodeForTokensFunction, createGetAuthUrlFunction } from "./defaults";
import { NicaError, NicaErrorCode } from "./errors";
import { PROVIDERS } from "./providers";
import { AuthCallback, AuthTokens, CreateAuthParams, ProviderConfig } from "./types";

type ResolvedProviderConfig = Required<Pick<ProviderConfig,
  | "clientId"
  | "clientSecret"
  | "redirectUri"
  | "scopes"
  | "authorizationUrl"
  | "tokenUrl"
  | "normalizeProfile"
  | "normalizeTokens"
  | "exchangeCodeForTokens"
  | "fetchProfile"
  | "getAuthUrl"
>>;

export function nica({ providers }: CreateAuthParams) {
  const p: Partial<Record<string, ResolvedProviderConfig>> = {};

  for (const [name, config] of Object.entries(providers)) {
    const PROVIDER = PROVIDERS[name as keyof typeof PROVIDERS];

    const clientId = config.clientId;
    const clientSecret = config.clientSecret;

    if (!clientId || !clientSecret) throw new NicaError(`Missing clientId or clientSecret for provider: ${name}`, { code: NicaErrorCode.INVALID_PROVIDER_CONFIG, provider: name });

    const redirectUri = config.redirectUri;
    if (!redirectUri) throw new NicaError(`Missing redirectUri for provider: ${name}`, { code: NicaErrorCode.INVALID_PROVIDER_CONFIG, provider: name });

    const scopes = config.scopes || PROVIDER?.scopes;
    if (!scopes) throw new NicaError(`Missing scopes for provider: ${name}`, { code: NicaErrorCode.INVALID_PROVIDER_CONFIG, provider: name });

    const authorizationUrl = config.authorizationUrl || PROVIDER?.authorizationUrl;
    if (!authorizationUrl) throw new NicaError(`Missing authorizationUrl for provider: ${name}`, { code: NicaErrorCode.INVALID_PROVIDER_CONFIG, provider: name });

    const tokenUrl = config.tokenUrl || PROVIDER?.tokenUrl;
    if (!tokenUrl) throw new NicaError(`Missing tokenUrl for provider: ${name}`, { code: NicaErrorCode.INVALID_PROVIDER_CONFIG, provider: name });

    const normalizeProfile = config.normalizeProfile || PROVIDER?.normalizeProfile;
    if (!normalizeProfile) throw new NicaError(`Missing normalizeProfile for provider: ${name}`, { code: NicaErrorCode.INVALID_PROVIDER_CONFIG, provider: name });

    const normalizeTokens = config.normalizeTokens || PROVIDER?.normalizeTokens;
    if (!normalizeTokens) throw new NicaError(`Missing normalizeTokens for provider: ${name}`, { code: NicaErrorCode.INVALID_PROVIDER_CONFIG, provider: name });

    const exchangeCodeForTokens =
      config.exchangeCodeForTokens || createExchangeCodeForTokensFunction({ tokenUrl, clientId, clientSecret, redirectUri });
    if (!exchangeCodeForTokens) throw new NicaError(`Missing exchangeCodeForTokens for provider: ${name}`, { code: NicaErrorCode.INVALID_PROVIDER_CONFIG, provider: name });

    const fetchProfile = config.fetchProfile || PROVIDER?.fetchProfile;
    if (!fetchProfile) throw new NicaError(`Missing fetchProfile for provider: ${name}`, { code: NicaErrorCode.INVALID_PROVIDER_CONFIG, provider: name });

    const getAuthUrl = config.getAuthUrl || createGetAuthUrlFunction({ authorizationUrl, clientId, redirectUri, scopes });
    if (!getAuthUrl) throw new NicaError(`Missing getAuthUrl for provider: ${name}`, { code: NicaErrorCode.INVALID_PROVIDER_CONFIG, provider: name });

    p[name] = {
      clientId,
      clientSecret,
      redirectUri,
      scopes,
      authorizationUrl,
      tokenUrl,
      normalizeProfile,
      normalizeTokens,
      exchangeCodeForTokens,
      fetchProfile,
      getAuthUrl,
    };
  }

  const getProvider = (name: string) => {
    const provider = p[name];
    if (!provider) throw new NicaError(`Provider not configured: ${name}`, { code: NicaErrorCode.PROVIDER_NOT_CONFIGURED, provider: name });
    return provider;
  };

  const getRedirectUrl = async (providerName: string): Promise<{ url: string; state: string; codeVerifier: string }> => {
    const provider = getProvider(providerName);
    return provider.getAuthUrl();
  };

  const exchangeCode = async (providerName: string, code: string, codeVerifier?: string): Promise<AuthTokens> => {
    const provider = getProvider(providerName);
    const rawTokens = await provider.exchangeCodeForTokens(code, codeVerifier);
    return provider.normalizeTokens(rawTokens);
  };

  const authenticate = async (providerName: string, code: string, codeVerifier?: string): Promise<AuthCallback> => {
    const provider = getProvider(providerName);
    const tokens = await exchangeCode(providerName, code, codeVerifier);
    const rawProfile = await provider.fetchProfile(tokens.accessToken, provider.clientId);
    const profile = provider.normalizeProfile(rawProfile);
    return { tokens, profile, provider: providerName };
  };

  return { providers: Object.keys(p), getRedirectUrl, exchangeCode, authenticate };
}

export default nica;