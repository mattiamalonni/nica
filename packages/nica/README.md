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

// 2. Handle the OAuth callback
// → verify that the `state` query param matches what you saved
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
      handleCallback?: (code: string, codeVerifier?: string) => Promise<AuthCallback>;
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
