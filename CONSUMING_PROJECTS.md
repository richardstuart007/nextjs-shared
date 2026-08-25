# nextjs-shared — Consuming Project Guide

This file is the complete reference for Claude (and developers) in any project that uses `nextjs-shared`.  
Import as: `"nextjs-shared": "github:richardstuart007/nextjs-shared"` in `package.json`.

---

## 0. Pulling the latest nextjs-shared

Run these commands in order in the consuming project's terminal:

```powershell
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
Remove-Item -Recurse -Force .next
npx tsc --noEmit
npm run build
```

**Why delete everything and reinstall?**  
`nextjs-shared` is installed from GitHub via a git ref. npm records the resolved commit hash in `package-lock.json`. Deleting both `node_modules` and `package-lock.json` forces npm to re-resolve the git ref to the latest commit on the next `npm install`. Partial approaches (`npm update nextjs-shared`, `npm install --force`) either leave stale cached modules or silently rewrite the GitHub ref in `package.json`.

After running, verify the version with:

```powershell
node -e "const p = require('./node_modules/nextjs-shared/package.json'); console.log(p.version)"
```

---

## 1. Required devDependencies

`nextjs-shared` exports raw TypeScript source files (`.ts`/`.tsx`) that are compiled directly by the consuming project's TypeScript build. This means type declaration packages used inside `nextjs-shared` must also be present in the consuming project's `devDependencies`, even if the project does not use `pg` directly.

Add the following to every consuming project's `devDependencies`:

```json
"@types/pg": "8.20.0"
```

**Why:** `nextjs-shared` uses the `pg` library for Postgres connections. Its source file `src/tables/db.ts` imports from `pg`. TypeScript resolves type declarations from `node_modules` in the consuming project — the `@types/pg` `devDependency` inside `nextjs-shared` is not installed when the package is consumed, so without this entry the production build fails with:

```
Type error: Could not find a declaration file for module 'pg'
```

This error only appears on production builds (e.g. Vercel) because local dev may have a warm `node_modules` from when `nextjs-shared` was developed directly.

---

## 2. Database Setup

**Projects with a database:** Run `scripts/schema.sql` (nextjs-shared's own single source of truth
for its `x`-prefixed tables) once in every database (local, dev, prod). This creates the
`xlg_logging` table that all logging writes to — see that file for the exact column definitions.

**Existing project already has `xlg_logging` without `lg_dbkey`?** Postgres has no `ALTER TABLE`
column-position support, so adding it *before* `lg_table` (to match the column order above) needs
the backup → drop → recreate → copy-back process, not a plain `ADD COLUMN` (which would only ever
append at the end). See this project's own `db-column-reorder` skill for the exact SQL shape — a
consuming project's log history is normally worth preserving, so use the backup/copy-back version,
not a plain drop.

**Projects without a database:** Skip this step and omit `POSTGRES_URL` from `.env`. Logging will fall back to `console.log` automatically. Do not use any `table_fetch`, `table_write`, or other DB functions — only UI components, `write_logging` (console fallback), and `userCache_store` are safe without a database.

---

## 2a. Multi-Database Routing (optional)

