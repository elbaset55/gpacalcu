---
name: Termly email auth + guest mode
description: How email login and guest mode are wired in the Termly app
---

## Email auth
- `email_users` table: `id text PK, email unique, password_hash, display_name, created_at, updated_at`
- `src/lib/email-auth.ts`: `registerEmailUser` / `loginEmailUser` using bcryptjs (hash factor 12)
- On register: also inserts row into `replit_users` (same sessions table works for both)
- API routes in `src/server.ts`: `POST /api/auth/email/register` and `POST /api/auth/email/login`
- Both routes call `saveSession(sessionId, userId)` then set `termly_sid` cookie + return `{ ok: true }`
- Frontend does `fetch(endpoint, { method: "POST", ... })` then `window.location.href = "/app"` on success

## Guest mode
- `/guest` route (NOT under `_authenticated`) renders `<GPAAdvisorApp isGuest={true} />`
- `GPAAdvisorApp` accepts `isGuest?: boolean` (default false). Authenticated app.tsx needs no change.
- When `isGuest=true`: server queries disabled (`enabled: !isGuest`), localStorage used instead
  - localStorage keys: `termly_guest_profile`, `termly_guest_sems`
- `GuestBanner` component (fixed top bar, 38px) shows when isGuest=true; Planner gets `paddingTop: 38`
- `Planner` accepts `isGuest` + `onSaveSemGuest` props; `saveSem()` routes to localStorage when guest
- AI advisor + roadmap buttons: if isGuest, show toast "Sign in to use AI features 🔒" instead of calling mutation

## Login page
- Tabs: Replit | Email (toggles authMode state)
- Email tab: controlled form → fetch to /api/auth/email/login or /register → redirect on ok
- Guest link: `<a href="/guest">` below the card with de-emphasized styling
- i18n via `T.ar` / `T.en` objects; respects lang/theme from useLang + useGpaTheme hooks

**Why:** bcryptjs is pure-JS (no native bindings), works fine in Vite SSR. Session table reused for email users.
