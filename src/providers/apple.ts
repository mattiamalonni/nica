import type { OAuthTokens, OAuthProfile, ProviderBase } from "../provider/types";

export default {
  name: "apple",
  authorizationUrl: "https://appleid.apple.com/auth/authorize",
  tokenUrl: "https://appleid.apple.com/auth/token",
  scopes: ["name", "email"] as const,

  normalizeProfile(rawProfile: unknown): OAuthProfile {
    const profile = rawProfile as Record<string, unknown>;
    const user = profile.user as Record<string, unknown> | undefined;
    return {
      id: String(profile.sub),
      email: profile.email as string | undefined,
      name: user?.name as string | undefined,
      picture: undefined,
      provider: "apple",
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
    const response = await fetch("https://appleid.apple.com/auth/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Apple user: ${response.statusText}`);
    }

    return response.json();
  },
} as ProviderBase;
