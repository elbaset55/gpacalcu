---
name: Termly production server
description: How to run Termly in production — Node.js HTTP adapter for TanStack Start's fetch-handler output.
---

## Rule: TanStack Start builds a fetch handler, not an HTTP server
`dist/server/server.js` exports `{ default: { fetch(req, env, ctx) } }`. It has no built-in HTTP listener.
**Why:** TanStack Start (h3-v2 / nitro) outputs a universal fetch handler. Replit's autoscale needs a real port listener.
**How to apply:** `server-prod.mjs` at project root creates a Node.js http server that adapts the fetch handler. `npm start` runs it. Production deployment: `build = ["npm","run","build"]`, `run = ["npm","start"]`.

## Rule: set-cookie headers need `getSetCookie()` in the adapter
Node's `res.setHeader("set-cookie", ...)` must receive an array. Use `response.headers.getSetCookie()` (Node 18.14+) to extract all Set-Cookie headers from the fetch Response. Do not use `response.headers.entries()` for set-cookie — it may only yield one value.

## Rule: protocol detection in production
Use `x-forwarded-proto` header to build the correct `https://` request URL. Fall back to `https` (Replit always terminates TLS). Auth redirect URIs depend on this being correct.

## Required secrets
- `GEMINI_API_KEY` — AI chat (already set via integration)
- `DATABASE_URL` — auto-set by Replit postgres integration
- `REPL_ID` — auto-set by Replit (used for OIDC client_id)
- `ADMIN_EMAILS` — comma-separated emails allowed to access /admin (user must set)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — optional, only if Google OAuth is wanted

## DB tables (all created, schema stable)
sessions, replit_users, academic_profiles, semesters, courses, reminders, email_users, google_users, password_reset_tokens
