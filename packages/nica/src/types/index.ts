export type SupportedProviderName = "google" | "github" | "facebook" | "linkedin" | "slack" | "twitter" | "microsoft" | "twitch" | "discord";

export type ProviderConfig = {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes?: string[];

  authorizationUrl?: string;
  tokenUrl?: string;

  exchangeCodeForTokens?: (code: string, codeVerifier?: string) => Promise<unknown>;

  normalizeProfile?: (rawProfile: unknown) => {
    id: string;
    email?: string;
    name?: string;
    username?: string;
    picture?: string;
    provider: string;
    raw: Record<string, unknown>;
  };

  normalizeTokens?: (rawTokens: unknown) => {
    accessToken: string;
    refreshToken?: string;
    tokenType?: string;
    expiresIn?: number;
    raw: Record<string, unknown>;
  };

  fetchProfile?: (accessToken: string, clientId?: string) => Promise<unknown>;
  getAuthUrl?: () => Promise<{ url: string; state: string; codeVerifier: string }>;
};

export type ProviderSchema = Record<string, ProviderConfig>;

export type AuthProfile = {
  id: string;
  email?: string;
  name?: string;
  username?: string;
  picture?: string;
  provider: string;
  raw?: Record<string, unknown>;
};

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  raw?: Record<string, unknown>;
}

export type AuthCallback = { tokens: AuthTokens; profile: AuthProfile; provider: string };

export type CreateAuthParams = {
  providers: ProviderSchema;
};

export type SessionPayload<T extends object = Record<string, unknown>> = T & {
  iat: number;
  exp: number;
};
