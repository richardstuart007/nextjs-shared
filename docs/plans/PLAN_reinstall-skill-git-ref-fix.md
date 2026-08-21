# PLAN_reinstall-skill-git-ref-fix — nextjs-shared

## Title
Fix #reinstall's stale nextjs-shared git-ref resolution

## Background — why this plan exists

Discovered during a next-bridgeschool session: `#reinstall`'s current steps (delete
`node_modules`/`package-lock.json`, `npm install --legacy-peer-deps`) do not guarantee a fresh
`nextjs-shared` install. npm caches git-ref resolution (`github:owner/repo` → commit) separately
from `node_modules`/the lockfile, so a project can stay pinned to a stale commit — in that
session's case, 17 commits behind — even after a full clean reinstall. The only thing that forced
a fresh resolution was `npm install nextjs-shared@github:richardstuart007/nextjs-shared#main
--legacy-peer-deps --force`.

Two other approaches were considered and rejected:
- **SHA-pinning `package.json` every `#reinstall`** — would give a deterministic install and a
  visible diff, but conflicts with the existing rule that nextjs-shared version pins are only ever
  set via the nextjs-shared dev app's Versions tab / "Sync All" tool, never by hand-editing
  `package.json`. Rejected.
- **SHA-pin AND `--force`** — doesn't fix anything `--force` alone doesn't already fix; only
  reintroduces the same Versions-tab conflict, for the sole benefit of visibility into which
  commit got installed. Rejected in favor of printing that info instead of persisting it.

Agreed approach: after the normal reinstall, force a fresh resolution of `nextjs-shared`
specifically (using whatever spec is already in `package.json` — untouched either way), then print
the resolved info so there's visibility without a persisted diff. A bare commit SHA isn't
recognizable on its own — the installed package's own `version` field (from
`node_modules/nextjs-shared/package.json`) is what's actually meaningful, since it's bumped on
every commit per this project's release rules. Report the version as the primary signal, with the
short commit SHA alongside for exactness (e.g. `nextjs-shared reinstalled @ version 2.1.77
(commit 689ec566)`).

This is a shared skill (`~/.claude/skills/reinstall/SKILL.md`) used by every project, so the fix
applies globally, not just to next-bridgeschool.

## Plan
- [x] `~/.claude/skills/reinstall/SKILL.md`: after the existing `npm install --legacy-peer-deps`
      step, add a new step: if `package.json`'s `dependencies` has a `nextjs-shared` entry, run
      `npm install "nextjs-shared@<that exact spec>" --legacy-peer-deps --force` to force a fresh
      git-ref resolution, then read the installed `version` field from
      `node_modules/nextjs-shared/package.json` and the resolved short commit SHA (from `npm ls
      nextjs-shared`), and report both in the chat output (e.g. `nextjs-shared reinstalled @
      version 2.1.77 (commit 689ec566)`). Skip this step entirely if the project has no
      `nextjs-shared` dependency (e.g. nextjs-shared itself, or a non-Next.js local project).
- [x] Do not modify `package.json` as part of this step under any circumstance — the dependency
      spec stays exactly as the Versions tab / Sync All last set it.
- [x] Update the skill's "What NOT to do" and "Checklist" sections to reflect the new step.
- [x] Bump the `version` field in the skill's frontmatter (1.0.0 → 1.1.0).

## Changes

### ~/.claude/skills/reinstall/SKILL.md
- Added a new step 4 (between `npm install --legacy-peer-deps` and the `.next` removal): if the
  project has a `nextjs-shared` dependency, force-reinstall it specifically with `--force` using
  its exact existing `package.json` spec, to bypass npm's stale git-ref resolution cache — the root
  cause of a next-bridgeschool session staying pinned to a commit 17 behind `main` even after a
  full clean reinstall. Reports the installed version and short commit SHA in chat output (e.g.
  `nextjs-shared reinstalled @ version 2.1.77 (commit 689ec566)`); never writes anything to
  `package.json`, since that file's `nextjs-shared` spec is owned by the Versions tab / Sync All
  tool.
- Renumbered the remaining steps (`.next` removal, `tsc`, `build`) from 4-6 to 5-7.
- Updated "What NOT to do" with an explicit note against persisting the resolved SHA/version into
  `package.json`, and updated the Checklist with the new step.
- Bumped frontmatter `version` 1.0.0 → 1.1.0.
- Verified via direct testing (not a full end-to-end `#reinstall` run, since nextjs-shared itself
  has no `nextjs-shared` dependency to exercise the positive path against): the guard clause
  correctly no-ops in nextjs-shared (confirmed live), and the version/SHA-extraction logic produces
  the exact agreed output format when tested against a realistic synthetic `npm ls` string.

## Testing
- [ ] Run `#reinstall` in a real consuming project (e.g. next-bridgeschool or chess) and confirm
      step 4 prints `nextjs-shared reinstalled @ version X.X.X (commit XXXXXXXX)` with a real
      version/SHA, and that `package.json` shows no diff after the run.
- [ ] Confirm the whole `#reinstall` sequence still completes end-to-end (tsc + build pass) in that
      project.
- [ ] Guard clause and SHA/version parsing logic verified directly in nextjs-shared (no
      `nextjs-shared` dependency here to exercise the positive path against end-to-end) — already
      done above, re-check if desired.
