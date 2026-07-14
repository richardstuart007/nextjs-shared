# PLAN_claude-plan-clean-slate — nextjs-shared

## Title
Claude plan clean slate

## Plan
- [x] Delete any existing `.claude/PLAN.md`, `.claude/CHANGES.md`, or `.claude/PLAN_*.md` — no need to preserve or migrate content, this is an explicit clean-slate reset.
- [x] If this project's `.claude/CLAUDE.md` has a "Silent file updates — never ask permission" section describing the old `.claude/PLAN.md`/`.claude/CHANGES.md` convention, remove it entirely — no project-specific replacement note is needed; PLAN files now live at `docs/PLAN_<slug>.md` as the current global default (one file per task, `## Title` / `## Plan` / `## Changes` sections, no separate CHANGES.md).
- [x] Confirm this project has no `.claude/settings.json` (expected — nothing to change there).

## Changes
- Deleted `.claude/PLAN_owner-layout-back-link.md` (untracked; no `.claude/PLAN.md` or `.claude/CHANGES.md` existed).
- Removed the "Silent file updates — never ask permission" section from `.claude/CLAUDE.md`.
- Confirmed no `.claude/settings.json` exists in this project — nothing to change.
