import type { SupportedProviderName } from "./types";

export const NicaErrorCode = {
  UNSUPPORTED_PROVIDER: "UNSUPPORTED_PROVIDER",
  PROVIDER_NOT_CONFIGURED: "PROVIDER_NOT_CONFIGURED",
  INVALID_PROVIDER_CONFIG: "INVALID_PROVIDER_CONFIG",
  PROVIDER_FETCH_FAILED: "PROVIDER_FETCH_FAILED",
  TOKEN_EXCHANGE_FAILED: "TOKEN_EXCHANGE_FAILED",
  INVALID_SESSION_CONFIG: "INVALID_SESSION_CONFIG",
} as const;

export type NicaErrorCode = (typeof NicaErrorCode)[keyof typeof NicaErrorCode];

export class NicaError extends Error {
  readonly code: NicaErrorCode;
  readonly provider?: SupportedProviderName;

  constructor(message: string, options: { code: NicaErrorCode; provider?: SupportedProviderName; cause?: unknown }) {
    super(message, { cause: options.cause });
    this.name = "NicaError";
    this.code = options.code;
    this.provider = options.provider;
  }
}
