export type { AuthCallback, AuthProfile, AuthTokens, CreateAuthParams, SupportedProviderName } from "./types";

import { createExchangeCodeForTokensFunction, createGetAuthUrlFunction, createHandleCallbackFunction } from "./defaults";
import { PROVIDERS } from "./providers";
import { AuthCallback, CreateAuthParams, ProviderSchema, SupportedProviderName } from "./types";

export function nica({ providers }: CreateAuthParams) {
  const p: Partial<ProviderSchema> = {};

  for (const [name, config] of Object.entries(providers)) {
    const providerName = name as keyof typeof PROVIDERS;

    const PROVIDER = PROVIDERS[name as keyof typeof PROVIDERS];
    if (!PROVIDER) throw new Error(`Unsupported provider: ${name}`);

    const clientId = config.clientId;
    const clientSecret = config.clientSecret;

    if (!clientId || !clientSecret) throw new Error(`Missing clientId or clientSecret for provider: ${name}`);

    const redirectUri = config.redirectUri;

    const scopes = config.scopes || PROVIDER.scopes;
    if (!scopes) throw new Error(`Missing scopes for provider: ${name}`);

    const authorizationUrl = config.authorizationUrl || PROVIDER.authorizationUrl;
    if (!authorizationUrl) throw new Error(`Missing authorizationUrl for provider: ${name}`);

    const tokenUrl = config.tokenUrl || PROVIDER.tokenUrl;
    if (!tokenUrl) throw new Error(`Missing tokenUrl for provider: ${name}`);

    const normalizeProfile = config.normalizeProfile || PROVIDER.normalizeProfile;
    if (!normalizeProfile) throw new Error(`Missing normalizeProfile for provider: ${name}`);

    const normalizeTokens = config.normalizeTokens || PROVIDER.normalizeTokens;
    if (!normalizeTokens) throw new Error(`Missing normalizeTokens for provider: ${name}`);

    const exchangeCodeForTokens =
      config.exchangeCodeForTokens || createExchangeCodeForTokensFunction({ tokenUrl, clientId, clientSecret, redirectUri });
    if (!exchangeCodeForTokens) throw new Error(`Missing exchangeCodeForTokens for provider: ${name}`);

    const fetchProfile = config.fetchProfile || PROVIDER.fetchProfile;
    if (!fetchProfile) throw new Error(`Missing fetchProfile for provider: ${name}`);

    const getAuthUrl = config.getAuthUrl || createGetAuthUrlFunction({ authorizationUrl, clientId, redirectUri, scopes });
    if (!getAuthUrl) throw new Error(`Missing getAuthUrl for provider: ${name}`);

    const handleCallback =
      config.handleCallback ||
      createHandleCallbackFunction({ providerName: name, exchangeCodeForTokens, normalizeTokens, fetchProfile, normalizeProfile });
    if (!handleCallback) throw new Error(`Missing handleCallback for provider: ${name}`);

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
    if (!provider) throw new Error(`Provider not configured: ${name}`);
    return provider;
  };

  const generateAuthUrl = (providerName: keyof typeof PROVIDERS): string => {
    const provider = getProvider(providerName);
    return provider.getAuthUrl!();
  };

  const authenticate = async (providerName: keyof typeof PROVIDERS, code: string): Promise<AuthCallback> => {
    const provider = getProvider(providerName);
    const { tokens, profile } = await provider.handleCallback!(code);
    return { tokens, profile, provider: providerName as SupportedProviderName };
  };

  return { providers: Object.keys(p), getRedirectUrl: generateAuthUrl, authenticate };
}

export default nica;