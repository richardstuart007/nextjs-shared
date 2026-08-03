# PLAN_owner-constants-tab — nextjs-shared

## Title
Combined session plan: (1) MySelectRows component + constants centralization [complete], (2)
Pagination skill enforcement + docs, (3) Owner `/owner` Constants tab, (4) MyPaginationFooter
component, (5) integrate MyPaginationFooter into OwnerTableLogging, (6) MyPaginationFooter layout
tweaks (centered pagination, narrower rows dropdown), (7) MyPagination sub-element override props,
(8) MySelectRows own default width.

## Plan

### 1. MySelectRows + constants centralization
- [x] Create `src/constants.ts` — a new project-wide constants file for nextjs-shared (first of its
      kind; existing components colocate defaults in their own files, but going forward new
      standalone tunable values live here for easier at-a-glance viewing). Exports
      `MySelectRows_optionsDftShared = [10, 20, 50, 100] as const` and
      `MySelectRows_valueDftShared = 20`. Internal to nextjs-shared only — not registered in
      `package.json`'s `exports` map for `MySelectRows`'s own two constants specifically, since
      consuming projects override via `MySelectRows`'s own `options`/`value` props, not by
      importing the raw constants directly.
- [x] Create `src/components/MySelectRows.tsx` — a thin wrapper around `MySelect` (following the
      pattern established by next-bridge's local `RowsPerPageSelect`):
      - Imports `MySelectRows_optionsDftShared`/`MySelectRows_valueDftShared` from `../constants`.
      - Props: `value: number`, `onChange: (value: number) => void`,
        `options?: readonly number[]` (default `MySelectRows_optionsDftShared`), plus passthrough
        `label?`, `id?`, `overrideClass?`, `labelClass?`, `containerClass?` forwarded straight to
        the underlying `MySelect` (no re-merging — `MySelect` already handles `myMergeClasses`,
        label/id linking, and container styling internally).
      - Renders each option's label as `` `${n} rows` ``, matching next-bridge's existing display
        convention.
- [x] Register the new component export in `package.json`'s `exports` map:
      `"./MySelectRows": "./src/components/MySelectRows.tsx"`
- [x] Update `CONSUMING_PROJECTS.md` with the new component's props, defaults, and a usage example
      (including how a consuming project overrides `options`/`value` for a different default).
- [x] Review all code in this project (`src/`) for constants currently declared *inside a function
      body* (per the global Constants convention). Found and moved three: `OwnerTableLogging.tsx`'s
      filter-change debounce delay (`OwnerTableLogging_filterDebounceMs = 2000`) and message
      truncation length (`OwnerTableLogging_msgTruncateLen = 200`), and `OwnerTableCache.tsx`'s
      tables-badge visible-count (`OwnerTableCache_tablesBadgeVisibleCount = 3`). Excluded per the
      convention's own carve-outs: table names, SQL text, test/demo fixture data
      (`src/app/actions.ts`), and a Postgres pool-size correctness constant (`db.ts`'s `max: 1`,
      deliberately fixed for serverless, not a casual tunable).
- [x] **Scope expanded mid-execution (agreed via chat):** every existing shared component's
      already-exported module-level default-class constant (44 constants across 19 component
      files, e.g. `MySelect_dftClass_Shared`, `MyTab_underlineActiveClass_Shared`) was ALSO moved
      into `src/constants.ts`. Agreed naming: drop the `_Shared` suffix only, keep each constant's
      existing infix (e.g. `MySelect_dftClass`, `MyTab_underlineActiveClass`). Agreed export
      surface: `src/constants.ts` is the only source — component files no longer re-export these
      names, so `"./constants": "./src/constants.ts"` was added to `package.json`'s `exports` map,
      and `CONSUMING_PROJECTS.md`'s "Project-wide defaults" pattern plus every affected component's
      props table/"Exported constants" line were rewritten to import from `nextjs-shared/constants`
      instead of from each component's own module. Verified no consuming project (chess, infostore,
      next-bridge, next-bridgeschool, next-dbadmin, richard-dashboard) imported any of these
      constants directly before the rename, so this is non-breaking for all six.
- [x] Run:
      npx tsc --noEmit

