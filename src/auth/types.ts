import type { OAuthProfileData } from "../provider/types";
import * as PROVIDERS from "../providers";

export interface ProviderConfig {
  clientId: string;
  clientSecret: string;
  redirectUri?: string;
  scopes?: string[];
}

export type SupportedProviders = keyof typeof PROVIDERS;

export type TypedProvidersConfig = Partial<
  Record<SupportedProviders, ProviderConfig>
>;

export interface NextOAuthConfig<TResult = void> {
  secret: string;
  providers: TypedProvidersConfig;
  origin?: string;
  onProfile?: (data: OAuthProfileData) => Promise<TResult>;
}
