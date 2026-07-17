export type SupportedProviderName = "google" | "github" | "facebook" | "linkedin" | "slack" | "twitter" | "microsoft" | "twitch" | "discord";

type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

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

  fetchProfile?: (accessToken: string) => Promise<unknown>;
  getAuthUrl?: () => Promise<{ url: string; state: string; codeVerifier: string }>;
  handleCallback?: (code: string, codeVerifier?: string) => Promise<AuthCallback>;
};

export type ProviderSchema = RequireAtLeastOne<Record<SupportedProviderName, ProviderConfig>>;

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

export type AuthCallback = { tokens: AuthTokens; profile: AuthProfile; provider: SupportedProviderName };

export type CreateAuthParams = {
  providers: ProviderSchema;
};

export type SessionPayload<T extends object = Record<string, unknown>> = T & {
  iat: number;
  exp: number;
};
