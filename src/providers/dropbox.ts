import type { OAuthTokens, OAuthProfile, ProviderBase } from "../provider/types";

export default {
  name: "dropbox",
  authorizationUrl: "https://www.dropbox.com/oauth2/authorize",
  tokenUrl: "https://api.dropboxapi.com/oauth2/token",
  scopes: [] as const,

  normalizeProfile(rawProfile: unknown): OAuthProfile {
    const profile = rawProfile as Record<string, unknown>;
    const account = profile.account_id as Record<string, unknown> | undefined;
    return {
      id: String(profile.account_id),
      email: profile.email as string | undefined,
      name: profile.display_name as string | undefined,
      picture: profile.profile_photo_url as string | undefined,
      provider: "dropbox",
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
    const response = await fetch(
      "https://api.dropboxapi.com/2/users/get_current_account",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Dropbox user: ${response.statusText}`);
    }

    return response.json();
  },
} as ProviderBase;
