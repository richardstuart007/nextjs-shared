# PLAN_expand-function-headers-add-function-order — nextjs-shared

## Title
Expand function-headers skill to cover every function; add new function-order skill for top-down reordering

## Plan
- [x] Expand `~/.claude/skills/function-headers/SKILL.md` scope: every function in a file gets a
      title comment (existing plain `//----` style) if it doesn't already have one, and a short
      description + `Parameters:`/`Returns:` when the title alone doesn't convey purpose — same
      no-fabrication rules as today (never invent `2) NOTES`/history/behavior not in the code).
      Main/exported function's numbered `1)/2)/3)` header handling stays as-is.
- [x] Add a concise ordering rule to global `~/.claude/CLAUDE.md`'s existing `### Functions`
      section (which today only says "main logic at the top, helper functions below"): precise
      rule is `useEffect`s first, then the main exported function, then helpers ordered by first
      use. Also states the arrow-function conversion rule: any `const` arrow function used as a
      named function must be converted to a `function` declaration UNLESS it genuinely cannot be
      converted without changing behavior or fighting an API — the two known cases are an inline
      callback passed directly as a prop/argument, and a callback wrapped in `useCallback`/
      `useMemo` (which require a function expression, not a hoisted declaration). Never invent a
      workaround to force a conversion (e.g. a named function expression inside `useCallback`) —
      if it can't convert, leave it as an arrow. Those "cannot convert" cases are skipped for
      ordering (declared wherever needed before use) but still require full title/description/
      params/returns commenting. Points to the new `function-order` skill for the retroactive
      audit/fix mechanics, mirroring how the header convention points to `function-headers` —
      CLAUDE.md holds the rule text itself (read prospectively, every session), the skill holds
      the retroactive-fix procedure.
- [x] Create new `~/.claude/skills/function-order/SKILL.md`: reorders a file's function
      declarations top-down per the CLAUDE.md rule above (read fresh from CLAUDE.md, not
      hardcoded in the skill). Includes a pre-check/conversion pass: any `const` arrow function
      used as a named function gets converted to a `function` declaration unless conversion is
      genuinely impossible per the CLAUDE.md rule above (inline prop/argument callback, or
      `useCallback`/`useMemo`-wrapped) — those are skipped for reordering but must still get full
      commenting. Defines the ambiguous-order rule (a helper called by more than one other helper,
      or mutual calls) as "order by first use, flag the ambiguity to the user" rather than
      silently guessing. Requires a type-check after every single move/conversion, not just at the
      end of the file. Restricted to the current project, same as `function-headers`.
- [x] Confirm neither skill needs a `COMMANDS.md` entry — both are natural-language-triggered
      skills (like `pagination`, `db-naming`), not `#`/`/` literal-trigger commands, matching how
      `function-headers` itself isn't listed there today.
- [x] Apply the new ordering rule to `src/components/MyPagination.tsx` as a real first case:
      reorder its three helpers (`generatePagination`, `PaginationArrow`, `PaginationNumber`) by
      first-use order within `MyPagination`'s body (`generatePagination` → `PaginationArrow` →
      `PaginationNumber`).
- [x] Run `function-order` (only — `function-headers` deferred to a separate run) across all 89
      `.ts`/`.tsx` files under `src/`, no exclusions. Scope confirmed with the user first, per both
      skills' own "never run a whole-project pass without confirming the file list" rule. Executed
      via 5 parallel background agents (~18 files each), each following
      `~/.claude/skills/function-order/SKILL.md` and reading the rule fresh from CLAUDE.md, with
      one practical adaptation from the skill's literal per-move type-check: type-check once per
      file (not per individual move) given the 89-file scale, reverting a file's edits immediately
      if that check failed. Final whole-project `npx tsc --noEmit` run by the orchestrating session
      after all 5 chunks completed, to confirm consistency across the parallel edits.

## Changes
### ~/.claude/skills/function-headers/SKILL.md
- Expanded scope from "main export only" to every function in a file: adds a missing title
  comment, adds description/Params/Returns when the title alone isn't enough, and reformats a
  title that's present but in a looser/unbordered form (the gap found while testing on
  `MyDropdown.tsx` — `determineRows` had a title but not the canonical bordered style).
  Version bumped 1.0.0 → 1.1.0.

