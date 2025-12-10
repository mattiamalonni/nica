import type { OAuthTokens, OAuthProfile, ProviderBase } from "../provider/types";

export default {
  name: "slack",
  authorizationUrl: "https://slack.com/oauth/v2/authorize",
  tokenUrl: "https://slack.com/api/oauth.v2.access",
  scopes: ["users:read", "users:read.email"] as const,

  normalizeProfile(rawProfile: unknown): OAuthProfile {
    const profile = rawProfile as Record<string, unknown>;
    const user = profile.user as Record<string, unknown> | undefined;
    const profileData = user?.profile as Record<string, unknown> | undefined;
    return {
      id: String(user?.id),
      email: user?.email as string | undefined,
      name: user?.real_name as string | undefined,
      username: user?.name as string | undefined,
      picture: profileData?.image_192 as string | undefined,
      provider: "slack",
      raw: profile,
    };
  },

  normalizeTokens(rawTokens: unknown): OAuthTokens {
    const tokens = rawTokens as Record<string, unknown>;
    return {
      accessToken: tokens.access_token as string,
      raw: tokens,
    };
  },

  async fetchProfile(accessToken: string): Promise<unknown> {
    const response = await fetch("https://slack.com/api/users.identity", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Slack user: ${response.statusText}`);
    }

    return response.json();
  },
} as ProviderBase;