### 2. Pagination skill
- [x] Insert the following content into `CONSUMING_PROJECTS.md`, immediately after the
      `### fetchFiltered — paginated filtered SELECT` code example's closing code fence and before
      the `---` separator that follows it:

      **Always use this — never fetch a whole table and paginate/filter it client-side.** A pagination
      UI (page numbers, rows-per-page dropdown) can look complete while the underlying query still loads
      every row — the UI looking right doesn't mean the query is right. Only `fetchFiltered`/
      `fetchTotalPages` with `limit`/`offset` actually bound what's queried and sent to the client.

      *Real incident:* next-bridge's Home page had a fully-wired pagination UI (`MyPagination` +
      rows-per-page selector) sitting on top of an unbounded `table_query`/`table_fetch` call, silently
      loading 11,000+ and 14,000+ row tables into the browser on every page view — confirmed via git
      history to have been that way since the page was first built. For a complete, currently-working
      reference to model a new paginated list on, see chess's `src/lib/actions/games.ts`
      (`fetchFilteredGames`/`getGamesPageCount`) and `src/ui/games/GameList.tsx`.

- [x] Update `~/.claude/skills/pagination/SKILL.md` (global skill, editable from any project per
      `~/.claude/CLAUDE.md`'s project-isolation exception for Claude's own working files — still
      goes through this `#plan`/`#code` gate since it's a skill file, not exempt) to also mandate
      the UI layer, not just the fetchFiltered/fetchTotalPages data layer:
      - Add `MyPagination` (page controls) and `nextjs-shared/MySelectRows` (rows-per-page dropdown)
        as the required shared components for any paginated list's UI — replacing a hand-rolled or
        project-local equivalent (e.g. next-bridge's own `RowsPerPageSelect`, now superseded by the
        shared `MySelectRows`).
      - Update the existing "Why this exists" narrative's mention of `RowsPerPageSelect` to note it
        predates `MySelectRows` and should be migrated.
      - Add a checklist item: confirm the list uses `MyPagination`/`MySelectRows` rather than a
        hand-rolled pagination control or rows-per-page dropdown.
- [x] Add a new entry to nextjs-shared's own `.claude/CLAUDE.md` "Outstanding items" section, under
      next-bridge, noting that its local `RowsPerPageSelect` (`src/ui/shared/RowsPerPageSelect.tsx`)
      should be migrated to the shared `MySelectRows` — flagged for a session opened in next-bridge,
      not actioned here (project isolation).
- [x] Run:
      npx tsc --noEmit

### 3. Owner Constants tab
- [x] Create `src/UI/OwnerConstants.tsx` — `'use client'` component with its own `MyTab`
      (underline variant) row for 3 sub-tabs: Constants, .env, Functions.
      - **Constants sub-tab**: `import * as Constants from '../constants'`, iterate
        `Object.entries(Constants)`, group by the component-name prefix before the first
        underscore (`name.split('_')[0]` — e.g. `MySelect_dftClass` groups under "MySelect"),
        render each group as a heading with `name: value` rows (arrays via `JSON.stringify`,
        everything else as a plain string). Fully derived from the module — no hand-written
        descriptions.
      - **.env sub-tab**: a small fixed array matching `CONSUMING_PROJECTS.md` §3 exactly —
        `POSTGRES_URL`, `NEXT_PUBLIC_APPENV_LOG_I`, `NEXT_PUBLIC_APPENV_LOG_D`,
        `NEXT_PUBLIC_APPENV_ISDEV` (name + existing doc description each) — rendered against an
        `envValues: Record<string, string | undefined>` prop (values must be read server-side and
        passed in, since a client component can't read non-`NEXT_PUBLIC_` env vars directly).
      - **Functions sub-tab**: derived from `package.json`'s `exports` map (`import pkg from
        '../../package.json'`) — exclude any export whose target path is under `/components/` or
        `/UI/` (already shown in the existing "Components" tab) and any path ending in
        `constants.ts` (`./constants`, `./chess/constants` — those feed the Constants sub-tab, not
        Functions). Group remaining entries by folder via a small fixed label map:
        `tables/tableGeneric/table_pages` → "Pagination", `tables/tableGeneric` → "Generic Table
        Operations", `tables/cache` → "Cache", `tables` (root) → "Database Connection", `chess` →
        "Chess" — unrecognized folders fall back to the raw path so nothing is silently dropped.
        Also exclude `./structures` (type definitions, not a function).
- [x] Update `src/app/owner/page.tsx` (server component, no `'use client'`) to read the 4 env vars
      from `process.env` and pass them into a new `envValues` prop, and add
      `{ label: 'Constants', content: <OwnerConstants envValues={{...}} /> }` to the existing
      `OwnerPage` tabs array (alongside Logging, Cache, Versions, Components, Generate Data, Back
      Nav Demo).
- [x] Run:
      npx tsc --noEmit
- [x] Run:
      npm run build
- [x] **Refinement (agreed via chat after initial build):** remove the Functions sub-tab entirely —
      delete `groupFunctions`/`functionFolder`/`FUNCTION_GROUP_LABELS`/`FUNCTION_EXCLUDED_KEYS` and
      the `pkg`/`package.json` import, and drop the "Functions" button + its render branch from the
      top-level sub-tab row (which becomes just Constants / .env). Within the Constants sub-tab,
      replace the single continuous grouped list with its own nested `MyTab` row (pill variant,
      matching next-bridge's inner-tab convention) — one tab per constant group/component (e.g.
      MySelect, MyButton, MyTab, OwnerTableCache, OwnerTableLogging, ...), showing only the
      selected group's `name: value` rows at a time.
- [x] Run:
      npx tsc --noEmit
- [x] Run:
      npm run build

### 4. MyPaginationFooter component
- [x] Add `MyPaginationFooter_dftClass` to `src/constants.ts` — the container row's default class:
      `'flex items-center justify-between bg-yellow-100 px-2 py-1 rounded-md'` (yellow background
      per explicit request; reuses the existing `MySelectRows_optionsDftShared` constant for its
      default rows-per-page options, no new options constant needed).
- [x] Create `src/components/MyPaginationFooter.tsx` — combines `MySelectRows` (left) and
      `MyPagination` (right) in one row, `justify-between`:
      - Props: `totalPages: number`, `statecurrentPage: number`,
        `setStateCurrentPage: (value: number) => void` (passed straight to `MyPagination`);
        `rowsPerPage: number`, `setRowsPerPage: (value: number) => void`,
        `rowsOptions?: readonly number[]` (default `MySelectRows_optionsDftShared`, passed to
        `MySelectRows` as `value`/`onChange`/`options` — no label, per agreed design).
      - Container styling: `defaultClass = MyPaginationFooter_dftClass`, `overrideClass?: string`,
        merged via `myMergeClasses` (standard pattern).
      - Nested pass-through style props (agreed): `paginationOverrideClass?: string` →
        `MyPagination`'s own `overrideClass`; `selectRowsOverrideClass?: string` → `MySelectRows`'s
        own `overrideClass`.
- [x] Register export in `package.json`'s `exports` map:
      `"./MyPaginationFooter": "./src/components/MyPaginationFooter.tsx"`
- [x] Update `CONSUMING_PROJECTS.md`: add a `### MyPaginationFooter props` section (props table,
      usage example showing it replacing separate `MyPagination`/`MySelectRows` instances) and a
      row in the UI Components table.
- [x] Run:
      npx tsc --noEmit
- [x] Run:
      npm run build

### 5. Integrate MyPaginationFooter into OwnerTableLogging
- [x] **Decision agreed via chat:** keep `LOGGING_ROWS_PER_PAGE = 40` as the initial rows-per-page
      value (option (a)); added `OwnerTableLogging_rowsOptions = [10, 20, 40, 100] as const` to
      `src/constants.ts` as this table's custom options override, including `40` alongside the
      shared defaults — explicitly "as a test" of the `rowsOptions` override per the user. Rows-per-page
      changes reset `currentPage` to `1`, matching the documented usage pattern.
- [x] Replace `src/UI/OwnerTableLogging.tsx`'s current lone `<MyPagination .../>` with
      `<MyPaginationFooter .../>`: added `rowsPerPage` state (initial `LOGGING_ROWS_PER_PAGE`),
      used it (not the fixed constant) in `fetchdata`'s `offset`/`limit`/`items_per_page`, added it
      to the filter-change effect's dependency array so changing it triggers a refetch, and passed
      `rowsOptions={OwnerTableLogging_rowsOptions}`.
- [x] Run:
      npx tsc --noEmit
- [x] Run:
      npm run build

### 6. MyPaginationFooter layout tweaks
- [x] Changed `MyPaginationFooter_dftClass` in `src/constants.ts` from
      `flex items-center justify-between ...` to a 3-column grid (`grid grid-cols-3 items-center
      ...`): rows-dropdown in the left cell (as-is), `MyPagination` wrapped in a
      `flex justify-center` div in the middle cell, empty right cell for symmetry.
- [x] Added `MyPaginationFooter_selectRowsOverrideClass = 'w-36'` to `src/constants.ts` (half of
      `MySelect`'s default `w-72`) and used it as `MyPaginationFooter`'s default
      `selectRowsOverrideClass` value (still overridable per call site).
- [x] Updated `CONSUMING_PROJECTS.md`'s `MyPaginationFooter` props table default for
      `selectRowsOverrideClass` and its intro paragraph.
- [x] Run:
      npx tsc --noEmit
- [x] Run:
      npm run build

### 7. MyPagination sub-element override props
- [x] **Requested via chat.** Add named override props for every hardcoded
      Tailwind class in `MyPagination.tsx`'s sub-elements (per the component-authoring "Sub-element
      override props" rule), with each default moved into `src/constants.ts`:
      - `numbersContainerClass` — the page-numbers wrapper div (`'flex -space-x-px'`) →
        `MyPagination_numbersContainerClass`
      - `ellipsisClass` — the `...` placeholder cell
        (`'flex h-5 md:h-6 w-5 md:w-6 items-center justify-center text-xxs md:text-xs text-gray-300'`)
        → `MyPagination_ellipsisClass`
      - `numberClass` — `PaginationNumber`'s shared structural class (size/border/text, regardless
        of state): `'flex items-center justify-center border text-xxs md:text-xs h-5 md:h-6 w-5 md:w-6'`
        → `MyPagination_numberClass`
      - `numberActiveClass` — `'z-10 bg-blue-600 border-blue-600 text-white'` →
        `MyPagination_numberActiveClass`
      - `numberInactiveClass` — `'hover:bg-gray-100 cursor-pointer'` →
        `MyPagination_numberInactiveClass`
      - `arrowClass` — `PaginationArrow`'s shared structural class:
        `'flex items-center justify-center rounded-md border w-4 h-4 md:w-6 md:h-6'` →
        `MyPagination_arrowClass`
      - `arrowDisabledClass` — `'pointer-events-none text-gray-300'` →
        `MyPagination_arrowDisabledClass`
      - `arrowEnabledClass` — `'hover:bg-gray-100 cursor-pointer'` → `MyPagination_arrowEnabledClass`
      - `arrowIconClass` — the `ArrowLeftIcon`/`ArrowRightIcon`'s `'w-4'` →
        `MyPagination_arrowIconClass`
      Left inline (structural positioning logic, not a style choice): the first/last
      `rounded-l-md`/`rounded-r-md` toggling on `PaginationNumber`, and the direction-based
      `mr-2 md:mr-4`/`ml-2 md:ml-4` margin on `PaginationArrow`.
      All 9 new props threaded from `MyPagination` down through `PaginationNumber`/`PaginationArrow`
      (currently plain internal helper functions with no style props at all).
- [x] Update `CONSUMING_PROJECTS.md`'s `MyPagination` section (currently has no props table) with
      a full props table and the list of exported/default constants.
- [x] Run:
      npx tsc --noEmit
- [x] Run:
      npm run build

### 8. MySelectRows own default width
- [x] **Requested via chat.** Give `MySelectRows` its own default width,
      independent of `MySelect`'s generic `w-72`, applied even when used standalone (not just via
      `MyPaginationFooter`):
      - Add `MySelectRows_dftClass = MySelect_dftClass.replace('w-72', 'w-24')` to `src/constants.ts`
        (agreed value: `w-24`) — mirrors the documented "Project-wide defaults (`defaultClass`
        pattern)" convention (import the shared default, adjust it, use as `defaultClass`).
      - Add a `defaultClass?: string` prop to `MySelectRows` (default `MySelectRows_dftClass`),
        passed to the underlying `<MySelect defaultClass={defaultClass} ...>` — distinct from the
        existing `overrideClass` prop, which stays available for further per-instance overrides.
      - **Cleanup (follows directly from this):** remove `MyPaginationFooter_selectRowsOverrideClass`
        (`'w-36'`) from `src/constants.ts` and drop the `selectRowsOverrideClass` default in
        `MyPaginationFooter.tsx` (still an overridable prop, just no default) — it becomes a
        duplicate encoding of the same "narrower rows dropdown" decision now that `MySelectRows`
        has its own default width.
