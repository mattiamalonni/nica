# nica-react

React primitives for [`nica`](../nica) — session context and hooks. Framework-agnostic: works with Vite, Remix, or any React app.

## Installation

```bash
npm install nica-react
```

## Usage

```typescript
import { useNica } from "nica-react";

// getSession can call any endpoint that returns your session data
export const { SessionProvider, useSession } = useNica({
  getSession: async () => {
    const res = await fetch("/api/session");
    if (!res.ok) return undefined;
    return res.json();
  },
});
```

**Wrap your app with `SessionProvider`** — `src/App.tsx`:

```tsx
import { SessionProvider } from "@/lib/auth";

export default function App() {
  return (
    <SessionProvider>
      <YourApp />
    </SessionProvider>
  );
}
```

**Use `useSession` in any component:**

```tsx
import { useSession } from "@/lib/auth";

export function Profile() {
  const { session } = useSession();
  if (!session) return <p>Not authenticated</p>;
  return <p>Welcome, user {session.userId}</p>;
}
```

## API

### `useNica(options)`

Creates a `SessionProvider` component and a `useSession` hook bound to a shared context.

- `options.getSession` — async function that fetches session data. Called once on mount inside `SessionProvider`. Should return `SessionPayload<T> | undefined`.
- `options.deleteSession` — optional async function to destroy the session. When provided, `useSession().deleteSession` will call it and clear local state.
- Returns `{ SessionProvider, useSession }`

### `useSession()`

Returns `{ session: SessionPayload<T> | undefined; isLoading: boolean; refreshSession: () => Promise<SessionPayload<T> | undefined>; deleteSession: (() => Promise<void>) | undefined }`. Must be called inside a `<SessionProvider>`. Throws if used outside one.

### `SessionContextProvider`

Low-level context provider. Use this if you need to populate the context manually (e.g. from SSR-injected data).

## Types

```typescript
import type { SessionPayload } from "nica-react";

// SessionPayload<T> = T & { iat: number; exp: number }
```

`iat` and `exp` are Unix timestamps (seconds) for issued-at and expiry, matching the standard JWT claims.

## License

MIT
