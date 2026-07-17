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

// 1. Generate the authorization URL
const url = auth.generateAuthUrl("github");

// 2. Handle the OAuth callback
const { tokens, profile, provider } = await auth.authenticate("github", code);
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
      exchangeCodeForTokens?: (code: string) => Promise<unknown>;
      fetchProfile?: (accessToken: string) => Promise<unknown>;
      normalizeProfile?: (raw: unknown) => AuthProfile;
      normalizeTokens?: (raw: unknown) => AuthTokens;
      getAuthUrl?: () => string;
      handleCallback?: (code: string) => Promise<AuthCallback>;
    },
  },
});
```

## License

MIT