- [x] Update `CONSUMING_PROJECTS.md`'s `MySelectRows` props table (add `defaultClass`) and
      `MyPaginationFooter` props table (`selectRowsOverrideClass` default becomes "—" again, since
      it's no longer forced — `MySelectRows`'s own `w-24` default now applies). Also fixed a stale
      `MyPaginationFooter_dftClass` description still saying `flex items-center justify-between`
      instead of the grid layout from section 6 (missed then, caught now).
- [x] Run:
      npx tsc --noEmit
- [x] Run:
      npm run build

## Changes

### src/constants.ts (new)
- Central constants file. Holds `MySelectRows_optionsDftShared`/`MySelectRows_valueDftShared`
  (internal-only), the 44 renamed default-class constants moved out of every shared component
  (dropped `_Shared` suffix, kept existing infix), and the 3 new constants extracted from
  in-function literals (`OwnerTableLogging_filterDebounceMs`, `OwnerTableLogging_msgTruncateLen`,
  `OwnerTableCache_tablesBadgeVisibleCount`).

### src/components/MySelectRows.tsx (new)
- New component: thin wrapper around `MySelect` for a rows-per-page dropdown. Props: `value`,
  `onChange`, `options` (default `MySelectRows_optionsDftShared`), plus `label`/`id`/
  `overrideClass`/`labelClass`/`containerClass` passthrough to `MySelect`.

