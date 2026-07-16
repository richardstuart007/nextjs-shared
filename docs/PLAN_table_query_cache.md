# Plan: table_query cache integration

## Context

`table_query` (src/tables/tableGeneric/table_query.ts) never integrated with the shared cache,
unlike `table_fetch`, which caches by building a value-substituted "readable" SQL string via
`buildSql_Readable` and using that as the cache key. This plan brings `table_query` in line with
`table_fetch`'s caching behavior, while ensuring writes (`isupdate: true`) always bypass the cache
on both the read and write side.

## Plan

- [x] `table_query.ts` — add `skipCache` prop (default `false`); compute
      `useCache = !skipCache && !isupdate`; build cache key via
      `buildSql_Readable(query, params)`; call `cache_get` before the query (return early on hit);
      call `cache_set` after a successful query, only on the read path.
- [x] `buildSql_Readable.ts` — widen `values` param type from `(string | number)[]` to
      `(string | number | null | boolean)[]` to match `table_query_Props.params` (body already
      does `String(value)`, so this is a type-only change).
- [x] `CONSUMING_PROJECTS.md` — update the `table_query` section (heading + prose) to describe the
      new caching + `skipCache` behavior, keep `cache_clearTable` guidance for writes; remove
      `table_query` (read case) from the "no cache awareness" table and the matching bullet under
      the Cache conventions section, replacing with the `isupdate: true` write-only caveat.
- [x] Type-check (`npx tsc --noEmit`) to confirm no regressions.

## Changes

### src/tables/tableGeneric/table_query.ts
- Added `skipCache?: boolean` prop (default `false`).
- Added `cache_get`/`cache_set` integration using `buildSql_Readable(query, params)` as the cache
  key, gated by `useCache = !skipCache && !isupdate` so writes never read from or write to the
  cache.

### src/tables/tableGeneric/buildSql_Readable.ts
- Widened `values` parameter type to `(string | number | null | boolean)[]` to match
  `table_query`'s `params` type.

### CONSUMING_PROJECTS.md
- Updated the `table_query` section heading and example (added `skipCache` option) and prose to
  describe auto-cached reads vs. `isupdate: true` writes bypassing the cache.
- Updated the "Functions with no cache awareness" table and the Cache conventions bullet list to
  reflect that only `table_query` writes (`isupdate: true`) still need manual `cache_clearTable`.

## Status

All steps complete. Type-check passed clean. Ready for `#commit` when the user is ready (per
release rules: bump `package.json` version before committing, then reinstall in consuming projects
after push).
