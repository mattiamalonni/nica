# nica

A minimal, unopinionated OAuth2 authentication library. Provides a composable API for handling OAuth flows with built-in support for multiple providers. Fully typed with TypeScript.

## Packages

| Package | Description |
|---|---|
| [`nica`](./packages/nica) | Core OAuth2 library — framework-agnostic, works in any Node.js environment |
| [`nica-next`](./packages/nica-next) | Next.js adapter — session management, cookie handling, React hooks |

## Installation

```bash
# Core only (Node.js, Express, Fastify, ...)
npm install nica

# With Next.js support
npm install nica nica-next
```

## Usage

### Generic (any Node.js environment)

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

// 1. Redirect the user to the provider
const url = auth.generateAuthUrl("github");

// 2. Handle the OAuth callback
const { tokens, profile, provider } = await auth.authenticate("github", code);
// → decide what to do: save to DB, create session, etc.
```

### With Next.js

```typescript
import { nicaNext } from "nica-next";

const auth = nicaNext({
  providers: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      redirectUri: "https://myapp.com/api/auth/github/callback",
    },
  },
  session: {
    secret: process.env.SESSION_SECRET!,
  },
  onProfile: async ({ profile }) => {
    // Save user to DB, return data to store in session
    const user = await db.upsertUser(profile);
    return { userId: user.id };
  },
});
```

**Redirect route** — `app/api/auth/[provider]/route.ts`:

```typescript
export async function GET(_req: Request, { params }: { params: { provider: string } }) {
  return Response.redirect(auth.generateAuthUrl(params.provider));
}
```

**Callback route** — `app/api/auth/[provider]/callback/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return new Response("Missing code", { status: 400 });

  const res = NextResponse.redirect(new URL("/dashboard", req.url));
  await auth.authenticate(params.provider, code, { response: res });
  return res;
}
```

**Read session in a Server Component:**

```typescript
const session = await auth.session.get();
if (!session) redirect("/login");
```

**React hook in a Client Component:**

```typescript
"use client";

import { withReactSession } from "nica-next";

const { useSession } = withReactSession(auth.session);

export function Profile() {
  const { session, loading, error } = useSession();
  if (loading) return <p>Loading...</p>;
  if (!session) return <p>Not authenticated</p>;
  return <p>Welcome {session.userId}</p>;
}
```

**Destroy session (logout):**

```typescript
const res = NextResponse.redirect(new URL("/", req.url));
await auth.session.destroy({ response: res });
return res;
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

## Session Configuration (`nica-next`)

```typescript
session: {
  secret: string;                  // required, min 32 chars
  strategy?: "encrypted" | "signed"; // default: "encrypted" (AES-GCM)
  tokenExp?: number;               // default: 7 days (seconds)
  cookie?: {
    name?: string;                 // default: "nica_session"
    maxAge?: number;               // default: 7 days (seconds)
    httpOnly?: boolean;            // default: true
    secure?: boolean;              // default: true
    sameSite?: "lax" | "strict" | "none"; // default: "lax"
    path?: string;                 // default: "/"
  },
}
```

## License

MIT

