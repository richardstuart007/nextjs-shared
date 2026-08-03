# PLAN_audit-pagination — nextjs-shared

## Title
Audit pagination — analyse all consuming projects and identify where the new `MyPaginationFooter`
can be implemented, replacing existing pagination footers. Start with the bridge project.

## Analysis

### Cross-project scan (MyPagination usage)
- **chess**: `MyPagination` used in 4 files (`habits/page.tsx`, `lib/analysis/chessdb.ts`,
  `ui/analysis/PipelineLogTable.tsx`, `ui/games/GameList.tsx`) — **re-verified in detail (2026-08-03)**:
  all four already have **real, correct server-side pagination**, confirming the `pagination`
  skill's own reference to `GameList.tsx` is still accurate:
  - `habits/page.tsx` / `chessdb.ts` — `getHabitsData`/`getHabitsCount`, raw `table_query` with
    explicit `LIMIT`/`OFFSET` + matching `COUNT(*)`
  - `PipelineLogTable.tsx` — `fetchFiltered`/`fetchTotalPages` (nextjs-shared) directly
  - `GameList.tsx` — `fetchFilteredGames`/`getGamesPageCount` (`src/lib/actions/games.ts`), which
    wrap `fetchFiltered`/`fetchTotalPages`
  No `.slice()`/client-side pagination anywhere — unlike next-bridge, there's no underlying
  data-layer bug here. However, **none of the four has a rows-per-page dropdown at all** — each uses
  a fixed page-size constant (`HABITS_ITEMS_PER_PAGE=10`, `PIPELINE_LOG_ROWS_PER_PAGE`,
  `GAME_LIST_ITEMS_PER_PAGE=15`). So adopting `MyPaginationFooter` here isn't a like-for-like footer
  swap (there's no existing combo to replace) — it would mean *adding* a new rows-per-page control
  where none exists today, a small scope decision in its own right, not just a component swap.
- **next-bridge**: 5 files use `MyPagination`; has its own shared `RowsPerPageSelect` component and
  `ROWS_PER_PAGE`/`ROWS_PER_PAGE_OPTIONS` constants. Clearest candidate set — see detailed inventory
  below.
- **next-bridgeschool**: 12 files use `MyPagination`, with `itemsPerPage`-style state present in
  many `admin/*/table.tsx` files — not yet inventoried in detail.
- **infostore, next-dbadmin, richard-dashboard**: no `MyPagination` usage found — not candidates.

### next-bridge detailed inventory

| File | Combo? | State | Wrapper | onChange side effect |
|---|---|---|---|---|
| `ui/admin/DataTableShared.tsx` | No — `MyPagination` alone, fixed `ROWS_PER_PAGE` (20), not user-adjustable | `page`/`setPage` (plain, `safePage` clamp effect) | `<div className='flex justify-center mt-2'>` | n/a |
| `ui/home/HomePageClient.tsx` | Yes — twice (Players tab, Sessions tab) | `playerPage`/`playerItemsPerPage`, `sessionPage`/`sessionItemsPerPage` (plain numbers, persisted to `sessionStorage`) | `<div className='mt-3 flex items-center gap-3'>` (RowsPerPageSelect, `p.X/Y` span, MyPagination) | Resets page to 1. Players tab overrides `options={[15,20,50,100]}` (only deviation from shared default) |
| `ui/player/PartnersTable.tsx` | Yes | `currentPage`/`itemsPerPage` (plain, seeded from `ROWS_PER_PAGE`) | same `mt-3 flex items-center gap-3` pattern | Resets page to 1; separate effect also resets page to 1 on filter changes |
| `ui/player/PlayerPageClient.tsx` | Yes (data view only; hidden in graph view) | `currentPage`/`itemsPerPage` (plain, `sessionStorage`-persisted) | same pattern | Resets page to 1; also resets on filter changes |
| `ui/session/SessionPageClient.tsx` | Yes (simplest — no filters, no persistence) | `currentPage`/`itemsPerPage` (plain) | same pattern | Resets page to 1 |

All four combo files import the same shared `RowsPerPageSelect` — no local/duplicate variants.

### Drop-in assessment (next-bridge)
Four of five files (all but `DataTableShared.tsx`) use an identical minimal wrapper
(`<div className='mt-3 flex items-center gap-3'>` → RowsPerPageSelect + manual `p.X/Y` label span +
MyPagination), no borders/backgrounds — visually low-friction to swap for `MyPaginationFooter`.
Three things to reconcile per site:
1. The manual `p.X/Y` page-count label isn't part of `MyPaginationFooter` — needs dropping or
   re-adding some other way.
2. `MyPaginationFooter`'s own yellow-background 3-column grid will look different from the current
   plain flex row — check against each section's surrounding card padding/borders.
3. The "reset page to 1 on rows-per-page change" side effect (present in all 4 combos, sometimes
   alongside a filter-change reset too) must be preserved in whatever `onChange` wraps
   `MyPaginationFooter`'s `setRowsPerPage`.

Note: confirmed mapping — "home page" = `HomePageClient.tsx` (Players + Sessions tabs), "players
table" = `PlayerPageClient.tsx` (`/player/[id]`, which itself has two combos: its own history table
plus a nested one in `PartnersTable.tsx` on the Partners tab), "sessions table" =
`SessionPageClient.tsx` (`/session/[id]`), "rankings table" = `RankingsPageClient.tsx` — which has
**no existing page-based pagination** (a client-side Top-N dropdown over an unpaginated fetch, not
a `MyPagination`+`RowsPerPageSelect` combo). User decided (via `AskUserQuestion`): skip rankings for
this plan — it would need real `fetchFiltered`/`fetchTotalPages` pagination added first, a bigger,
separate task.