### ~/.claude/CLAUDE.md
- Added a precise ordering rule to the existing `### Functions` section: `useEffect`s → main
  function → helpers by first use, with an explicit "flag, don't guess" rule for ambiguous cases.
- Added the arrow-function conversion rule: convert any `const` arrow function used as a named
  function to a `function` declaration, unless it genuinely cannot convert without changing
  behavior or fighting an API (inline prop/argument callback, or `useCallback`/`useMemo`-wrapped)
  — those stay arrows, are skipped for ordering, but still need full commenting. Points to the new
  `function-order` skill for retroactive audit/fix mechanics.

### src/components/MyDropdown.tsx
- Reformatted the nested `determineRows` helper's comment from a loose unbordered `//` block into
  the canonical bordered title style, and added a `Returns:` line (real, non-obvious return value)
  — a live test of the expanded `function-headers` scope before building it out further.
  `fetchOptions` (a `useCallback`-wrapped arrow function) was deliberately left unconverted per
  the "cannot convert without fighting the API" exception.

### ~/.claude/skills/function-order/SKILL.md
- New skill: reorders a file's functions top-down (useEffects → main → helpers by first use),
  reading the precise rule fresh from CLAUDE.md rather than owning its own copy. Converts stray
  `const` arrow functions used as named functions into `function` declarations, except where
  conversion is genuinely impossible (inline prop/argument callback, or `useCallback`/`useMemo`).
  States its own explicit carve-out from the global "never restructure code" rule, since this is
  the user-invoked mechanism for exactly the one restructuring being standardized on.

### src/components/MyPagination.tsx
- Reordered the three helpers (`generatePagination`, `PaginationArrow`, `PaginationNumber`) to
  match their first-use order inside `MyPagination`'s body — the first real application of the
  new ordering rule.
- Also converted `PaginationNumber`'s local `handleClick` from `const handleClick = () => {...}`
  to `function handleClick() {...}` — found while applying the ordering pass: it's a named const
  arrow referenced by identifier (not an inline prop/argument callback, not `useCallback`/
  `useMemo`-wrapped), so it falls under "must convert," not the "cannot convert" exception. This
  wasn't called out in the original plan step for this file (which only anticipated the three
  already-`function` top-level helpers) — flagging it here since it's a small but real expansion
  of what got touched in this file.

### Project-wide `function-order` pass (89 files, 12 changed)
- **src/components/MySelectMulti.tsx** — reordered `selectAll` before `toggle` to match first use
  in the return JSX (the "select all" row's `onChange` appears before per-item rows').
- **src/components/MyCheckbox.tsx** — reordered 5 helpers by actual first-use chain:
  `renderCheckboxes` (the only one called from the main body) → `renderHiddenInputs` →
  `isSelected` → `handleCheckboxChange` → `sortSelected`.
- **src/UI/OwnerTableSessionStorage.tsx** — swapped `handleDelete`/`handleClearAll` to match
  button order in the JSX (Refresh → Clear All → per-row Delete).
- **src/UI/OwnerRoutingMaintenance.tsx** — reordered 6 handlers to match the `isEditing` ternary's
  true-branch-before-false-branch textual order in the JSX.
- **src/UI/OwnerTableCache.tsx** — swapped `handleRowClick`/`handleDelete` (nested tier); the three
  top-level sibling functions were already correctly ordered.
- **src/UI/OwnerSyncVersions.tsx** — swapped `versionDiff`/`extractBaseVersion` to match first
  textual use.
- **src/UI/OwnerTableLogging.tsx** — reordered `truncateDisplay`/`sqlViewValue`/`fmtDate` to match
  first use in the row JSX.
- **src/UI/OwnerComponentTest.tsx** — mechanical reorder across all 23 `XxxTab` components: each
  had its `handleApply` (and, in two tabs, a second local helper) declared before its own `return`
  statement; moved to after it, matching the "main logic/return at top, helpers below" convention
  already used elsewhere. Verified as a pure move (`git diff --stat`: equal insertions/deletions,
  same total line count).
