import type {
  OAuthTokens,
  OAuthProfile,
  ProviderBase,
} from "../provider/types";

export default {
  name: "gitlab",
  authorizationUrl: "https://gitlab.com/oauth/authorize",
  tokenUrl: "https://gitlab.com/oauth/token",
  scopes: ["read_user", "read_email"] as const,

  normalizeProfile(rawProfile: unknown): OAuthProfile {
    const profile = rawProfile as Record<string, unknown>;
    return {
      id: String(profile.id),
      email: profile.email as string | undefined,
      name: profile.name as string | undefined,
      username: profile.username as string | undefined,
      picture: profile.avatar_url as string | undefined,
      provider: "gitlab",
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
    const response = await fetch("https://gitlab.com/api/v4/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch GitLab user: ${response.statusText}`);
    }

    return response.json();
  },
} as ProviderBase;
