# PLAN_tailwind-source-docs — nextjs-shared

## Title
Document the Tailwind v4 @source requirement for consuming projects

## Plan
- [x] Add a new "Tailwind v4 — required @source directive" section to `CONSUMING_PROJECTS.md`, documenting that every consuming project's `globals.css` must include `@source "../../node_modules/nextjs-shared/src";` (or the correct relative path for that project's file location) — without it, Tailwind v4 never scans nextjs-shared's source for class-name strings, so none of its components' default classes generate any CSS at all. Place it before the existing "Tailwind v4 — custom text sizes" section since this is the more fundamental prerequisite.
- [x] Cross-check chess/infostore/next-bridge/next-dbadmin's exact `@source` line for consistency and use that as the documented example.
- [x] Note (not actioned, out of scope): the `onboard-nextjs-shared` skill (`~/.claude/skills/onboard-nextjs-shared/SKILL.md`) also doesn't mention this step and looks broadly stale (references `write_Logging`, `DatabaseTools`, `nextjs-shared/routes/copy` — none of which match the current package's actual exports seen throughout this session). Flagging only; a full rewrite of that skill is a separate task.

## Changes

### CONSUMING_PROJECTS.md
- Added a new "Tailwind v4 — required @source directive" section immediately before the existing "Tailwind v4 — custom text sizes" section. Documents that `@source "../../node_modules/nextjs-shared/src";` must be the first line after `@import "tailwindcss";` in every consuming project's `globals.css`, explains why (Tailwind v4 doesn't scan `node_modules` by default, so none of nextjs-shared's component default classes generate any CSS without it), and what the failure looks like in practice (components render in the DOM with zero styling — a modal collapses to an unstyled inline block instead of a fixed overlay). This was discovered live: richard-dashboard was missing this directive entirely, while chess/infostore/next-bridge/next-dbadmin all already had it — confirmed via direct grep across all consuming projects' globals.css files.
- Flagged but did not fix: `~/.claude/skills/onboard-nextjs-shared/SKILL.md` doesn't mention this `@source` requirement either, and appears broadly stale overall (references exports/components not seen anywhere in current nextjs-shared usage — `write_Logging`, `DatabaseTools`, `nextjs-shared/routes/copy`). Out of scope for this task; noted for a separate rewrite.

### Not done in this task (separate project, out of scope for this session)
- Actually adding the missing `@source` line to richard-dashboard's `globals.css` — instructions already given in chat; needs a richard-dashboard session to apply.