By default every `table_` function reads/writes the single database at `POSTGRES_URL`. A project
that needs to move one or more large tables to a separate database (e.g. to work around a
provider's per-database storage limit) can do so transparently — no `table_` function call site
needs to change, routing is resolved automatically inside `db.ts` based on the table name.

**Setup:**
1. Add one env var per additional database, named `POSTGRES_URL` + any suffix (e.g.
   `POSTGRES_URL1`) — the exact suffix doesn't matter, but the routing table stores this literal
   env var name, not an abstract key, so pick something you'll recognize later.
2. Create the routing control table (`xrtg_routing`) in your **primary** database only (it must
   always live there — a query has to know where to look up routing before it can route anything)
   by running `scripts/schema.sql` there, same as any other `nextjs-shared`-owned table.
3. Create the table you're relocating in the **secondary** database (not primary) — it's a genuine
   physical relocation, so the table shouldn't exist in both places.
4. Insert one row per relocated table: `rtg_table` = the table name, `rtg_dbkey` = the env var name
   from step 1 (e.g. `'POSTGRES_URL1'`).
5. Physically move any existing data yourself (`pg_dump`/`pg_restore`, or manual export/import) —
   none of the `table_` functions can copy data across two physical databases in one call, only
   within one database.

**Managing routing rows:** `nextjs-shared` exports `OwnerRoutingMaintenance`
(`./OwnerRoutingMaintenance` → `src/UI/OwnerRoutingMaintenance.tsx`) — a panel for writing, editing
in place (via an Edit/Save/Cancel toggle per row), and deleting `xrtg_routing` rows, no manual SQL
needed for day-to-day changes once the table exists. Any project that opts into multi-database
routing should add it as a tab (e.g. "Routing Maintenance") on their own `/owner` page, the same
way `OwnerTableLogging`/`OwnerTableCache` are added:
```tsx
import OwnerRoutingMaintenance from 'nextjs-shared/OwnerRoutingMaintenance'
// ...
{ label: 'Routing Maintenance', content: <OwnerRoutingMaintenance /> }
```
(`nextjs-shared`'s own `/owner` page also has a "Routing Test" tab, `OwnerRoutingTest.tsx`, that
exercises `ttst_test` to verify routing actually reaches the right database — that one is
internal-only and not exported, same as the Components tab.)

**Behavior:** see `src/tables/db.ts`'s `routingMapPromise`/`getRoutingMap`/`resolveDbKey` for the
caching and no-project-forced-to-opt-in fallback behavior.

**Hard constraint: no cross-database joins.** A relocated table can never appear in the same
`table_fetch_join` call or the same raw `table_query` SQL as a table living in a different
database — Postgres cannot join across two physical databases. Before relocating a table, check
every place it's currently joined with something else; if a join is genuinely needed later, fetch
each side separately (each from its own database) and merge in application code.

---

## 3. Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `POSTGRES_URL` | No | Postgres connection string. If omitted, all `write_logging` calls fall back to `console.log` and DB operations will fail. |
| `POSTGRES_URL<suffix>` (e.g. `POSTGRES_URL1`) | No | Additional database connection string(s) for multi-database routing — see §2a |
| `NEXT_PUBLIC_APPENV_LOG_I` | No | Set to `'false'` to suppress `'I'` severity log entries |
| `NEXT_PUBLIC_APPENV_LOG_D` | No | Set to `'false'` to suppress `'D'` (development) severity log entries |
| `NEXT_PUBLIC_APPENV_ISDEV` | No | Set to `'true'` to show a dev/environment badge in the UI |

---

## 4. Logging

### Write a log entry

Call `write_logging` directly only for errors/events outside a `table_` function call (`table_`
functions already log automatically). Its own header comment
(`src/tables/tableGeneric/write_logging.ts`) documents the full `Params:` shape, including how
`lg_dbkey` auto-resolves from `lg_table` via the multi-database routing map (§2a) when omitted.

Note: all `table_` functions populate `lg_sql_raw`/`lg_sql_params`/`lg_sql_readable` automatically
wherever a query is in scope — most callers never need to pass these manually.

### Display the log table

```tsx
import OwnerTableLogging from 'nextjs-shared/OwnerTableLogging'

export default function LoggingPage() {
  return <OwnerTableLogging />
}
```

No props required. Displays `xlg_logging` with filters for level, severity, dbKey (dropdown — only present if using multi-database routing, see §2a), table, isupdate, caller, function name, message, SQL, and SQL params. Click a row to see the full message plus the raw SQL, bound params, and a pgAdmin4-ready readable SQL string in a detail popup.

### Coding convention

All server actions use `write_logging` (not `console.error`) for errors.  
Log message format: `'consequence string: ' + (error as Error).message`

---

## 5. Generic Table Operations

All are `'use server'` functions. Import individually.

**Every function below returns `TableResult<T>` (`{ ok: boolean; data: T; error: string | null }`),
never throws.** A failed call — bad table name, constraint violation, connection error, anything —
comes back as `{ ok: false, data: <empty-ish default>, error: '<message>' }` instead of rejecting
the promise. Always check `ok` before trusting `data`; `error` is a ready-to-display message, so
there's no need to go spelunking in `xlg_logging` to find out why something failed. This applies
uniformly to every function in this section, including the ones (`table_fetch`, `table_query`,
etc.) that already failed soft before — they now fail soft with this same shape instead of their
own ad hoc one, so a caller checks `.ok`/`.data`/`.error` the same way regardless of which function
it called.

Every function's own header comment (in its source file, under `src/tables/tableGeneric/` or
`src/tables/tableGeneric/table_pages/`) documents its full `Params:`/`Returns:` shape — read that
for exact usage rather than looking for a code example here. Import each by name, e.g.
`import { table_fetch } from 'nextjs-shared/table_fetch'`.

| Function | Purpose |
|---|---|
| `table_fetch` | SELECT rows, with optional WHERE/ORDER BY/LIMIT/DISTINCT |
| `table_fetch_join` | Same as `table_fetch`, plus a `joins` array (`LEFT JOIN`s) |
| `table_write` | INSERT a row |
| `table_upsert` | `INSERT ... ON CONFLICT ... DO UPDATE` (or `DO NOTHING`) |
| `table_update` | UPDATE rows matching a WHERE |
| `table_delete` | DELETE rows matching a WHERE |
| `table_check` | Check whether any row matches, across one or more table/WHERE pairs |
| `table_count` | `COUNT(*)`, with optional WHERE |
| `table_seqGet` / `table_seqReset` | Inspect / fix up a table's identity sequence |
| `table_drop` / `table_truncate` / `table_duplicate` / `table_copy_data` | Schema/admin operations — destructive, admin tooling only (e.g. next-dbadmin), not ordinary app request paths. `table_drop`/`table_truncate` take **positional args**, not an options object |
| `table_query` | Raw parameterized SQL — for anything `table_fetch` can't express: multi-table JOINs, LATERAL subqueries, `json_agg`, `ON CONFLICT DO UPDATE SET col = col + 1`, `COALESCE` in SET clauses |
| `fetchFiltered` / `fetchTotalPages` / `fetchTotalRows` | Paginated filtered SELECT, plus page count / actual row count |

