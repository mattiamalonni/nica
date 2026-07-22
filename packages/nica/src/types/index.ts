export type SupportedProviderName = "google" | "github" | "facebook" | "linkedin" | "slack" | "twitter" | "microsoft" | "twitch" | "discord";

export type ProviderConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes?: string[];

  authorizationUrl?: string;
  tokenUrl?: string;
  pkce?: boolean;

  exchangeCodeForTokens?: (code: string, codeVerifier?: string) => Promise<unknown>;

  normalizeProfile?: (rawProfile: unknown) => AuthProfile;

  normalizeTokens?: (rawTokens: unknown) => AuthTokens;

  fetchProfile?: (accessToken: string, clientId?: string) => Promise<unknown>;
  getAuthUrl?: () => Promise<{ url: string; state: string; codeVerifier?: string }>;
};

export type ProviderSchema = Record<string, ProviderConfig>;

export type AuthProfile = {
  id: string;
  email?: string;
  name?: string;
  username?: string;
  picture?: string;
  provider: string;
  raw: Record<string, unknown>;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  raw: Record<string, unknown>;
};

export type AuthCallback = { tokens: AuthTokens; profile: AuthProfile; provider: string };

export type CreateAuthParams = {
  providers: ProviderSchema;
};
