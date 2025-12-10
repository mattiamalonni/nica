export type ProvidersConfig = Record<string, ProviderConfig>;

export interface ProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
  scopes?: string[];
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType?: string;
  raw?: Record<string, unknown>;
}

export interface OAuthProfile {
  id: string;
  email?: string;
  name?: string;
  username?: string;
  picture?: string;
  provider: string;
  raw?: Record<string, unknown>;
}

export interface OAuthProfileData {
  tokens: OAuthTokens;
  profile: OAuthProfile;
}

export interface ProviderBase {
  name: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];

  normalizeTokens(rawTokens: unknown): OAuthTokens;
  normalizeProfile(rawProfile: unknown): OAuthProfile;
  fetchProfile?(accessToken: string): Promise<unknown>;
}
