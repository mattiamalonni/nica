import type { OAuthTokens, OAuthProfile, ProviderBase } from "../provider/types";

export default {
  name: "facebook",
  authorizationUrl: "https://www.facebook.com/v18.0/dialog/oauth",
  tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
  scopes: ["email", "public_profile"] as const,

  normalizeProfile(rawProfile: unknown): OAuthProfile {
    const profile = rawProfile as Record<string, unknown>;
    const picture = profile.picture as
      | Record<string, Record<string, unknown>>
      | undefined;
    return {
      id: String(profile.id),
      email: profile.email as string | undefined,
      name: profile.name as string | undefined,
      picture: picture?.data?.url as string | undefined,
      provider: "facebook",
      raw: profile,
    };
  },

  normalizeTokens(rawTokens: unknown): OAuthTokens {
    const tokens = rawTokens as Record<string, unknown>;
    return {
      accessToken: tokens.access_token as string,
      expiresIn: tokens.expires_in as number | undefined,
      raw: tokens,
    };
  },

  async fetchProfile(accessToken: string): Promise<unknown> {
    const response = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${accessToken}`,
      {
        headers: {
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Facebook user: ${response.statusText}`);
    }

    return response.json();
  },
} as ProviderBase;
