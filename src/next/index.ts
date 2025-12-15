import { cookies, headers } from "next/headers";

export type SessionConfig = {
  secret: string;
  strategy?: "encrypted" | "signed";
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

export type SessionPayload = Record<string, unknown> & {
  iat?: number;
  exp?: number;
};

export type SessionContext = {
  request?: Request;
  response?: any;
};

type AuthInstance<T> = {
  listProviders: () => string[];
  getAuthUrl: (providerName: string) => string;
  handleCallback: (providerName: string, code: string) => Promise<T>;
};

type SessionMethods<T> = {
  create: (data: SessionPayload, context?: SessionContext) => Promise<string>;
  get: (context?: SessionContext) => Promise<SessionPayload | undefined>;
  peek: (context?: SessionContext) => Promise<(SessionPayload & { iat: number; exp: number }) | undefined>;
  destroy: (context?: SessionContext) => Promise<void>;
};

type AuthWithSession<T> = AuthInstance<T> & {
  session: SessionMethods<T>;
};

// Helper functions for encryption/decryption using SubtleCrypto
const encoder = new TextEncoder();
const decoder = new TextDecoder();

async function hashSecret(secret: string, salt: Uint8Array): Promise<Uint8Array> {
  const secretBuf = encoder.encode(secret);
  const combined = new Uint8Array(secretBuf.length + salt.length);
  combined.set(secretBuf);
  combined.set(salt, secretBuf.length);
  const hash = await crypto.subtle.digest("SHA-256", combined);
  return new Uint8Array(hash);
}

async function encryptData(data: string, secret: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(16));
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const key = await hashSecret(secret, salt);
  const cryptoKey = await crypto.subtle.importKey("raw", key.buffer as ArrayBuffer, { name: "AES-GCM" }, false, ["encrypt"]);

  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, encoder.encode(data));

  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return btoa(String.fromCharCode(...Array.from(combined)));
}

async function decryptData(token: string, secret: string): Promise<string | null> {
  try {
    const combined = Uint8Array.from(atob(token), (c) => c.charCodeAt(0));

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 32);
    const encrypted = combined.slice(32);

    const key = await hashSecret(secret, salt);
    const cryptoKey = await crypto.subtle.importKey("raw", key.buffer as ArrayBuffer, { name: "AES-GCM" }, false, ["decrypt"]);

    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, encrypted);

    return decoder.decode(decrypted);
  } catch {
    return null;
  }
}

// HMAC signing for "signed" strategy
async function signData(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const signatureStr = btoa(String.fromCharCode(...Array.from(new Uint8Array(signature))));

  return `${data}.${signatureStr}`;
}

async function verifySignedData(token: string, secret: string): Promise<string | null> {
  try {
    const [data, signature] = token.split(".");
    if (!data || !signature) return null;

    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);

    const signatureBuf = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify("HMAC", key, signatureBuf, encoder.encode(data));

    return isValid ? data : null;
  } catch {
    return null;
  }
}

