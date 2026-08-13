# PLAN_fix-buildsql-readable-quoting — nextjs-shared

## Title
Fix buildSql_Readable — string/null params aren't quoted, so its output isn't valid SQL to copy-paste

## Plan
- [x] Update `src/tables/tableGeneric/buildSql_Readable.ts` so string values are rendered as quoted SQL string literals (embedded single quotes escaped by doubling), null renders as `NULL`, and numbers/booleans render unquoted as today
- [x] Run `npx tsc --noEmit` to verify correctness
- [x] Bump `package.json` version (currently `2.1.64`) before committing, per release rules

## Changes
### src/tables/tableGeneric/buildSql_Readable.ts
- String param values are now rendered as quoted SQL string literals with embedded single quotes escaped by doubling (`'` → `''`); `null` now renders as `NULL` instead of the bare text `null`. Numbers and booleans are unchanged (rendered unquoted via `String(value)`). Fixes the readable SQL text (used on the Owner Cache page and as the `table_query.ts` cache key) being invalid to copy-paste into pgAdmin/psql.

### package.json
- Bumped version `2.1.64` → `2.1.65` so npm doesn't serve a cached copy to consuming projects.

## Testing
- [ ] Open the Owner Cache page (wherever `OwnerTableCache.tsx` is mounted, e.g. `/owner` → Cache tab) and run/trigger a query that has a string parameter (e.g. a `LIKE '%c69%'`-style filter) or a null parameter — confirm the displayed readable SQL now shows the string quoted (`'%c69%'`) and null shown as `NULL`, and that copy-pasting it into pgAdmin/psql runs without a syntax error.
- [ ] Confirmed via `npx tsc --noEmit` — passed with no errors.
- [ ] Note: this changes the cache-key text `table_query.ts` derives from `buildSql_Readable`, so any previously cached entries for queries with string/null params become unreachable once (equivalent to a one-time cache clear for those queries) — no action needed, just expected on first use after deploy.
