# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

For consuming project setup, component APIs, and usage examples see [CONSUMING_PROJECTS.md](CONSUMING_PROJECTS.md).

## Commands

```bash
# Type check
npx tsc --noEmit

# Format
npm run prettier

# Check formatting
npm run prettier:check
```

No test runner is configured. Use `npx tsc --noEmit` to verify correctness after changes.

## Release rules

**Before every commit to GitHub:**
1. Bump the version number in `package.json` — this prevents npm from serving a cached copy to consuming projects
2. After pushing, run the following in every consuming project to pull the updated package:
   ```powershell
   Remove-Item -Recurse -Force node_modules
   Remove-Item -Force package-lock.json
   npm install
   Remove-Item -Recurse -Force .next
   npx tsc --noEmit
   npm run build
   ```
   Deleting `node_modules` and `package-lock.json` and running a full `npm install` is the reliable way to pull the latest GitHub commit. `npm update nextjs-shared` is avoided because with `save-exact=false` it can silently rewrite the GitHub ref in `package.json`.

**When nextjs-shared changes affect consuming projects** (new exports, removed exports, API changes):
- Identify which consuming projects are affected
- Update their import paths / usage as needed
- Reinstall and verify they build correctly before reporting the task as done

## Purpose

`nextjs-shared` is a private npm package (`github:richardstuart007/nextjs-shared`) consumed by other Next.js projects. It provides:
- All direct database access (Postgres via `pg`)
- Shared UI components
- Utility functions

Consumer projects never call the DB directly — they always go through this package.

## Architecture

### Stack
- TypeScript (strict mode); src/ is consumed directly by Next.js projects
- Postgres (`pg` library) — no ORM
- React components (for Next.js consumers)

### Exports (all resolve to src/ directly)

**Database — generic table operations**
- `fetchFiltered` — paginated filtered SELECT
- `fetchTotalPages` — page count for pagination
- `table_fetch` — fetch rows from any table
- `table_write` — INSERT a row
- `table_update` — UPDATE a row
- `table_delete` — DELETE a row
- `table_check` — check row existence
- `write_logging` — write to `xlg_logging`

**Database — backup / schema utilities**
- `schemaSnapshot` — snapshot a DB's public schema into `xsc_schema`
- `schemaCompare` — diff two snapshots stored in `xsc_schema`
- `copyTables` — copy table data between databases

**UI Components**
- `MyButton`, `MyInput`, `MySelect`, `MySelectTable`, `MyTextarea`, `MyConfirmDialog`, `MyTab`
- `MyDropdown` — retained only until consuming projects migrate to `MySelect`/`MySelectTable`; see Outstanding items

**Full UI panels (src/UI/)**
- `OwnerLayout` — dev-only guard layout with sessionStorage back-link
- `OwnerPage` — tabbed page chrome; accepts `tabs: { label, content }[]`
- `Table_Logging` — paginated view of `xlg_logging`
- `Table_Cache` — cache inspector

**Cache**
- `userCache_store` — per-user server-side cache (cache key = SQL string)

### Tables owned by this package

| Table | Purpose |
|---|---|
| `xlg_logging` | Application log entries |
| `xsc_schema` | Schema snapshots for comparison |

Table names use `x` prefix to avoid clashing with consumer project table names. Column names are prefixed with the short table code (e.g. `lg_`, `sc_`).

### File layout

```
src/
  components/     Primitive shared React components (MyButton, MyInput, etc.)
  UI/             Full UI panels (OwnerLayout, OwnerPage, Table_Cache, Table_Logging)
  tables/
    db.ts         Postgres connection helper (sql())
    structures.ts Row types and shared type definitions
    tableGeneric/ Generic table operations + write_logging
```

### Coding conventions
- All exports resolve directly to `src/` TypeScript files. There is no compiled `dist/` output — the main `tsconfig.json` has `noEmit: true`.

---

## Component authoring rules

