---
name: Termly redesign approach
description: Key decisions and constraints for the Termly GPA app visual redesign
---

## Core design system
- Three themes via `data-gpa-theme` on `<html>`: `dark` (default), `light`, `hc`
- All components use `--gpa-*` CSS variables — changing variables in `styles.css` propagates everywhere
- Default theme set in `__root.tsx` as HTML attribute (`data-gpa-theme="dark"`), overridden by `useGpaTheme()` hook which reads/writes localStorage

## Architecture
- GPAAdvisorApp.tsx is 3020 lines with inline CSS objects — use targeted `edit` calls, NOT full rewrites
- Key style objects in Planner(): `card` (~line 1355), `chip()` (~1363), `iconBtn` (~2823), `menuItem` (~2837)
- Toast component: ~line 163. Tab bar: ~line 1656. Loading screen: ~line 2898. Header: ~line 1460.

## Fonts loaded
- Sora (headings), Plus Jakarta Sans / Manrope (body), Cairo / Noto Sans Arabic (Arabic text)
- Font variable: `FONT = "'Plus Jakarta Sans','Manrope','Cairo','Noto Sans Arabic',sans-serif"`
- Heading: `FONT_HEAD = "'Sora',..." `

## Animation keyframes (in styles.css)
- `gpa-float`, `gpa-orb-drift/2/3`, `gpa-fade-in-up`, `gpa-fade-in-scale`, `gpa-slide-toast`, `gpa-shimmer`, `gpa-pulse-ring`, `gpa-spin`, `gpa-number-in`, `gpa-bar-grow`
- Inline `<style>` in Planner also defines `fadeSlide` and `gpa-slide-toast` for backward compat

## Important imports
- `useLang` from `@/lib/use-lang` — exports `Lang` type and `useLang()` hook
- `useGpaTheme` from `@/components/gpa/use-theme` — exports `GpaTheme` type and hook

**Why:** GPAAdvisorApp.tsx uses inline CSS throughout (no Tailwind classes), so CSS variable changes are the most reliable way to restyle the whole app.
