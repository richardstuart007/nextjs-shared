# PLAN_claude-improvements — nextjs-shared

## Title
Claude improvements - improve my interaction with Claude

## Plan
- [x] Fix `~/.claude/hooks/project-isolation-guard.js` so the isolation boundary is anchored to
  the project the session actually opened in, not the live shell `cwd`. Currently
  `projectRoot = input.cwd || process.cwd()` is re-read on every hook call, so a `Bash`/`PowerShell`
  `cd` into another project's folder mid-session silently redefines what counts as "current
  project" — writes to that other project become allowed, and writes back to the original project
  get blocked, with no warning. Change `projectRoot` to prefer `process.env.CLAUDE_PROJECT_DIR`
  (the fixed project root Claude Code passes to every hook invocation), falling back to
  `input.cwd || process.cwd()` only if that env var is ever unset. Update the file's top comment
  block to describe the new mechanism.
- [x] Manually verify: simulate a hook call via stdin with `CLAUDE_PROJECT_DIR` set to the
  nextjs-shared path but `input.cwd` set to a different project (simulating a drifted shell cwd
  after a `cd`) — confirm a write inside nextjs-shared is still allowed and a write outside it is
  still blocked, i.e. the decision now follows `CLAUDE_PROJECT_DIR` rather than `input.cwd`.
- [x] Review Claude's own configuration files for consistency, staleness, and gaps: global
  `~/.claude/CLAUDE.md`, every skill under `~/.claude/skills/`, `~/.claude/COMMANDS.md`, and the
  auto-memory files under `~/.claude/projects/*/memory/`. Includes checking whether the
  `project_isolation_guard_tracks_shell_cwd` memory note and any related CLAUDE.md text need
  updating once the hook fix above lands. Report findings before making any further changes.
- [x] Remove the `#tested`-before-`#commit` gate. `#code` keeps writing the `## Testing` checklist
  (still useful as a prompt + test plan), and `#tested` keeps existing as an optional way to check
  those items off, but `#commit` no longer refuses to run just because some are unchecked. Files to
  change:
  - `~/.claude/CLAUDE.md` — the `#tested` bullet under "Plan by default" drops "`#commit` refuses
    to proceed while any Testing item is still unchecked."
  - `~/.claude/skills/commit/SKILL.md` — remove pipeline step 1 (the Testing-checklist stop/gate),
    renumber the remaining steps, drop the matching "What NOT to do" bullet and Checklist item, and
    drop "Testing-checklist gate" from the frontmatter `description`.
  - `~/.claude/skills/tested/SKILL.md` — reword the frontmatter `description` (currently says
    checking off Testing items is "required before `#commit`'s gate will let the pipeline
    proceed") to describe it as optional, not a prerequisite.
  - `~/.claude/COMMANDS.md` — update the `#commit` and `#tested` summaries to match (drop the
    "refusing to proceed... if any remain" language from `#commit`'s entry).
  - The manual-SQL-confirmation gate (`commit` skill step 0, and the separate CLAUDE.md section)
    is unrelated and stays exactly as-is — only the Testing-checklist gate is removed.
- [x] Audit `~/.claude/CLAUDE.md` for redundancy and inconsistency, and also compare it against
  `nextjs-shared`'s own `.claude/CLAUDE.md` for duplication/conflict between the two. Present each
  finding one at a time in chat; only edit the file once the user approves that specific finding,
  then move to the next.
- [ ] Extend the same audit to every other consuming project's `.claude/CLAUDE.md`
  (chess, infostore, next-bridge, next-bridgeschool, next-dbadmin, richard-dashboard — scanned
  dynamically, never hardcoded). **User decision (2026-07-25): this is a housekeeping run, not
  per-project feature work** — no `docs/PLAN_<slug>.md` is created in each consuming project, no
  `## Testing` checklist, and no per-project `#code`/`#commit`. Everything is tracked here in
  nextjs-shared's own plan, edits are made directly (still via the `#audit` skill's sentinel
  mechanism, since `project-isolation-guard.js` still requires it), and testing/commit for these
  `.claude/CLAUDE.md`-only changes is skipped entirely per the user's explicit instruction.
  - [x] infostore — removed the stale PLAN-workflow section (`.claude/PLAN.md`/`.claude/CHANGES.md`,
    superseded by the current `docs/PLAN_<slug>.md` convention) and two duplicated boilerplate
    sections (`nextjs-shared reference`, `Schema file`) already covered by global CLAUDE.md.
  - [x] next-bridge — removed duplicated `nextjs-shared reference` and `Schema file` sections.
  - [x] next-bridgeschool — removed duplicated `nextjs-shared reference` and `Schema file` sections.
  - [x] next-dbadmin — removed duplicated `nextjs-shared reference` and `Schema file` sections, plus
    three duplicated generic coding-convention bullets (function declarations, `'use client'`/`'use
    server'` first line, no `require()`); kept the two project-specific "Key conventions" bullets.
  - [x] richard-dashboard — removed duplicated `nextjs-shared reference` section.
  - [x] chess — no findings, left untouched.
- [x] Two remaining cleanups flagged earlier in this run:
  - [x] infostore has two stale tracked files left from the old PLAN workflow
    (`.claude/PLAN.md`, `.claude/CHANGES.md`) — `git rm` them via the `#audit` sentinel mechanism
    (housekeeping, no per-project plan/testing/commit, same as the rest of this run).
  - [x] `~/.claude/skills/audit/SKILL.md`'s "A `cd` gotcha specific to this skill" section and the
    `feedback_isolation_guard_tracks_shell_cwd` auto-memory note both still describe the
    now-fixed `project-isolation-guard.js` cwd-drift bug as current behavior — update both to
    reflect the `CLAUDE_PROJECT_DIR` fix from earlier in this plan.
- [x] Make presenting the test plan in chat an explicit, always-done step of `~/.claude/skills/code/SKILL.md`
  — not just an incidental mention. Since `#commit` will no longer be blocked on `## Testing`, the
  chat-presented test plan becomes the main way testing actually gets surfaced to the user. Add a
  new numbered step after "write the `## Testing` section" that says the full `## Testing` checklist
  content must always be included in the chat completion message once every `## Plan` step is done —
  not optional, not only when it seems useful. Update the frontmatter `description` and the
  `## Checklist` section to reflect this as its own explicit item, separate from "wrote the
  `## Testing` section" (writing it to the file and presenting it in chat are two different
  sub-steps, both mandatory).

