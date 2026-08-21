# PLAN_parameterize-limit-offset — nextjs-shared

## Title
Parameterize LIMIT/OFFSET in fetchFiltered / table_fetch_pages_filtered

## Background — why this plan exists
`applyFetchSuffix` (src/tables/tableGeneric/table_pages/buildSqlQuery.ts:87-112) builds the
paging suffix of every filtered/paginated query by string-concatenating `LIMIT`/`OFFSET` values
straight into the SQL text, instead of pushing them into `queryValues` and referencing them as
`$N` bound parameters the way every `WHERE` filter value already does (`buildSqlQuery`, same
file, lines 24-78). This is why a logged entry for `table_fetch_pages_filtered` shows
`SQL Params: []` while the raw SQL has literal `LIMIT 40 OFFSET 0` baked in — there just happened
to be no filters on that call, so nothing else was pushed into `queryValues` either.

**Scope note (LIMIT/OFFSET only, not ORDER BY):** `orderBy` (and `distinctColumns`) are column
names/expressions, not values — Postgres parameter binding (`$N`) only substitutes values, it
cannot bind an identifier or SQL keyword. There is no way to "parameterize" `ORDER BY` the same
way; the only real fix for that would be validating/allowlisting the column name server-side,
which is a different kind of change. This plan only covers `LIMIT`/`OFFSET`, which are genuine
bindable values (already typed as `number` in the function signature).

## Plan
- [x] `src/tables/tableGeneric/table_pages/buildSqlQuery.ts`: change `applyFetchSuffix` to accept
      the existing `queryValues` array as a parameter and return `{ finalQuery, queryValues }`
      instead of a bare string. When `limit`/`offset` are defined, push them onto a copy of
      `queryValues` and emit `LIMIT $N`/`OFFSET $N` referencing their position, instead of
      concatenating the literal number into the SQL text. `orderBy`/`distinctColumns` stay
      string-interpolated (see Scope note above).
- [x] `src/tables/tableGeneric/table_pages/tableFetchUtils.ts` (`table_fetch_pages_filtered`):
      update the call site to pass `queryValues` into `applyFetchSuffix` and use its returned
      `finalQuery`/`queryValues` for both `buildSql_Readable` and the `db.query(...)` call.
- [x] `src/tables/tableGeneric/table_pages/fetchFiltered.ts`: update the call site the same way
      for the cache-key build (`applyFetchSuffix` → `buildSql_Readable`).
- [x] Run `npx tsc --noEmit` to verify.
- [x] Bump the version in `package.json` per release rules.
- [x] `src/tables/tableGeneric/buildSql_Placeholders.ts` (used by `table_fetch`/
      `table_fetch_join`): same bug as above — `if (limit) sqlQuery += \` LIMIT ${limit}\`` on
      line 42 concatenates a literal instead of using the `values`/`paramIndex` machinery already
      built for `WHERE` conditions. Push `limit` onto `values` and emit `LIMIT $${++paramIndex}`
      instead.
- [x] Re-run `npx tsc --noEmit` to verify.

## Changes

### src/tables/tableGeneric/table_pages/buildSqlQuery.ts
- `applyFetchSuffix` now takes `queryValues` as a parameter and returns
  `{ finalQuery, queryValues }` instead of a bare SQL string. `limit`/`offset` are pushed onto a
  copy of `queryValues` and emitted as `LIMIT $N`/`OFFSET $N` instead of being concatenated as
  literals into the SQL text, matching how `WHERE` filter values are already bound in
  `buildSqlQuery`. `orderBy`/`distinctColumns` are unchanged (still string-interpolated — they're
  column names/expressions, not bindable SQL values).

### src/tables/tableGeneric/table_pages/tableFetchUtils.ts
- `table_fetch_pages_filtered` now passes `queryValues` into `applyFetchSuffix` and uses its
  returned `finalQuery`/`queryValues` for both the readable-SQL log text and the actual
  `db.query(...)` params, so the executed query's `LIMIT`/`OFFSET` are real bound parameters
  end-to-end.

### src/tables/tableGeneric/table_pages/fetchFiltered.ts
- The cache-key build now passes `queryValues` into `applyFetchSuffix` and uses its returned
  `queryValues` when building the readable cache key via `buildSql_Readable`, so the cache key
  still fully reflects `limit`/`offset` even though they're no longer literal text in the SQL
  string itself.

### package.json
- Bumped version 2.1.73 → 2.1.74 per release rules (prevents npm serving a cached copy to
  consuming projects). Note: this bump was later superseded on disk by an unrelated commit
  (`193d520`, MySelect plan) that landed mid-session and put `package.json` at `2.1.76` on `HEAD`
  — still needs a fresh bump on top of that before this plan is committed.

### src/tables/tableGeneric/buildSql_Placeholders.ts
- Same fix as `applyFetchSuffix`, applied to the generic (non-paginated) query builder used by
  `table_fetch`/`table_fetch_join`. `limit` is now pushed onto `values` and emitted as
  `LIMIT $${++paramIndex}` instead of being concatenated as a literal into the SQL text.
  `orderBy` is unchanged (still string-interpolated — a column name/expression, not a bindable
  value, same reasoning as the Scope note above).

## Testing
- [ ] Confirmed via `npx tsc --noEmit` only — this is an internal query-building change with no
      UI surface. Behavior should be identical: any page using `fetchFiltered`/paginated table
      views (e.g. `/owner` → Logging tab) should still page/filter/sort exactly as before.
- [ ] Open `/owner` → Logging tab, change pages and confirm rows still page correctly.
- [ ] Check a fresh log entry's "SQL (raw)" / "SQL Params" in the Log Entry Detail view — the raw
      SQL should now show `LIMIT $N OFFSET $N` (with `N` matching the params array position)
      instead of literal numbers baked into the SQL text, and "SQL Params" should contain the
      limit/offset values.
- [ ] Exercise any page that calls `table_fetch`/`table_fetch_join` with a `limit` (e.g. a
      dropdown/lookup populated via one of those) and confirm it still returns the correct number
      of rows.