### package.json
- Added `"./constants": "./src/constants.ts"` and `"./MySelectRows": "./src/components/MySelectRows.tsx"`
  to the `exports` map.

### src/components/MyBox.tsx, MyButton.tsx, MyCheckbox.tsx, MyConfirmDialog.tsx, MyDropdown.tsx, MyHelp.tsx, MyHelpField.tsx, MyHelpStep.tsx, MyHourGlass.tsx, MyInput.tsx, MyLink.tsx, MyLoadingMessage.tsx, MyPagination.tsx, MyPopup.tsx, MySelect.tsx, MySelectMulti.tsx, MyTab.tsx, MyTextarea.tsx, MyToggle.tsx, MyBackHomeNav.tsx
- Removed each file's locally-defined/exported `_dftClass_Shared`-style constant(s); each now
  imports its renamed equivalent (e.g. `MySelect_dftClass`) from `../constants` and uses it as the
  prop default. No behavior change — same class strings, same default values.

### src/UI/OwnerComponentTest.tsx
- Updated every import to stop pulling `_dftClass_Shared`-style constants from each component's
  own module; now imports the renamed constants from `../constants` in one block. All usage sites
  (className previews, MyTab active/inactive class switch) updated to the new names.

### src/UI/OwnerTableCache.tsx
- `TablesBadge`'s hardcoded `tables.slice(0, 3)` now uses
  `OwnerTableCache_tablesBadgeVisibleCount` from `../constants`.

