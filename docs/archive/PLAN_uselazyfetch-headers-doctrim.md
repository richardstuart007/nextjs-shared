# PLAN_uselazyfetch-headers-doctrim — nextjs-shared

## Title
useLazyFetch hook, retroactive function header comments across src/, and CONSUMING_PROJECTS.md trim

Combined from three sequential plans in this session (`PLAN_uselazyload`,
`PLAN_function-header-comments`, `PLAN_trim-consuming-projects-docs`) — merged into one file since
they'll all be committed together.

## Plan

### Phase 1 — useLazyFetch hook
- [x] Add `useLazyFetch<T>` hook to `src/components/useLazyFetch.ts`, exactly as provided
- [x] Add `"./useLazyFetch": "./src/components/useLazyFetch.ts"` to `package.json` `exports`,
  following the existing `useBackNav`/`useTabQueryState` pattern
- [x] Document `useLazyFetch` in `CONSUMING_PROJECTS.md` (signature, params, return shape, usage
  example)
- [x] Run `npx tsc --noEmit` to verify
- [x] Add error handling to `useLazyFetch`: catch a rejected `fetchFn()`, reset `loading` to
  `false` in all cases (success or failure), and expose a new `error: unknown` field in the
  returned object (`null` when no error has occurred, cleared on each new `load()` call)
- [x] Guard against a race condition when `deps` changes before an in-flight fetch resolves —
  discard a stale fetch's result instead of overwriting state from a newer `deps` value
- [x] Update the `CONSUMING_PROJECTS.md` `useLazyFetch` section to document the new `error` field
- [x] Run `npx tsc --noEmit` to verify
- [x] Genericize the `useLazyFetch` example in `CONSUMING_PROJECTS.md` — replace the chess-specific
  `PlayerPanel`/`fetchPlayerStats`/`plid`/"Failed to load player" naming with a domain-neutral
  equivalent (`ItemPanel`/`fetchItem`/`itemId`/"Failed to load item"); confirmed via grep no other
  chess-specific code exists anywhere in `src/`
- [x] Fully comment `useLazyFetch` per the project's inline-comment convention (min. 3-line `//`
  blocks) — explain `autoFetch`'s default, `requestIdRef`'s purpose, the staleness check on both
  the success and error paths, and the effect's request-invalidation + state-reset steps
- [x] Run `npx tsc --noEmit` to verify
- [x] Reorder `useLazyFetch`'s body top-down: `useEffect` first, then the `return` statement, then
  the `load` function declaration last (function declarations hoist)
- [x] Add a section-header comment above `useEffect` and above the `load` function declaration,
  matching the existing indented `//----...----//` style already used in this codebase
- [x] Run `npx tsc --noEmit` to verify
- [x] Expand the function's top-level header comment to document each parameter (`fetchFn`, `deps`,
  `options.autoFetch`) and each returned field (`data`, `loaded`, `loading`, `error`, `load`)
- [x] Run `npx tsc --noEmit` to verify
- [x] Add a matching `Params:`/`Returns:` block to `src/components/useBackNav.ts`'s `saveBackNav`
  and `useBackNav` header comments
- [x] Add a matching `Params:`/`Returns:` block to `src/components/useTabQueryState.ts`'s
  `useTabQueryState` header comment
- [x] Run `npx tsc --noEmit` to verify

### Phase 2 — retroactive Params/Returns header comments across all of src/
Standard applied to every file:
1. **Top-down order** — main/exported function or component first, nested/local helper functions
   declared below it (function declarations hoist).
2. **Header block on every named function/component** — a `//----...----//` title comment (82-dash
   non-indented for top-level/exported functions, 94-dash indented for nested helpers), followed by
   a `Params:`/`Returns:` breakdown. Skip the `Params:`/`Returns:` block only when there's
   genuinely nothing beyond the one-line description worth saying.

- [x] Audit & update every file in `src/components/` (29 files)
- [x] Audit & update every file in `src/UI/` (16 files)
- [x] Audit & update every file in `src/tables/` (29 files, incl. `tableGeneric/`,
  `tableGeneric/table_pages/`, `cache/`, `db.ts`, `structures.ts`)
- [x] Audit & update every file in `src/app/` (14 files)
- [x] Run `npx tsc --noEmit` to verify
- [x] Run `npm run prettier` to verify formatting (found not to exist as a script — see Changes)

### Phase 3 — CONSUMING_PROJECTS.md trim
- [x] §2 Database Setup: replace the embedded `CREATE TABLE public.xlg_logging (...)` DDL block
  with a pointer to `scripts/schema.sql` as the single source of truth. Also fixes an existing
  staleness bug: the embedded snippet was labeled `-- src/schema.sql`, but the real file is
  `scripts/schema.sql`.
