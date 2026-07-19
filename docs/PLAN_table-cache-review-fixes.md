# PLAN_table-cache-review-fixes — nextjs-shared

## Title
Address findings from table_ functions / caching review

## Plan
- [x] Fix `table_fetch` / `table_fetch_join` caching DB errors as empty results — `table_fetch_query` (table_fetch.ts) and `table_fetch_join_query` (table_fetch_join.ts) swallow query failures and return `[]`, which the caller then caches via `cache_set` as if it were a genuine empty result. Bring these in line with `table_query`/`table_fetch_pages_filtered`, which don't cache on the error path.
- [x] Fix Neon `Pool` being recreated (and never closed) on every `sql()` call — `createDbQueryHandler()` (db.ts:31-41) has no "already initialized" guard — every call to `sql()` re-runs it, and on the Vercel/Neon branch that means `new Pool({ max: 1 })` every time, reassigning `sqlHandler.query` to a new closure. Since practically every `table_*` function calls `await sql()` internally, a single page load that touches several `table_` functions creates several distinct Pool objects, none of which are ever `.end()`'d (confirmed — the only `.end()` in the file is the local-Postgres `client.end()` at line 135, which is correctly scoped per-query on that branch). Over a warm serverless instance's lifetime this is at minimum wasteful pool-construction churn, and at worst a slow connection leak toward Neon's connection cap. Fix: gate `createDbQueryHandler()` with an "already initialized" flag so the pool is built once per warm instance.
- [x] Add an inline comment in `cache_clearUser` (userCache_store.ts) documenting that its regex only matches equality filters and will silently miss a userId inside an `IN (...)` list — noting this is not currently a problem since its only consumer (`next-bridgeschool`'s `userCache_purge`) always clears one user at a time after that user's own record changed, so every affected query filters by plain equality. Documentation only — no functional change.
- [x] De-duplicate query-building logic used for both cache-key construction and actual query execution — `table_fetch_join`'s JOIN injection (built twice) and `fetchFiltered`/`table_fetch_pages_filtered`'s ORDER BY/LIMIT/OFFSET suffix (built twice) risk the cache key silently diverging from the real query if one copy is edited without the other.
- [x] Decide on `skipCache` naming clarity — same prop name means "bypass cache" on read functions but "don't invalidate other cached reads" on write functions (e.g. table_write.ts). **Decided: no action** — deprioritized without further discussion.
- [x] Decide on cache eviction/TTL strategy (or explicitly decide not to add one) — the cache has no size cap or expiry, only reactive clearing via `cache_clearTable`/`cache_clearUser`/`cache_clearAll`. **Decided: no action.** Discussed a TTL as a defense-in-depth backstop for missed invalidations (relevant given the `chess` purge-pipeline gap noted below) versus a size cap for memory growth versus doing nothing given the app's scale — concluded no fix is needed at this time.
- [x] Reduce `table_*` Props type duplication — every function redeclares the same boilerplate fields (`caller`, `noLog`, `level`, `severity`, `skipCache`). **Decided: no action** at this time. (Separately, explicitly ruled out pursuing global-variable or AsyncLocalStorage-based ambient context for `caller` — discussed and rejected: `caller` is deliberately per-call-site, and a plain global variable is unsafe under concurrent requests.)
- [x] Fix `buildSql_Readable` edge case where a parameter value containing literal `"$N"` text can be mis-substituted during cache-key/log-string construction (cosmetic only — does not affect the real parameterized query sent to Postgres). **Decided: no action** at this time.

## Side note (out of scope for this plan) — reviewed, no action
While reviewing item 7, found that `chess/src/lib/analysis/purgePositions.ts`'s `purgeStaleReachOnePositions` pipeline step runs `table_query({ isupdate: true, ... })` DELETE/UPDATE statements against `teva_evaluations`, `tgam_game_positions`, `tgd_gamesdecon`, and `tpos_positions` with no `cache_clearTable` call afterward — a real instance of the documented "`table_query` with `isupdate: true` doesn't auto-invalidate" gap. **Decided: ignore.** The affected data is analysis-pipeline output, not user-authored data — a user momentarily reading a stale analysis result that clashes with a pipeline addition is marginal and of no real consequence. No follow-up needed in `chess`.

## Changes

### src/tables/tableGeneric/table_fetch.ts
- Moved the `try`/`catch` from the private `table_fetch_query` helper up into the public `table_fetch` function. `table_fetch_query` now re-throws on query failure instead of swallowing it and returning `[]`. `table_fetch`'s `cache_set` call is now only reachable on the success path, so a caught DB error can no longer be written to the cache as a fake empty result. Public contract unchanged — `table_fetch` still never throws to its caller and still returns `[]` on error.

### src/tables/tableGeneric/table_fetch_join.ts
- Same restructuring applied to `table_fetch_join` / `table_fetch_join_query`, for the same reason.

### src/tables/db.ts
- Added a `handlerInitialized` guard at the top of `createDbQueryHandler()` so the handler (and, on the Neon/Vercel branch, the underlying `Pool`) is only built once per warm instance instead of on every `sql()` call. The guard is set synchronously before any `await`, so it's safe even under concurrent `sql()` calls on a cold instance. The local-Postgres branch is unaffected in substance — it already creates and `.end()`s a `Client` per query inside the closure.

### src/tables/cache/userCache_store.ts
- Extended `cache_clearUser`'s header comment to document that its regex only matches equality filters and silently misses a userId inside an `IN (...)` list. Documentation only — no functional change, since the only consumer (`next-bridgeschool`'s `userCache_purge`) always clears one user at a time via equality filters, so the gap doesn't currently apply.

