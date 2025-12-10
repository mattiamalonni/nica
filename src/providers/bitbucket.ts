import type {
  OAuthTokens,
  OAuthProfile,
  ProviderBase,
} from "../provider/types";

export default {
  name: "bitbucket",
  authorizationUrl: "https://bitbucket.org/site/oauth2/authorize",
  tokenUrl: "https://bitbucket.org/site/oauth2/access_token",
  scopes: ["account", "email"] as const,

  normalizeProfile(rawProfile: unknown): OAuthProfile {
    const profile = rawProfile as Record<string, unknown>;
    const links = profile.links as Record<string, unknown> | undefined;
    const avatar = links?.avatar as Record<string, unknown> | undefined;
    return {
      id: String(profile.uuid),
      email: profile.email as string | undefined,
      name: profile.display_name as string | undefined,
      username: profile.username as string | undefined,
      picture: avatar?.href as string | undefined,
      provider: "bitbucket",
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

  async fetchProfile(accessToken: string): Promise<unknown> {
    const response = await fetch("https://api.bitbucket.org/2.0/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Bitbucket user: ${response.statusText}`);
    }

    return response.json();
  },
} as ProviderBase;
