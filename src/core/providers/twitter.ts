import { ProviderConfig } from "../types";

export default {
  authorizationUrl: "https://twitter.com/i/oauth2/authorize",
  tokenUrl: "https://twitter.com/2/oauth2/token",
  scopes: ["tweet.read", "users.read"],

  normalizeProfile(rawProfile: unknown) {
    const profile = rawProfile as Record<string, unknown>;
    const data = profile.data as Record<string, unknown> | undefined;

    return {
      id: String(data?.id),
      email: undefined,
      name: data?.name as string | undefined,
      picture: data?.profile_image_url as string | undefined,
      provider: "twitter",
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
    const response = await fetch("https://api.twitter.com/2/users/me?user.fields=id,name,profile_image_url", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Twitter user: ${response.statusText}`);
    }

    return response.json();
  },
} as Omit<ProviderConfig, "clientId" | "clientSecret">;
