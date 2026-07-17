# nica

A minimal, unopinionated OAuth2 authentication library. Fully typed with TypeScript.

> **Supported providers:** `google` · `github` · `facebook` · `linkedin` · `slack` · `twitter` · `microsoft` · `twitch` · `discord`

---

## Packages

| Package | Version | Description |
|---|---|---|
| [`nica`](./packages/nica) | [![npm](https://img.shields.io/npm/v/nica)](https://www.npmjs.com/package/nica) | Core OAuth2 library — framework-agnostic, works in any Node.js environment |
| [`nica-react`](./packages/nica-react) | [![npm](https://img.shields.io/npm/v/nica-react)](https://www.npmjs.com/package/nica-react) | React primitives — session context and `useSession()` hook |
| [`nica-next`](./packages/nica-next) | [![npm](https://img.shields.io/npm/v/nica-next)](https://www.npmjs.com/package/nica-next) | Next.js adapter — session management, cookie handling, React hooks |

---

## `nica` — Core

Framework-agnostic OAuth2 core. Handles authorization URLs, PKCE, CSRF state, token exchange, and profile normalization.

```bash
npm install nica
```

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
// → save `state` and `codeVerifier` between this request and the callback
//   (e.g. short-lived signed cookies)

// 2. Handle the OAuth callback
// → verify that the `state` query param matches what you saved
const { tokens, profile, provider } = await auth.authenticate("github", code, codeVerifier);
// → decide what to do: save to DB, create session, etc.
```

`getRedirectUrl()` automatically generates a cryptographically random `state` parameter (CSRF protection) and a PKCE `code_verifier`/`code_challenge` pair (RFC 7636).

[Full documentation →](./packages/nica)

---

## `nica-next` — Next.js Adapter

Session management, encrypted cookies, and React hooks for Next.js App Router.

```bash
npm install nica-next
```

```typescript
import { nicaNext } from "nica-next/server";

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
    const user = await db.upsertUser(profile);
    return { userId: user.id };
  },
});
```

**Redirect route** — `app/api/auth/[provider]/route.ts`:

```typescript
export async function GET(_req: Request, { params }: { params: { provider: string } }) {
  const { url } = await auth.getRedirectUrl(params.provider as SupportedProviderName);
  return Response.redirect(url);
}
```

**Callback route** — `app/api/auth/[provider]/callback/route.ts`:

```typescript
export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return new Response("Missing code", { status: 400 });

  const res = NextResponse.redirect(new URL("/dashboard", req.url));
  await auth.authenticate(params.provider as SupportedProviderName, code, undefined, { response: res });
  return res;
}
```

**Server Component:**

```typescript
const session = await auth.session.get();
if (!session) redirect("/login");
```

**React session hooks:**

```typescript
// lib/auth.ts
import { withServerSession } from "nica-next/server";
export const { SessionProvider, useSession } = withServerSession(auth.session);
```

```tsx
// app/layout.tsx
import { SessionProvider } from "@/lib/auth";
export default function RootLayout({ children }) {
  return <html><body><SessionProvider>{children}</SessionProvider></body></html>;
}
```

```tsx
// components/Profile.tsx
"use client";
import { useSession } from "@/lib/auth";
export function Profile() {
  const { session } = useSession();
  if (!session) return <p>Not authenticated</p>;
  return <p>Welcome {session.userId}</p>;
}
```

[Full documentation →](./packages/nica-next)

---

## `nica-react` — React Primitives

Session context and `useSession()` hook for any React app (Vite, Remix, etc.).

```bash
npm install nica-react
```

```typescript
import { withReactSession } from "nica-react";

export const { SessionProvider, useSession } = withReactSession(async () => {
  const res = await fetch("/api/session");
  if (!res.ok) return undefined;
  return res.json();
});
```

```tsx
// src/App.tsx
import { SessionProvider } from "@/lib/auth";
export default function App() {
  return <SessionProvider><YourApp /></SessionProvider>;
}
```

```tsx
import { useSession } from "@/lib/auth";
export function Profile() {
  const { session, isLoading } = useSession();
  if (isLoading) return <p>Loading…</p>;
  if (!session) return <p>Not authenticated</p>;
  return <p>Welcome, user {session.userId}</p>;
}
```

[Full documentation →](./packages/nica-react)

---

## License

MIT