A few things that span more than one function's own source, so they're worth stating here:

- **`table_fetch_join`'s joined tables must all live in the same physical database** — see §2a's
  no-cross-database-join note.
- **`table_copy_data` cannot copy across two physical databases** either — same constraint, see §2a.
- **`table_query` with `isupdate: true`, and `table_truncate`/`table_copy_data`, do not clear the
  affected table's cache entries automatically** — call `cache_clearTable(table, caller)`
  explicitly afterward (see §6).
- **Always use `fetchFiltered`/`fetchTotalPages`/`fetchTotalRows` — never fetch a whole table and
  paginate/filter it client-side.** A pagination UI (page numbers, rows-per-page dropdown) can look
  complete while the underlying query still loads every row — the UI looking right doesn't mean the
  query is right. *Real incident:* next-bridge's Home page had a fully-wired pagination UI sitting
  on top of an unbounded `table_query`/`table_fetch` call, silently loading 11,000+ and 14,000+ row
  tables into the browser on every page view. For a complete, currently-working reference to model
  a new paginated list on, see chess's `src/lib/actions/games.ts`
  (`fetchFilteredGames`/`getGamesPageCount`) and `src/ui/games/GameList.tsx`.
- **Filtering a `text[]` array column:** the standard `Comparison_operator` list (`=`, `<>`, `LIKE`,
  `NOT LIKE`, `>`, `>=`, `<`, `<=`, `IN`, `NOT IN`, `IS NULL`, `IS NOT NULL`) only compares scalar
  values — none can express "this array column contains one of these values." Use
  `'ARRAY_OVERLAP'` instead, with an array `value` (builds a Postgres `&&` overlap check):
  `{ column: 'my_tags_col', value: ['news', 'opinion'], operator: 'ARRAY_OVERLAP' }`.
- **`fetchTotalRows` vs. `fetchTotalPages`:** `fetchTotalPages` returns a page count
  (`Math.ceil(rows / items_per_page)`), enough to drive `MyPagination`, but `MyPaginationFooter`'s
  `totalRows` prop wants the real row count — omitted, the footer estimates
  (`totalPages * rowsPerPage`), which overstates a partially-filled last page. Use `fetchTotalRows`
  (same `table`/`joins`/`filters` shape as `fetchTotalPages`, no `items_per_page`) and pass its
  result through as `totalRows`.

---

## 6. Cache

The cache is a server-side in-memory store keyed by SQL string. It is automatically populated by `table_fetch`, `table_fetch_join`, `fetchFiltered`, `fetchTotalPages`, `fetchTotalRows`, and `table_query` (read calls only, i.e. `isupdate` not set), and automatically cleared on any write/update/delete by `table_write`, `table_update`, `table_upsert`, and `table_delete`.

**Functions with no cache awareness** — the consuming project is responsible for calling `cache_clearTable` (or `cache_clearAll`) after using any of these:

| Function | Why cache may be stale |
|---|---|
| `table_query` (with `isupdate: true`) | Executes raw SQL writes — bypasses the cache entirely rather than clearing it |
| `table_truncate` | Removes all rows but does not clear cache entries for that table |
| `table_copy_data` | Inserts rows into `table_to` without clearing its cache entries |

```ts
import { cache_clearAll, cache_clearUser, cache_clearTable } from 'nextjs-shared/userCache_store'

cache_clearAll('myFunction')           // clear entire cache
cache_clearUser(userId, 'myFunction')  // clear entries containing a userId
cache_clearTable('my_table', 'myFunction') // clear entries for a table
```

Display the cache contents:
```tsx
import OwnerTableCache from 'nextjs-shared/OwnerTableCache'

export default function CachePage() {
  return <OwnerTableCache />
}
```

---

## 7. UI Components

All are React client components. Import individually.

