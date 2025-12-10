import type { OAuthTokens, OAuthProfile, ProviderBase } from "../provider/types";

export default {
  name: "twitch",
  authorizationUrl: "https://id.twitch.tv/oauth2/authorize",
  tokenUrl: "https://id.twitch.tv/oauth2/token",
  scopes: ["user:read:email"] as const,

  normalizeProfile(rawProfile: unknown): OAuthProfile {
    const profile = rawProfile as Record<string, unknown>;
    return {
      id: String(profile.id),
      email: profile.email as string | undefined,
      name: profile.display_name as string | undefined,
      username: profile.login as string | undefined,
      picture: profile.profile_image_url as string | undefined,
      provider: "twitch",
      raw: profile,
    };
  },

  normalizeTokens(rawTokens: unknown): OAuthTokens {
    const tokens = rawTokens as Record<string, unknown>;
    return {
      accessToken: tokens.access_token as string,
      refreshToken: tokens.refresh_token as string | undefined,
      tokenType: tokens.token_type as string | undefined,
      expiresIn: tokens.expires_in as number | undefined,
      raw: tokens,
    };
  },

  async fetchProfile(accessToken: string): Promise<unknown> {
    const response = await fetch("https://api.twitch.tv/helix/users", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Client-ID": "",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Twitch user: ${response.statusText}`);
    }

    const data = await response.json();
    return data.data?.[0];
  },
} as ProviderBase;