### src/UI/OwnerTableLogging.tsx
- Filter-change debounce (`2000`) now `OwnerTableLogging_filterDebounceMs`; message-truncation
  length (`200`) now `OwnerTableLogging_msgTruncateLen`, both imported from `../constants`.

### src/UI/components_wrappers/defaults.ts
- Updated a comment referencing the old per-component constant import path to point at
  `../../constants` instead.

### CONSUMING_PROJECTS.md
- Added `### MySelectRows props` section (props table, defaults, usage example, options override
  example) and a row in the UI Components table.
- Rewrote "Project-wide defaults (`defaultClass` pattern)" section and every affected component's
  props table / "Exported constants" line to reflect the new `_Shared`-dropped names and their new
  single source, `nextjs-shared/constants`.

### src/UI/OwnerConstants.tsx (new)
- Constants/.env sub-tabbed component for the dev app's `/owner` route. Constants sub-tab has its
  own nested pill-variant tab row, one per constant group/component. (Functions sub-tab was
  removed per the agreed refinement — see Plan section 3.)

### src/app/owner/page.tsx
- Reads the 4 documented env vars from `process.env` server-side and passes them into a new
  `envValues` prop; added a "Constants" tab rendering `<OwnerConstants envValues={envValues} />`
  to the existing `OwnerPage` tabs array.

