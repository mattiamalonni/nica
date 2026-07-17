# nica-next

Next.js adapter for [`nica`](../nica) — session management, cookie handling, and React hooks.

## Installation

```bash
npm install nica-next
```

## Usage

```typescript
import nica from "nica-next";

const auth = nica({
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
const session = await auth.session.get();
if (!session) redirect("/login");
```

**React session — setup (once in your auth config):**

```typescript
// lib/auth.ts
import nica from "nica-next";

export const auth = nica({ ... });
export const { SessionProvider, useSession } = auth;
```

**Wrap your root layout with `SessionProvider`** — `app/layout.tsx`:

```tsx
import { SessionProvider } from "@/lib/auth";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
```

**Use `useSession` in any Client Component:**

```typescript
"use client";

import { useSession } from "@/lib/auth";

export function Profile() {
  const { session } = useSession();
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

## Session Configuration

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

## Providers

Supports all providers from [`nica`](../nica#supported-providers): `google` · `github` · `facebook` · `linkedin` · `slack` · `twitter` · `microsoft` · `twitch` · `discord`

Custom providers are also supported — see [`nica` docs](../nica#custom-providers).

## Error Handling

`redirect()` and `callback()` throw `NicaError` on failure. Additional error codes specific to `nica-next`:

| Code | When thrown |
|------|-------------|
| `PKCE_COOKIE_MISSING` | `callback()` called but the PKCE cookie is absent or expired |
| `INVALID_STATE` | PKCE cookie signature invalid, or `state` mismatch between redirect and callback |

## License

MIT