| Import | Description |
|---|---|
| `nextjs-shared/MyBackHomeNav` | Home link, plus a Back link when `backPath` differs from `homePath` — see usage below |
| `nextjs-shared/useBackNav` | `saveBackNav`/`useBackNav` pair for remembering the exact path (incl. query string) to return to after navigating into a detail page — see usage below |
| `nextjs-shared/useTabQueryState` | Syncs a tabbed component's active tab to a URL query param (built on `nuqs`) — see usage below |
| `nextjs-shared/useLazyFetch` | Fetches on mount (or on demand) with `data`/`loaded`/`loading`/`error` state, re-fetching when `deps` change — see usage below |
| `nextjs-shared/MyButton` | Standard button — `cursor-pointer` default, `aria-disabled:cursor-not-allowed` on disabled |
| `nextjs-shared/MyInput` | Text input |
| `nextjs-shared/MyDropdown` | Searchable dropdown with optional DB fetch — retained only until consuming projects migrate to `MySelect`/`MySelectTable`; do not use in new code |
| `nextjs-shared/MySelect` | Labelled select (label + select element) for pre-supplied options; optional search + blank option |
| `nextjs-shared/MySelectTable` | Labelled select whose options are always fetched from a DB table (like `MyDropdown`, but table-only — no `tableData` path) |
| `nextjs-shared/MySelectMulti` | Compact checkbox-dropdown multi-select for filter bars — collapsed trigger, opens on click |
| `nextjs-shared/MySelectRows` | Rows-per-page dropdown, for use alongside `MyPagination` |
| `nextjs-shared/MyTab` | Single tab button — `underline` or `pill` variant, active state controlled by the caller |
| `nextjs-shared/MyTextarea` | Textarea |
| `nextjs-shared/MyCheckbox` | Multi-select checkbox group with search, sort, min/max |
| `nextjs-shared/MyToggle` | Toggle switch |
| `nextjs-shared/MyConfirmDialog` | Confirmation modal |
| `nextjs-shared/MyPagination` | Pagination controls |
| `nextjs-shared/MyPaginationFooter` | `MySelectRows` + `MyPagination` combined in one row — preferred over placing them separately |
| `nextjs-shared/MyLink` | Styled Next.js anchor |
| `nextjs-shared/MyPopup` | Popup overlay |
| `nextjs-shared/MyHelp` | Help button with popover — pass `items` (structured heading+body) or `text` (plain string, supports newlines) |
| `nextjs-shared/MyHelpField` | Hover tooltip `?` icon for inline field hints — pass `text` string |
| `nextjs-shared/MyHelpStep` | Wide structured help popover for pipeline/process steps — pass `title`, `input[]`, `processing`, `output[]`, optional `consumers[]` and `label`. Renders an Input / Processing / Output / Consumers table. Anchors to the nearest `position:relative` ancestor. |
| `nextjs-shared/MyHourGlass` | Loading spinner |
| `nextjs-shared/MyLoadingMessage` | Loading text |
| `nextjs-shared/MyBox` | Styled container box |

### MyBackHomeNav — replacing hardcoded back buttons

Use `MyBackHomeNav` instead of a page-level, hardcoded-target back button. Home always renders;
Back renders only when `backPath` is supplied and differs from `homePath`.

```tsx
import { MyBackHomeNav } from 'nextjs-shared/MyBackHomeNav'

<MyBackHomeNav backPath='/some/hardcoded/route' />
```

Props: `backPath?: string | null`, `backLabel?: string`, `homePath?: string` (default `/`),
`containerClass?: string`, `linkClass?: string`. The Back link's text is `backLabel` if supplied,
otherwise the generic `Back` — the raw `backPath` is never shown as text, since it can contain
query strings that shouldn't be exposed in the UI. Pass `backLabel` to show something more
specific (e.g. `backLabel='Position'`). The Back link renders whenever `backPath` differs from
`homePath` at all — including when only the query string differs (e.g. `backPath='/?tab=rankings'`
vs. `homePath='/'`), which is what makes it possible to show a distinct "Back to [tab]" link for a
tabbed page living at a single route (see `useTabQueryState` below). This is the same component `OwnerLayout` uses internally
for its own sessionStorage-driven back link — on `/owner` routes, `OwnerLayout` already supplies
`backPath` automatically, so pages under `/owner` should **not** also render their own
`MyBackHomeNav`. Everywhere else, pass a static `backPath` to replace a hardcoded back button.

### useBackNav — remembering the exact path to return to

For a list page that navigates into a detail page (e.g. clicking a table row) and needs its Back
link to return to the exact originating path — including query string, not just a fixed route —
call `saveBackNav(key)` at the click site before navigating, then `useBackNav(key)` on mount of
the detail page to read (and clear) it, and pass the result to `MyBackHomeNav`'s `backPath` prop.
Both functions' own header comments (`src/components/useBackNav.ts`) document the full
`Params:`/`Returns:` shape.

Two things worth knowing that aren't visible from that file alone:
- This only tracks the return *path*; it does not persist page content (filters, pagination,
  selected/highlighted row) — that remains the consuming project's own state, restored however
  suits that page's own shape (see `PlayerPageClient` in next-bridge for an existing hand-rolled
  example of that pattern).
- Pages under `/owner` should **not** use this — `OwnerLayout` already supplies its own back link
  automatically for that tree (see the `MyBackHomeNav` note above).

### useTabQueryState — syncing a tabbed component's active tab to the URL

For a page whose in-page tabs are switched via local component state (so the URL never changes,
e.g. always `/`), `useBackNav` alone can't restore the right tab — there's no query string for it
to capture. `useTabQueryState` puts the active tab into the URL (e.g. `?tab=rankings`) so it
round-trips through reload, back/forward, and `saveBackNav`/`useBackNav` with no extra bookkeeping.
Built on [`nuqs`](https://nuqs.dev), which handles the shallow update (no full navigation or scroll
jump), history mode, and encoding.

