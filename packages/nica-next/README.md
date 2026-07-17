# nica-next

Next.js adapter for [`nica`](../nica) — session management, cookie handling, and React hooks.

## Installation

```bash
npm install nica-next
```

## Usage

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
    // Save user to DB, return data to store in session
    const user = await db.upsertUser(profile);
    return { userId: user.id };
  },
});
```

**Redirect route** — `app/api/auth/[provider]/route.ts`:

```typescript
import type { SupportedProviderName } from "nica";

export async function GET(_req: Request, { params }: { params: { provider: string } }) {
  const { url } = await auth.getRedirectUrl(params.provider as SupportedProviderName);
  return Response.redirect(url);
}
```

**Callback route** — `app/api/auth/[provider]/callback/route.ts`:

```typescript
import type { SupportedProviderName } from "nica";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { provider: string } }) {
  const code = req.nextUrl.searchParams.get("code");
  if (!code) return new Response("Missing code", { status: 400 });

  const res = NextResponse.redirect(new URL("/dashboard", req.url));
  await auth.authenticate(params.provider as SupportedProviderName, code, undefined, { response: res });
  return res;
}
```

**Read session in a Server Component:**

```typescript
const session = await auth.session.get();
if (!session) redirect("/login");
```

**React session — setup (once in your auth config):**

```typescript
import { withServerSession } from "nica-next/server";

export const { SessionProvider, useSession } = withServerSession(auth.session);
```

> `nica-next/client` re-exports everything from [`nica-react`](../nica-react) — `withReactSession`, `SessionContextProvider`, `createUseSession`, and `SessionPayload`.

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

## License

MIT
