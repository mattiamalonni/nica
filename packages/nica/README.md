# nica

A minimal, unopinionated OAuth2 authentication library. Provides a composable API for handling OAuth flows with built-in support for multiple providers. Fully typed with TypeScript.

## Installation

```bash
npm install nica
```

## Usage

```typescript
import { nica } from "nica";

const auth = nica({
  providers: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      redirectUri: "https://myapp.com/auth/github/callback",
    },
  },
});

// 1. Generate the authorization URL (includes CSRF state and PKCE verifier)
const { url, state, codeVerifier } = await auth.getRedirectUrl("github");
// → save `state` and `codeVerifier` somewhere between this request and the callback
//   (e.g. short-lived signed cookies)

// 2a. Exchange the code for tokens only (e.g. to save them or call extra provider APIs)
const tokens = await auth.exchangeCode("github", code, codeVerifier);

// 2b. Or exchange + fetch the user profile in one step
const { tokens, profile, provider } = await auth.authenticate("github", code, codeVerifier);
// → decide what to do: save to DB, create session, etc.
```

## Supported Providers

`google` · `github` · `facebook` · `linkedin` · `slack` · `twitter` · `microsoft` · `twitch` · `discord`

## Provider Configuration

```typescript
nica({
  providers: {
    github: {
      clientId: string;           // required
      clientSecret: string;       // required
      redirectUri: string;        // required — full URL, e.g. "https://myapp.com/auth/github/callback"

      // optional overrides
      scopes?: string[];
      authorizationUrl?: string;
      tokenUrl?: string;
      exchangeCodeForTokens?: (code: string, codeVerifier?: string) => Promise<unknown>;
      fetchProfile?: (accessToken: string) => Promise<unknown>;
      normalizeProfile?: (raw: unknown) => AuthProfile;
      normalizeTokens?: (raw: unknown) => AuthTokens;
      getAuthUrl?: () => Promise<{ url: string; state: string; codeVerifier: string }>;
    },
  },
});
```

## Error Handling

All errors thrown by nica are instances of `NicaError`, which extends the native `Error` with two extra fields:

| Field | Type | Description |
|-------|------|-------------|
| `code` | `NicaErrorCode` | Machine-readable slug identifying the error |
| `provider` | `string \| undefined` | Provider involved, if applicable |
| `cause` | `unknown` | Underlying cause (ES2022 native `Error.cause`) |

```typescript
import { NicaError, NicaErrorCode } from "nica";

try {
  const { tokens, profile } = await auth.authenticate("github", code, codeVerifier);
} catch (err) {
  if (err instanceof NicaError) {
    console.error(err.code);     // e.g. "PROVIDER_FETCH_FAILED"
    console.error(err.provider); // e.g. "github"
    console.error(err.cause);    // underlying error, if any
  }
}
```

### Error codes

| Code | When thrown |
|------|-------------|
| `PROVIDER_NOT_CONFIGURED` | `authenticate()` / `getRedirectUrl()` called for a provider not passed to `nica()` |
| `INVALID_PROVIDER_CONFIG` | Required config field missing for a provider |
| `PROVIDER_FETCH_FAILED` | HTTP error while fetching user profile from provider |
| `TOKEN_EXCHANGE_FAILED` | HTTP error while exchanging authorization code for tokens |
| `INVALID_SESSION_CONFIG` | Invalid session config (via `nica-next`) |

## Custom Providers

Any OAuth2-compatible provider can be used by supplying a full config. Built-in defaults (URLs, normalizers) are only available for the supported providers listed above.

```typescript
const auth = nica({
  providers: {
    keycloak: {
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      redirectUri: "https://myapp.com/auth/keycloak/callback",
      scopes: ["openid", "profile", "email"],
      authorizationUrl: "https://auth.mycompany.com/realms/myrealm/protocol/openid-connect/auth",
      tokenUrl: "https://auth.mycompany.com/realms/myrealm/protocol/openid-connect/token",
      normalizeProfile: (raw) => {
        const p = raw as Record<string, unknown>;
        return { id: String(p.sub), email: p.email as string, name: p.name as string, provider: "keycloak", raw: p };
      },
      normalizeTokens: (raw) => {
        const t = raw as Record<string, unknown>;
        return { accessToken: t.access_token as string, raw: t };
      },
      fetchProfile: async (accessToken) => {
        const res = await fetch("https://auth.mycompany.com/realms/myrealm/protocol/openid-connect/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        return res.json();
      },
    },
  },
});
```

## Security

`getRedirectUrl()` automatically generates a cryptographically random `state` parameter (CSRF protection) and a PKCE `code_verifier`/`code_challenge` pair (RFC 7636). You are responsible for persisting `state` and `codeVerifier` between the redirect and the callback (e.g. via short-lived cookies), and for verifying that the `state` received in the callback matches the one you stored.

## Next.js

Use [`nica-next`](https://www.npmjs.com/package/nica-next) for session management and React hooks in Next.js apps.

## React

Use [`nica-react`](https://www.npmjs.com/package/nica-react) for session context and `useSession()` hook in React apps.

## License

MIT
