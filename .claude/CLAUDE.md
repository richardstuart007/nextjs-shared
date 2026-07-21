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

**Never rename an existing export, function, component, or type without explicit instruction from the user.** Every name in this package is consumed by all projects under `C:\Users\richa\github`. A rename silently breaks every consuming project. If a rename seems warranted, stop and ask first.

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
- `MyButton`, `MyInput`, `MyDropdown`, `MyTextarea`, `MyConfirmDialog`, `MyTab`

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
- Server actions use `write_logging` (not `console.error`) for errors, severity `'E'`
- Log messages include both a consequence string and `(error as Error).message`
- All exports resolve directly to `src/` TypeScript files. There is no compiled `dist/` output — the main `tsconfig.json` has `noEmit: true`.

---

## Component authoring rules

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
- `src/ui/filters/FilterMultiCheckbox.tsx` — still its own local checkbox-dropdown multi-select;
  not yet converted to a thin wrapper around `nextjs-shared/MySelectMulti`.
- ~~`MaintenancePanel.tsx` dead `MySelect` import~~ — **moot**. That file no longer exists; the
  maintenance UI was restructured into `src/app/owner/pipeline/page.tsx` (which already correctly
  uses `MySelect` for its run-id picker) and `src/ui/player/PlayerProfile.tsx`. No action needed.
- `PipelineHelp.tsx` — dismissed, not a finding (confirmed intentionally chess-specific content,
  not a shared-component gap).

### infostore
- Raw `<input>`/`<textarea>`/`<select>`/`<button>` across the `entries` CRUD pages (list/new/edit),
  duplicated in both the public and `[admin_secret]` route trees — still outstanding, unchanged.
- Hand-rolled confirm modal in `[admin_secret]/dashboard/entries/page.tsx` duplicating
  `MyConfirmDialog` — still outstanding, unchanged.
- Category/country checkbox filters in `[admin_secret]/dashboard/entries/page.tsx:80-106` — an
  always-visible bordered/scrollable checkbox list; this is a `MyCheckbox` gap (not
  `MySelectMulti`, which is for collapsed dropdowns). Surfaced during the `MySelectMulti`
  investigation; no handoff instructions written yet.

### next-bridge
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
- ~~7 raw-`sql()` database calls~~ (`fetch_NextSeq.ts`, `fetch_SessionInfo.ts`, `Recent_fetch_1.ts`,
  `Recent_fetch_Averages.ts`, `Top_fetch.ts`, `User_fetch.ts`, `User_fetch_Average.ts`) — **all
  fixed**. No `sql()` calls remain anywhere in this project's `src`.
- `src/app/owner/page.tsx` hand-rolled tab bar — still outstanding, not yet using `OwnerPage`.
- `NavDrawer.tsx` (raw close-button next to an existing `MyButton` usage), `login/form.tsx` (raw
  "not Registered" button next to an existing `MyButton` usage), `answers/form.tsx:92` and
  `detail/form.tsx:285` (raw `<textarea>`, the latter alongside an already-correct `MyTextarea` at
  line 226) — all still outstanding.

### next-dbadmin
- `DatabaseToolsConn.tsx:49-59` hand-rolled tab bar — still outstanding, genuine `MyTab` gap.
- `CreateSQLConn.tsx:91-109` raw-button table list — still outstanding, minor.
- `SchemaSyncConn.tsx` and `CopyTableConn.tsx` status-filter dropdowns (`Set`-based, hand-rolled
  `<details>/<summary>` + checkboxes) — still outstanding, not yet converted to
  `MySelectMulti`. Unresolved design decision before converting: `MySelectMulti` has no built-in
  one-click "reset to All" like the current UI does — needs a decision (accept the UX regression,
  add a separate reset control, or extend the shared component) before applying the swap.

### richard-dashboard
- `src/app/owner/page.tsx` raw buttons — still outstanding.
- `AppCard.tsx:29-69` hand-rolled help-toggle button + overlay modal duplicating `MyHelp`/`MyPopup`
  — still outstanding.

### Cross-project, not yet handed off to any project
- **`DevLayoutHeader` gap** — chess, infostore, next-bridge, next-bridgeschool, and
  richard-dashboard each have their own local `DevHeader.tsx` that duplicates the write-side
  `sessionStorage.setItem('ownerFrom', pathname)` logic already sitting in
  `nextjs-shared/DevLayoutHeader.tsx`, instead of importing it. Note: the shared version's markup
  isn't a byte-for-byte match for every project's local header (e.g. some take a `dbLocation` prop
  or add an extra nav link), so this wouldn't be a pure drop-in without checking each project's
  actual header content first.
- **`MyBackHomeNav` adoption** — only chess uses it (3 call sites). Not confirmed as a gap in the
  other five projects — could mean they simply don't have a page needing a hardcoded back button
  outside `/owner` (which `OwnerLayout` already handles separately). Worth checking each project's
  pages for hand-rolled back-button code before assuming this is outstanding work.
