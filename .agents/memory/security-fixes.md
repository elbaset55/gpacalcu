---
name: Security fixes applied
description: All confirmed vulnerabilities patched — what was fixed and key decisions
---

## Fixes applied (original audit)

**SSR auth bypass** (`_authenticated.tsx`)
- Removed `if (typeof window === "undefined") return;` — now throws `redirect` to `/login` during SSR too.

**Reset password session fixation** (`reset-password.tsx`)
- `onAuthStateChange` now only sets `ready=true` for `PASSWORD_RECOVERY` event, not `SIGNED_IN`.

**Account enumeration** (`forgot-password.tsx`)
- `resetPasswordForEmail` error is swallowed entirely; always shows the same "check inbox" success message.

**Unsafe login redirect** (`login.tsx`)
- Added `sanitizeRedirect()` — only allows paths matching `/^\/(?!\/)/` (relative, not `//evil.com`).

**Incomplete account deletion** (`profile.functions.ts`)
- `deleteAccount` deletes all DB rows then calls session cleanup.

**Duplicate semester race condition** (`profile.functions.ts`)
- Before inserting, checks if a semester with the same label exists for the user.
- If course insert fails after semester insert, rolls back the semester row.

**Weak MIME validation** (`transcript.functions.ts`)
- `mimeType` now validated against an allowlist: `application/pdf`, `image/jpeg`, `image/png`, `image/webp`, `image/gif`.

**No rate limiting on AI endpoints**
- New `src/lib/rate-limit.ts` — in-memory per-user sliding window rate limiter.
- transcript: 5 req/min, advisor: 10 req/min, chat: 20 req/min, roadmap: 5 req/min.

## Production hardening (June 2026 session)

**Auth endpoint brute-force protection** (`src/server.ts`)
- IP-based in-memory rate limiter (separate from per-user CRUD limiter).
- `/api/auth/email/register` — 5 req / 15 min per IP
- `/api/auth/email/login` — 10 req / 15 min per IP
- `/api/auth/email/reset-request` — 3 req / 15 min per IP
- Returns 429 with `Retry-After: 900` header.
- IP extracted via: `cf-connecting-ip` → `x-forwarded-for` → `x-real-ip` → "unknown"

**CRUD rate limits** (`profile.functions.ts`, `reminders.functions.ts`)
- `saveProfile` — 20 req / 60s per userId
- `saveSemester` — 10 req / 60s per userId
- `addReminder` — 30 req / 60s per userId

**Session security** (`src/integrations/replit/auth.ts`, `profile.functions.ts`)
- Added `deleteUserSessions(userId)` — `DELETE FROM sessions WHERE sess->>'userId' = $1`
- Added `cleanupExpiredSessions()` — `DELETE FROM sessions WHERE expire <= NOW()`
- `deleteAccount` now also calls session cleanup before deleting the user row.
- **Why:** Without session cleanup, deleted-account cookies stay valid for 7 days.
- Session cleanup runs every 6 hours via `setInterval` in `src/server.ts`.

**SEO/meta fixes** (`src/routes/__root.tsx`, `public/robots.txt`)
- OG/Twitter image was `https://gpacalcu.lovable.app/icon-512.png` — fixed to `/icon-512.png` (relative path).
- Added `theme-color: #2563eb`, `robots: index, follow`, Twitter card `summary_large_image`.
- Created `public/robots.txt` (Disallow: /app, /profile, /admin, /onboarding, /api/).

**Error/loading UI** (`src/routes/__root.tsx`)
- 404, Error, Pending all use inline CSS with CSS var fallbacks — work even if stylesheet fails.
- Added `pendingComponent: PendingComponent` to root route for route transitions (spinner).
- Error component shows `error.message` in a styled pre block.

## Key decisions
- Rate limiter is in-memory (resets on server restart). Acceptable for single-instance. Redis needed for multi-instance.
- `getPool()` creates a new Pool per call and calls `pool.end()` in finally — this is intentional for serverless (not a singleton bug).
