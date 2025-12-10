import type {
  OAuthTokens,
  OAuthProfile,
  ProviderBase,
} from "../provider/types";

export default {
  name: "reddit",
  authorizationUrl: "https://www.reddit.com/api/v1/authorize",
  tokenUrl: "https://www.reddit.com/api/v1/access_token",
  scopes: ["identity"] as const,

  normalizeProfile(rawProfile: unknown): OAuthProfile {
    const profile = rawProfile as Record<string, unknown>;
    return {
      id: String(profile.id),
      name: profile.name as string | undefined,
      username: profile.name as string | undefined,
      picture: undefined,
      provider: "reddit",
      raw: profile,
    };
  },

  normalizeTokens(rawTokens: unknown): OAuthTokens {
    const tokens = rawTokens as Record<string, unknown>;
    return {
      accessToken: tokens.access_token as string,
      tokenType: tokens.token_type as string | undefined,
      expiresIn: tokens.expires_in as number | undefined,
      raw: tokens,
    };
  },

  async fetchProfile(accessToken: string): Promise<unknown> {
    const response = await fetch("https://oauth.reddit.com/api/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Reddit user: ${response.statusText}`);
    }

    return response.json();
  },
} as ProviderBase;
