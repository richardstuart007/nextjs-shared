# PLAN_shared-review — nextjs-shared

## Title
shared review — audit each project in C:\Users\richa\claude\github for (1) nextjs-shared components that exist but aren't being used where they should be, and (2) places where raw db.query()/sql() is used instead of the shared table_ functions (table_fetch, table_write, table_update, table_upsert, table_delete, table_count, table_check, table_query)

## Plan
- [x] Enumerate consuming projects by scanning C:\Users\richa\claude\github for subdirectories with a package.json that depends on nextjs-shared (excluding nextjs-shared itself and any archived/moved-out projects)
- [x] For each consuming project, grep for raw `db.query`/`sql()` calls (or any direct `pg` usage) that bypass the shared `table_` functions, and classify each as: should use an existing `table_` function, should use `table_query`, or is a genuine gap not covered by any shared function
- [x] For each consuming project, grep for local UI patterns that duplicate an existing nextjs-shared component (raw `<button>`, `<input>`, `<select>`, `<textarea>`, custom confirm dialogs, custom tab UIs) instead of using `MyButton`, `MyInput`, `MyDropdown`, `MyTextarea`, `MyConfirmDialog`, `MyTab`
- [x] Compile findings into a single audit report, organized per project, with file:line references for each finding
- [x] Present the audit report to the user

## Changes

Investigation-only task — no source files were modified. Findings below, per project.

### nextjs-shared (self-audit)
- **Raw DB access:** `src/chess/deconstruct.ts` — `getUndeconstructedCount` and `deconstructGames` call `sql()`/`db.query()` directly instead of `table_query`, losing the shared caching/logging layer. Queries are complex enough (dynamic IN-clause, NOT EXISTS subquery) to need `table_query` rather than a simpler `table_` helper; `getUndeconstructedCount` is a backlog-count style read and should pass `skipCache: true`.
- **Components:** no internal gaps beyond minor playground/test-harness code in `OwnerComponentTest.tsx` (not a finding) and a toggle-pill filter row in `OwnerSyncVersions.tsx` (judgment call, not flagged).

### chess
- **Raw DB access:** none — all 10 files needing raw SQL correctly route through `table_query`.
- **Components:** dead `MySelect` import in `MaintenancePanel.tsx:129-139` sitting next to a raw `<select>` — genuine fix, instructions given for a chess Claude Code session (swap in `MySelect`, pass options via `children` since label ≠ value; note the default styling differs from the current gray-border look, decide whether to keep it or override). `PipelineHelp.tsx:137-206` initially flagged as duplicating `MyHelpStep`, but on closer read `MyHelpStep` only supports one step per popover while `PipelineHelp` shows all 9 steps + a title + a trailing Row-Count-SQL block in one panel — not a 1:1 swap. User confirmed this is intentionally chess-specific content and out of scope for a shared-component change — **dismissed, not a finding**. Several other borderline cases (project's own `Filter*` component family, icon-only table buttons) judged as intentional, not flagged.

### infostore
- **Raw DB access:** none — fully compliant, all access via `src/lib/*` wrappers over `table_*`.
- **Components:** heavy duplication concentrated in the `entries` CRUD pages (list/new/edit), duplicated across both the public and `[admin_secret]` route trees — raw inputs/textareas/selects/buttons throughout, plus a genuine hand-rolled confirm modal (`[admin_secret]/dashboard/entries/page.tsx:200-225`) duplicating `MyConfirmDialog`.

### next-bridge
- **Raw DB access:** none — all access via `src/lib/actions/*.ts` using `table_fetch`/`table_write`/`table_update`/`table_count`.
- **Components:** systemic — zero adoption of any shared UI component anywhere in the project. Every input/select/button/tab bar is hand-rolled, including `src/app/owner/page.tsx`'s tab bar, which CONSUMING_PROJECTS.md explicitly mandates should use `OwnerPage`. Side finding (safety, not component-shape): `StagingBar.tsx:20`'s destructive "Truncate ts0/ts1/ts2" button has no confirmation step.

### next-bridgeschool
- **Raw DB access:** all hits call `sql()` from `nextjs-shared/db` directly (an internal implementation detail, not the documented API) rather than `table_*`. `fetch_NextSeq.ts:24-30` should use `table_fetch` (single table, simple WHERE); five others (`fetch_SessionInfo.ts`, `Recent_fetch_1.ts`, `Recent_fetch_Averages.ts`, `Top_fetch.ts`, `User_fetch.ts`, `User_fetch_Average.ts`) are genuine JOIN/window-function/computed-WHERE queries needing `table_query`, several of which already hand-reimplement `table_fetch`'s own placeholder/cache-key plumbing instead of just calling it.
- **Components:** `src/app/owner/page.tsx` hand-rolls its tab bar instead of using `OwnerPage`/`OwnerLayout` (mandated per CONSUMING_PROJECTS.md §8); a few same-file inconsistencies where a component is used elsewhere in the file but missed in one spot (`NavDrawer.tsx`, `login/form.tsx`, two `<textarea>`s that should be `MyTextarea`). Otherwise well-adopted — `MyConfirmDialog`/`MyPopup` used consistently across all 8 admin table components.

### next-dbadmin
- **Raw DB access:** all raw `db.query`/`pg.Client` usage is the project's own URL-accepting arbitrary-connection tooling (`dbArbitrary.ts`, backup/schema-sync/copy actions), explicitly declared out of scope for `table_*` by this project's own `.claude/CLAUDE.md`. No genuine gaps.
- **Components:** `DatabaseToolsConn.tsx:49-59` hand-rolls a tab bar — corrected finding: `MyTab` does exist in nextjs-shared (`src/components/MyTab.tsx`), so this is a genuine `MyTab` gap, not just a `MyButton`-styling one as the sub-agent initially concluded. Minor: `CreateSQLConn.tsx:91-109` raw-button table list could use `MyButton`. Everything else (`BackupConn.tsx`, `CopyTableConn.tsx`) already correctly uses `MyButton`/`MyInput`/`MyConfirmDialog`.

### richard-dashboard
- **Raw DB access:** none — project has no database of its own.
- **Components:** raw buttons in `owner/page.tsx` (should be `MyButton`); hand-rolled help-toggle button + overlay modal in `AppCard.tsx:29-69` duplicating `MyHelp`/`MyPopup`.

### src/chess/ (removed during this task, outside the audit scope)
- User removed `src/chess/constants.ts`, `deconstruct.ts`, `parsePgn.ts`, `schema.sql`, `sync.ts` — chess-sync logic has been rebuilt directly inside the chess project instead. Confirmed via grep that no consuming project imported any `nextjs-shared/chess/*` export, so removal is safe from that angle. `package.json`'s four `./chess/*` export map entries (constants/parsePgn/sync/deconstruct) still point at these now-deleted files — left as-is pending explicit confirmation to remove them.
