---
name: Termly Replit Auth System
description: The actual auth stack — Replit OAuth + pg sessions, NOT Supabase JWT. Critical for any auth-related work.
---

## The Rule
Auth is **Replit OAuth cookie-based**, not Supabase JWT. The `supabase` and `lovable` client objects are **stubs**.

**Why:** The project migrated from Lovable/Supabase to Replit. Auth was fully converted to Replit OAuth; the Supabase client was replaced with a facade to avoid breaking call sites.

## How it works
1. User clicks "Continue with Google/Replit" → `lovable.auth.signInWithOAuth()` → redirects to `/api/auth/login`
2. Replit OIDC OAuth flow → `/api/auth/callback` → sets `termly_sid` HTTP-only cookie
3. Server functions: `requireSupabaseAuth` middleware (in `src/integrations/supabase/auth-middleware.ts`) reads `termly_sid` from cookies, queries `sessions` + `replit_users` tables via `pg`
4. Client-side auth guard: check `document.cookie` for `/(?:^|;\s*)termly_sid=/` — see `src/routes/index.tsx` and `src/routes/_authenticated.tsx`

## Stubs
- `src/integrations/supabase/client.ts` — fake `supabase` object; `getUser()` always returns `{ user: null }`, `signOut()` → `/api/auth/logout`
- `src/integrations/lovable/index.ts` — `signInWithOAuth()` → `window.location.href = "/api/auth/login"`

## pg dependency
- `pg` must be installed (`npm install pg @types/pg`). It was absent from node_modules despite being in package.json — caused all server functions to fail with "Cannot find module 'pg'".
- Vite config has `optimizeDeps: { exclude: ["pg", "pg-native"] }` — keep this.

## How to apply
- Never use `supabase.auth.getUser()` to check if a user is authenticated — it always returns null.
- For client-side auth guards: check `termly_sid` cookie.
- For server functions: use `requireSupabaseAuth` middleware which validates the cookie against the DB.
- `forgot-password` and `reset-password` pages don't apply to OAuth-only auth — show redirect to Google account settings instead.
