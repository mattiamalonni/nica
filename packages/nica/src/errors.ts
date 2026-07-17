export const NicaErrorCode = {
  PROVIDER_NOT_CONFIGURED: "PROVIDER_NOT_CONFIGURED",
  INVALID_PROVIDER_CONFIG: "INVALID_PROVIDER_CONFIG",
  PROVIDER_FETCH_FAILED: "PROVIDER_FETCH_FAILED",
  TOKEN_EXCHANGE_FAILED: "TOKEN_EXCHANGE_FAILED",
  INVALID_SESSION_CONFIG: "INVALID_SESSION_CONFIG",
  PKCE_COOKIE_MISSING: "PKCE_COOKIE_MISSING",
  INVALID_STATE: "INVALID_STATE",
} as const;

export type NicaErrorCode = (typeof NicaErrorCode)[keyof typeof NicaErrorCode];

export class NicaError extends Error {
  readonly code: NicaErrorCode;
  readonly provider?: string;

  constructor(message: string, options: { code: NicaErrorCode; provider?: string; cause?: unknown }) {
    super(message, { cause: options.cause });
    this.name = "NicaError";
    this.code = options.code;
    this.provider = options.provider;
  }
}