### The OwnerComponentTest demo page must stay in sync with component changes
`src/UI/OwnerComponentTest.tsx` (the "Components" tab on `/owner`) is the only place a shared
component can actually be exercised in the browser before committing. Whenever a component's
props, defaults, or behavior change — a new prop added, an existing one's meaning changed, a new
component created — its tab in `OwnerComponentTest.tsx` must be updated (or added) in the same
change, so the new/changed behavior can be tested here first. A change to `src/components/` or
`src/UI/` is not complete until its demo tab reflects it; do not report the task done, and do not
propose `#commit`, while the demo page is still showing the old prop surface.

### overrideClass — main element
Every component that renders a single styled element (button, input, select, textarea) must accept `overrideClass?: string` and merge it via `myMergeClasses(defaultClass, overrideClass)`. Define default classes as a joined array, one concern per line:
```ts
const defaultClass = [
  'h-8 px-2',
  'text-xs text-white',
  'bg-blue-500 hover:bg-blue-600',
].join(' ')
const classValue = myMergeClasses(defaultClass, overrideClass)
```

### Sub-element override props
Any sub-element with hardcoded Tailwind classes (label, title heading, wrapper div) MUST expose those classes as a named override prop with the hardcoded string as the default. Never leave appearance locked behind a hardcode a caller cannot reach.

Naming convention:
- Main element wrapper → `className` (plain passthrough, no merge needed)
- Label element → `labelClass`
- Title heading → `titleClass`
- Container/wrapper div → `containerClass`

Example — MySelect label:
```ts
// Prop
labelClass?: string
// Default
labelClass = 'font-bold text-xs whitespace-nowrap'
// Usage in JSX
<label htmlFor={autoId} className={labelClass}>{label}</label>
```
A caller that needs a smaller label passes `labelClass='font-bold text-xxs whitespace-nowrap'`.

### Form element id / htmlFor
Every `<select>`, `<input>`, and `<textarea>` that renders alongside a `<label>` must link them. Accept `id` via props; if none is passed, derive one from the `label` prop:
```ts
const autoId = id ?? (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
// then: <label htmlFor={autoId}> and <select id={autoId}>
```

### myMergeClasses behaviour
`myMergeClasses` replaces default classes with matching override classes based on Tailwind prefix patterns (`h-`, `w-`, `px-`, `py-`, `text-`, `bg-`). Key rules:
- Variant prefixes (`hover:`, `focus:`, `sm:`, etc.) are stripped before matching, so `hover:bg-blue-600` is replaced only by another `hover:bg-*` override, not a bare `bg-*`.
- `text-*` colour classes (e.g. `text-white`) are never replaced by `text-*` size classes (e.g. `text-xxs`) and vice versa — the `canReplace` guard prevents this.
- Classes in `overrideClass` that match no default pattern are appended.

### Tailwind v4 — custom text sizes in consuming projects
`theme.extend.fontSize` in `tailwind.config.ts` is silently ignored in Tailwind v4. Custom text-size utilities must be declared with `@utility` in the consuming project's `globals.css`:
```css
@utility text-xxs {
  font-size: 0.625rem;
  line-height: 1rem;
}
@utility text-xxx {
  font-size: 0.5rem;
  line-height: 0.875rem;
}
```
Without this, the class appears in the HTML but no CSS rule is generated and the text renders at the inherited/default size.

## Schema file

`scripts/schema.sql` is the single source of truth for the database structure of `nextjs-shared`-owned tables (`x`-prefixed). Every new shared table and index must be added here.

## Outstanding items

Tracked from the `shared review` audit (component adoption / raw SQL vs. `table_` functions) and
its follow-ups. Each item lives in a different project — Claude cannot fix these from a
nextjs-shared session (project isolation); they need a Claude Code session opened in that project.
Re-verified against actual file contents as of this entry, not just the original audit summary.

### chess
- ~~`src/ui/filters/FilterMultiCheckbox.tsx`~~ — **fixed**, via `#audit`. Now a thin wrapper around
  `nextjs-shared/MySelectMulti`, preserving the existing call-site API.
- ~~`MaintenancePanel.tsx` dead `MySelect` import~~ — **moot**. That file no longer exists; the
  maintenance UI was restructured into `src/app/owner/pipeline/page.tsx` (which already correctly
  uses `MySelect` for its run-id picker) and `src/ui/player/PlayerProfile.tsx`. No action needed.
