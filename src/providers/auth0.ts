import type { OAuthTokens, OAuthProfile, ProviderBase } from "../provider/types";

export default {
  name: "auth0",
  authorizationUrl: "https://YOUR_DOMAIN.auth0.com/authorize",
  tokenUrl: "https://YOUR_DOMAIN.auth0.com/oauth/token",
  scopes: ["openid", "email", "profile"] as const,

  normalizeProfile(rawProfile: unknown): OAuthProfile {
    const profile = rawProfile as Record<string, unknown>;
    return {
      id: String(profile.sub),
      email: profile.email as string | undefined,
      name: profile.name as string | undefined,
      picture: profile.picture as string | undefined,
      provider: "auth0",
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
    const response = await fetch("https://YOUR_DOMAIN.auth0.com/userinfo", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Auth0 user: ${response.statusText}`);
    }

    return response.json();
  },
} as ProviderBase;
