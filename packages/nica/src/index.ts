export { NicaError, NicaErrorCode } from "./errors";
export type { AuthCallback, AuthProfile, AuthTokens, CreateAuthParams, SessionPayload, SupportedProviderName } from "./types";

import { createExchangeCodeForTokensFunction, createGetAuthUrlFunction, createHandleCallbackFunction } from "./defaults";
import { NicaError, NicaErrorCode } from "./errors";
import { PROVIDERS } from "./providers";
import { AuthCallback, CreateAuthParams, ProviderSchema, SupportedProviderName } from "./types";

export function nica({ providers }: CreateAuthParams) {
  const p: Partial<ProviderSchema> = {};

  for (const [name, config] of Object.entries(providers)) {
    const providerName = name as keyof typeof PROVIDERS;

    const PROVIDER = PROVIDERS[name as keyof typeof PROVIDERS];
    if (!PROVIDER) throw new NicaError(`Unsupported provider: ${name}`, { code: NicaErrorCode.UNSUPPORTED_PROVIDER });

    const clientId = config.clientId;
    const clientSecret = config.clientSecret;

    if (!clientId || !clientSecret) throw new NicaError(`Missing clientId or clientSecret for provider: ${name}`, { code: NicaErrorCode.INVALID_PROVIDER_CONFIG, provider: name as SupportedProviderName });

    const redirectUri = config.redirectUri;
    if (!redirectUri) throw new NicaError(`Missing redirectUri for provider: ${name}`, { code: NicaErrorCode.INVALID_PROVIDER_CONFIG, provider: name as SupportedProviderName });

    const scopes = config.scopes || PROVIDER.scopes;
    if (!scopes) throw new NicaError(`Missing scopes for provider: ${name}`, { code: NicaErrorCode.INVALID_PROVIDER_CONFIG, provider: name as SupportedProviderName });

    const authorizationUrl = config.authorizationUrl || PROVIDER.authorizationUrl;
    if (!authorizationUrl) throw new NicaError(`Missing authorizationUrl for provider: ${name}`, { code: NicaErrorCode.INVALID_PROVIDER_CONFIG, provider: name as SupportedProviderName });

    const tokenUrl = config.tokenUrl || PROVIDER.tokenUrl;
    if (!tokenUrl) throw new NicaError(`Missing tokenUrl for provider: ${name}`, { code: NicaErrorCode.INVALID_PROVIDER_CONFIG, provider: name as SupportedProviderName });

    const normalizeProfile = config.normalizeProfile || PROVIDER.normalizeProfile;
    if (!normalizeProfile) throw new NicaError(`Missing normalizeProfile for provider: ${name}`, { code: NicaErrorCode.INVALID_PROVIDER_CONFIG, provider: name as SupportedProviderName });

    const normalizeTokens = config.normalizeTokens || PROVIDER.normalizeTokens;
    if (!normalizeTokens) throw new NicaError(`Missing normalizeTokens for provider: ${name}`, { code: NicaErrorCode.INVALID_PROVIDER_CONFIG, provider: name as SupportedProviderName });

    const exchangeCodeForTokens =
      config.exchangeCodeForTokens || createExchangeCodeForTokensFunction({ tokenUrl, clientId, clientSecret, redirectUri });
    if (!exchangeCodeForTokens) throw new NicaError(`Missing exchangeCodeForTokens for provider: ${name}`, { code: NicaErrorCode.INVALID_PROVIDER_CONFIG, provider: name as SupportedProviderName });

    const fetchProfile = config.fetchProfile || PROVIDER.fetchProfile;
    if (!fetchProfile) throw new NicaError(`Missing fetchProfile for provider: ${name}`, { code: NicaErrorCode.INVALID_PROVIDER_CONFIG, provider: name as SupportedProviderName });

    const getAuthUrl = config.getAuthUrl || createGetAuthUrlFunction({ authorizationUrl, clientId, redirectUri, scopes });
    if (!getAuthUrl) throw new NicaError(`Missing getAuthUrl for provider: ${name}`, { code: NicaErrorCode.INVALID_PROVIDER_CONFIG, provider: name as SupportedProviderName });

    const handleCallback =
      config.handleCallback ||
      createHandleCallbackFunction({ providerName: name, clientId, exchangeCodeForTokens, normalizeTokens, fetchProfile, normalizeProfile });
    if (!handleCallback) throw new NicaError(`Missing handleCallback for provider: ${name}`, { code: NicaErrorCode.INVALID_PROVIDER_CONFIG, provider: name as SupportedProviderName });

    p[providerName] = {
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
      handleCallback,
    };
  }

  const getProvider = (name: keyof typeof PROVIDERS) => {
    const provider = p[name];
    if (!provider) throw new NicaError(`Provider not configured: ${name}`, { code: NicaErrorCode.PROVIDER_NOT_CONFIGURED, provider: name });
    return provider;
  };

  const getRedirectUrl = async (providerName: keyof typeof PROVIDERS): Promise<{ url: string; state: string; codeVerifier: string }> => {
    const provider = getProvider(providerName);
    return provider.getAuthUrl!();
  };

  const authenticate = async (providerName: keyof typeof PROVIDERS, code: string, codeVerifier?: string): Promise<AuthCallback> => {
    const provider = getProvider(providerName);
    const { tokens, profile } = await provider.handleCallback!(code, codeVerifier);
    return { tokens, profile, provider: providerName as SupportedProviderName };
  };

  return { providers: Object.keys(p), getRedirectUrl, authenticate };
}

export default nica;