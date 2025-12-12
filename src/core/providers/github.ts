import { ProviderConfig } from "../types";

export default {
  authorizationUrl: "https://github.com/login/oauth/authorize",
  tokenUrl: "https://github.com/login/oauth/access_token",
  scopes: ["user:email"],

  normalizeProfile(rawProfile: unknown) {
    const profile = rawProfile as Record<string, unknown>;
    return {
      id: String(profile.id),
      email: profile.email as string | undefined,
      name: profile.name as string | undefined,
      username: profile.login as string | undefined,
      picture: profile.avatar_url as string | undefined,
      provider: "github",
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

  /**
   * GitHub fornisce le email verificate tramite un endpoint separato
   * Se non c'è una email primaria nel profilo, cerca tra le email verificate
   */
  async fetchProfile(accessToken: string) {
    // Fetcha il profilo utente
    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!userResponse.ok) {
      throw new Error(`Failed to fetch GitHub user: ${userResponse.statusText}`);
    }

    const user = await userResponse.json();

    // Se non c'è una email pubblica, fetcha le email verificate
    if (!user.email) {
      try {
        const emailsResponse = await fetch("https://api.github.com/user/emails", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (emailsResponse.ok) {
          const emails = await emailsResponse.json();
          // Trova la email primaria e verificata
          const primaryEmail = emails.find((e: unknown) => {
            const email = e as Record<string, unknown>;
            return email.primary === true && email.verified === true;
          });
          if (primaryEmail) {
            const primaryEmailData = primaryEmail as Record<string, unknown>;
            user.email = primaryEmailData.email;
          }
        }
      } catch (error) {
        // Se fallisce il fetching delle email, continua con quello che abbiamo
        console.warn("Failed to fetch GitHub emails:", error);
      }
    }

    return user;
  },
} as Omit<ProviderConfig, "clientId" | "clientSecret">;
