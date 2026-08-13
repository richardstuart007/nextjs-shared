# PLAN_paginationfooter-actual-record-count — nextjs-shared

## Title
Owner Cache and Logging table footers show an estimated record count instead of the actual count

## Plan
- [x] Add `table_fetch_rows_total` to `src/tables/tableGeneric/table_pages/tableFetchUtils.ts` — mirrors `table_fetch_pages_total` (same `buildSqlQuery`/`buildCountQuery` construction, same COUNT query) but returns the raw count instead of `Math.ceil(count / items_per_page)`
- [x] Add new file `src/tables/tableGeneric/table_pages/fetchTotalRows.ts` exporting `fetchTotalRows` — mirrors `fetchTotalPages`'s signature/caching shape, calls `table_fetch_rows_total`, and uses a `ROWS::`-prefixed cache key (distinct from `fetchTotalPages`'s bare-SQL cache key) so the two can't silently overwrite each other's cached value for the same underlying query
- [x] Export `./fetchTotalRows` from `package.json`'s `exports` map, pointing at the new file
- [x] Update `src/UI/OwnerTableCache.tsx` — pass the already-available `totalCount` state to `MyPaginationFooter`'s `totalRows` prop
- [x] Update `src/UI/OwnerTableLogging.tsx` — replace the `fetchTotalPages` call with `fetchTotalRows`, store the actual count in a `totalRows` state var, derive `totalPages` client-side via `Math.max(1, Math.ceil(totalRows / rowsPerPage))` (matching `OwnerTableCache.tsx`'s existing pattern), and pass `totalRows` to `MyPaginationFooter`
- [x] Update `CONSUMING_PROJECTS.md` to document the new `fetchTotalRows` export
- [x] Run `npx tsc --noEmit` to verify correctness
- [x] Bump `package.json` version before committing, per release rules

## Changes
### src/tables/tableGeneric/table_pages/tableFetchUtils.ts
- Added `table_fetch_rows_total` — same query construction as `table_fetch_pages_total` but returns the raw `COUNT(*)` result instead of dividing it into a page count. `table_fetch_pages_total` itself is unchanged.

### src/tables/tableGeneric/table_pages/fetchTotalRows.ts (new)
- New public function mirroring `fetchTotalPages`'s caching shape (`skipCache`, `level`, `severity`), calling `table_fetch_rows_total` to get the actual row count. Cache key is prefixed `ROWS::` so it can never collide with `fetchTotalPages`'s bare-SQL cache key for the identical query.

### package.json
- Added `./fetchTotalRows` to the `exports` map.
- Bumped version `2.1.65` → `2.1.66` so npm doesn't serve a cached copy to consuming projects.

### src/UI/OwnerTableCache.tsx
- `MyPaginationFooter` now receives `totalRows={totalCount}` — the actual matched-entry count it already had in state, previously computed but never passed through.

### src/UI/OwnerTableLogging.tsx
- Replaced the `fetchTotalPages` call with `fetchTotalRows`. Added `totalRows` state; `fetchdata()` now stores the actual row count and derives `totalPages` client-side (`Math.max(1, Math.ceil(fetchedTotalRows / rowsPerPage))`), matching `OwnerTableCache.tsx`'s existing pattern — one COUNT query per fetch instead of two. `MyPaginationFooter` now receives `totalRows={totalRows}`.
- `MyPaginationFooter.tsx`'s own estimate fallback (`totalRows ?? totalPages * rowsPerPage`) is unchanged — consuming projects that don't pass `totalRows` keep getting the same estimate as before.

### CONSUMING_PROJECTS.md
- Documented the new `fetchTotalRows` function under the `fetchFiltered`/`fetchTotalPages` section, with a usage example showing it feeding `MyPaginationFooter`'s `totalRows` prop.
- Added `fetchTotalRows` to the list of cache-populating functions in the Cache section.

## Testing
- [ ] Open the Owner Logging page (`/owner` → Logging tab, or wherever `OwnerTableLogging` is mounted) with more rows than one page — confirm the footer's row count matches the actual filtered row count (not `totalPages * rowsPerPage`), especially on a partially-filled last page.
- [ ] Open the Owner Cache page (Cache tab) — confirm the footer's row count matches the `totalCount` shown in the "`totalCount` / `overallSize` entries" text above the table.
- [ ] Confirmed via `npx tsc --noEmit` — passed with no errors.
- [ ] Confirmed `MyPaginationFooter`'s own fallback behavior is untouched — a consuming project that doesn't pass `totalRows` still sees the `totalPages * rowsPerPage` estimate as before.
