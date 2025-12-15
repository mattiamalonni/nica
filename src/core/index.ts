import { createExchangeCodeForTokensFunction, createGetAuthUrlFunction, createHandleCallbackFunction, getDefaultRedirectUri } from "./defaults";
import { PROVIDERS } from "./providers";
import { CreateAuthParams, ProviderSchema, SupportedProviderName } from "./types";

export function createAuth<T = void>({ providers, origin, onProfile }: CreateAuthParams<T>) {
  const p: Partial<ProviderSchema> = {};

  for (const [name, config] of Object.entries(providers)) {
    const providerName = name as keyof typeof PROVIDERS;

    const PROVIDER = PROVIDERS[name as keyof typeof PROVIDERS];
    if (!PROVIDER) throw new Error(`Unsupported provider: ${name}`);

    const clientId = config.clientId;
    const clientSecret = config.clientSecret;

    if (!clientId || !clientSecret) throw new Error(`Missing clientId or clientSecret for provider: ${name}`);

    const baseRedirectUri = getDefaultRedirectUri(name as keyof typeof PROVIDERS);
    const redirectUri = config.redirectUri || (origin ? `${origin}${baseRedirectUri}` : baseRedirectUri);
    if (!redirectUri) throw new Error(`Missing redirectUri for provider: ${name}`);

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

  const getAuthUrl = (providerName: string): string => {
    const provider = getProvider(providerName as keyof typeof PROVIDERS);
    return provider.getAuthUrl!();
  };

  const handleCallback = async (providerName: string, code: string): Promise<T extends void ? void : T> => {
    const provider = getProvider(providerName as keyof typeof PROVIDERS);
    const { tokens, profile } = await provider.handleCallback!(code);

    if (onProfile && profile) {
      const data = await onProfile({ tokens, profile, provider: providerName as SupportedProviderName });
      return data as T extends void ? void : T;
    }
    return undefined as T extends void ? void : T;
  };

  return { providers: Object.keys(p), getAuthUrl, handleCallback };
}
