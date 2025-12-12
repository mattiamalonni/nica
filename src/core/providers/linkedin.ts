import { ProviderConfig } from "../types";

export default {
  authorizationUrl: "https://www.linkedin.com/oauth/v2/authorization",
  tokenUrl: "https://www.linkedin.com/oauth/v2/accessToken",
  scopes: ["openid", "profile", "email"],

  normalizeProfile(rawProfile: unknown) {
    const profile = rawProfile as Record<string, unknown>;
    const localizedFirstName = profile.localizedFirstName as string | undefined;
    const localizedLastName = profile.localizedLastName as string | undefined;
    const profilePicture = profile.profilePicture as Record<string, unknown> | undefined;
    const dpDisplayUrl = profilePicture?.displayImage as string | undefined;
    
    return {
      id: String(profile.id),
      email: profile.email as string | undefined,
      name: [localizedFirstName, localizedLastName].filter(Boolean).join(" ") || undefined,
      picture: dpDisplayUrl,
      provider: "linkedin",
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
    const response = await fetch("https://api.linkedin.com/v2/me?projection=(id,localizedFirstName,localizedLastName,profilePicture(displayImage))", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch LinkedIn user: ${response.statusText}`);
    }

    return response.json();
  },
} as Omit<ProviderConfig, "clientId" | "clientSecret">;
