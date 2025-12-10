import type { OAuthProfileData } from "../provider/types";
import { Provider } from "../provider";
import { NextOAuthConfig } from "./types";

export class NextOAuth<TResult = void> {
  private secret: string;
  private origin?: string;
  private providers: Provider[] = [];
  private onProfile?: (data: OAuthProfileData) => Promise<TResult>;

  constructor(config: NextOAuthConfig<TResult>) {
    const { secret, providers, origin, onProfile } = config;

    if (!secret || secret.length < 32) {
      throw new Error("Secret must be at least 32 characters long");
    }

    this.secret = secret;
    this.origin = origin;
    this.onProfile = onProfile;

    Object.entries(providers).forEach(([name, providerConfig]) => {
      this.providers.push(new Provider(name, providerConfig));
    });

    if (this.providers.length === 0) {
      throw new Error("At least one provider must be configured");
    }
  }

  private getProviderByName(name: string): Provider {
    const provider = this.providers.find((p) => p.name === name);
    if (!provider) {
      throw new Error(`Provider "${name}" is not configured`);
    }
    return provider;
  }

  public getRedirectUrl(providerName: string): string {
    const provider = this.getProviderByName(providerName);
    return provider.getRedirectUrl();
  }

  public async handleCallback(
    providerName: string,
    code: string,
  ): Promise<TResult extends void ? void : TResult> {
    const provider = this.getProviderByName(providerName);
    const { tokens, profile } = await provider.handleCallback(code);

    if (this.onProfile && profile) {
      const data = await this.onProfile({ tokens, profile });
      return data as TResult extends void ? void : TResult;
    }
    return undefined as TResult extends void ? void : TResult;
  }
}