- [x] §5 Generic Table Operations: replace each function's full code-example + explanatory-prose
  subsection (`table_fetch`, `table_fetch_join`, `table_write`, `table_upsert`, `table_update`,
  `table_delete`, `table_check`, `table_count`, `table_seqGet`/`table_seqReset`,
  `table_drop`/`table_truncate`/`table_duplicate`/`table_copy_data`, `table_query`,
  `fetchFiltered`, `fetchTotalPages`, `fetchTotalRows`) with a compact list — function name,
  one-line purpose, pointer to source. Keep only genuinely cross-cutting integration knowledge
  (the `TableResult<T>` soft-fail contract, `table_fetch_join`'s same-physical-database
  constraint, the cache auto-populate/auto-clear behavior table).
- [x] §7 UI Components — `useBackNav` / `useTabQueryState` / `useLazyFetch` subsections: same trim
  (list + pointer to source). Keep genuinely external setup requirements not visible from the
  hook's own source: `useTabQueryState`'s `NuqsAdapter` root-layout wrap and required
  `<Suspense>` boundary.
- [x] Run `npx tsc --noEmit` — sanity check (docs-only change, expected no-op)
- [x] §2a Multi-Database Routing: replace the embedded `CREATE TABLE public.xrtg_routing (...)`
  DDL block with a pointer to `scripts/schema.sql` — same pattern as `xlg_logging` above.
  Confirmed via grep this was the only other remaining embedded `CREATE TABLE` in the file.
- [x] §4 Logging, "Write a log entry": replace the full `write_logging({...})` example (whose
  inline comments duplicate `write_logging.ts`'s own `Params:` header almost field-for-field)
  with a short description + pointer to that header. Keep the one genuinely cross-cutting
  sentence — "all `table_` functions populate `lg_sql_raw`/`lg_sql_params`/`lg_sql_readable`
  automatically... most callers never need to pass these manually."

**§7's `### X props` component subsections** — per the new "Extended documentation header"
convention added to `.claude/CLAUDE.md` (two-header structure: `Params:`/`Returns:`, plus an
optional second header for real behavioral depth, positioned right after imports, before
`type Props`) and the AskUserQuestion answers confirming (a) prop tables get trimmed to a pointer
same as everything else, and (b) only add a second header where there's genuine content beyond
params — not for symmetry. Classified during the chat audit:

- [x] **Pure trim, no source change needed** (headers from Phase 2 already cover everything):
  `MyButton`, `MyInput`, `MyTextarea`, `MyBox`, `MyToggle`, `MyTab` (its `AppTab` wrapper example
  just re-demonstrates the already-general "Project-wide defaults" section at line ~428 — trim to
  a cross-reference instead of re-explaining). Replace each subsection's prop table + prose with a
  one-line description + source pointer.
- [x] **Small second-header addition** (a real behavior/gotcha Phase 2 missed, a few sentences
  each), then trim the doc subsection to a pointer:
  - `MySelect.tsx` — auto-select-on-single-match requires a controlled `value`+`onChange`; an
    uncontrolled `MySelect` silently skips it.
  - `MyPagination.tsx` — why corner-rounding/direction-margin classes aren't exposed as props
    (structural positioning, not a style choice).
  - `MyPaginationFooter.tsx` — the 3-column grid layout reasoning (centers `MyPagination`
    relative to the whole row, not just leftover space).
  - `MyPopup.tsx` — why `closeOnBackdropClick` defaults `false` (backward compat — every existing
    consumer, including `MyConfirmDialog`, keeps unchanged behavior unless explicitly opted in).
  - `MyCheckbox.tsx` — selected options are always kept sorted; min/max validation shows an inline
    error when a limit is hit.
  - `MyDropdown.tsx` / `MySelectTable.tsx` — auto-selects the single option when only one exists;
    fetches on mount (`table`) or uses pre-fetched rows (`tableData`, `MyDropdown` only).
- [x] **Substantial second-header** (Phase 2 under-documented these):
  - `MySelectRows.tsx` — the 0-options/1-option/2+-options render-nothing/static-text/dropdown
    behavior, currently entirely missing from its header.
  - `MySelectMulti.tsx` — the selection convention (both extremes = no filter), the "select all"
    row's visual-unchecked-during-full-selection state, floating-selection ordering, the
    `minSelected`/`maxSelected` swap-oldest-on-max behavior (incl. the insertion-order vs.
    display-order caveat), the `merge`-prefix naming convention, and the panel-width-inherits-
    from-trigger behavior. This is the bulk of the ~170-line `MySelectMulti props` doc section.
- [x] **Cross-file move, per chat agreement:** `isSelectionFiltering.ts` currently has only a
  short one-line-per-function header (`isSelectionFiltering`, `serializeSelection`,
  `SELECTION_ALL`). Expand it with the full usage guidance currently living in the doc under
  `MySelectMulti props` (why `isSelectionFiltering` should be used instead of ad hoc `.length`
  checks, why `serializeSelection`/`SELECTION_ALL` avoid a stale-snapshot bug on persist/restore)
  — these are genuinely that file's own documentation, not `MySelectMulti`'s, even though they're
  framed around it in the doc today. `MySelectMulti.tsx`'s own header gets a one-line
  cross-reference pointing to `isSelectionFiltering.ts` instead of re-explaining.

**New feature (a real code change, not just a docs move) — per chat agreement:** `MyHelp` and
`MyHelpStep` currently hardcode "always show a close button" and "always close on outside click"
unconditionally. Turn both into props instead, so the behavior is self-documenting via each
component's own `Params:` header rather than needing prose explaining a hardcoded choice:
- [x] Add `showCloseButton?: boolean` (default `true`) and `closeOnOutsideClick?: boolean`
  (default `true`) to `MyHelp.tsx` and `MyHelpStep.tsx`. Both default `true` — required for every
  existing caller to keep its current behavior unchanged with zero call-site changes. Naming:
  `closeOnOutsideClick`, not `closeOnBackdropClick` (`MyPopup`'s name) — these two components have
  no rendered backdrop element (the close-on-outside-click is a
  `document.addEventListener('mousedown', ...)` listener against a ref), so "outside click" is
  the accurate term, not "backdrop".
- [x] `MyHelpField` is explicitly **not** touched — confirmed via AskUserQuestion: it's a
  structurally different interaction model (hover-triggered, dismisses on mouse-leave, no
  click-to-open state at all), not just a component missing two props.
- [x] Update `OwnerComponentTest.tsx`'s `MyHelpTab`/`MyHelpStepTab` demo tabs to expose the two
  new props (per this project's own "demo page must stay in sync with component changes" rule).
- [x] Update both components' headers to document the two new props via `Params:` (no second
  header needed here — once they're real, named, documented props, there's nothing left over
  requiring extra prose).
- [x] Trim `CONSUMING_PROJECTS.md`'s `MyHelp props` / `MyHelpStep props` subsections to a pointer
  — the hardcoded-behavior prose (and the `MyHelpStep` → `MyHelpField` comparison note) is gone,
  now that this is just two documented, independently-inspectable props per component. Done
  together with the rest of the §7 component trim below, once the user confirmed testing passed.
- [x] Run `npx tsc --noEmit` after the `MyHelp`/`MyHelpStep` prop changes specifically (a real
  code change, not docs-only — needs an actual type-check pass, not just habit).

### Phase 4 — two missed fixes found + new "Change History" header convention
- [x] Fix: the `xrtg_routing` `CREATE TABLE` DDL in §2a was never actually replaced with a
  `scripts/schema.sql` pointer, despite being marked `[x]` in Phase 3 above — a genuine miss,
  caught by the user re-pasting the still-present snippet. Fixed now.
- [x] Fix: the full `write_logging({...})` example in §4 was likewise never actually trimmed,
  despite being marked `[x]` — same kind of miss. Fixed now (short description + source pointer,
  keeping the one cross-cutting sentence about `table_` functions auto-populating SQL fields).
- [x] Audited the rest of `CONSUMING_PROJECTS.md` for other steps marked done that weren't — grep
  for old DDL/code-example content found no further misses; the one `table_fetch` example still
  present (§10 "caller convention") is a different, legitimate example, not a leftover.
- [x] Moved the §2a "Behavior:" paragraph (routing-map caching, no-live-reload-until-restart,
  fallback-to-primary-when-`xrtg_routing`-missing) into `db.ts`'s own header comments (the
  `routingMapPromise` section comment, which already covered part of this) — doc trimmed to a
  pointer.
- [x] New convention, per chat agreement: a third optional header, `Change History:`, added to
  `.claude/CLAUDE.md` alongside the existing `Params:`/`Returns:` + optional second-header
  structure. Scope agreed via AskUserQuestion: every named function (not just exported/public),
  only added once there's a real entry (same "no useless documentation" principle as the second
  header), date-only (no package version — that's only known at the `#commit` version-bump step,
  and stamping it would require changing that skill, judged not worth it for now), forward-only
  (no backfill of pre-convention history).
