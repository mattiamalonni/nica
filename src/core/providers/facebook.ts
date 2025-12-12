import { ProviderConfig } from "../types";

export default {
  authorizationUrl: "https://www.facebook.com/v18.0/dialog/oauth",
  tokenUrl: "https://graph.facebook.com/v18.0/oauth/access_token",
  scopes: ["email", "public_profile"],

  normalizeProfile(rawProfile: unknown) {
    const profile = rawProfile as Record<string, unknown>;
    const picture = profile.picture as Record<string, unknown> | undefined;
    const pictureData = picture?.data as Record<string, unknown> | undefined;

    return {
      id: String(profile.id),
      email: profile.email as string | undefined,
      name: profile.name as string | undefined,
      picture: pictureData?.url as string | undefined,
      provider: "facebook",
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
    const response = await fetch("https://graph.facebook.com/me?fields=id,email,name,picture", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Facebook user: ${response.statusText}`);
    }

    return response.json();
  },
} as Omit<ProviderConfig, "clientId" | "clientSecret">;
