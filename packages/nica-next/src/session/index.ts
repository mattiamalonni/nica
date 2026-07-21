import type { NextRequest, NextResponse } from "next/server";
import type { SessionPayload } from "nica";
import { NicaError, NicaErrorCode } from "nica";
import { decryptData, encryptData, signData, verifySignedData } from "../crypto";

/* -------------------------------------------------------------------------- */
/*                                   Types                                    */
/* -------------------------------------------------------------------------- */

export type SessionConfig = {
  secret: string;
  /**
   * "encrypted" (default): AES-GCM encryption via HKDF-derived key. Payload is private.
   * "signed": HMAC-SHA256 integrity only. Payload is base64-encoded and **readable** by anyone
   * with access to the cookie. Do not store sensitive data (tokens, secrets) with this strategy.
   */
  strategy?: "encrypted" | "signed";
  /** Session expiry in **seconds**. Default: 604800 (7 days). */
  tokenExp?: number;
  cookie?: {
    name?: string;
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: "lax" | "strict" | "none";
    path?: string;
  };
};

export type SessionContext = {
  request?: NextRequest;
  response?: NextResponse;
};

export type SessionMethods<T extends object> = {
  create: (data: T, context?: SessionContext) => Promise<string>;
  get: (context?: SessionContext) => Promise<SessionPayload<T> | undefined>;
  peek: (context?: SessionContext) => Promise<SessionPayload<T> | undefined>;
  destroy: (context?: SessionContext) => Promise<void>;
};

/* -------------------------------------------------------------------------- */
/*                               createSession                                */
/* -------------------------------------------------------------------------- */

export function createSession<T extends object = {}>(sessionConfig: SessionConfig): SessionMethods<T> {
  if (!sessionConfig?.secret) {
    throw new NicaError("Session secret is required", { code: NicaErrorCode.INVALID_SESSION_CONFIG });
  }

  if (sessionConfig.secret.length < 32) {
    throw new NicaError("Session secret must be at least 32 characters long", { code: NicaErrorCode.INVALID_SESSION_CONFIG });
  }

  const config = {
    secret: sessionConfig.secret,
    strategy: sessionConfig.strategy ?? "encrypted",
    tokenExp: sessionConfig.tokenExp ?? 60 * 60 * 24 * 7,
    cookie: {
      name: sessionConfig.cookie?.name ?? "nica_session",
      maxAge: sessionConfig.cookie?.maxAge ?? 60 * 60 * 24 * 7,
      httpOnly: sessionConfig.cookie?.httpOnly !== false,
      secure: sessionConfig.cookie?.secure !== false,
      sameSite: sessionConfig.cookie?.sameSite ?? "lax",
      path: sessionConfig.cookie?.path ?? "/",
    },
  };

  /* ----------------------------- Token helpers ----------------------------- */

  const encodeToken = async (payload: SessionPayload<T>): Promise<string> => {
    const json = JSON.stringify(payload);
    return config.strategy === "encrypted" ? encryptData(json, config.secret) : signData(btoa(json), config.secret);
  };

  const decodeToken = async (token: string, validateExp: boolean): Promise<SessionPayload<T> | null> => {
    let json: string | null = null;

    if (config.strategy === "encrypted") {
      json = await decryptData(token, config.secret);
    } else {
      const verified = await verifySignedData(token, config.secret);
      if (verified) json = atob(verified);
    }

    if (!json) return null;

    const payload = JSON.parse(json) as SessionPayload<T>;

    if (validateExp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  };

  /* ----------------------------- Cookie helpers ---------------------------- */

  const setCookie = async (token: string, context?: SessionContext) => {
    if (context?.response) {
      context.response.cookies.set(config.cookie.name, token, config.cookie);
    } else {
      const { cookies } = await import("next/headers");
      const store = await cookies();
      store.set(config.cookie.name, token, config.cookie);
    }
  };

  const getCookie = async (context?: SessionContext): Promise<string | undefined> => {
    if (context?.request) {
      return context.request.cookies.get(config.cookie.name)?.value;
    }
    const { cookies } = await import("next/headers");
    const store = await cookies();
    return store.get(config.cookie.name)?.value;
  };

  const clearCookie = async (context?: SessionContext) => {
    if (context?.response) {
      context.response.cookies.delete(config.cookie.name);
    } else {
      const { cookies } = await import("next/headers");
      const store = await cookies();
      store.delete(config.cookie.name);
    }
  };

  /* ------------------------------- Public API ------------------------------ */

  return {
    create: async (data: T, context?: SessionContext): Promise<string> => {
      const now = Math.floor(Date.now() / 1000);

      const payload: SessionPayload<T> = {
        ...data,
        iat: now,
        exp: now + config.tokenExp,
      };

      const token = await encodeToken(payload);
      await setCookie(token, context);
      return token;
    },

    get: async (context?: SessionContext): Promise<SessionPayload<T> | undefined> => {
      const token = await getCookie(context);
      if (!token) return undefined;

      const payload = await decodeToken(token, true);
      if (!payload) return undefined;

      return payload;
    },

    peek: async (context?: SessionContext): Promise<SessionPayload<T> | undefined> => {
      const token = await getCookie(context);
      if (!token) return undefined;

      const payload = await decodeToken(token, false);
      if (!payload) return undefined;

      return payload;
    },

    destroy: async (context?: SessionContext): Promise<void> => {
      await clearCookie(context);
    },
  };
}