**One-time setup required per project** — wrap the root layout in `NuqsAdapter` (from `nuqs`
itself, not `nextjs-shared` — this is nuqs's own required App Router adapter):

```tsx
// src/app/layout.tsx
import { NuqsAdapter } from 'nuqs/adapters/next/app'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='en'>
      <body>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  )
}
```

**Suspense boundary required** — since the hook calls Next.js's `useSearchParams()` internally
(via `nuqs`), any component using it must be wrapped in `<Suspense>` at the page level, or the
build fails on any route that isn't already dynamic:

```
useSearchParams() should be wrapped in a suspense boundary at page "/"
Read more: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
```

Fix — wrap the calling component in `<Suspense>` in the page file:

```tsx
// src/app/page.tsx
import { Suspense } from 'react'
import HomePageClient from '@/src/ui/home/HomePageClient'

export default function HomePage() {
  return (
    <Suspense>
      <HomePageClient />
    </Suspense>
  )
}
```

This isn't specific to `useTabQueryState` — it applies to any component using
`useSearchParams()` (directly or via a hook built on it) on a route that isn't already dynamic.

Usage: replace a local `useState` for the active tab with `const [tab, setTab] =
useTabQueryState('tab', 'players')`, same shape as `useState`, driving `MyTab`'s `active`/`onClick`.
The hook's own header comment (`src/components/useTabQueryState.ts`) documents the full
`Params:`/`Returns:` shape.

With the URL now carrying `?tab=rankings`, a row click that calls `saveBackNav(key)` before
navigating to a detail page captures the active tab automatically (`saveBackNav` stores
`window.location.pathname + window.location.search`), and `MyBackHomeNav` shows a distinct
"← Back" link back to that exact tab — see the `MyBackHomeNav` note above on why a same-pathname,
different-query `backPath` now renders the Back link instead of being suppressed.

### useLazyFetch — fetching with data/loaded/loading state

For a component that fetches from a server action and wants to track load state without wiring up
`useState`/`useEffect` by hand each time: `const { data, loaded, loading, error, load } =
useLazyFetch(fetchFn, deps, options?)`. Fetches automatically on mount and whenever `deps` changes;
pass `options.autoFetch: false` to defer the first fetch until `load()` is called explicitly (e.g.
a tab or panel that only fetches once opened, or a "Refresh" button). The hook's own header comment
(`src/components/useLazyFetch.ts`) documents the full `Params:`/`Returns:` shape, including its
stale-request-discard and error-handling behavior.

### Project-wide defaults (`defaultClass` pattern)

Every component accepts a `defaultClass` prop alongside `overrideClass`. Every component's default Tailwind classes live centrally in `nextjs-shared/constants` (named `ComponentName_constantName`, e.g. `MyButton_dftClass`) rather than in the component's own module. A consuming project creates a project-wide wrapper by importing the constant, adjusting it, and passing the result as `defaultClass` — callers can still use `overrideClass` for per-instance changes.

```tsx
// src/components/AppButton.tsx — project-wide wrapper
import { MyButton } from 'nextjs-shared/MyButton'
import { MyButton_dftClass } from 'nextjs-shared/constants'

// Taller buttons project-wide; everything else inherited from shared default
const projectDefault = MyButton_dftClass.replace('h-6 md:h-8', 'h-8 md:h-10')

type Props = React.ComponentProps<typeof MyButton>

export function AppButton(props: Props) {
  return <MyButton defaultClass={projectDefault} {...props} />
}
```

**`overrideClass` gotcha — responsive defaults need every variant repeated.** `myMergeClasses`
only replaces a default token with an override that shares the exact same variant prefix — a bare
override never touches a `md:`-prefixed default, only the unqualified base token. `MyButton`,
`MyInput`, `MyDropdown`, `MySelect`, and `MyLink` all default to `'h-6 md:h-8'` (two independent
tokens, not one). Passing `overrideClass="h-6"` replaces only the base `h-6`; `md:h-8` survives
untouched and still applies at the `md:` breakpoint and up. To force one fixed height across all
breakpoints, repeat both variants: `overrideClass="h-6 md:h-6"`. This is intentional
`myMergeClasses` behavior (it's what lets a caller override just the mobile size while keeping a
deliberate desktop bump) — not a bug to work around, just a default to check before assuming a
bare override fully replaces it.

Each component's own header comment (in its source file, under `src/components/`) documents its
full `Params:`/`Returns:` shape and, where the component has real behavioral depth beyond a plain
prop list, a second header with that detail. Import each by name, e.g.
`import { MyButton } from 'nextjs-shared/MyButton'`.

| Component | Purpose |
|---|---|
| `MyButton` | Standard button |
| `MyInput` | Text input |
| `MyTextarea` | Textarea |
| `MySelect` | Labelled select for pre-supplied options (`options` or `children`); use `MySelectTable` instead when options come from a DB table |
| `MySelectMulti` | Compact checkbox-dropdown multi-select for filter bars |
| `MySelectRows` | Rows-per-page dropdown, for use alongside `MyPagination` |
| `MyPagination` | Page-number pagination controls |
| `MyPaginationFooter` | `MySelectRows` + `MyPagination` + a total-rows count combined in one row |
| `MyTab` | Single tab button (`underline`/`pill` variant); active state and click handling owned by the caller |
| `MyBox` | Bordered container box, optionally collapsible |
| `MyToggle` | Toggle switch |
| `MyDropdown` | Searchable dropdown with optional DB fetch — **do not use in new code**, retained only until consuming projects finish migrating to `MySelect`/`MySelectTable` |
| `MySelectTable` | Labelled select whose options are always fetched from a DB table |
| `MyCheckbox` | Always-expanded multi-select checkbox group with search/sort/min-max — for dedicated form space; use `MySelectMulti` instead for a collapsed filter-bar control |
| `MyPopup` | Modal overlay panel with close button |
| `MyHelp` | Toggleable help popover (title + plain text or structured items) |
| `MyHelpStep` | Toggleable step help popover (Input/Processing/Output/Consumers table) |

A few things that span more than one component's own source, so they're worth stating here:
- **`isSelectionFiltering`/`serializeSelection`/`SELECTION_ALL`** (`nextjs-shared/isSelectionFiltering`)
  are the correct way to derive "is this `MySelectMulti` selection actually filtering?" and to
  persist a selection across reloads — see that file's own header for full usage. Don't re-derive
  either with an ad hoc check.
- **`MyTab`'s `*Class` props** follow the same project-wide-wrapper pattern as `MyButton`'s
  `defaultClass` (see "Project-wide defaults" above) — one override per variant/active combination,
  so a consuming project's wrapper can re-theme only the combo(s) it needs.
- **`MyDropdown`/`MySelectTable`'s `whereColumnValuePairs`** is the same shape as `table_fetch`'s
  own `whereColumnValuePairs` (§5).
- **`MyHelpField`** (hover-triggered tooltip, not a click-to-open popover — see its row in the
  "UI Components" import table near the top of this section) is a structurally different
  interaction model from `MyHelp`/`MyHelpStep` — it dismisses on mouse-leave and has no
  click-open state, so it has no close-button/outside-click props to document.

### Tailwind v4 — required @source directive

**Every consuming project's `globals.css` must include an `@source` directive pointing at
`nextjs-shared`'s source, as the very first line after `@import "tailwindcss";`.** Tailwind v4
only generates CSS for utility classes it finds by scanning files it's told to scan — it does not
scan `node_modules` by default. Every `nextjs-shared` component's default Tailwind classes (e.g.
`MyPopup`'s `fixed inset-0 flex justify-center items-center z-50` overlay, or any `MyButton`
default) live as string constants inside `nextjs-shared`'s own source files. Without this
directive, Tailwind never sees those strings, so **no CSS is ever generated for them** — the
component still renders in the DOM, but with none of its default styling. A modal like `MyPopup`
degrades to an unstyled block sitting in normal page flow instead of a centered fixed overlay, and
things like the close button can end up invisible.

