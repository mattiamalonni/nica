import type {
  OAuthTokens,
  OAuthProfile,
  ProviderBase,
} from "../provider/types";

export default {
  name: "twitter",
  authorizationUrl: "https://twitter.com/i/oauth2/authorize",
  tokenUrl: "https://twitter.com/2/oauth2/token",
  scopes: ["tweet.read", "users.read"] as const,

  normalizeProfile(rawProfile: unknown): OAuthProfile {
    const profile = rawProfile as Record<string, unknown>;
    return {
      id: String(profile.id),
      name: profile.name as string | undefined,
      username: profile.username as string | undefined,
      picture: undefined,
      provider: "twitter",
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
    const response = await fetch("https://api.twitter.com/2/users/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Twitter user: ${response.statusText}`);
    }

    return response.json();
  },
} as ProviderBase;
