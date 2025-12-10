import type { OAuthTokens, OAuthProfile, ProviderBase } from "../provider/types";

export default {
  name: "stripe",
  authorizationUrl: "https://connect.stripe.com/oauth/authorize",
  tokenUrl: "https://connect.stripe.com/oauth/token",
  scopes: ["read_write"] as const,

  normalizeProfile(rawProfile: unknown): OAuthProfile {
    const profile = rawProfile as Record<string, unknown>;
    const stripeUser = profile.stripe_user as
      | Record<string, unknown>
      | undefined;
    return {
      id: String(stripeUser?.user_id),
      email: stripeUser?.email as string | undefined,
      name: stripeUser?.business_name as string | undefined,
      picture: undefined,
      provider: "stripe",
      raw: profile,
    };
  },

  normalizeTokens(rawTokens: unknown): OAuthTokens {
    const tokens = rawTokens as Record<string, unknown>;
    return {
      accessToken: tokens.access_token as string,
      tokenType: tokens.token_type as string | undefined,
      raw: tokens,
    };
  },

  async fetchProfile(accessToken: string): Promise<unknown> {
    const response = await fetch("https://api.stripe.com/v1/oauth/token", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Stripe user: ${response.statusText}`);
    }

    return response.json();
  },
} as ProviderBase;