```css
@import "tailwindcss";
@source "../../node_modules/nextjs-shared/src";
```

The relative path must resolve from wherever `globals.css` actually lives (typically
`src/app/globals.css`, two directories above the project root). This is easy to miss because
nothing errors or warns when it's absent — components simply render unstyled, which can look like
a bug in the component itself rather than a missing project-level Tailwind config. Check for this
directive first whenever a `nextjs-shared` component renders with no visible styling in a
particular project.

### Tailwind v4 — custom text sizes

`theme.extend.fontSize` in `tailwind.config.ts` is **silently ignored** in Tailwind v4. Any custom text-size utility (e.g. `text-xxs`) must be declared with `@utility` in the consuming project's `globals.css` — otherwise the class appears in the HTML but renders at the inherited default size:

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

---

## 8. Owner Route (`/owner`)

Each consuming project builds its own `/owner` page. `nextjs-shared` provides the layout shell, tab chrome, and panel components — the consuming project decides which tabs to show.

### Standard layout (`src/app/owner/layout.tsx`)

All consuming projects must use `OwnerLayout` from nextjs-shared. This gives the standard `px-6 py-4 bg-green-100` container, the sessionStorage back-link, and a Home link (`/`) — matching the appearance of the nextjs-shared dev UI. When the back-link would already point to `/`, only the Home link is shown to avoid a duplicate. Do **not** write a custom layout.

```tsx
import OwnerLayout from 'nextjs-shared/OwnerLayout'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <OwnerLayout>{children}</OwnerLayout>
}
```

### Standard page (`src/app/owner/page.tsx`)

Use `OwnerPage` from nextjs-shared for the tab bar. Pass each tab's label and content. Do **not** add extra `px-*` wrappers — `OwnerLayout` already provides horizontal padding.

```tsx
import OwnerPage from 'nextjs-shared/OwnerPage'
import OwnerTableLogging from 'nextjs-shared/OwnerTableLogging'
import OwnerTableCache from 'nextjs-shared/OwnerTableCache'
import OwnerTableSessionStorage from 'nextjs-shared/OwnerTableSessionStorage'

export default function Page() {
  return (
    <OwnerPage
      tabs={[
        { label: 'Logging', content: <OwnerTableLogging /> },
        { label: 'Cache', content: <OwnerTableCache /> },
        { label: 'Session Storage', content: <OwnerTableSessionStorage /> },
      ]}
    />
  )
}
```