### CONSUMING_PROJECTS.md (pagination skill)
- Inserted the "Always use fetchFiltered/fetchTotalPages — never client-side paginate" callout
  (with the next-bridge incident and chess reference) right after the `fetchFiltered` code example.

### ~/.claude/skills/pagination/SKILL.md
- Added a "## The UI layer" section mandating `MyPagination`/`MySelectRows`/`MyPaginationFooter`;
  updated the "Why this exists" narrative and "What NOT to do"/checklist to reference them instead
  of a hand-rolled or project-local rows-per-page control; bumped skill version to 1.1.0.

### nextjs-shared/.claude/CLAUDE.md
- Added a next-bridge outstanding item: its local `RowsPerPageSelect.tsx` should migrate to the
  shared `MySelectRows`/`MyPaginationFooter` (needs a next-bridge session; project isolation).

### src/constants.ts (MyPaginationFooter)
- Added `MyPaginationFooter_dftClass` (yellow background, `flex items-center justify-between`).

### src/components/MyPaginationFooter.tsx (new)
- New component combining `MySelectRows` (left) and `MyPagination` (right) in one row. Props:
  `totalPages`/`statecurrentPage`/`setStateCurrentPage` (to `MyPagination`), `rowsPerPage`/
  `setRowsPerPage`/`rowsOptions` (to `MySelectRows`), `defaultClass`/`overrideClass` for the
  container, `paginationOverrideClass`/`selectRowsOverrideClass` pass-through to each nested
  component.

### package.json (MyPaginationFooter)
- Added `"./MyPaginationFooter": "./src/components/MyPaginationFooter.tsx"` to the `exports` map.

### CONSUMING_PROJECTS.md (MyPaginationFooter)
- Added `### MyPaginationFooter props` section (props table, usage example) and a row in the UI
  Components table.

### src/constants.ts (OwnerTableLogging)
- Added `OwnerTableLogging_rowsOptions = [10, 20, 40, 100] as const` — this table's custom
  rows-per-page options, including the existing `40` default alongside `MySelectRows`'s shared
  defaults.

### src/UI/OwnerTableLogging.tsx (MyPaginationFooter integration)
- Replaced the lone `MyPagination` with `MyPaginationFooter`. Added `rowsPerPage` state (initial
  `LOGGING_ROWS_PER_PAGE`), used it instead of the fixed constant in `fetchdata`'s
  `offset`/`limit`/`items_per_page`, added it to the filter-change effect's dependencies, and wired
  `setRowsPerPage` to also reset `currentPage` to `1`.

### src/constants.ts (MyPaginationFooter layout tweaks)
- `MyPaginationFooter_dftClass` changed from `flex items-center justify-between` to a 3-column
  grid (`grid grid-cols-3 items-center`). Added `MyPaginationFooter_selectRowsOverrideClass = 'w-36'`.

### src/components/MyPaginationFooter.tsx (layout tweaks)
- `MyPagination` now wrapped in a `flex justify-center` div (middle grid cell) with an empty third
  cell for symmetry; `selectRowsOverrideClass` now defaults to `MyPaginationFooter_selectRowsOverrideClass`.

### CONSUMING_PROJECTS.md (MyPaginationFooter layout tweaks)
- Updated the props table's `selectRowsOverrideClass` default and the section's intro paragraph to
  describe the centered-pagination grid layout.

### src/constants.ts (MyPagination sub-element overrides)
- Added `MyPagination_numbersContainerClass`, `MyPagination_ellipsisClass`,
  `MyPagination_numberClass`, `MyPagination_numberActiveClass`, `MyPagination_numberInactiveClass`,
  `MyPagination_arrowClass`, `MyPagination_arrowDisabledClass`, `MyPagination_arrowEnabledClass`,
  `MyPagination_arrowIconClass` — defaults for the 9 new override props.