## Changes

### ~/.claude/hooks/project-isolation-guard.js
- Changed `projectRoot` derivation from `input.cwd || process.cwd()` to
  `process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd()`, anchoring the isolation boundary
  to the fixed project root Claude Code passes to every hook invocation instead of the live shell
  cwd. Updated the top comment block to describe the new mechanism. Verified via direct stdin
  simulation: (1) `CLAUDE_PROJECT_DIR`=nextjs-shared with a drifted `input.cwd`=chess and a write
  target inside nextjs-shared — now correctly allowed (previously would have been blocked); (2)
  same drifted setup with a write target inside chess — now correctly blocked, following
  `CLAUDE_PROJECT_DIR` rather than the stale `cwd`; (3) `CLAUDE_PROJECT_DIR` unset, write target
  outside `input.cwd` — still blocked, confirming the fallback preserves prior behavior.

### Review of Claude config files (no files changed — findings only, per this step's scope)
- Read global `~/.claude/CLAUDE.md` in full: no other section references the shell-cwd tracking
  behavior, so nothing else there is stale from this fix. The existing "Known gap" note (Bash/
  PowerShell writes not being hook-intercepted) is a separate, still-accurate issue, unaffected by
  this change.
- Listed all 14 skills under `~/.claude/skills/` and cross-checked against `~/.claude/COMMANDS.md`:
  every `#`-triggered skill (`plan`, `code`, `tested`, `commit`, `audit`, `reinstall`, `noprompt`,
  `skillslist`) is documented there; the remaining skills (`onboard-nextjs-shared`, `safe-install`,
  `new-project`, `version-pin`, `db-naming`, `db-column-reorder`) are invoked by description match,
  not `#` triggers, so their absence from `COMMANDS.md` is correct, not a gap.
- **Stale — found, not yet fixed:** `~/.claude/skills/audit/SKILL.md`, section "A `cd` gotcha
  specific to this skill" (around the file's later section), describes `project-isolation-guard.js`
  as keying off the Bash tool's live `cwd` and prescribes cd'ing back to nextjs-shared as a
  workaround. That description and workaround are now obsolete — the guard anchors to
  `CLAUDE_PROJECT_DIR` instead.