- `PipelineHelp.tsx` — dismissed, not a finding (confirmed intentionally chess-specific content,
  not a shared-component gap).
- **New, unfixed (found 2026-08-20, via the MyDropdown → MySelect/MySelectTable migration survey):**
  `src/ui/board/ChessBoardView.tsx` has 2 `MyDropdown` call sites (`chesscom-p1` line ~1556,
  `chesscom-p2` line ~1571), both passing `tableData={masterPlayerNames.map(...)}` +
  `searchEnabled` + `includeBlank`. Both are candidates to migrate to `MySelect` (now that it
  supports `searchEnabled`/`includeBlank` — see `CONSUMING_PROJECTS.md`). Fix (in a chess session,
  not here — project isolation): replace both `MyDropdown` call sites with `MySelect`, mapping
  `optionLabel`/`optionValue='name'` to a plain `options={masterPlayerNames}` string array (since
  label and value are the same field here), and `selectedOption`/`setSelectedOption` to `value`/
  `onChange`.

### infostore
- ~~Everything~~ — **fully done**, via `#audit`. Raw `<input>`/`<textarea>`/`<select>`/`<button>`
  across all `entries` CRUD pages (list/new/edit, both public and `[admin_secret]` route trees) now
  use `MyInput`/`MyTextarea`/`MySelect`/`MyButton`; the hand-rolled confirm modal now uses
  `MyConfirmDialog`; the category/country checkbox filters now use `MyCheckbox`. One noted behavior
  change: the delete confirm button no longer shows a disabled "Deleting..." state mid-request
  (`MyConfirmDialog` has no built-in loading state). No outstanding items remain in this project.

### next-bridge
- ~~`src/ui/shared/RowsPerPageSelect.tsx` local rows-per-page dropdown~~ — **fixed**, via `#audit`.
  Migrated `HomePageClient.tsx`, `PlayerPageClient.tsx`, `PartnersTable.tsx`, and
  `SessionPageClient.tsx` to `nextjs-shared/MyPaginationFooter`; deleted the now-unused
  `RowsPerPageSelect.tsx` and the now-dead `ROWS_PER_PAGE_OPTIONS` constant. `RankingsPageClient.tsx`
  was excluded (no existing page-based pagination to swap — uses a client-side Top-N pattern
  instead; would need real `fetchFiltered`/`fetchTotalPages` pagination added first, a separate,
  bigger task not yet scheduled).
- ~~`src/app/owner/page.tsx` hand-rolled tab bar~~ — **fixed**. Now uses `OwnerPage` correctly.
  Minor polish only: `ToolsPanel` still wraps its content in `p-8`, which may double up with
  `OwnerLayout`'s own `px-6 py-4` padding — low-priority cosmetic follow-up, not a functional bug.
- ~~`StagingBar.tsx` missing confirmation + raw button~~ — **fixed**. Now uses `MyButton` +
  `MyConfirmDialog` before truncating.
- ~~`BuildDataViewer.tsx` `FMultiSelect`~~ — **fixed**. Now uses `nextjs-shared/MySelectMulti`.
- ~~The rest of the systemic component-adoption gap~~ — **fully fixed**. Re-scanned the whole
  project: zero raw `<select>` remain, every remaining `<input>` is a checkbox (excluded from this
  audit), every remaining `<button>` is an MP/VP or A/B/C segmented pill filter (also excluded from
  the start), and all four hand-rolled tab bars (`HomePageClient.tsx`, `PlayerPageClient.tsx`,
  `RankingsPageClient.tsx`, `ScrapeTabs.tsx`) now use `MyTab`. No outstanding component-adoption
  work left in this project.