### Session Storage tab

`OwnerTableSessionStorage` displays sessionStorage entries whose key starts with
`SessionStorageKeyPrefix` (`'rs7_'`, from `nextjs-shared/constants`). Unlike Logging/Cache, this is
a pure client component with no server round-trip — `sessionStorage` never leaves the browser, so
there's nothing for the server to read.

**Why an include-list, not "show everything":** the browser's `sessionStorage` for any project also
holds entries this display shouldn't show — framework/dev-tooling internals (e.g. Next.js dev mode
writes `__next_debug_channel:*` entries), browser extensions, anything not meant as inspectable app
state. Filtering to a known prefix keeps the table meaningful instead of full of noise.

**The `rs7_` naming convention:** nextjs-shared is a package that runs inside every consuming
project's own browser origin, so its own sessionStorage keys (from `useBackNav`/`saveBackNav`,
`OwnerPage`'s `persistKey`, `OwnerLayout`/`DevLayoutHeader`'s back-link key) share a namespace with
whatever keys that project writes itself. nextjs-shared writes its own keys under
`SessionStorageKeyPrefixShared` (`'rs7_shr_'`) automatically and transparently — existing call
sites (`useBackNav('myKey')`, `persistKey='owner-main'`, etc.) don't change, the prefix is applied
internally. A consuming project that wants its **own** sessionStorage keys visible in this same tab
should adopt its own `rs7_<code>_` sub-prefix for them (e.g. `rs7_br_` for next-bridge, `rs7_ch_`
for chess) — since that also starts with the umbrella `rs7_`, it's picked up automatically with no
extra configuration or props. A project that doesn't adopt the convention simply won't see its own
keys here — nothing else changes.

**Tab-scoping caveat:** it only shows entries in the *current browser tab's* `sessionStorage`. A
fresh tab only shows whatever that tab itself has written (typically just `OwnerPage`'s
`persistKey` entry, if set) — not keys set by navigating other pages in a different tab. Refresh
is manual (a Refresh button) rather than automatic, since same-tab `sessionStorage` writes don't
fire a browser event to react to. "Clear All" only removes the `rs7_`-prefixed entries actually
shown in the table, not the tab's entire `sessionStorage`.

### Persisting the active tab across navigation (`persistKey`)

By default `OwnerPage`'s active tab is plain component state — it resets to the first tab if the
user navigates away (e.g. clicking into a detail page) and comes back. Pass `persistKey` (any
string, unique per `OwnerPage` instance) to have `OwnerPage` remember the active tab in
`sessionStorage` and restore it on the next mount:

```tsx
<OwnerPage persistKey='owner-main' tabs={[...]} />
```

This only covers `OwnerPage`'s own tab state. Filters, pagination, and which row was last
selected/highlighted are not covered — that's page content, owned by the consuming project's own
state, the same as it always has been (see `useBackNav` below for the one piece — the return
path — that nextjs-shared does provide for that scenario).

### Projects with additional tabs (e.g. Tools)

Add project-specific tabs alongside Logging/Cache:

```tsx
import OwnerPage from 'nextjs-shared/OwnerPage'
import OwnerTableLogging from 'nextjs-shared/OwnerTableLogging'
import OwnerTableCache from 'nextjs-shared/OwnerTableCache'

export default function Page() {
  return (
    <OwnerPage
      tabs={[
        { label: 'Tools', content: <MyToolsPanel /> },
        { label: 'Logging', content: <OwnerTableLogging /> },
        { label: 'Cache', content: <OwnerTableCache /> },
      ]}
    />
  )
}
```

### Projects without a database

Omit Logging and Cache tabs — they require `xlg_logging` and the DB cache. `Session Storage` needs
no database and can still be included. Use only project-specific tabs (plus `Session Storage` if
wanted):

```tsx
<OwnerPage tabs={[{ label: 'Tools', content: <MyToolsPanel /> }]} />
```

### Available owner panel components

| Import | Requires DB | Description |
|---|---|---|
| `nextjs-shared/OwnerLayout` | No | Standard layout shell: `px-6 py-4 bg-green-100` + sessionStorage back-link + Home link (back link is suppressed when it already points to `/`) |
| `nextjs-shared/OwnerPage` | No | Tab bar chrome — pass `tabs: { label, content }[]` |
| `nextjs-shared/OwnerTableLogging` | Yes | Paginated, filterable view of `xlg_logging` |
| `nextjs-shared/OwnerTableCache` | Yes | Inspector for the server-side cache |
| `nextjs-shared/OwnerTableSessionStorage` | No | Display + delete/clear-all for the current tab's `rs7_`-prefixed browser `sessionStorage` entries — see "Session Storage tab" below |
| `nextjs-shared/OwnerRoutingMaintenance` | Yes | Write, edit-in-place, and delete `xrtg_routing` rows — see "Multi-Database Routing" above |
| `nextjs-shared/DevLayoutHeader` | No | Dev-only top nav bar (Owner link + optional extra links + optional DB-location badge) — see below |

