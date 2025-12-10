import type {
  OAuthTokens,
  OAuthProfile,
  ProviderBase,
} from "../provider/types";

export default {
  name: "discord",
  authorizationUrl: "https://discord.com/api/oauth2/authorize",
  tokenUrl: "https://discord.com/api/oauth2/token",
  scopes: ["identify", "email"] as const,

  normalizeProfile(rawProfile: unknown): OAuthProfile {
    const profile = rawProfile as Record<string, unknown>;
    return {
      id: String(profile.id),
      email: profile.email as string | undefined,
      name: profile.username as string | undefined,
      username: profile.username as string | undefined,
      picture: profile.avatar as string | undefined,
      provider: "discord",
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
    const response = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Discord user: ${response.statusText}`);
    }

    return response.json();
  },
} as ProviderBase;