- [x] Added the first `Change History:` entry to the three files with an actual change this
  round, per the user's explicit scope: `useLazyFetch.ts` (new hook), `MyHelp.tsx` and
  `MyHelpStep.tsx` (`showCloseButton`/`closeOnOutsideClick` props). The mass retroactive
  `Params:`/`Returns:` header rollout itself does not get entries anywhere — it's a
  documentation-only pass, not a change a consuming project needs to know about.
- [x] Run `npx tsc --noEmit` to verify.

### Phase 5 — final numbered header shape + cross-project skill
Through further chat discussion, the header shape from Phase 4 was refined to its final form:
one unified main header per file (not separate `Params:`/`Note:`/`Change History:` blocks),
numbered `1) DESCRIPTION` (with `Parameters:`/`Returns:` sub-sections) / `2) NOTES` / `3) CHANGE
HISTORY`, double-equals-bordered, and repositioned to sit between the `'use client'`/`'use
server'` directive and the file's imports (not after the imports as Phase 3/4 had it) — the user
wants this enforced across their other projects too, not just nextjs-shared.
- [x] Finalized the shape in chat (several rounds: numbered sections agreed, then `DESCRIPTION`
  split out as its own top section with `Parameters:`/`Returns:` as sub-sections, then
  double-equals border requested, then repositioning before imports confirmed after checking
  it doesn't conflict with the `'use client'`-must-be-first-line rule).
- [x] Wrote the final shape into `nextjs-shared`'s own `.claude/CLAUDE.md` (project file),
  consolidating what had been three separate subsections (header format, extended-doc header,
  Change History) into one coherent section.
- [x] Wrote the same final shape into the **global** `~/.claude/CLAUDE.md`'s existing "Function
  comment headers" section (under Coding Conventions) — this is what makes it apply to every
  project, not just nextjs-shared. Reframed the Change History rationale to be project-agnostic
  (not just "a consuming project reading source" — any future reader, including other projects,
  a future Claude session, or a teammate).
- [x] Create a new skill, `function-headers` (agreed name, chosen to match the existing
  `db-naming`/`db-column-reorder`/`pagination` naming style — short noun-phrase, not a verb),
  at `~/.claude/skills/function-headers/SKILL.md`. Confirmed via chat discussion this is a
  separate skill, not folded into `#code` (which is a generic plan-executor with no opinion on
  any specific coding convention — matches how `db-naming` isn't folded into `#code` either).
  Operationalizes auditing/fixing a file (or a project's `src/` tree) against the header
  convention now in global `CLAUDE.md`, mirroring `db-naming`'s structure (why-this-exists,
  before-starting, per-file procedure, what-not-to-do, checklist). Explicitly designed to never
  fabricate `2) NOTES`/`3) CHANGE HISTORY` content during a pure reformat pass — only reposition/
  restructure what's already true, and only add a Change History entry when invoked alongside an
  actual code change happening in the same session.
- [x] Applied the new `function-headers` shape across nextjs-shared's own `src/` tree — every
  file from Phase 2 (the ~88-file retroactive `Params:`/`Returns:` pass) plus the handful with
  second-header `Note:`/`Change History:` content from Phase 3/4, reformatted to the final
  numbered/repositioned/double-equals shape. Same directory order as Phase 2 (`components/`,
  `UI/`, `tables/`, `app/`), with a `tsc` checkpoint after each directory (all clean). See the
  per-directory Changes entries above for exactly which files were reformatted vs. intentionally
  left unchanged (multi-export modules with no single "main", or files with no functions at all).

### Phase 6 — CONSUMING_PROJECTS.md §10 "Coding Conventions for Claude": same duplication
  problem as §2/§4/§5/§7, found via chat audit comparing each §10 subsection against global
  `~/.claude/CLAUDE.md`.
- [x] **Pure duplicates — removed from `CONSUMING_PROJECTS.md` entirely** (global's version is
  identical or a strict superset): `What Claude must never do without being asked`,
  `File structure`, `Functions`, `Async`, `Database / table conventions`.
- [x] **`Error handling` — reconciled the drift, not just deleted.** Kept only the
  nextjs-shared-specific delta (require both `lg_functionname` + `lg_caller`) as an addition on
  top of a pointer to global CLAUDE.md's Error handling section, instead of leaving it as an
  independently-drifting full restatement.
- [x] **`Function comment headers` — trimmed to a one-line pointer** at global `CLAUDE.md`'s now-
  updated numbered convention, since there's nothing nextjs-shared-specific about the header
  shape itself.
- [x] **Stayed, legitimately nextjs-shared-specific**: `Layout (consuming project responsibility)`,
  `caller convention`, `Cache`, `Server actions` (kept the `noLog: true` detail), `Components`
  (kept the `ssr:false`/hydration-mismatch note, not in global). `TypeScript` — trimmed to just
  the `nextjs-shared/structures` types line; the rest (explicit types, `type` over `interface`)
  was generic and already in global.
- [x] Ran `npx tsc --noEmit` — clean, as expected for a docs-only change.

## Changes

### Phase 1 — src/components/useLazyFetch.ts
- New hook: `useLazyFetch<T>(fetchFn, deps, options?)` — fetches on mount (or on `deps` change),
  tracking `data`/`loaded`/`loading`; `load()` can also be called manually. `autoFetch: false`
  defers the initial fetch until `load()` is called explicitly.
- Added error handling — a rejected `fetchFn()` is caught, `loading` is reset to `false` in both
  the success and failure paths, and the caught value is exposed via a new `error: unknown` field.
- Added a race-condition guard for a stale in-flight fetch — a `requestIdRef` counter (rather than
  a bare effect-cleanup flag, since `load()` is also callable manually, independent of the
  effect): each `load()` call claims a new id, the `deps`-change effect bumps it too, and a
  resolving fetch only applies its result if its own id still matches the current one.
- Added full inline commenting per the project's convention.
- Reordered top-down: `useEffect` first, then `return`, then `load` declared last, each with its
  own section-header comment.
- Expanded the top-level header comment with a `Params:`/`Returns:` breakdown.

### Phase 1 — src/components/useBackNav.ts, src/components/useTabQueryState.ts
- Added matching `Params:`/`Returns:` blocks to `saveBackNav`/`useBackNav`/`useTabQueryState`'s
  header comments, for consistency with `useLazyFetch`'s new style.

### Phase 1 — package.json
- Added `"./useLazyFetch": "./src/components/useLazyFetch.ts"` to `exports`.

### Phase 1 — CONSUMING_PROJECTS.md
- Added `useLazyFetch` to the UI Components import table and a new section with usage examples.
- Documented the new `error` field, stale-fetch-discard behavior, and error-path semantics.
- Genericized the usage example (chess-specific naming → generic `ItemPanel`/`fetchItem`).

### Phase 2 — src/components/ (29 files)
- Added `Params:`/`Returns:` header blocks to every named function/component.
- Reordered to top-down in files where the original order was helpers-before-main: `MySelectMulti.tsx`,
  `MySelectTable.tsx`, `MyDropdown.tsx`, `MyCheckbox.tsx`.
- `npx tsc --noEmit` verified clean after this batch.

### Phase 2 — src/UI/ (16 files)
- Added `Params:`/`Returns:` header blocks to every named function/component across all 16 files,
  including the ~50 functions inside `OwnerComponentTest.tsx`.
- Reordered to top-down where needed: `OwnerBackNavDemo.tsx`, `DevLayoutHeader.tsx`,
  `DbKeySelect.tsx`, `OwnerConstants.tsx`, `OwnerTableSessionStorage.tsx`, `OwnerRoutingTest.tsx`,
  `OwnerRoutingMaintenance.tsx`, `OwnerTableCache.tsx`, `OwnerSyncVersions.tsx`,
  `OwnerTableLogging.tsx`.
- `OwnerSyncVersions_actions.ts` was **not** reordered — a multi-export actions module with no
  single "main," only headers added, order left as-is (flagged, not decided silently).
- `npx tsc --noEmit` verified clean after this batch.

### Phase 2 — src/tables/ (29 files)
- Added `Params:`/`Returns:` header blocks to every named function across `tableGeneric/`,
  `tableGeneric/table_pages/`, `cache/`, and `db.ts`. `structures.ts` and
  `table_comparison_values.ts`/`page_constants.ts` have no functions — skipped.
- No reordering needed anywhere — every file was already top-down, or is a multi-export module
  with no single "main" (same judgment call as `OwnerSyncVersions_actions.ts`).
- `npx tsc --noEmit` verified clean after this batch.

### Phase 2 — src/app/ (14 files)
- Added header comments to every function/component/page.
- `npx tsc --noEmit` verified clean.

### Phase 2 — Formatting check
- `npm run prettier`/`npm run prettier:check` **do not exist** in this project's `package.json`
  (only `build`/`start`/`locallocal` are defined), despite being documented in this project's own
  `.claude/CLAUDE.md` — a pre-existing discrepancy, unrelated to this task, not fixed here.
- Ran `npx prettier --check "src/**/*.{ts,tsx}"` directly instead: 89 files reported as not
  matching Prettier's default style. Confirmed pre-existing and unrelated — no `.prettierrc` in
  the project, and `table_comparison_values.ts` (untouched by this plan, no git diff) also fails.
  Not "fixed," since doing so would mean reformatting semicolons/quotes across the entire
  codebase, well outside this task's scope.

### Phase 2 — Summary
All ~88 files across `src/components/`, `src/UI/`, `src/tables/`, and `src/app/` now have
`Params:`/`Returns:` header blocks on every named function/component, and every file with a clear
single-main-function shape was reordered top-down. `npx tsc --noEmit` passes clean.

### Phase 3 — CONSUMING_PROJECTS.md
- §2 Database Setup: removed the embedded `xlg_logging` `CREATE TABLE` DDL (already drifted —
  wrong file path, missing 3 columns `write_logging.ts` actually writes). Replaced with a pointer
  to `scripts/schema.sql`.
- §2a Multi-Database Routing: same fix for the embedded `xrtg_routing` `CREATE TABLE` DDL.
- §4 Logging: trimmed the `write_logging` usage example to a short description + source pointer,
  keeping the one cross-cutting sentence about `table_` functions auto-populating SQL fields.
- §5 Generic Table Operations: replaced 14 subsections' worth of code examples + duplicated
  Params/Returns prose with one compact table (function name + one-line purpose) pointing to each
  function's own source header, plus a short bullet list of genuinely cross-cutting notes.
- §7 UI Components: trimmed the `useBackNav`, `useTabQueryState`, and `useLazyFetch` subsections
  to a short description + pointer to each hook's own source header.
- Net so far: 1739 → 1373 lines (-366), before the §7 component-props work below.
- `npx tsc --noEmit` confirmed clean (docs-only change, no-op as expected).

### Phase 3 — src/components/MyHelp.tsx, src/components/MyHelpStep.tsx
- Added `showCloseButton?: boolean` (default `true`) — gates the "×" close button in the panel
  header.
- Added `closeOnOutsideClick?: boolean` (default `true`) — gates the `mousedown`-outside-click
  listener that closes the panel (the listener is skipped entirely, not just a no-op inside it,
  when `false`).
- Both default `true`, so every existing caller's behavior is unchanged with no call-site edits.
- The trigger button's own toggle (`onClick={() => setOpen(o => !o)}`) is unconditional and
  unaffected by either prop — even with both `false`, the panel remains closeable by clicking the
  trigger again.
- `MyHelpField` was not touched (different interaction model — hover-triggered, no click-to-open
  state).
- Updated both components' header comments to document the two new props via `Params:`.
- Added a note to `MyHelp.tsx`'s header explaining that the trigger button's own toggle is always
  active regardless of `showCloseButton`/`closeOnOutsideClick` — even with both `false`, the panel
  stays closeable via the trigger. `MyHelpStep.tsx`'s header cross-references this instead of
  repeating it (single source of truth).
- Updated `src/UI/OwnerComponentTest.tsx`'s `MyHelpTab` and `MyHelpStepTab` demo tabs — added
  `showCloseButton`/`closeOnOutsideClick` checkboxes to the controls column, wired into the live
  preview and the Returns column.
- `npx tsc --noEmit` confirmed clean.
- User tested `showCloseButton`/`closeOnOutsideClick` live in `/test/components` and confirmed
  working — including confirming the trigger-button-always-toggles behavior with both props
  `false`. Documentation trim (below) proceeded once this was confirmed.

### Phase 3 — §7 UI Components, `### X props` subsections
- Added a small second-header note (a real behavior/gotcha beyond a plain prop list) to:
  `MySelect.tsx` (auto-select requires a controlled `value`+`onChange`), `MyPagination.tsx` (why
  corner-rounding/margin classes aren't props), `MyPaginationFooter.tsx` (3-column grid layout
  reasoning), `MyPopup.tsx` (why `closeOnBackdropClick` defaults `false`), `MyCheckbox.tsx`
  (selections always sorted; inline min/max validation error), `MyDropdown.tsx`/
  `MySelectTable.tsx` (auto-select-single-option + fetch-on-mount/`tableData` behavior).
- Added a substantial second-header to `MySelectRows.tsx` (the 0/1/2+-options
  nothing/static-text/dropdown behavior — also fixed a slight inaccuracy in the old one-line
  description, which conflated the 0-options and 1-option cases) and to `MySelectMulti.tsx` (the
  full selection convention, floating-selection ordering, `minSelected`/`maxSelected` swap-oldest
  behavior, `merge`-prefix naming convention, and panel-width-inheritance behavior — moved
  essentially verbatim from the ~170-line doc section).
- Expanded `isSelectionFiltering.ts`'s header with the usage guidance (why to use
  `isSelectionFiltering` instead of an ad hoc check; the `serializeSelection`/`SELECTION_ALL`
  persist/restore pattern) that the doc previously explained only in terms of `MySelectMulti`.
  `MySelectMulti.tsx`'s own header now just cross-references this file instead of re-explaining.
- Replaced all 17 `### X props` subsections (`MyButton` through `MyHelpStep`, plus `MyHelp props`/
  `MyHelpStep props` specifically, now that their behavior is just two documented props) with one
  compact "Component | Purpose" table pointing to each component's own source header, plus a short
  bullet list of the genuinely cross-cutting notes no single component's source could carry
  (`isSelectionFiltering` usage, `MyTab`'s wrapper-pattern cross-reference instead of
  re-demonstrating, `MyDropdown`/`MySelectTable`'s shared `whereColumnValuePairs` shape, and
  `MyHelpField`'s structurally-different interaction model vs. `MyHelp`/`MyHelpStep`).
- `npx tsc --noEmit` confirmed clean (all source header additions).
- Net for this final chunk: 1373 → 851 lines (-522). Total across all of Phase 3: 1739 → 851
  lines (-888).

### Phase 4 — CONSUMING_PROJECTS.md
- §2a: replaced the `xrtg_routing` DDL with a pointer to `scripts/schema.sql` (the miss described
  above), and replaced the "Behavior:" paragraph with a pointer to `db.ts`.
- §4: replaced the full `write_logging` usage example (the other miss) with a short description +
  pointer to `write_logging.ts`'s header, keeping the cross-cutting SQL-auto-population sentence.

### Phase 4 — src/tables/db.ts
- Expanded the `routingMapPromise` section comment to explicitly state the cache-until-restart
  behavior and the non-breaking fallback-to-primary behavior, absorbing the content that used to
  live only in the doc's "Behavior:" paragraph.

### Phase 4 — .claude/CLAUDE.md
- Added the "Change History header — third header, tracking consumer-relevant changes over time"
  section: format (dated, one line per entry, oldest-to-newest), scope (every named function, not
  just exported ones), the "only once there's a real entry" rule, and "forward-only, no backfill."

### Phase 4 — src/components/useLazyFetch.ts, MyHelp.tsx, MyHelpStep.tsx
- Added each file's first `Change History:` entry (2026-08-25): `useLazyFetch.ts` — new hook
  summary; `MyHelp.tsx`/`MyHelpStep.tsx` — the `showCloseButton`/`closeOnOutsideClick` addition.
- `npx tsc --noEmit` confirmed clean.

### Phase 5 — nextjs-shared's .claude/CLAUDE.md
- Consolidated the three separate subsections from Phase 2/4 ("Function header comments",
  "Extended documentation header", "Change History header") into one coherent section describing
  the final numbered/double-equals/pre-imports shape.

### Phase 5 — global ~/.claude/CLAUDE.md
- Rewrote the existing "Function comment headers" subsection (under Coding Conventions) to the
  same final shape, so it applies to every project, not just nextjs-shared. Kept the old
  94-dash/82-dash plain-header examples, now reframed as the style for helper (non-main)
  functions rather than the primary convention. Reframed the Change History rationale to be
  project-agnostic.

### Phase 5 — rollout: src/components/ (28 files) reformatted to final numbered shape
- Every file in `src/components/` repositioned to the final `1) DESCRIPTION` (`Parameters:`/
  `Returns:` sub-sections) / `2) NOTES` / `3) CHANGE HISTORY` shape, double-equals bordered,
  positioned between `'use client'` and imports (or at the very top of the file for the two
  files with no directive: `MyMergeClasses.ts`).
- Multi-block files consolidated into the new single-header shape: `MyHelp.tsx`/`MyHelpStep.tsx`
  (Params/Note/Change History → 1/2/3), `MySelectMulti.tsx` (two separate comment blocks — a
  short Params block and a long separate "behavior notes" block — merged into one 1)/2) header).
