---
name: Termly Replit Migration
description: Key lessons from migrating Termly from Lovable/Supabase to Replit — TanStack Start OIDC auth, pg wiring, Vite dev middleware.
---

## Rule: pg must be explicitly installed — it is NOT a transitive dep here
`pg` is used but not listed as a project dependency; `npm install pg @types/pg --save` is required.
**Why:** TanStack Start uses `drizzle-orm` which has pg-flavored sub-paths but doesn't pull in `pg` itself. The SSR runner fails with `Cannot find module 'pg'` without it.
**How to apply:** Always run `npm list pg` before starting server-side DB work.

## Rule: TanStack Start API routes in vite.config.ts middleware (dev), server.ts (prod)
In dev, Vite's SSR runner handles `virtual:tanstack-start-server-entry` — my `server.ts` fetch handler runs, but `pg` fails before auth can intercept. The fix: add auth routes as a Vite `configureServer` middleware using `server.ssrLoadModule()`.
**Why:** TanStack Start's `createAPIFileRoute` doesn't exist in v1.168.x. Routes in `src/routes/api/` show "does not export a Route" warnings.
**How to apply:** Auth routes live in `vite.config.ts` `authRoutesPlugin()` (dev) AND `src/server.ts` fetch handler (production). Both must exist.

## Rule: openid-client needs `ssr.noExternal` in vite.config.ts
`ssr: { noExternal: ["openid-client"] }` is required or Vite won't bundle it for SSR.

## Rule: Session cookie name is `termly_sid`, stored in `sessions` table
DB schema: sessions, replit_users, academic_profiles, semesters, courses, reminders — all created with `CREATE TABLE IF NOT EXISTS`.

## Rule: Auth middleware is named `requireSupabaseAuth` (kept for compat) but reads `termly_sid`
File: `src/integrations/supabase/auth-middleware.ts` — do not rename, many server functions import it.
