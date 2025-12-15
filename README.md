# nica

A minimal, unopinionated OAuth2 authentication library. Provides a composable API for handling OAuth flows with built-in support for multiple providers. Fully typed with TypeScript for complete type safety across your authentication flow.

## Installation

```bash
npm install nica
```

## Quick Start

```typescript
import { createAuth } from "nica";

const auth = createAuth({
  providers: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  origin: "https://myapp.com",
  onProfile: async ({ tokens, profile, provider }) => {
    // Handle authenticated user (e.g., save to database)
    // const user = await db.user.upsert({
    //   where: { id: profile.id },
    //   update: { lastLoginAt: new Date() },
    //   create: { providerName: provider, providerId: profile.id, name: profile.name, email: profile.email },
    // });
    // return { userId: user.id };
    return { userId: profile.id };
  },
});
```

## Usage Examples

### Basic Setup

```typescript
const auth = createAuth({
  providers: {
    github: {
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    },
    google: {
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
    },
  },
  origin: process.env.APP_URL,
  onProfile: async ({ tokens, profile }) => {
    // Handle authenticated user
    return { userId: profile.id };
  },
});
```

### Next.js Integration

**Redirect to login:**

```typescript
// app/api/auth/[provider]/route.ts
export async function GET(req: Request, { params }: { params: { provider: string } }) {
  const authUrl = auth.getAuthUrl(params.provider);
  return Response.redirect(authUrl);
}
```

**Handle callback:**

```typescript
// app/api/auth/[provider]/callback/route.ts
export async function GET(req: Request, { params }: { params: { provider: string } }) {
  const code = new URL(req.url).searchParams.get("code");

  if (!code) {
    return new Response("Missing code", { status: 400 });
  }

  try {
    const result = await auth.handleCallback(params.provider, code);
    // Redirect to dashboard or set session
    return Response.redirect("/dashboard");
  } catch (error) {
    return new Response("Authentication failed", { status: 401 });
  }
}
```

### Session Management (Next.js)

For managing user sessions in Next.js, use the `withSession` module:

```typescript
import { createAuth, withSession } from "nica";
import type { SessionConfig } from "nica/next";

const auth = createAuth({
  // ... configuration
});

const authWithSession = withSession(auth, {
  secret: process.env.SESSION_SECRET!,
  strategy: "encrypted", // or "signed"
  tokenExp: 1000 * 60 * 30, // 30 minutes
  cookie: {
    name: "session",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: true,
    sameSite: "lax",
  },
});
```

**Create a session:**

```typescript
// In a route handler or server action
const token = await authWithSession.session.create(
  { userId: user.id, email: user.email },
  { response }
);
```

**Get current session:**

```typescript
// In a server component or route handler
const session = await authWithSession.session.get();
if (!session) {
  // User not authenticated
}
```

**Peek at session (without validation):**

```typescript
// Check if session exists and get expiration info
const sessionData = await authWithSession.session.peek();
if (sessionData?.exp) {
  const expiresAt = new Date(sessionData.exp * 1000);
}
```

**Destroy session:**

```typescript
// Logout user
await authWithSession.session.destroy({ response });
```

**Session configuration defaults:**

- `strategy`: `"encrypted"` (uses AES-GCM)
- `tokenExp`: `7 days`
- `cookie.name`: `"nica_auth"`
- `cookie.maxAge`: `7 days`
- `cookie.httpOnly`: `true`
- `cookie.secure`: `true`
- `cookie.sameSite`: `"lax"`
- `cookie.path`: `"/"`

### Express Integration

**Redirect to login:**

```typescript
app.get("/auth/:provider", (req, res) => {
  const authUrl = auth.getAuthUrl(req.params.provider);
  res.redirect(authUrl);
});
```

**Handle callback:**

```typescript
app.get("/auth/:provider/callback", async (req, res) => {
  const { code } = req.query;
  const { provider } = req.params;

  if (!code) {
    return res.status(400).json({ error: "Missing code" });
  }

  try {
    const result = await auth.handleCallback(provider, code as string);
    // Set session or cookie
    res.redirect("/dashboard");
  } catch (error) {
    res.status(401).json({ error: "Authentication failed" });
  }
});
```

### Fastify Integration

**Redirect to login:**

```typescript
app.get("/auth/:provider", async (request, reply) => {
  const authUrl = auth.getAuthUrl(request.params.provider);
  reply.redirect(authUrl);
});
```

**Handle callback:**

```typescript
app.get("/auth/:provider/callback", async (request, reply) => {
  const { code } = request.query;
  const { provider } = request.params;

  if (!code) {
    return reply.status(400).send({ error: "Missing code" });
  }

  try {
    const result = await auth.handleCallback(provider, code as string);
    // Set session or cookie
    reply.redirect("/dashboard");
  } catch (error) {
    reply.status(401).send({ error: "Authentication failed" });
  }
});
```

## Supported Providers

The library includes built-in support for:

- Google
- GitHub
- Facebook
- LinkedIn
- Slack
- Twitter
- Microsoft
- Twitch
- Discord

Additional providers can be added by implementing the provider interface.

## Default Redirect URIs

If no custom `redirectUri` is specified, the library uses these defaults:

- Google: `/api/auth/google/callback`
- GitHub: `/api/auth/github/callback`
- Facebook: `/api/auth/facebook/callback`
- LinkedIn: `/api/auth/linkedin/callback`
- Slack: `/api/auth/slack/callback`
- Twitter: `/api/auth/twitter/callback`
- Microsoft: `/api/auth/microsoft/callback`
- Twitch: `/api/auth/twitch/callback`
- Discord: `/api/auth/discord/callback`

With `origin` set, the full redirect URI becomes: `{origin}{redirectUri}`

## License

MIT
