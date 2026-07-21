const encoder = new TextEncoder();
const decoder = new TextDecoder();

/* -------------------------------------------------------------------------- */
/*                              AES-GCM helpers                               */
/* -------------------------------------------------------------------------- */

async function deriveKey(secret: string, salt: Uint8Array, usage: KeyUsage[]): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(secret), "HKDF", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "HKDF", hash: "SHA-256", salt: salt as unknown as Uint8Array<ArrayBuffer>, info: new Uint8Array() },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    usage,
  );
}

export async function encryptData(data: string, secret: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));

  const cryptoKey = await deriveKey(secret, salt, ["encrypt"]);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, cryptoKey, encoder.encode(data));

  const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, salt.length);
  combined.set(new Uint8Array(encrypted), salt.length + iv.length);

  return btoa(Array.from(combined).map((b) => String.fromCharCode(b)).join(""));
}

export async function decryptData(token: string, secret: string): Promise<string | null> {
  try {
    const combined = Uint8Array.from(atob(token), (c) => c.charCodeAt(0));

    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);

    const cryptoKey = await deriveKey(secret, salt, ["decrypt"]);
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, cryptoKey, encrypted);

    return decoder.decode(decrypted);
  } catch {
    return null;
  }
}

/* -------------------------------------------------------------------------- */
/*                              HMAC-SHA256 helpers                           */
/* -------------------------------------------------------------------------- */

export async function signData(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  const signatureStr = btoa(Array.from(new Uint8Array(signature)).map((b) => String.fromCharCode(b)).join(""));

  return `${data}.${signatureStr}`;
}

export async function verifySignedData(token: string, secret: string): Promise<string | null> {
  try {
    const dotIndex = token.lastIndexOf(".");
    if (dotIndex === -1) return null;

    const data = token.slice(0, dotIndex);
    const signature = token.slice(dotIndex + 1);
    if (!data || !signature) return null;

    const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);

    const signatureBuf = Uint8Array.from(atob(signature), (c) => c.charCodeAt(0));
    const isValid = await crypto.subtle.verify("HMAC", key, signatureBuf, encoder.encode(data));

    return isValid ? data : null;
  } catch {
    return null;
  }
}