- `useBackNav.ts` and `isSelectionFiltering.ts` left unchanged (multi-export, no single "main"),
  consistent with the Phase 2 judgment call.
- `npx tsc --noEmit` verified clean after this batch.

### Phase 5 — rollout: src/UI/ (15 of 16 files) reformatted to final numbered shape
- Every file with a single main export repositioned to the final numbered/double-equals/
  pre-imports shape: `OwnerTableLogging_actions.ts`, `OwnerDbRouting_actions.ts`,
  `OwnerLayout.tsx`, `OwnerBackNavDemo.tsx`, `DevLayoutHeader.tsx`, `DbKeySelect.tsx`,
  `OwnerPage.tsx`, `OwnerConstants.tsx`, `OwnerTableSessionStorage.tsx`, `OwnerRoutingTest.tsx`,
  `OwnerRoutingMaintenance.tsx`, `OwnerTableCache.tsx`, `OwnerSyncVersions.tsx`,
  `OwnerTableLogging.tsx`, `OwnerComponentTest.tsx` (main header only — its ~50 nested per-tab
  helper functions keep their existing 94-dash indented headers, unchanged, per convention).
- `OwnerSyncVersions_actions.ts` left unchanged — multi-export module (10 actions), no single
  "main," consistent with the Phase 2 judgment call.
