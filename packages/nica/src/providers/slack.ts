import { ProviderConfig } from "../types";

export default {
  authorizationUrl: "https://slack.com/oauth/v2/authorize",
  tokenUrl: "https://slack.com/api/oauth.v2.access",
  scopes: ["openid", "profile", "email"],

  normalizeProfile(rawProfile: unknown) {
    const profile = rawProfile as Record<string, unknown>;

    return {
      id: String(profile.sub),
      email: profile.email as string | undefined,
      name: profile.name as string | undefined,
      picture: profile.picture as string | undefined,
      provider: "slack",
      raw: profile,
    };
  },

  normalizeTokens(rawTokens: unknown) {
    const tokens = rawTokens as Record<string, unknown>;
    return {
      accessToken: tokens.access_token as string,
      refreshToken: tokens.refresh_token as string | undefined,
      tokenType: tokens.token_type as string | undefined,
      expiresIn: tokens.expires_in as number | undefined,
      raw: tokens,
    };
  },

  async fetchProfile(accessToken: string) {
    const response = await fetch("https://slack.com/openid/connect/userinfo", {
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
} as Omit<ProviderConfig, "clientId" | "clientSecret" | "redirectUri">;