- **src/tables/tableGeneric/table_fetch_join.ts** — reordered `injectJoins` before
  `table_fetch_join_query` to match its earlier first use directly in the main function's body.
- **src/app/owner/functiontest/page.tsx** — moved the `runTests` helper from before the `return`
  to after it, matching the same convention as `OwnerComponentTest.tsx`.
- **src/components/MyPagination.tsx**, **src/components/MyDropdown.tsx** — reverified already
  compliant from the earlier manual pass this session; no further changes.

No arrow-to-function conversions were needed anywhere in the 89-file scan — every named function
project-wide was already a `function` declaration (this project had no `const`-arrow-as-named-
function violations to begin with). Full project `npx tsc --noEmit` clean after all changes.

**Ambiguous cases flagged, left unchanged (not guessed):**
- `src/tables/cache/userCache_store.ts` — `getDataInfo` is called from three different exported
  `cache_*` functions; no single "first use" applies.
- `src/components/isSelectionFiltering.ts` — `isSelectionFiltering` and `serializeSelection` are
  both independent public exports of equal status; `serializeSelection` calls the other internally,
  so which one is "main" is genuinely ambiguous.
- `src/tables/db.ts` — `resolveDbKey` is both a standalone exported function and a helper called
  from inside `createDbQueryHandler`; a dual role that doesn't cleanly resolve to one position.
- `src/components/MyMergeClasses.ts` — `getCoreClass` has multiple callers; `sameTextType`/
  `sameBorderType` are never called by name directly (wired in via the `CLASS_GROUPS` config array's
  `canReplaceCheck` field), so "first use in the main body" doesn't cleanly apply to them either.

## Testing
- [ ] Read `~/.claude/skills/function-headers/SKILL.md` and `~/.claude/skills/function-order/SKILL.md`
      end-to-end and confirm they read the way you intended — these are behavior-defining files
      for future Claude sessions, worth a direct review rather than just trusting the diff.
- [ ] Read the updated `### Functions` section in `~/.claude/CLAUDE.md` and confirm the ordering/
      conversion rule reads clearly on its own, without needing today's conversation as context.
- [ ] Open `src/components/MyDropdown.tsx` and `src/components/MyPagination.tsx` in an editor and
      confirm the comment/order changes look right and aren't "padding" — the concern you raised
      mid-run.
- [ ] Confirmed via `npx tsc --noEmit` after every file edit (MyDropdown.tsx, MyPagination.tsx) —
      no user-facing behavior change in either file, comment/ordering-only.
- [ ] Try invoking `function-headers` and `function-order` by name (e.g. "check function order in
      src/components/MySelect.tsx") on a file not touched today, to confirm the skills trigger and
      behave as expected outside of this session's own test cases.
- [ ] Review the 12 files changed by the project-wide pass (`git diff` against each) — especially
      `src/UI/OwnerComponentTest.tsx` (largest diff, 456 lines, mechanical move across 23 tabs) —
      and confirm the reordering reads correctly, nothing was dropped, and nothing feels like
      unwanted churn.
- [ ] Decide on the 4 flagged ambiguous-ordering cases (`userCache_store.ts`'s `getDataInfo`,
      `isSelectionFiltering.ts`, `db.ts`'s `resolveDbKey`, `MyMergeClasses.ts`'s multi-caller/
      config-wired helpers) — left untouched pending a human call, not resolved automatically.
- [ ] Run/exercise the app locally (or at least the `/owner` dev pages, since `OwnerComponentTest.tsx`,
      `OwnerTableCache.tsx`, `OwnerTableLogging.tsx`, `OwnerSyncVersions.tsx`, `OwnerRoutingMaintenance.tsx`,
      and `OwnerTableSessionStorage.tsx` were all touched) to confirm nothing broke behaviorally —
      `tsc` only proves types are consistent, not that runtime behavior is unchanged.
- [ ] Decide whether/when to run the deferred `function-headers` pass project-wide (this run was
      `function-order` only, per your choice).