- `npx tsc --noEmit` verified clean after this batch.

### Phase 5 — rollout: src/tables/ (21 of 29 files) reformatted to final numbered shape
- Reformatted: `buildSql_Readable.ts`, `buildSql_Placeholders.ts`, `fetchTotalRows.ts`,
  `table_drop.ts`, `fetchTotalPages.ts`, `table_truncate.ts`, `fetchFiltered.ts`,
  `table_duplicate.ts`, `table_seq_reset.ts`, `table_count.ts`, `table_query.ts` (folded its
  separate intro comment block into the one numbered header), `table_check.ts`,
  `table_write.ts`, `table_update.ts`, `write_logging.ts`, `table_delete.ts`, `table_upsert.ts`,
  `table_fetch.ts`, `table_copy_data.ts`, `table_fetch_join.ts`, `table_seq_get.ts`. Files with
  no `'use client'`/`'use server'` directive got the header at the very top of the file, before
  imports (`buildSql_Readable.ts`, `buildSql_Placeholders.ts`).
- Left unchanged — multi-export modules with no single "main": `buildSqlQuery.ts` (3 exports),
  `db.ts` (2 exports: `sql`, `resolveDbKey`), `userCache_store.ts` (cache_get/cache_set/etc.),
  `cache_actions.ts` (4 actions), `tableFetchUtils.ts` (3 shared query functions) — consistent
  with the Phase 2 judgment call.
