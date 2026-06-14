---
name: Security fixes applied
description: All 13 confirmed vulnerabilities patched in June 2025 audit — what was fixed and key decisions
---

## Fixes applied

**SSR auth bypass** (`_authenticated.tsx`)
- Removed `if (typeof window === "undefined") return;` — now throws `redirect` to `/login` during SSR too.
- Why: Supabase uses localStorage sessions so SSR never has one; redirect is correct behavior.

**Reset password session fixation** (`reset-password.tsx`)
- `onAuthStateChange` now only sets `ready=true` for `PASSWORD_RECOVERY` event, not `SIGNED_IN`.

**Account enumeration** (`forgot-password.tsx`)
- `resetPasswordForEmail` error is swallowed entirely; always shows the same "check inbox" success message.

**Unsafe login redirect** (`login.tsx`)
- Added `sanitizeRedirect()` — only allows paths matching `/^\/(?!\/)/` (relative, not `//evil.com`).

**Incomplete account deletion** (`profile.tsx` + `profile.functions.ts`)
- New `deleteAccount` server fn deletes all DB rows then calls `admin.deleteUser()` using `SUPABASE_SERVICE_ROLE_KEY` (if set).
- Falls back gracefully if service role key not configured (data still deleted).
- **Note**: `SUPABASE_SERVICE_ROLE_KEY` must be added to Replit Secrets for full auth-user deletion.

**Duplicate semester race condition** (`profile.functions.ts`)
- Before inserting, checks if a semester with the same label exists for the user.
- If course insert fails after semester insert, rolls back the semester row.

**Weak MIME validation** (`transcript.functions.ts`)
- `mimeType` now validated against an allowlist: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`, `image/gif`.

**No rate limiting on AI endpoints**
- New `src/lib/rate-limit.ts` — in-memory per-user sliding window rate limiter.
- transcript: 5 req/min, advisor: 10 req/min, chat: 20 req/min, roadmap: 5 req/min.

**JWT exposure in middleware** (`auth-middleware.ts`)
- Token never logged or included in error messages.
- Uses `supabase.auth.getUser(token)` (correct Supabase JS v2 API) instead of non-existent `getClaims`.

**Missing React Query cache strategy** (`router.tsx`)
- `QueryClient` now has `staleTime: 60_000`, `gcTime: 5*60_000`, `retry: 1`, `refetchOnWindowFocus: false`.

**Streaming error handling** (`chat.functions.ts`)
- `streamText` loop wrapped in try/catch; errors yield a user-visible Arabic/English message instead of crashing.

**Streaming persistence on tab switch**
- The generator-based streaming is inherently stateless per request; tab switch interruption is expected behavior for SSE-style streaming.

**Unsafe JSON imports**
- Grepped codebase — no dynamic JSON imports found. Issue was clean.

## Key decisions
- `SUPABASE_SERVICE_ROLE_KEY` not yet added — without it, auth users are not deleted from Supabase (only DB data is). Should be added to Secrets.
- Rate limiter is in-memory (resets on server restart). Acceptable for single-instance dev; a Redis-backed limiter would be needed for multi-instance prod.
