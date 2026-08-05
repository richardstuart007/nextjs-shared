# PLAN_array-overlap-filter-operator — nextjs-shared

## Title
Add ARRAY_OVERLAP comparison operator for filtering text[] array columns

## Plan
- [x] Add `'ARRAY_OVERLAP'` to `Comparison_operator` in `src/tables/structures.ts`.
- [x] Update `src/tables/tableGeneric/table_pages/buildSqlQuery.ts`'s filter-mapping logic to
      handle `'ARRAY_OVERLAP'`: value must be an array; build
      `${column} && ARRAY[$n1, $n2, ...]::text[]` (Postgres array-overlap operator — true when the
      column's array shares at least one element with the given array), pushing each element to
      `queryValues` the same way the existing `IN`/`NOT IN` branch does.
- [x] Update `CONSUMING_PROJECTS.md`'s `Filter`/`Comparison_operator` documentation to list the new
      operator with a short example (filtering a `text[]` column).

## Changes

### src/tables/structures.ts
- Added `'ARRAY_OVERLAP'` to the `Comparison_operator` union type.

### src/tables/tableGeneric/table_pages/buildSqlQuery.ts
- Added an `ARRAY_OVERLAP` branch to the filter-mapping logic, mirroring the existing `IN`/`NOT IN`
  placeholder-building, producing `${column} && ARRAY[$n1, $n2, ...]::text[]` (Postgres array
  overlap — true when the column shares at least one element with the given array).

### CONSUMING_PROJECTS.md
- Documented the new `ARRAY_OVERLAP` operator right after the `fetchFiltered` example, with a short
  usage example for filtering a `text[]` column.

## Testing
- [ ] Confirmed via `npx tsc --noEmit` only — new operator has no consumer yet in this project
      (infostore's entries pagination plan uses it next). No behavior change to any existing
      operator/query path.