- Left unchanged — no functions at all: `structures.ts` (types only), `table_comparison_values.ts`,
  `page_constants.ts` (bare constants).
- `npx tsc --noEmit` verified clean after this batch.

### Phase 5 — rollout: src/app/ (13 of 14 files) reformatted to final numbered shape
- Reformatted: `backnav-test/[id]/page.tsx`, `layout.tsx` (no directive — header placed at the
  very top of the file, before imports), `owner/OwnerGenerateData.tsx`,
  `owner/functiontest/page.tsx`, `owner/layout.tsx`, `owner/page.tsx`, `page.tsx`,
  `test/back-nav-demo/page.tsx`, `test/components/page.tsx`, `test/constants/page.tsx`,
  `test/layout.tsx`, `test/routing-test/page.tsx`, `test/versions/page.tsx`.
- `actions.ts` left unchanged — multi-export module (`action_generateLogs`,
  `action_generateCache`), no single "main," consistent with the Phase 2 judgment call.
- `npx tsc --noEmit` verified clean after this batch — Phase 5's full `src/` rollout is now
  complete across all four directories.

### Phase 5 — new skill: ~/.claude/skills/function-headers/SKILL.md
- Created, mirroring `db-naming`'s structure (why-this-exists, before-starting, per-file
  procedure, what-not-to-do, checklist). Reads the convention fresh from `~/.claude/CLAUDE.md`
  each time rather than embedding its own copy, so it can't drift out of sync with future
  refinements to the convention. Explicitly forbids fabricating `2) NOTES` or `3) CHANGE HISTORY`
  content during a pure audit/reformat pass.
