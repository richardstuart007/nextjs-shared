# PLAN_plan-files-subfolder — nextjs-shared

## Title
Move active PLAN files into docs/plans/ instead of directly in docs/

## Plan
- [x] `~/.claude/CLAUDE.md`: update the "Project files — CLAUDE.md and PLAN files" section (and
      any other reference to `docs/PLAN_<slug>.md`) to say active plans live at
      `docs/plans/PLAN_<slug>.md`, archived by `#commit` into `docs/archive/` (unchanged location
      for archive). Also update the "Manual SQL must be confirmed complete before #commit" section
      and any other prose mentioning the `docs/PLAN_*.md` path.
- [x] `~/.claude/skills/plan/SKILL.md`: update all references to creating
      `docs/PLAN_<slug>.md` → `docs/plans/PLAN_<slug>.md`, including the "Before starting" check
      for an existing plan (glob `docs/plans/PLAN_*.md` instead of `docs/PLAN_*.md`) and the
      Checklist section.
- [x] `~/.claude/skills/code/SKILL.md`: update all references to `docs/PLAN_<slug>.md` →
      `docs/plans/PLAN_<slug>.md`.
- [x] `~/.claude/skills/commit/SKILL.md`: update all references to `docs/PLAN_<slug>.md` →
      `docs/plans/PLAN_<slug>.md`. Archive destination (`docs/archive/`) is unchanged — step 10
      still moves the file from `docs/plans/` into `docs/archive/` (not `docs/plans/archive/`).
- [x] `~/.claude/skills/audit/SKILL.md`: update Phase 4's plan-file creation and Phase 2's
      nextjs-shared plan-file reference to `docs/plans/PLAN_<slug>.md`. Note: the Phase 2.5
      controller-plan step referenced in this bullet doesn't exist in `audit/SKILL.md` yet — it's
      tracked separately in the still-unimplemented `docs/plans/PLAN_audit-controller-plan.md` —
      so there was nothing to update there this run.
- [x] Amended during `#code` (user instruction): nextjs-shared's own two existing active plan
      files (`PLAN_audit-controller-plan.md` and this plan) are moved into `docs/plans/` as part of
      this run, overriding the "not retroactive" scoping below for this project specifically. Other
      projects' existing active plans (next-bridge's `PLAN_production-data-errors.md`, chess's
      `PLAN_pagination-footer.md`, etc.) are unaffected — still out of scope, per the original
      agreement.
- [x] Not retroactive elsewhere: existing active `PLAN_*.md` files in other projects stay directly
      in `docs/` — not moved. Only plans created after this change lands (in those projects) use
      `docs/plans/`.

## Changes

### C:\Users\richa\.claude\CLAUDE.md
- Updated every `docs/PLAN_<slug>.md` reference to `docs/plans/PLAN_<slug>.md` (the `#plan`
  bullet, the "PLAN file must exist" paragraph, "Project files — CLAUDE.md and PLAN files"
  section, "PLAN files live with the code they describe", and "During testing/iteration phases,
  capture everything into the plan"). Added a sentence to "Project files" explaining `docs/plans/`
  sits parallel to `docs/archive/`.

### C:\Users\richa\.claude\skills\plan\SKILL.md
- Updated frontmatter `description`, the opening summary, "Before starting" (both the folder
  determination and the existing-plan check), the file-creation path, "What NOT to do", and the
  Checklist — all now reference `docs/plans/PLAN_<slug>.md` / `docs/plans/PLAN_*.md`.

### C:\Users\richa\.claude\skills\code\SKILL.md
- Updated frontmatter `description`, the opening summary, and step 1 ("Find the current...") to
  `docs/plans/PLAN_<slug>.md`.

### C:\Users\richa\.claude\skills\commit\SKILL.md
- Updated frontmatter `description`, the opening summary, step 3 (find), step 7 (stage), and step
  10 (archive move) to `docs/plans/PLAN_*.md`. Archive destination itself (`docs/archive/`)
  unchanged.

### C:\Users\richa\.claude\skills\audit\SKILL.md
- Updated the opening summary, Phase 2 (nextjs-shared's own plan), and Phase 4 step 2 (consuming
  project's plan file) to `docs/plans/PLAN_<slug>.md`.

### C:\Users\richa\.claude\COMMANDS.md
- Updated the `/plan`, `/code`, and `/audit` summary lines to `docs/plans/PLAN_<slug>.md`, per the
  "COMMANDS.md — keep in sync" rule (not an originally-listed plan step, but the mechanical
  follow-through the rule requires whenever a `#`/`/` trigger's mechanics change).

### c:\Users\richa\claude\github\nextjs-shared\docs\plans\ (new folder)
- Created. Moved this project's two existing active plan files
  (`PLAN_audit-controller-plan.md`, `PLAN_plan-files-subfolder.md`) here from `docs/` directly, per
  explicit user instruction to migrate nextjs-shared's own in-flight plans as part of this change
  (other projects' existing plans are unaffected).

## Testing
- [ ] Confirmed via `npx tsc --noEmit` + `npm run build` — no user-facing/code change to verify;
      this is a documentation/workflow-convention change only (`.md` files under `~/.claude/` plus
      a folder move under `docs/`), no application code touched.
- [ ] Next time `#plan` is sent in any project, confirm the new PLAN file is created at
      `docs/plans/PLAN_<slug>.md` rather than directly in `docs/`.
- [ ] Next time `#commit` runs, confirm the completed plan is archived from `docs/plans/` into
      `docs/archive/` (not `docs/plans/archive/`).
