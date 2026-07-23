# nica-next

Next.js adapter for [`nica`](../nica) — session management, cookie handling, and React hooks.

## Installation

```bash
npm install nica-next
```

## Usage

```typescript
import { createNica, createNicaSession, createNicaNext } from "nica-next";

const nica = createNica({
  providers: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      redirectUri: "https://myapp.com/api/auth/github/callback",
    },
  },
});

const session = createNicaSession({
  secret: process.env.SESSION_SECRET!,
});

const auth = createNicaNext({
  nica,
  session,
  onProfile: async ({ profile }) => {
    // Save user to DB, return data to store in session
    const user = await db.upsertUser(profile);
    return { userId: user.id };
  },
});
```

**Redirect route** — `app/api/auth/[provider]/route.ts`:

```typescript
export async function GET(_req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  return auth.redirect(provider);
}
```

**Callback route** — `app/api/auth/[provider]/callback/route.ts`:

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const { response } = await auth.callback(req, provider);
  return NextResponse.redirect(new URL("/dashboard", req.url), { headers: response.headers });
}
```

**Read session in a Server Component:**

```typescript
const data = await session.get();
if (!data) redirect("/login");
```

**React session — setup:**

`createNicaNext()` is server-safe and can be imported from Server Components. `useNica` lives in a separate client-only entry so it never leaks into the server bundle.

```typescript
// lib/auth.ts  (server-safe — import freely from Server Components)
import { createNica, createNicaSession, createNicaNext } from "nica-next";

const nica = createNica({ providers: { ... } });
export const session = createNicaSession({ secret: process.env.SESSION_SECRET! });
export const auth = createNicaNext({ nica, session, onProfile: async () => { ... } });
```

**Wrap your root layout with `SessionProvider`** — `app/layout.tsx`:

```tsx
import { SessionProvider } from "nica-next/server";
import { session } from "@/lib/auth";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

**Use `useNica` in any Client Component:**

```typescript
"use client";

import { useNica } from "nica-next/client";

export function Profile() {
  const { session } = useNica<{ userId: string }>();
  if (!session) return <p>Not authenticated</p>;
  return <p>Welcome {session.userId}</p>;
}
```

**Destroy session (logout):**

```typescript
const res = NextResponse.redirect(new URL("/", req.url));
await session.destroy({ response: res });
return res;
```

## Session Configuration

```typescript
const session = createNicaSession({
  secret: "...", // required, min 32 chars
  strategy: "encrypted", // "encrypted" (default, AES-GCM) | "signed" (HMAC, readable payload)
  tokenExp: 604800, // default: 7 days (seconds)
  cookie: {
    name: "nica_session", // default: "nica_session"
    maxAge: 604800, // default: 7 days (seconds)
    httpOnly: true, // default: true
    secure: true, // default: true
    sameSite: "lax", // default: "lax"
    path: "/", // default: "/"
    domain: undefined, // default: host-only
  },
});
```

## Providers

Supports all providers from [`nica`](../nica#supported-providers): `google` · `github` · `facebook` · `linkedin` · `slack` · `twitter` · `microsoft` · `twitch` · `discord`

Custom providers are also supported — see [`nica` docs](../nica#custom-providers).

## Error Handling

`redirect()` and `callback()` throw `NicaError` on failure. Additional error codes specific to `nica-next`:

| Code                  | When thrown                                                                      |
| --------------------- | -------------------------------------------------------------------------------- |
| `PKCE_COOKIE_MISSING` | `callback()` called but the PKCE cookie is absent or expired                     |
| `INVALID_STATE`       | PKCE cookie signature invalid, or `state` mismatch between redirect and callback |

## License

MIT