- Confirmed registered and available (appeared in the skills list immediately after creation).
- Retroactively reformatting nextjs-shared's own existing headers to this final shape (the actual
  first real use of this skill) is explicitly **not** done as part of this step — flagged as a
  separate, large follow-up task.

### Phase 6 — CONSUMING_PROJECTS.md §10 "Coding Conventions for Claude"
- Removed 5 pure-duplicate subsections entirely (`What Claude must never do without being asked`,
  `File structure`, `Functions`, `Async`, `Database / table conventions`) — replaced by one
  intro sentence pointing to global `~/.claude/CLAUDE.md`'s Coding Conventions section.
- `Error handling`: trimmed to just the nextjs-shared-specific delta (`lg_functionname` +
  `lg_caller` both required) on top of a pointer to global's Error handling section.
- `Function comment headers`: replaced the stale pre-numbered-convention example blocks with a
  one-line pointer to global CLAUDE.md's now-updated numbered convention.
- `TypeScript`: trimmed to just the `nextjs-shared/structures` shared-types line (the rest was
  generic and already in global).
- Left unchanged (legitimately nextjs-shared-specific): `Server actions`, `Components`,
  `Layout (consuming project responsibility)`, `caller convention`, `Cache`.
- `npx tsc --noEmit` confirmed clean (docs-only change, no-op as expected).
- Net: §10 went from ~140 lines to ~55 lines.

