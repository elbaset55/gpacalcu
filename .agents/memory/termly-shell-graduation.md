---
name: Termly shell graduation
description: Key decisions and quirks from graduating the mockup dashboard shell into the Planner component of GPAAdvisorApp.tsx
---

## What was built
`src/components/gpa/TermlyAppShell.tsx` — a 480-line premium layout shell component that wraps the Planner. It provides:
- Animated background (dark: electric blue/cyan orbs + dot grid; light: pastel blue orbs)
- Fixed 240px glassmorphism sidebar with RTL/LTR `border-inline-end` CSS
- Mini GPA hero in sidebar: animated circular SVG progress ring + animated counter + credit bar
- Sidebar nav: icons from lucide-react, `border-inline-start` active state (not solid blocks)
- Theme toggle (light/dark/HC) built into sidebar bottom
- Sticky topbar with hamburger + per-tab title + overflow menu
- Mobile: sidebar collapses to hamburger overlay

## Key integration points in GPAAdvisorApp.tsx
The Planner's return was surgically edited:
1. Outer `<div>` replaced with `<TermlyAppShell ...props>` 
2. Old HEADER section (logo, chips, menu dropdown, progress bar) — deleted entirely
3. Old horizontal TABS bar — deleted entirely
4. `</div>` closing → `</TermlyAppShell>`
5. File input (`ref={fileRef}`) moved to be a direct child before SMART ALERTS

## Critical type gotcha
`TABS` in Planner is `string[][]` (inferred), not `[string, string][]`. The shell prop must be `tabs: string[][]` not `[string, string][]` or TypeScript errors.

## getWebRequest alias fix
`@tanstack/react-start/server` exports `getRequest` not `getWebRequest`. Three files needed: `src/integrations/replit/auth.ts`, `src/integrations/supabase/auth-middleware.ts`, `src/routes/_authenticated.tsx`. Fix: `import { getRequest as getWebRequest } from "@tanstack/react-start/server"`.

## Google Fonts @import rule
Must be the FIRST line in `styles.css` before `@import "tailwindcss"`. PostCSS errors if `@import url(...)` appears after other @import statements (Tailwind expands them at compile time).

**Why:** PostCSS requires all `@import` statements before any CSS rules; Tailwind/tw-animate-css expand to many rules, making any later `@import` illegal.
