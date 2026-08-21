# PLAN_mydropdown-decommission — nextjs-shared

## Title
Review MyDropdown usage and hand off next-bridgeschool migration

## Background — why this plan exists

`PLAN_myselect-label-value-options` (archived, `docs/archive/`) covered steps 1-3 of the original
5-step MyDropdown decommission: gap review, fixing `MySelect` to accept label/value option
objects, and a full cross-project usage survey. This plan covers what's actually achievable from a
nextjs-shared session for the remaining two steps.

**Step 4 — replace MyDropdown call sites in other projects.** Project isolation means the actual
edits cannot happen from a nextjs-shared session. The only consuming project with remaining
`MyDropdown` usage is **next-bridgeschool**: 34 call sites across 14 files. A detailed handoff
instruction (file/line mapping, prop-remapping guidance for both the `table=`→`MySelectTable` and
`tableData=`→`MySelect` groups) was drafted and sent to a next-bridgeschool session, which created
its own `docs/plans/PLAN_mydropdown-migration.md` there after independently re-verifying the
call sites — and found the handoff instruction's "26 sites are a pure drop-in" claim was slightly
optimistic: 9 of those 26 also pass `tableColumn`/`tableColumnValue`, which a separate, unrelated
nextjs-shared release had already removed from `MyDropdown` (replaced by
`whereColumnValuePairs`), so those 9 need remapping too, not just a rename. The actual next-
bridgeschool migration work itself is tracked entirely in that project's own plan — not
duplicated here, since it would drift out of sync.

**Side-finding during the next-bridgeschool handoff — resolved.** That session hit a stale npm
git-ref resolution (stuck 17 commits behind `main` even after a full clean reinstall) and, while
investigating, this project's own working tree was found to have a stray, uncommitted, never-
pushed self-referencing dependency (`"nextjs-shared": "github:richardstuart007/nextjs-shared"`
inside nextjs-shared's own `package.json`) — confirmed harmless (never affected anyone, since it
was never committed) but removed anyway, with `package-lock.json` regenerated to match. The npm
staleness issue itself is being fixed separately via `PLAN_reinstall-skill-git-ref-fix.md`.

**Step 5 — decommission MyDropdown itself — deferred, not part of this plan.** Cannot happen until
next-bridgeschool's migration (tracked in its own plan) is confirmed complete (no consuming
project still imports `MyDropdown`). At that point, a new plan should be created here to: delete
`src/components/MyDropdown.tsx`, remove its `package.json` export line, remove its demo tab from
`OwnerComponentTest.tsx`, remove its documentation section from `CONSUMING_PROJECTS.md`, and
update `.claude/CLAUDE.md`'s Outstanding items. Note `MySelectTable` imports
`MyDropdown_dftClass`/`MyDropdown_labelDftClass`/`MyDropdown_searchDftClass` from `constants.ts` —
those stay; only `MyDropdown.tsx` itself, its export, and its demo tab go.

## Plan
- [x] Confirm no consuming project other than next-bridgeschool has remaining `MyDropdown` usage
      (fresh grep across all projects).
- [x] Draft and send the next-bridgeschool migration handoff instruction (file/line mapping, prop
      remapping guidance for both call-site groups).
- [x] Remove the stray, uncommitted, never-pushed self-referencing `nextjs-shared` dependency from
      this project's own `package.json`, and regenerate `package-lock.json` to match.

## Changes

### package.json
- Removed the stray `"nextjs-shared": "github:richardstuart007/nextjs-shared"` self-reference from
  `dependencies` — this project cannot sensibly depend on itself. It was never committed, so this
  change brings the working tree back in line with what was already on `main`.

### package-lock.json
- Regenerated via `npm install --legacy-peer-deps` after the `package.json` fix above, removing the
  resolved-dependency bloat that the stray self-reference had caused.
