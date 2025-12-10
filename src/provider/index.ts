import type { OAuthProfile, OAuthTokens } from "../provider/types";
import * as PROVIDERS from "../providers";

export class Provider {
  public name: string;
  private clientId: string;
  private clientSecret: string;

  private authorizationUrl: string;
  private tokenUrl: string;

  private scopes: string[];
  private redirectUri: string;
  private normalizeTokens: (rawTokens: unknown) => OAuthTokens;
  private normalizeProfile: (rawProfile: unknown) => OAuthProfile;
  private fetchProfile: (accessToken: string) => Promise<unknown>;

  constructor(
    name: string,
    configs: {
      clientId: string;
      clientSecret: string;
      redirectUri?: string;
      scopes?: string[];
    },
  ) {
    this.name = name;
    const { clientId, clientSecret, redirectUri, scopes } = configs;

    if (!clientId || !clientSecret) {
      throw new Error(
        `Provider "${name}" requires both clientId and clientSecret`,
      );
    }

    this.clientId = clientId;
    this.clientSecret = clientSecret;

    const provider = PROVIDERS[name as keyof typeof PROVIDERS];

    if (!provider) {
      throw new Error(`Provider "${name}" is not supported`);
    }

    this.redirectUri = redirectUri || `/api/oauth/${name}/callback`;
    this.scopes = scopes || provider.scopes;
    this.authorizationUrl = provider.authorizationUrl;
    this.tokenUrl = provider.tokenUrl;
    this.normalizeTokens = provider.normalizeTokens;
    this.normalizeProfile = provider.normalizeProfile;
    this.fetchProfile = provider.fetchProfile ?? (async () => null);
  }

  public getRedirectUrl(): string {
    const scopes = this.scopes;

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: "code",
      scope: scopes.join(" "),
    });

    return `${this.authorizationUrl}?${params.toString()}`;
  }

  public async handleCallback(
    code: string,
  ): Promise<{ tokens: OAuthTokens; profile: OAuthProfile }> {
    const rawTokens = await this.exchangeCodeForTokens(code);
    const tokens = this.normalizeTokens(rawTokens);

    const rawProfile = await this.fetchProfile(tokens.accessToken);
    const profile = this.normalizeProfile(rawProfile);

    return { tokens, profile };
  }

  private async exchangeCodeForTokens(code: string): Promise<unknown> {
    const response = await fetch(this.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: this.redirectUri,
      }).toString(),
    });

    if (!response.ok) {
      throw new Error(
        `Failed to exchange code for tokens: ${response.statusText}`,
      );
    }

    return response.json();
  }
}