export function withSession<T = void>(oauth: AuthInstance<T>, sessionConfig: SessionConfig): AuthWithSession<T> {
  // Validate required parameters
  if (!oauth) throw new Error("OAuth instance is required");
  if (!sessionConfig) throw new Error("Session config is required");
  if (!sessionConfig.secret) throw new Error("Session secret is required");
  if (sessionConfig.secret.length < 32) throw new Error("Session secret must be at least 32 characters long");

  // Validate optional parameters
  if (sessionConfig.strategy && !["encrypted", "signed"].includes(sessionConfig.strategy)) {
    throw new Error("Strategy must be either 'encrypted' or 'signed'");
  }

  if (sessionConfig.tokenExp !== undefined && sessionConfig.tokenExp <= 0) {
    throw new Error("Token expiration must be a positive number");
  }

  if (sessionConfig.cookie?.name !== undefined && sessionConfig.cookie.name.length === 0) {
    throw new Error("Cookie name cannot be empty");
  }

  if (sessionConfig.cookie?.maxAge !== undefined && sessionConfig.cookie.maxAge <= 0) {
    throw new Error("Cookie maxAge must be a positive number");
  }

  if (sessionConfig.cookie?.sameSite && !["lax", "strict", "none"].includes(sessionConfig.cookie.sameSite)) {
    throw new Error("Cookie sameSite must be 'lax', 'strict', or 'none'");
  }

  const getCookieStore = async () => await cookies();

  // Merge with defaults
  const config = {
    secret: sessionConfig.secret,
    strategy: (sessionConfig.strategy || "encrypted") as "encrypted" | "signed",
    tokenExp: sessionConfig.tokenExp || 1000 * 60 * 60 * 24 * 7, // 7 days default
    cookie: {
      name: sessionConfig.cookie?.name || "nica_auth",
      maxAge: sessionConfig.cookie?.maxAge || 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: sessionConfig.cookie?.httpOnly !== false,
      secure: sessionConfig.cookie?.secure !== false,
      sameSite: sessionConfig.cookie?.sameSite || "lax",
      path: sessionConfig.cookie?.path || "/",
    },
  };

  const encodeToken = async (payload: SessionPayload): Promise<string> => {
    const now = Math.floor(Date.now() / 1000);
    const tokenData: SessionPayload = {
      ...payload,
      iat: now,
      exp: now + Math.floor(config.tokenExp / 1000),
    };

    const jsonStr = JSON.stringify(tokenData);

    if (config.strategy === "encrypted") {
      return await encryptData(jsonStr, config.secret);
    } else {
      return await signData(btoa(jsonStr), config.secret);
    }
  };

  const decodeToken = async (token: string, validateExp: boolean): Promise<SessionPayload | null> => {
    let jsonStr: string | null = null;

    if (config.strategy === "encrypted") {
      jsonStr = await decryptData(token, config.secret);
    } else {
      const decoded = await verifySignedData(token, config.secret);
      if (decoded) {
        jsonStr = atob(decoded);
      }
    }

    if (!jsonStr) return null;

    try {
      const payload = JSON.parse(jsonStr) as SessionPayload;

      if (validateExp && payload.exp) {
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
          return null;
        }
      }

      return payload;
    } catch {
      return null;
    }
  };

  const setSessionCookie = async (token: string, context?: SessionContext) => {
    if (context?.response) {
      context.response.cookies.set(config.cookie.name, token, {
        maxAge: config.cookie.maxAge,
        httpOnly: config.cookie.httpOnly,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
        path: config.cookie.path,
      });
    } else {
      const cookieStore = await getCookieStore();
      cookieStore.set(config.cookie.name, token, {
        maxAge: config.cookie.maxAge,
        httpOnly: config.cookie.httpOnly,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite as any,
        path: config.cookie.path,
      });
    }
  };

  const getSessionCookie = async (context?: SessionContext): Promise<string | undefined> => {
    if (context?.request) {
      try {
        const headersList = context.request.headers;
        const cookieHeader = headersList.get("cookie");
        if (cookieHeader) {
          const cookieList = cookieHeader.split(";").map((c) => c.trim());
          const sessionCookie = cookieList.find((c) => c.startsWith(`${config.cookie.name}=`));
          if (sessionCookie) {
            const parts = sessionCookie.split("=");
            return parts.length > 1 ? parts[1] : undefined;
          }
        }
      } catch {
        // Silently fail and fall back to next method
      }
    }

    const cookieStore = await getCookieStore();
    return cookieStore.get(config.cookie.name)?.value;
  };

  const clearSessionCookie = async (context?: SessionContext) => {
    if (context?.response) {
      context.response.cookies.delete(config.cookie.name);
    } else {
      const cookieStore = await getCookieStore();
      cookieStore.delete(config.cookie.name);
    }
  };

  return {
    ...oauth,
    session: {
      create: async (data: SessionPayload, context?: SessionContext): Promise<string> => {
        const token = await encodeToken(data);
        await setSessionCookie(token, context);
        return token;
      },

      get: async (context?: SessionContext): Promise<SessionPayload | undefined> => {
        const token = await getSessionCookie(context);
        if (!token) return undefined;

        return (await decodeToken(token, true)) || undefined;
      },

      peek: async (context?: SessionContext): Promise<(SessionPayload & { iat: number; exp: number }) | undefined> => {
        const token = await getSessionCookie(context);
        if (!token) return undefined;

        const payload = await decodeToken(token, false);
        if (!payload) return undefined;

        return payload as SessionPayload & { iat: number; exp: number };
      },

      destroy: async (context?: SessionContext): Promise<void> => {
        await clearSessionCookie(context);
      },
    },
  };
}
