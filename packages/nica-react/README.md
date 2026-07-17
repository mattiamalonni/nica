# nica-react

React primitives for [`nica`](../nica) — session context and hooks. Framework-agnostic: works with Vite, Remix, or any React app.

## Installation

```bash
npm install nica-react
```

## Usage

```typescript
import { withReactSession } from "nica-react";

// fetchFn can call any endpoint that returns your session data
export const { SessionProvider, useSession } = withReactSession(async () => {
  const res = await fetch("/api/session");
  if (!res.ok) return undefined;
  return res.json();
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

### `withReactSession(fetchFn)`

Creates a `SessionProvider` component and a `useSession` hook bound to a shared context.

- `fetchFn` — async function that fetches session data. Called once on mount inside `SessionProvider`. Should return `SessionPayload<T> | undefined`.
- Returns `{ SessionProvider, useSession }`

### `useSession()`

Returns `{ session: SessionPayload<T> | undefined; isLoading: boolean }`. Must be called inside a `<SessionProvider>`. Throws if used outside one.

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