### src/components/MyPagination.tsx (sub-element overrides)
- Added 9 new override props (see constants above), threaded down to the previously-prop-less
  `PaginationNumber`/`PaginationArrow` helper functions, replacing their hardcoded class strings.
  Left inline (structural, not style): first/last corner rounding, direction-based arrow margins.
  No visual change — same class strings, same default values.

### CONSUMING_PROJECTS.md (MyPagination props table)
- Added a `### MyPagination props` section (previously had none) with a full props table and a
  note on which two structural classes are intentionally not exposed as props.

### src/constants.ts (MySelectRows own width)
- Added `MySelectRows_dftClass = MySelect_dftClass.replace('w-72', 'w-24')`. Removed
  `MyPaginationFooter_selectRowsOverrideClass` (`'w-36'`) — now redundant.

### src/components/MySelectRows.tsx (own default width)
- Added `defaultClass?: string` prop (default `MySelectRows_dftClass`), passed to the underlying
  `MySelect`'s own `defaultClass` — applies even when `MySelectRows` is used standalone.

### src/components/MyPaginationFooter.tsx (cleanup)
- `selectRowsOverrideClass` no longer has a default (was `MyPaginationFooter_selectRowsOverrideClass`)
  — `MySelectRows`'s own `w-24` default now applies unless a caller overrides it.

### CONSUMING_PROJECTS.md (MySelectRows own width)
- Added `defaultClass` to the `MySelectRows` props table. Updated `MyPaginationFooter`'s
  `defaultClass`/`selectRowsOverrideClass` rows (also fixed a stale grid-layout description missed
  in section 6).

## Testing
- [ ] User runs:
      npm run locallocal
- [ ] Open `/owner` in the dev app and visit every component-test tab (MyButton, MyInput,
      MyTextarea, MyBox, MyDropdown, MyCheckBox, MyPagination, MyConfirmDialog, MyLink, MySelect,
      MyToggle, MyLoadingMessage, MyPopup, MyHourGlass, MyHelp, MyHelpField, MyHelpStep, MyTab) —
      confirm every component still renders with its original default styling (no visual
      regression from moving default classes into `src/constants.ts`).
- [ ] On the Logging tab, type into a filter field and confirm the "Applying filters..." message
      still appears briefly before results update (verifies `OwnerTableLogging_filterDebounceMs`
      still debounces correctly), and confirm a long log message still truncates with "…" at the
      same length as before (verifies `OwnerTableLogging_msgTruncateLen`).
- [ ] On the Cache tab, find (or create, e.g. via `action_generateCache`) a cache entry that
      touched more than 3 tables and confirm the tables badge still shows exactly 3 names plus a
      "+N" suffix (verifies `OwnerTableCache_tablesBadgeVisibleCount`).
- [ ] Confirmed via `npx tsc --noEmit` and `npm run build` — both pass cleanly.
- [ ] Open `/owner` → "Constants" tab. Confirm the top-level sub-tab row now shows only Constants
      and .env (no Functions). On the Constants sub-tab, confirm a nested tab row lists one tab per
      component (MySelect, MyButton, MyTab, OwnerTableCache, OwnerTableLogging, etc.), and that
      selecting one (e.g. MySelect) shows only its own entries (`MySelect_dftClass`,
      `MySelect_labelDftClass`, `MySelect_containerDftClass`) with correct values (including the
      `MySelectRows_optionsDftShared` array rendering as `[10,20,50,100]`). On the .env sub-tab,
      confirm the 4 vars show their live values (or "(not set)").
- [ ] On the Logging tab, confirm the pagination row is now a `MyPaginationFooter`: rows-per-page
      dropdown on the left (options `10, 20, 40, 100`, starting at `40`, roughly half its previous
      width) on a yellow background, with page-number controls centered in the row (not pushed to
      the right). Change the rows-per-page value and confirm the table refetches with the new page
      size and jumps back to page 1; confirm clicking a page number still navigates pages correctly.
- [ ] Open `/owner` → Components → "MyPagination" tab and confirm it renders identically to before
      (page numbers, active-page highlight, disabled/enabled arrows, ellipsis for many pages) — the
      9 new override props all default to the same class strings that were previously hardcoded.
- [ ] On the Logging tab, confirm the rows-per-page dropdown is now narrower than before (`w-24`,
      down from the previous `w-36` override) — now coming from `MySelectRows`'s own default width
      rather than a `MyPaginationFooter`-forced override.
