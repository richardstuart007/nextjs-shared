# PLAN_cache-tab-pagination — nextjs-shared

## Title
Add pagination to the Cache tab

## Plan

- [x] **Scope note (surfaced during design, agreed to proceed):** `OwnerTableCache.tsx` currently
      fetches the *entire* cache entry list via `cacheAction_getEntries()` (no params) and applies
      its 3 filters (`keyFilter`/`tableFilter`/`callerFilter`) client-side via `useMemo` over the
      full array. Simulating real `limit`/`offset` means the server must only ever return one
      page's worth of entries — so filter matching has to move server-side too (matched against the
      full in-memory cache before slicing), otherwise a client-side filter would only search
      whatever page happened to load. This plan includes that move, not just adding limit/offset.
- [x] `src/tables/cache/userCache_store.ts`: change `cache_getEntriesInfo()` to accept
      `{ limit, offset, keyFilter, tableFilter, callerFilter }`, apply the same 3 substring/array
      matches currently done client-side (against the full `cache.entries()`), compute the matched
      total, then slice to the requested page. Return
      `{ entries: CacheEntryInfo[], totalCount: number, overallSize: number }` —
      `totalCount` = matched-filter total (for `MyPaginationFooter`'s `totalPages`), `overallSize` =
      `cache.size` (unfiltered, for the existing "`X / Y entries`" summary line's `Y`).
- [x] `src/tables/cache/cache_actions.ts`: update `cacheAction_getEntries` to accept and pass through
      the same params, matching the new return shape.
- [x] `src/UI/OwnerTableCache.tsx`:
      - Removed the client-side `filteredEntries` `useMemo` — the server now returns exactly what
        should be displayed.
      - Added `currentPage`/`rowsPerPage` state. `rowsPerPage` seeded from
        `MySelectRows_valueDftShared` (20) rather than a new duplicate constant — no existing fixed
        page-size constant to preserve for this tab, and `MyPaginationFooter`'s own default
        `rowsOptions` (`MySelectRows_optionsDftShared`, `[10,20,50,100]`) applies unchanged, so no
        new `OwnerTableCache_rowsOptions` constant was needed either (would have duplicated it).
      - Debounced filter-triggered refetches the same way `OwnerTableLogging` does, via new
        `OwnerTableCache_filterDebounceMs = 2000` in `src/constants.ts`. Immediate (1ms) refetch on
        page/rows-per-page change.
      - `rowsPerPage`/`currentPage`/filters are in the fetch effect's dependency array;
        `currentPage` resets to 1 on filter change and on rows-per-page change. Added a clamp effect
        (`if (currentPage > totalPages) setCurrentPage(totalPages)`) matching `OwnerTableLogging`'s
        own pattern.
      - Added `<MyPaginationFooter>` below the table.
      - Summary line now reads `{totalCount} / {overallSize} entries` (was
        `{filteredEntries.length} / {entries.length}`) — `totalCount` is the server's matched-filter
        total, `overallSize` is the unfiltered cache size. "Clear All"'s disabled condition changed
        from `entries.length === 0` (current page only) to `overallSize === 0` (whole cache).
      - Row numbering changed from `idx + 1` (page-relative, would restart at 1 every page) to
        `(currentPage - 1) * rowsPerPage + idx + 1` (absolute position), matching the convention
        used elsewhere (e.g. chess's `SessionPageClient.tsx`-style row numbering).
- [x] Checked `CONSUMING_PROJECTS.md` — `cacheAction_getEntries`/`cache_getEntriesInfo` were never
      documented there (internal dev-app action only). No update needed.
- [x] Run:
      npx tsc --noEmit
- [x] Run:
      npm run build

## Changes

### src/tables/cache/userCache_store.ts
- `cache_getEntriesInfo()` now takes `{ limit, offset, keyFilter?, tableFilter?, callerFilter? }`
  instead of no params. Applies the 3 filters (moved here from `OwnerTableCache.tsx`'s client-side
  `useMemo`) against the full in-memory cache, then slices to the requested page. Returns
  `{ entries, totalCount, overallSize }` instead of a bare array. New exported type
  `CacheEntriesPage`.

### src/tables/cache/cache_actions.ts
- `cacheAction_getEntries` now takes the same params and passes them through; return type changed
  from `Promise<CacheEntryInfo[]>` to `Promise<CacheEntriesPage>`.

### src/UI/OwnerTableCache.tsx
- Full pagination + server-side filtering: new `currentPage`/`rowsPerPage`/`totalCount`/
  `overallSize` state, debounced filter refetch (`OwnerTableCache_filterDebounceMs`), page clamp
  effect, `MyPaginationFooter` added below the table, summary line and row numbering updated, and
  the now-obsolete client-side `filteredEntries` `useMemo` removed.

### src/constants.ts
- Added `OwnerTableCache_filterDebounceMs = 2000`.

## Testing
- [ ] User runs:
      npm run locallocal
- [ ] Open `/owner` → Cache tab. Confirm entries now paginate (with more entries than one page's
      rows-per-page, only a page's worth renders at a time) instead of showing everything at once.
- [ ] Type into each of the 3 filter inputs (key/table/caller) and confirm results still match
      correctly across the *entire* cache, not just whatever page was loaded before typing — confirm
      the debounced "matching" behavior (brief delay before the list updates) and that the page
      resets to 1.
- [ ] Change rows-per-page and confirm the table refetches with the new page size and resets to
      page 1; confirm page-number clicks still navigate correctly.
- [ ] Confirm the "`X / Y entries`" summary line shows the filtered match count and the true
      unfiltered cache size correctly (e.g. clear a filter and confirm `X` grows back toward `Y`).
- [ ] Confirm "Clear All" is only disabled when the cache is genuinely empty, not just when the
      current filtered page has no rows.
- [ ] Confirmed via `npx tsc --noEmit` and `npm run build` — both pass cleanly.