## Testing
- [ ] `useLazyFetch` (Phase 1): confirmed via `npx tsc --noEmit` only — no existing call sites yet.
      To verify, use it from a consuming project after reinstalling, and confirm: `loaded`/`data`/
      `loading` behave correctly, `deps` changes trigger a re-fetch, `autoFetch: false` defers the
      first fetch, a rejected `fetchFn()` sets `error` correctly, and a stale in-flight fetch
      doesn't clobber a newer result.
- [ ] Header comments + reordering (Phase 2): confirmed via `npx tsc --noEmit` only (checked
      repeatedly throughout) — comment-only plus reordering of function *declarations* (never
      `const` arrow functions), so it cannot change runtime behavior. No consuming-project
      reinstall/retest needed. Optional: spot-check `OwnerRoutingMaintenance`, `OwnerTableCache`,
      `OwnerSyncVersions`, and `MySelectMulti`/`MySelectTable`/`MyDropdown`/`MyCheckbox` via
      `/test/components` for extra visual confirmation, given the size of this pass.
- [ ] CONSUMING_PROJECTS.md trim (Phase 3): documentation-only — read through
      [CONSUMING_PROJECTS.md](CONSUMING_PROJECTS.md) once to confirm it still reads coherently and
      every cross-reference still resolves to a real section (including the two-table §7 structure
      — the "UI Components" import table near the top, and the new "Component | Purpose" table
      further down).
- [x] `MyHelp`/`MyHelpStep` new props: confirmed working live by the user in `/test/components` —
      default behavior unchanged, and the trigger-always-toggles behavior confirmed even with both
      new props `false`.
- [ ] Phase 5 rollout (final numbered/double-equals/pre-imports header shape across all of
      `src/`): confirmed via `npx tsc --noEmit` only, checked after every directory
      (`components/`, `UI/`, `tables/`, `app/`) — comment-only repositioning, cannot change
      runtime behavior. No consuming-project reinstall/retest needed. Optional: spot-check a
      handful of reformatted files directly (e.g. `MyHelp.tsx`, `MySelectMulti.tsx`,
      `OwnerComponentTest.tsx`, `table_fetch.ts`) to confirm the header reads correctly and sits
      between the `'use client'`/`'use server'` directive (or the very top, for files with
      neither) and the imports.
- [ ] Phase 6 (`CONSUMING_PROJECTS.md` §10 trim): documentation-only — read through
      [CONSUMING_PROJECTS.md](CONSUMING_PROJECTS.md)'s §10 "Coding Conventions for Claude" once
      to confirm it still reads coherently, the pointers to global `~/.claude/CLAUDE.md` make
      sense in context, and nothing genuinely nextjs-shared-specific was accidentally removed.