### DevLayoutHeader props

Renders `null` unless `NEXT_PUBLIC_APPENV_ISDEV === 'true'`. Sets the same `ownerFrom` sessionStorage
key `OwnerLayout` reads, so its back-link works regardless of which page linked into `/owner`.

| Prop | Type | Default |
|---|---|---|
| `dbLocation` | `string` | falls back to reading `process.env.POSTGRES_DATABASE_LOCATION` internally if omitted |
| `extraLinks` | `{ href: string; label: string }[]` | `[]` |

**`dbLocation`**: pass this explicitly from your own root `layout.tsx` (a server component can read
`process.env.POSTGRES_DATABASE_LOCATION` directly, no client-bundle exposure needed) rather than
relying on the internal fallback — that fallback only works in a project whose `next.config`
re-exposes the var via an `env` block the way nextjs-shared's own does, which most consuming
projects' configs don't.

**`extraLinks`**: defaults to none, so a consuming project gets just the bare "Owner" link. Pass
your own project-specific `/owner/*` sub-routes here (nextjs-shared's own `layout.tsx` passes
`[{ href: '/owner/components', label: 'Components' }]` as an example) rather than hardcoding pages
that don't exist in every project.

```tsx
import { DevLayoutHeader } from 'nextjs-shared/DevLayoutHeader'

<DevLayoutHeader
  dbLocation={process.env.POSTGRES_DATABASE_LOCATION}
  extraLinks={[{ href: '/owner/components', label: 'Components' }]}
/>
```

---

## 9. Consuming Project Conventions

- **Never call the database directly** — always use functions from this package
- **Error logging** — use `write_logging` with severity `'E'`, never `console.error` alone
- **Table naming** — application tables use a short prefix (e.g. `tus_users`, `trf_reference`). Tables owned by `nextjs-shared` use the `x` prefix (`xlg_logging`)
- **Column naming** — columns are prefixed with the table code (e.g. `us_usid`, `lg_msg`)
- **Cache** — `skipCache: true` on any fetch that must see live data (e.g. admin pages, post-mutation refetches)

---

## 10. Coding Conventions for Claude

These apply whenever writing or modifying code in a consuming project. General conventions
(comment/rename/restructure discipline, file structure, `async`/`await`, `function` declarations,
etc.) live in the global `~/.claude/CLAUDE.md` Coding Conventions section — only genuinely
nextjs-shared-specific rules are kept here.

### Error handling
See global `~/.claude/CLAUDE.md`'s Error handling section for the general rule. nextjs-shared-specific addition:
- Always include both `lg_functionname` (the function that failed) and `lg_caller` (what called it)

### Server actions
- Mark files with `'use server'` at the top
- Never expose raw DB errors to the client — log internally, return a typed result
- Use `noLog: true` on fetches that run very frequently to avoid flooding the log

### Components
- Mark client components with `'use client'` at the top
- Use `next/dynamic` with `{ ssr: false }` for any admin component that contains inputs, to prevent hydration mismatches from browser extensions:
  ```ts
  const MyAdminComponent = dynamic(() => import('...'), { ssr: false })
  ```
- Never use `.then()` inside event handlers — use `async` functions instead

### Layout (consuming project responsibility)
- **This package provides bare components with no width, height, or scroll opinions**
- The consuming project's page/layout controls all sizing, padding, borders, and scroll behaviour
- Admin pages: use full viewport width
- Consumer-facing pages: the consuming project decides appropriate constraints for the device

### Function comment headers
See global `~/.claude/CLAUDE.md`'s "Function comment headers" section for the numbered
`1) DESCRIPTION`/`2) NOTES`/`3) CHANGE HISTORY` convention — nothing about the header shape is
nextjs-shared-specific.

### TypeScript
- Use types exported from `nextjs-shared/structures` for shared row types (`table_Logging`, `Filter`, `ColumnValuePair` etc.)

### caller convention
Every database call passes a `caller` string that traces the call back to its origin. Thread it from the page/action all the way down:
```ts
// Page
const result = await table_fetch({ caller: 'UsersPage', table: 'tus_users' })

// Server action called from a page
export async function getUsers(caller: string) {
  return await table_fetch({ caller, table: 'tus_users' })
}
```
Use the page or component name as the top-level caller. Pass it through to every DB call so errors in `xlg_logging` identify exactly where they came from.

### Cache
- Read-heavy server pages: allow caching (omit `skipCache`)
- Admin pages: always pass `skipCache: true` — admin must see live data
- After any write/update/delete via `table_write` / `table_update` / `table_upsert` / `table_delete`: cache is cleared automatically
- `table_query` reads (default, `isupdate` not set) are cached automatically like `table_fetch` — pass `skipCache: true` to bypass
- After `table_query` with `isupdate: true`, `table_truncate`, or `table_copy_data`: **cache is not cleared automatically** — call `cache_clearTable(tableName, caller)` explicitly
- High-frequency queries (e.g. polling, repeated renders): pass `noLog: true` to avoid flooding `xlg_logging` with cache hit/miss entries