- **Stale — found, not yet fixed:** the auto-memory note
  `feedback_isolation_guard_tracks_shell_cwd.md` (indexed in `MEMORY.md`) documents the same
  now-fixed bug as current behavior, with a "how to apply" workaround that no longer applies.
- Per this plan step's own scope ("report findings before making any further changes"), these two
  updates were not made in this run — see chat for the follow-up question.

### ~/.claude/CLAUDE.md
- The `#tested` bullet under "Plan by default" no longer says `#commit` refuses to proceed on
  unchecked Testing items — now says `#tested` is optional and `#commit` no longer requires it.

### ~/.claude/skills/commit/SKILL.md
- Removed pipeline step 1 (the `## Testing`-checklist stop/gate) entirely; remaining steps
  renumbered 1–11. Step 5 (extracting commit-body content) now notes an unchecked Testing item is
  fine and commit proceeds regardless. Dropped "Testing-checklist gate" from the frontmatter
  `description`. Replaced the "never skip the Testing gate" `## What NOT to do` bullet with one
  clarifying the checklist is no longer a gate but still shouldn't be checked off by anything other
  than `#tested`. Removed the matching `## Checklist` item. The manual-SQL-confirmation gate (step
  0, now still step 0) is untouched.

### ~/.claude/skills/tested/SKILL.md
- Reworded the frontmatter `description` to describe checking off `## Testing` items as an optional
  confirmation rather than something "required before `#commit`'s gate will let the pipeline
  proceed." No change to the skill's actual mechanics (still checks off every item on `#tested`).