### src/tables/tableGeneric/table_fetch_join.ts
- Extracted the duplicated LEFT JOIN injection logic (previously built once in `table_fetch_join` for the cache key and again in `table_fetch_join_query` for the real query) into a single private `injectJoins` helper called from both places, in the same file.

### src/tables/tableGeneric/table_pages/buildSqlQuery.ts
- Added two new exported helpers here (not in `tableFetchUtils.ts` — see fix below): `applyFetchSuffix` (DISTINCT ON / ORDER BY / LIMIT / OFFSET) and `buildCountQuery` (COUNT-wrapping, including the DISTINCT ON subquery case).

### src/tables/tableGeneric/table_pages/tableFetchUtils.ts
- `table_fetch_pages_filtered` and `table_fetch_pages_total` now call `applyFetchSuffix`/`buildCountQuery` (imported from `buildSqlQuery.ts`) instead of re-deriving the same logic inline.
- **Build-error fix:** the two new helpers were initially added directly in this file, but this file starts with `'use server'`, which makes Next.js treat every top-level exported function as a Server Action — and Server Actions must be `async`. `applyFetchSuffix`/`buildCountQuery` are plain synchronous string helpers, so the build failed ("Server Actions must be async functions"). Moved both into `buildSqlQuery.ts` (same directory, no `'use server'` directive) instead. Verified with `npm run build`, not just `tsc --noEmit`, since this class of error is a Next.js build-time check that plain type-checking doesn't catch.

### src/tables/tableGeneric/table_pages/fetchFiltered.ts
- Now imports and calls `applyFetchSuffix` from `buildSqlQuery` to build its cache-key SQL, instead of re-deriving the DISTINCT/ORDER BY/LIMIT/OFFSET suffix locally. Guarantees the cache key can't silently diverge from the real query built by `table_fetch_pages_filtered`.

### src/tables/tableGeneric/table_pages/fetchTotalPages.ts
- Now imports and calls `buildCountQuery` from `buildSqlQuery` to build its cache-key SQL, instead of re-deriving the COUNT-wrapping logic locally. Same divergence guarantee as above, for `table_fetch_pages_total`.