## Plan
- [x] Audit next-bridge (Phase 1) — confirmed via `#audit` skill, sentinel written for
      `next-bridge`, findings above re-verified against current file contents.
- [x] Create and execute `next-bridge/docs/PLAN_pagination-footer-swap.md` (that project's own plan
      file, per the `#audit` skill's Phase 4/5) — migrated `HomePageClient.tsx` (Players + Sessions
      tabs), `PlayerPageClient.tsx`, `PartnersTable.tsx`, and `SessionPageClient.tsx` to
      `MyPaginationFooter`; deleted the now-unused `RowsPerPageSelect.tsx` and dead
      `ROWS_PER_PAGE_OPTIONS` constant. next-bridge's own `tsc`/`build` both passed. Not yet
      committed — that project's own `#commit` hasn't been invoked.
- [x] Updated nextjs-shared's own `.claude/CLAUDE.md` outstanding-items entry for next-bridge to
      reflect this fix.
- [x] Audit chess in detail (2026-08-03) — all 4 `MyPagination` sites confirmed as real server-side
      pagination (no data-layer issue like next-bridge had); none has a rows-per-page dropdown to
      swap, so `MyPaginationFooter` adoption here would mean adding a new control, not a pure swap.
      Decision on whether to add it: not yet made, no action taken.
- [x] **MySelectRows single-option behavior (agreed via chat, surfaced while planning chess's
      rollout):** when `options.length <= 1`, render a plain static text label instead of a
      `<select>` — there's nothing to choose between, so a one-item dropdown is pointless UI.
      - Add `MySelectRows_staticTextClass = 'text-xs text-gray-700'` to `src/constants.ts` (agreed
        starting value — roughly matches the dropdown's own `text-xs`, no border/background since
        it isn't an interactive control).
      - In `MySelectRows.tsx`: if `options.length === 0`, render nothing. If `options.length === 1`,
        render `{label && <span className={labelClass}>{label}</span>}` (reusing the existing
        `labelClass`/`containerClass` props, defaulting the same as the dropdown branch — i.e.
        `MySelect_labelDftClass`/`MySelect_containerDftClass`, imported directly since `MySelect`
        itself isn't rendered in this branch) followed by
        `<span className={MySelectRows_staticTextClass}>{options[0]} rows</span>` — matches the
        dropdown's own `{n} rows` option-label format. Otherwise (2+ options), unchanged — same
        `<MySelect>` dropdown as today.
      - This is a `MySelectRows`-level fix (not `MyPaginationFooter`-specific), so it automatically
        benefits any other current or future direct `MySelectRows` consumer too.
      - Update `CONSUMING_PROJECTS.md`'s `MySelectRows` props section to document this behavior.
      - Run `npx tsc --noEmit` / `npm run build` (nextjs-shared's own). Both passed.
- [ ] Extend the audit to **next-bridgeschool** (12 files, `itemsPerPage`-style state present — not
      yet inventoried in detail).
- [ ] Decide (separately, out of scope here) whether to give `RankingsPageClient.tsx` real
      server-side pagination so it can also adopt `MyPaginationFooter`.

## Changes

### next-bridge (via #audit — see that project's own commit for full detail)
- Migrated 4 files off the local `RowsPerPageSelect` + `MyPagination` combo onto the shared
  `MyPaginationFooter`; deleted the now-dead component and constant. Not yet committed in
  next-bridge — awaiting that project's own `#commit`.

### nextjs-shared/.claude/CLAUDE.md
- Marked the next-bridge `RowsPerPageSelect` outstanding item as fixed.

### src/constants.ts (MySelectRows single-option)
- Added `MySelectRows_staticTextClass = 'text-xs text-gray-700'`.

### src/components/MySelectRows.tsx
- Renders nothing when `options.length === 0`; renders a plain static `{n} rows` label (no
  `<select>`) when `options.length === 1`; unchanged dropdown behavior for 2+ options.
  `labelClass`/`containerClass` now default to `MySelect_labelDftClass`/`MySelect_containerDftClass`
  directly (previously passed through as `undefined` for `MySelect` to default internally) — same
  effective classes, needed so the single-option branch (which doesn't render `MySelect`) has
  matching defaults.

### CONSUMING_PROJECTS.md
- Documented the single-option static-text behavior in the `MySelectRows` props section.

## Testing
- [ ] Confirmed via `npx tsc --noEmit` and `npm run build` — both pass cleanly.
- [ ] In a test page, render `<MySelectRows value={20} onChange={() => {}} options={[20]} />` and
      confirm it shows plain text "20 rows" with no dropdown/select element; render with
      `options={[]}` and confirm nothing renders; confirm 2+ options still shows the interactive
      dropdown as before.
