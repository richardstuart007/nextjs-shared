# PLAN_audit-skill — nextjs-shared

## Title
Build #audit skill — orchestrate audit rollout from nextjs-shared into consuming projects

## Plan
- [x] Modify `~/.claude/hooks/project-isolation-guard.js` to add a scoped, time-limited exception: if `~/.claude/.audit-active.json` exists, is not stale (max age a few hours), and lists a project path that the target file falls under, allow the `Edit`/`Write`/`NotebookEdit` — otherwise behave exactly as today (denying anything outside the current project). No other behavior change; the "no exceptions, not even nextjs-shared" default stance stays intact whenever no active audit sentinel exists.
- [x] Create `~/.claude/skills/audit/SKILL.md` defining the `#audit` skill:
  - `#audit` bare asks what to audit; `#audit <description>` proceeds.
  - Phase 1 — audit (read-only investigation) across consuming projects for the described scope.
  - Phase 2 — if the audit implies nextjs-shared changes, create/append `docs/PLAN_<slug>.md` in nextjs-shared per the normal `plan` skill mechanics.
  - Phase 3 — present a high-level, per-project list of what's needed, for the user to agree to before any project is touched.
  - Phase 4 — per consuming project the user agrees to proceed with: write/update the sentinel to unlock that project's path, then create `docs/PLAN_<slug>.md` inside that project (same `## Title`/`## Plan`/`## Changes` structure as the `plan` skill produces) — then **stop and wait for that project's own explicit `#code`**, never proceeding straight to implementation just because the plan was created.
  - Phase 5 — on `#code` for that project: implement the plan's steps in that project's files (now unlocked via the sentinel), run that project's own type-check/build commands (in that project's directory), update its plan file's `## Changes` — same mechanics as the existing `code` skill, just targeting a different project root than the session's own.
  - Phase 6 — on `#commit` for that project (only if the user invokes it): run that project's own commit pipeline — version bump in that project's `package.json`, tsc/build gate, `git add`/commit/push inside that project's own repo, delete + commit the plan file — same mechanics as the existing `commit` skill, scoped to that project.
  - Phase 7 — after each project is committed (or explicitly skipped/stopped), remove that project from the sentinel's project list; once every in-scope project is done (or the user ends the run), delete the sentinel file entirely — never leave it lying around after the run ends.
  - Explicit rule in the skill: never skip a project's own `#code`/`#commit` trigger gate just because this is an orchestrated multi-project run — same discipline as working in a single project, per project, every time.
- [x] Update `~/.claude/COMMANDS.md` with the new `#audit` trigger, per the "keep COMMANDS.md in sync" rule.

## Changes

### ~/.claude/hooks/project-isolation-guard.js
- Added a scoped, time-limited exception: if `~/.claude/.audit-active.json` exists, its `createdAt` is under 4 hours old (`AUDIT_SENTINEL_MAX_AGE_MS`), and its `projects` array lists a path the target file falls under, the `Edit`/`Write`/`NotebookEdit` is now allowed. No other behavior change — verified with manual tests: cross-project write denied with no sentinel (unchanged baseline), allowed once a fresh sentinel lists the target project, still denied for a project *not* listed in that same sentinel, and denied again once the sentinel is artificially aged past 4 hours. Updated the deny message to mention the `#audit` skill as the sanctioned path around the guard.

### ~/.claude/skills/audit/SKILL.md
- New skill implementing the 7-phase workflow above. Confirmed picked up by the harness (appears in the available-skills listing) immediately after creation.

### ~/.claude/COMMANDS.md
- Added an `#audit` entry documenting the skill, the sentinel mechanism, and that it's nextjs-shared-only.

### Verification
- Hook behavior manually tested via direct stdin simulation (see above) rather than through an actual `#audit` run, since no cross-project rollout has been executed yet — the mechanism is confirmed correct in isolation, but the skill's own end-to-end flow (creating a plan in another project, executing it, committing it, cleaning up the sentinel) hasn't been exercised for real yet.
