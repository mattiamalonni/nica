import type { OAuthTokens, OAuthProfile, ProviderBase } from "../provider/types";

export default {
  name: "google",
  authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenUrl: "https://oauth2.googleapis.com/token",
  scopes: ["openid", "email", "profile"] as const,

  normalizeProfile(rawProfile: unknown): OAuthProfile {
    const profile = rawProfile as Record<string, unknown>;
    return {
      id: String(profile.sub),
      email: profile.email as string | undefined,
      name: profile.name as string | undefined,
      picture: profile.picture as string | undefined,
      provider: "google",
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

  /**
   * Google fornisce i dati utente tramite l'endpoint userinfo
   * che ritorna direttamente i claim del token JWT
   */
  async fetchProfile(accessToken: string): Promise<unknown> {
    const response = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Google user: ${response.statusText}`);
    }

    return response.json();
  },
} as ProviderBase;