### ~/.claude/skills/code/SKILL.md
- Added new step 6: the full `## Testing` checklist must always be included in the chat completion
  message once every `## Plan` step is done — not optional, since `#commit` no longer gates on it.
  Updated the frontmatter `description` to mention this. Added a `## What NOT to do` bullet ("don't
  finish a run without presenting the checklist in chat") and a matching `## Checklist` item,
  separate from the existing "wrote the `## Testing` section" item — writing to the file and
  presenting in chat are now two distinct mandatory sub-steps.

### ~/.claude/COMMANDS.md
- Updated the `#tested` summary to say it's optional and no longer required before `#commit`.
  Updated the `#commit` summary to drop the "checks Testing has no unchecked items, refuses to
  proceed" language — its entry now starts straight from the manual-SQL confirmation. Updated the
  `#code` summary to note the Testing checklist is always presented in chat, not just written to
  the file.

### ~/.claude/CLAUDE.md — redundancy/inconsistency audit (presented one finding at a time, each approved individually)
- `#code` bullet updated to mention the checklist is always presented in chat (matches the
  `code`/`SKILL.md` change above; was previously only documented in `COMMANDS.md`, not here).
- Added a sentence to "Markdown files — always allowed" explicitly excluding
  `~/.claude/skills/*/SKILL.md` from the pre-authorized list — skill files go through the normal
  `#plan`/`#code` gate like project documentation does, closing an ambiguity that wasn't stated
  anywhere before.
- Trimmed "Manual SQL must be confirmed complete before `#commit`"'s "How to apply" paragraph to
  delegate mechanics to `commit/SKILL.md` step 0 instead of restating the same check in both
  places — keeps only the *why* here.
- Merged the two rename-rule bullets under "Coding Conventions" into one, folding the
  `nextjs-shared`-specific escalation into the general rule instead of stating it twice.
- Added a cross-reference from the general "hardcoded list" Coding Convention to the project-list
  rule under "All projects are local," noting the project list is a standing exception (never
  hardcoded even with confirmation).
- Reviewed "Explicit choices — never decide silently" vs. "Constraint values must be in the plan"
  for a possible merge — decided (user's call, after a fuller explanation of the before-`#code`
  vs. mid-run timing distinction) to leave both sections separate.
- Replaced "Planning workflow" (4 generic steps, 3 of which duplicated the `#plan`/`#code` trigger
  mechanics) with a shorter "Verify a plan before executing" section keeping only the
  previously-unstated verification requirement.

### infostore/.claude/CLAUDE.md (edited directly via the #audit sentinel; no plan file, testing, or commit in that project — housekeeping only)
- Removed the "## Silent file updates — never ask permission" section — referenced the now-defunct
  `.claude/PLAN.md`/`.claude/CHANGES.md` workflow; the current `docs/PLAN_<slug>.md` convention
  (silent updates already covered globally) applies without a local restatement.
- Removed the "## nextjs-shared reference" section (`CONSUMING_PROJECTS.md` pointer) — already
  stated in global `~/.claude/CLAUDE.md`'s "nextjs-shared" section.
- Removed the "## Schema file" section (`scripts/schema.sql` boilerplate) — already stated in
  global `~/.claude/CLAUDE.md`'s "Database / table conventions".
- Verified the resulting file reads cleanly, no dangling headers or blank sections.
- Note: `git ls-files .claude/` in infostore shows `.claude/CHANGES.md` and `.claude/PLAN.md` are
  still tracked, leftover files from the old workflow — not touched in this pass since it's a
  separate cleanup (deleting tracked files) from editing `CLAUDE.md`'s content; flagged for later.

### next-bridge/.claude/CLAUDE.md (edited directly via the #audit sentinel; housekeeping only)
- Removed the duplicated "## nextjs-shared reference" section and "## Schema file" section — both
  already covered by global `~/.claude/CLAUDE.md`.

### next-bridgeschool/.claude/CLAUDE.md (edited directly via the #audit sentinel; housekeeping only)
- Removed the duplicated "## nextjs-shared reference" section and "## Schema file" section — both
  already covered by global `~/.claude/CLAUDE.md`.

### next-dbadmin/.claude/CLAUDE.md (edited directly via the #audit sentinel; housekeeping only)
- Removed the duplicated "## nextjs-shared reference" section and "## Schema file" section.
- Removed three duplicated generic coding-convention bullets from "## Key conventions" (function
  declarations, `'use client'`/`'use server'` first line, no `require()`) — all already covered by
  global Coding Conventions. Kept the two project-specific bullets (`POSTGRES_URL` optional,
  don't add `xlg_logging` without a local database).

### richard-dashboard/.claude/CLAUDE.md (edited directly via the #audit sentinel; housekeeping only)
- Removed the duplicated "## nextjs-shared reference" section — already covered by global
  `~/.claude/CLAUDE.md`.

### infostore/.claude/PLAN.md, .claude/CHANGES.md (git rm via the #audit sentinel)
- `git rm`'d both, staged in infostore's own repo (not committed — per the "no commit for claude
  changes" instruction, left for the user to commit alongside their own infostore work whenever
  that happens).

### ~/.claude/skills/audit/SKILL.md
- Removed the "A `cd` gotcha specific to this skill" section entirely — it described
  `project-isolation-guard.js` keying off the Bash tool's live cwd, which is no longer true after
  the `CLAUDE_PROJECT_DIR` anchoring fix earlier in this plan.

### Auto-memory: feedback_isolation_guard_tracks_shell_cwd.md
- Rewrote to mark the issue RESOLVED (2026-07-25): kept as a historical record of the bug and fix
  rather than deleting outright, in case of a future regression, but removed the now-obsolete
  "how to apply" workaround. Updated its `MEMORY.md` index line to match.

### nextjs-shared/.claude/CLAUDE.md — compared against global CLAUDE.md for duplication/conflict
- Removed a duplicated "never rename an export without instruction" paragraph — the global
  CLAUDE.md's (now-merged) rename rule already covers this, and this project's copy had a stale
  path (`C:\Users\richa\github`, missing the `\claude\` segment present everywhere else).
- Removed two duplicated, and narrower, error-handling bullets from "Coding conventions" (only
  mentioned severity `'E'`, omitting `'W'`/`'I'` that the global "Error handling" section already
  documents in full).

## Testing
- [ ] In a real session, `cd` into another project's folder via Bash/PowerShell (e.g. run any
  command in `chess`), then try to `Edit`/`Write` a file back in nextjs-shared — confirm it's
  allowed (previously this could get incorrectly blocked after the `cd`).
- [ ] In that same drifted-cwd state, try to `Edit`/`Write` a file in the other project (chess) —
  confirm it's still correctly blocked by the isolation guard, pointing at nextjs-shared as the
  current project.
- [ ] Confirmed via the manual stdin simulations logged above (allowed/blocked/fallback cases) —
  no automated test suite exists for hooks in this environment.
- [ ] Next time a `#commit` runs with an unchecked `## Testing` item, confirm it proceeds instead
  of refusing.
- [ ] Next time a `#code` run finishes, confirm the `## Testing` checklist is actually shown in the
  chat completion message, not just written to the PLAN file.
