import type {
  OAuthTokens,
  OAuthProfile,
  ProviderBase,
} from "../provider/types";

export default {
  name: "amazon",
  authorizationUrl: "https://www.amazon.com/ap/oa",
  tokenUrl: "https://api.amazon.com/auth/o2/token",
  scopes: ["profile", "postal_code"] as const,

  normalizeProfile(rawProfile: unknown): OAuthProfile {
    const profile = rawProfile as Record<string, unknown>;
    return {
      id: String(profile.user_id),
      email: profile.email as string | undefined,
      name: profile.name as string | undefined,
      picture: undefined,
      provider: "amazon",
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
    const response = await fetch("https://api.amazon.com/user/profile", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Amazon user: ${response.statusText}`);
    }

    return response.json();
  },
} as ProviderBase;
