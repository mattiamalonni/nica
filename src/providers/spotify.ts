import type { OAuthTokens, OAuthProfile, ProviderBase } from "../provider/types";

export default {
  name: "spotify",
  authorizationUrl: "https://accounts.spotify.com/authorize",
  tokenUrl: "https://accounts.spotify.com/api/token",
  scopes: ["user-read-email", "user-read-private"] as const,

  normalizeProfile(rawProfile: unknown): OAuthProfile {
    const profile = rawProfile as Record<string, unknown>;
    const images = profile.images as Array<Record<string, unknown>> | undefined;
    return {
      id: String(profile.id),
      email: profile.email as string | undefined,
      name: profile.display_name as string | undefined,
      picture: images?.[0]?.url as string | undefined,
      provider: "spotify",
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
    const response = await fetch("https://api.spotify.com/v1/me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Spotify user: ${response.statusText}`);
    }

    return response.json();
  },
} as ProviderBase;
