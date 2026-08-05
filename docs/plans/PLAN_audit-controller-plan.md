# PLAN_audit-controller-plan — nextjs-shared

## Title
Add a controller plan to the #audit skill, tracking full cross-project rollout scope in nextjs-shared

## Plan
- [ ] `~/.claude/skills/audit/SKILL.md`: add a new step, **Phase 2.5 — Controller plan**, run
      after Phase 3's cross-project list is agreed and before Phase 4 touches any consuming
      project. Creates `docs/PLAN_audit-<slug>.md` in nextjs-shared itself — even when zero
      nextjs-shared code changes are needed — as the top-level record of the whole run:
      - One line per in-scope project, each linking to that project's own
        `docs/PLAN_<slug>.md`.
      - Checked off per project when that project's own `#code` finishes (not `#commit` — the
        controller doesn't gate on each project's own commit timing, which the user controls
        separately per-project).
      - Stays open in nextjs-shared's `docs/` for the life of the run.
      - Committed/archived in nextjs-shared only once every in-scope project's line is checked
        off — same end-of-run lifecycle as the sentinel (Phase 7): delete the sentinel and
        archive the controller plan together.
- [ ] Naming: controller plans use the `PLAN_audit-<slug>.md` prefix (vs. plain `PLAN_<slug>.md`
      for ordinary same-project tasks), so they're recognizable at a glance in nextjs-shared's
      `docs/` folder as belonging to an `#audit` run rather than a direct nextjs-shared change.
- [ ] Update the skill's Phase 2 wording if needed so it's clear Phase 2 (nextjs-shared's own
      code-change plan, when the audit implies one) and the new Phase 2.5 (controller plan,
      always created once Phase 3 is agreed) are distinct and can both apply to the same run.
- [ ] Update the Checklist section at the bottom of `SKILL.md` to include the new Phase 2.5 step.
- [ ] Not retroactive — the already-completed session-storage rollout run does not get a
      backfilled controller plan; this only applies starting with the next `#audit` invocation.

## Changes