### next-bridgeschool
- ~~Everything~~ — **fully done**, via `#audit`. 7 raw-`sql()` calls, `NavDrawer.tsx`,
  `login/form.tsx`, both textareas, and the `/owner` page tab bar (now `OwnerPage`, with an
  accepted active-tab color change from black/gray to `MyTab`'s default blue) are all fixed.
- **New, unfixed (found 2026-08-20, via the MyDropdown → MySelect/MySelectTable migration
  survey):** 34 `MyDropdown` call sites across 14 files — the heaviest user of `MyDropdown` of any
  consuming project. Fix (in a next-bridgeschool session, not here — project isolation): migrate
  each to `MySelect` or `MySelectTable` per its current prop (`tableData` → `MySelect`, `table` →
  `MySelectTable`), then remove the now-unused `MyDropdown` import from each file.
  - **8 pass `tableData` → migrate to `MySelect`:**
    `src/ui/dashboard/users/form.tsx:249` (`formattedCountries`),
    `src/ui/dashboard/graph/User/User_Header.tsx:50` (`User_limitMonths_Average_Options`),
    `src/ui/dashboard/graph/Recent/Recent_Header.tsx:71` (`Recent_usersReturned_Options`),
    `src/ui/dashboard/graph/Recent/Recent_Header.tsx:85` (`Recent_usersAverage_Options`),
    `src/ui/dashboard/graph/Top/Top_Header.tsx:45` (`Top_limitMonths_Options`),
    `src/ui/admin/questions/table.tsx:408` (`Comparison_values`),
    `src/ui/admin/subject/form.tsx:176` (`LEVEL_OPTIONS`),
    `src/ui/admin/subject/table.tsx:341` (`LEVEL_OPTIONS`).
  - **26 pass `table` → migrate to `MySelectTable`** (just drop-in rename, since `MySelectTable`'s
    props are identical to `MyDropdown`'s minus `tableData`):
    `src/ui/dashboard/history/table.tsx:515,538` (`tuo_usersowner`, `tsb_subject`),
    `src/ui/dashboard/users/form.tsx:338` (`tow_owner`),
    `src/ui/dashboard/reference/table.tsx:490,513,575,595` (`tuo_usersowner`, `tsb_subject`,
    `twh_who`, `trt_reftype`),
    `src/ui/admin/usersowner/table.tsx:222,239` (`tus_users`, `tow_owner`),
    `src/ui/admin/questions/table.tsx:340,360` (`tow_owner`, `tsb_subject`),
    `src/ui/admin/usersowner/form.tsx:52,69` (`tus_users`, `tow_owner`),
    `src/ui/admin/reference/table.tsx:317,337,397,412` (`tow_owner`, `tsb_subject`, `twh_who`,
    `trt_reftype`),
    `src/ui/admin/questions/detail/form.tsx:127,163,248` (`tow_owner`, `tsb_subject`,
    `trf_reference`),
    `src/ui/admin/subject/form.tsx:78` (`tow_owner`),
    `src/ui/admin/subject/table.tsx:287` (`tow_owner`),
    `src/ui/admin/reference/form.tsx:109,138,231,247` (`tow_owner`, `tsb_subject`, `twh_who`,
    `trt_reftype`).
  - Also, `src/content/conventions/architecture/components/content.ts:15` documents
    `'MySelect / MyDropdown'` as the single-choice dropdown pattern — low-priority doc update to
    mention `MySelectTable` too, once the migration above is done.

### next-dbadmin
- ~~`DatabaseToolsConn.tsx:49-59` hand-rolled tab bar~~ — **fixed**, via `#audit`. Now uses `MyTab`.
- ~~`SchemaSyncConn.tsx` and `CopyTableConn.tsx` status-filter dropdowns~~ — **fixed**, via
  `#audit`. Both now use `MySelectMulti` with `showReset`.
- `CreateSQLConn.tsx:91-109` raw-button table list — **decided against, not a finding**. User
  confirmed `MyButton` doesn't fit this flush list-item shape well; leaving as raw HTML
  intentionally.
- **New, unfixed (found 2026-08-04, via a next-bridge session reading this project read-only):**
  `SchemaSyncConn.tsx` (~line 641-642) and `CopyTableConn.tsx` (~line 532-533) still pass
  `showReset`/`resetLabel` props to `MySelectMulti` — both props were removed from
  `MySelectMulti`'s type entirely in an earlier nextjs-shared change (mode-removal work, predating
  this entry's "fixed" note above, which was never updated). Confirmed against current `src/`: no
  trace of `showReset`/`resetLabel` anywhere in this package. next-dbadmin isn't broken yet only
  because its installed `node_modules` is still pinned to `nextjs-shared@2.1.34`, which predates
  the removal — the next `npm install`/reinstall in next-dbadmin will fail to compile both files.
  Fix (in a next-dbadmin session, not here — project isolation): drop the `showReset`/`resetLabel`
  props from both call sites. The "select all" row `MySelectMulti` renders is no longer opt-in —
  it's built into the component by default (governed by `selectAllLabel`, not a `showReset` flag),
  so no replacement prop is needed, just deletion of the two obsolete ones.

### richard-dashboard
- ~~Everything~~ — **fully done**. `globals.css` `@source` directive, `owner/page.tsx` buttons, and
  `AppCard.tsx`'s "?" trigger button are all fixed. No outstanding work in this project.

### Cross-project, not yet handed off to any project
- ~~**`DevLayoutHeader` gap**~~ — **fully fixed**. Amended `nextjs-shared/DevLayoutHeader.tsx` with
  optional `dbLocation`/`extraLinks` props (backward-compatible defaults), then rolled the swap out
  to all 5 consuming projects (chess, infostore, next-bridge, next-bridgeschool, richard-dashboard)
  — each now imports the shared component and has deleted its local `DevHeader.tsx`. No outstanding
  work left.
- ~~**`MyBackHomeNav` adoption**~~ — **resolved, all six projects**. chess and next-bridge already
  used it. infostore had 6 real hardcoded back-links with no gap — fixed via `#audit` (added a new
  "⌂ Home" link alongside each, an explicitly agreed design change; see infostore's own git history).
  next-dbadmin and richard-dashboard confirmed not a gap (no hardcoded back-link pattern found).
  next-bridgeschool's 2 candidates (`register/form.tsx:209`, `reference/table.tsx:757`) turned out
  to be styled CTA buttons embedded in specific layouts (a form's secondary action, a pagination
  row), not the plain-text back-nav `MyBackHomeNav` is designed for — decided not a real fit, left
  as-is. No outstanding work left.
- ~~**Tailwind v4 `@source` directive audit**~~ — **done, all 6 compliant**. Checked every consuming
  project's Tailwind entry CSS file for `@source "../../node_modules/nextjs-shared/src";`
  (documented in `CONSUMING_PROJECTS.md`'s "Tailwind v4 — required @source directive" section).
  chess, infostore, next-bridge, next-dbadmin: `src/app/globals.css`, already had it. next-bridgeschool:
  no `src/app/globals.css` at all — its Tailwind entry file is `src/root/global.css` (different name
  and location), already had it too. richard-dashboard: was missing it entirely (root cause of a
  `MyPopup` rendering unstyled), now fixed by the user. No further action needed unless a new
  consuming project is added later.
- **`useBackNav` adoption** — not started. `nextjs-shared` now exports `saveBackNav`/`useBackNav`
  (`src/components/useBackNav.ts`) for remembering the exact path+query to return to after
  navigating into a detail page, and `OwnerPage` now accepts an optional `persistKey` prop to
  persist its own active tab across navigation (see `CONSUMING_PROJECTS.md`). Verified working via
  a live demo in this project's own `/owner` dev app (the "Back Nav Demo" tab + `/backnav-test/[id]`
  route). Not yet rolled out anywhere else — next-bridge's `PlayerPageClient.tsx` has a hand-rolled
  equivalent (`NB_BACK_FROM_KEY`) that's the obvious first candidate to refactor onto the shared
  hook, and any other project's list/detail pages wanting back-path restoration are candidates too.
  This needs a Claude Code session opened in each consuming project — project isolation.
- **`Session Storage` tab rollout** — not started. `nextjs-shared` now exports
  `OwnerTableSessionStorage` (`src/UI/OwnerTableSessionStorage.tsx`), a client-only component that
  displays + lets you delete/clear the current browser tab's `sessionStorage` entries (see
  `CONSUMING_PROJECTS.md`'s "Session Storage tab" section). Added to this project's own `/owner`
  page tabs. Not yet rolled out to any consuming project's own `/owner` page — each project that
  wants it needs a `Session Storage` tab added alongside its existing Logging/Cache tabs. This
  needs a Claude Code session opened in each consuming project — project isolation.
