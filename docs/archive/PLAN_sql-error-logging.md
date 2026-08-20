# PLAN_sql-error-logging — nextjs-shared

## Title
SQL error logging — capture query/params/readable-SQL on failure

## Plan
- [x] Add 3 new nullable columns to `xlg_logging`, appended at the end (plain `ADD COLUMN`, no reorder needed):
  - `lg_sql_raw` (text) — raw query text, as-is, no transform
  - `lg_sql_params` (jsonb) — bound params array, `JSON.stringify`'d after mapping any `undefined` element to the object marker `{ __undefined__: true }` (an object can never collide with a real param value, since every table_ function's params are typed `string | number | boolean | null`) so a real `null` stays distinguishable from a missing/`undefined` value; real nulls stay JSON `null`
  - `lg_sql_readable` (text) — `buildSql_Readable(query, params)` output: placeholders substituted with literal values, human-readable / pgAdmin4-pasteable
  - Rationale for `jsonb` over a native `text[]`: `jsonb` preserves per-element type (`5` vs `"5"` vs `true` vs `null`), which is exactly the diagnostic signal needed for "inconsistent types deduced" style errors; a native array would stringify every element and lose that distinction.
  - **Columns already created by the user via manual `ALTER TABLE` before code execution.**
- [x] Update `scripts/schema.sql` with the 3 new `xlg_logging` columns.
- [x] `write_logging.ts` — add 3 new optional fields to `WriteLoggingProps`: `lg_sql_raw?: string`, `lg_sql_params?: any[]`, `lg_sql_readable?: string`. The undefined-sentinel mapping + `JSON.stringify` happens inside `write_logging.ts` itself. `INSERT` statement adds the 3 new columns, `NULL` when not passed.
- [x] `db.ts`'s `sqlHandler.query` (both the Neon/`VERCEL_PG` branch and the local Postgres branch):
  - The pre-execution `log_query()` call now passes `lg_sql_raw`/`lg_sql_params`/`lg_sql_readable` through the new columns instead of embedding query+values into `lg_msg` text. `lg_msg` shrinks to a short marker (`'DB_SQL'`).
  - The `catch` block writes one `E`-severity row per failure with `lg_sql_raw`/`lg_sql_params`/`lg_sql_readable` populated the same way.
- [x] **Decided: keep all existing per-function `write_logging` calls — no duplicate logging removed.** Every one that has SQL/params in scope now also passes `lg_sql_raw`/`lg_sql_params`/`lg_sql_readable`:
  - `table_query.ts`, `table_fetch.ts`, `table_fetch_join.ts`, `table_write.ts`, `table_upsert.ts` — catch blocks updated
  - `table_update.ts`, `table_delete.ts`, `table_check.ts`, `table_count.ts` — catch blocks updated (some needed `sqlQuery`/`values` hoisted above their `try` so the catch could see them)
  - `table_seq_get.ts`, `table_seq_reset.ts`, `table_duplicate.ts`, `table_copy_data.ts`, `table_drop.ts`, `table_truncate.ts` — success and error logs updated; multi-query functions (`table_seq_get.ts`, `table_copy_data.ts`) track a `lastSql`/`lastValues` pair updated before each query so the catch always reflects the most recent attempt
- [x] `table_write.ts`, `table_upsert.ts`, `table_update.ts`, `table_delete.ts` success trace logs also pass `lg_sql_raw`/`lg_sql_params`/`lg_sql_readable`.
- [x] `buildSql_Readable.ts` — widened its `values` param from `(string | number | null | boolean)[]` to `any[]`, since it's now called with the broader value unions (including `IN`/`NOT IN` array values) used across `table_update`/`table_write`/`table_upsert`/etc.
- [x] Gave the user the manual `ALTER TABLE` SQL for the 3 columns in chat (user ran it independently, ahead of code execution, using the final column names).
- [x] Updated `CONSUMING_PROJECTS.md` — documented the 3 new optional `write_logging` fields and the `OwnerTableLogging` filter/detail additions.
- [x] **Added mid-execution:** `OwnerTableLogging.tsx` (the Owner page's logging viewer) — show and filter on the new columns:
  - New "SQL" and "Params" grid columns (truncated, same truncate length as the existing Message column) with their own filter inputs in the header filter row
  - `lg_sql_raw` filters with a plain `LIKE`; `lg_sql_params` (jsonb) filters via `lg_sql_params::text` cast so `LIKE` can search inside it — decided in chat as the way to make a jsonb column filterable through the existing generic `Filter`/`buildSqlQuery` mechanism, which just interpolates the `column` string as-is
  - Detail popup expanded to show full `lg_sql_raw`, pretty-printed `lg_sql_params`, and `lg_sql_readable`
- [x] **Added during testing (user testing in this project's own `/owner` UI), superseding the "widen columns" idea:** replace the separate "SQL" + "Params" columns/filters in `OwnerTableLogging.tsx` with:
  - Message column narrowed from `w-96` to `w-64` (own column/filter unchanged otherwise)
  - One new `w-96` "SQL" column with a 3-way toggle in its header (`Raw | Readable | Params`, local state `sqlView: 'raw' | 'readable' | 'params'`, default `'raw'`) controlling both which of `lg_sql_raw`/`lg_sql_readable`/`lg_sql_params` is displayed (truncated) for every row, and which one the column's single filter box searches (`Params` via `lg_sql_params::text` cast, the other two via plain `LIKE`)
- [x] **Added during testing:** `action_generateLogs` now populates `lg_sql_raw`/`lg_sql_params`/`lg_sql_readable` on several sample entries, including a new entry that replicates the original "inconsistent types deduced for parameter $2" bug (with an actual `undefined` param, to exercise the `{ __undefined__: true }` marker end-to-end).
- [x] **Added during testing:** `OwnerTableLogging.tsx` shows `'—'` for empty/null values (the SQL toggle column via `truncateDisplay`, and `lg_table`/`lg_caller` in the popup) — change to show nothing (empty string) instead, applied consistently across the whole component.

## Changes
### src/tables/structures.ts
- Added `lg_sql_raw`, `lg_sql_params`, `lg_sql_readable` to `table_Logging` (row shape) and `WriteLoggingProps` (all optional on the write side).

### src/tables/tableGeneric/write_logging.ts
- Accepts the 3 new optional fields. Maps any `undefined` element in `lg_sql_params` to `{ __undefined__: true }` before `JSON.stringify`, so a real `null` stays distinguishable from a missing value. `INSERT` now writes 11 columns instead of 8.

### src/tables/tableGeneric/buildSql_Readable.ts
- Widened `values` param type to `any[]` — it's now called from functions whose params can include `IN`/`NOT IN` array values, which the old narrower union rejected.

### src/tables/db.ts
- Imports `buildSql_Readable`. `log_query()` (the pre-execution info log) now populates `lg_sql_raw`/`lg_sql_params`/`lg_sql_readable` instead of embedding query+values into `lg_msg` text. Both `sqlHandler.query` catch blocks (Neon + local Postgres) now populate the same 3 fields on the single error row they already wrote — this is the one place with `query`/`params` in scope for every table_ function call, so every failure now carries full SQL diagnostics regardless of which table_ function triggered it.

### src/tables/tableGeneric/table_query.ts, table_fetch.ts, table_fetch_join.ts, table_write.ts, table_upsert.ts, table_update.ts, table_delete.ts, table_check.ts, table_count.ts, table_seq_get.ts, table_seq_reset.ts, table_duplicate.ts, table_copy_data.ts, table_drop.ts, table_truncate.ts
- Every `write_logging` call that has a SQL query in scope (success trace logs and error logs alike) now also passes `lg_sql_raw`/`lg_sql_params`/`lg_sql_readable`. Several functions needed their `sqlQuery`/`values` (or equivalent) hoisted from inside the `try` block to above it so the `catch` block could still reference them; multi-query functions track a running `lastSql`/`lastValues` pair so their catch block reflects whichever query was actually in flight when the failure happened.

### scripts/schema.sql
- Added `lg_sql_raw text`, `lg_sql_params jsonb`, `lg_sql_readable text` to the `xlg_logging` table definition.

### src/UI/OwnerTableLogging.tsx
- Added `sql_raw`/`sql_params` filter state, filter-changed tracking, and `Filter[]` entries (`lg_sql_raw` via `LIKE`, `lg_sql_params::text` via `LIKE` since the column is jsonb). Added "SQL" and "Params" grid columns (truncated) with their own filter inputs, and expanded the row detail popup to show the full raw SQL, pretty-printed params, and the readable/pgAdmin4-pasteable SQL.

### CONSUMING_PROJECTS.md
- Documented the 3 new optional `write_logging` fields and that `table_` functions populate them automatically. Updated the `OwnerTableLogging` description to mention the new SQL/params filters and detail fields.

### src/UI/OwnerTableLogging.tsx (testing-phase revision)
- Replaced the separate "SQL" + "Params" columns/filters with one `w-96` "SQL" column carrying a 3-way header toggle (`Raw | Readable | Params`, state `sqlView`) that controls both the displayed field and which single filter box (`sqlfilter`) searches. Message column narrowed `w-96` → `w-64`. `colSpan` for the empty-state row updated from 11 to 10.

### src/UI/OwnerTableLogging.tsx (testing-phase revision 2)
- Replaced the `'—'` placeholder for empty/null values with an empty string, in `truncateDisplay` (SQL toggle column) and for `lg_table`/`lg_caller` in the detail popup.

### src/app/actions.ts
- `action_generateLogs`'s `entries` type gained optional `sql`/`params`/`readable` fields, threaded through to `write_logging`'s `lg_sql_raw`/`lg_sql_params`/`lg_sql_readable`. Added sample SQL/params/readable values to 4 existing/new entries, including a new entry reproducing the original "inconsistent types deduced for parameter $2" bug with a real `undefined` param. Also trimmed the redundant "SQL(...) params([...])" text that had been hand-embedded in the debug-trace entry's message, since that data now lives in the new structured fields — a small cleanup beyond what was strictly asked, noted here for visibility.

## Testing
- [ ] Run this SQL manually via pgAdmin4 if not already applied (per the user's message, it already has been):
  ```sql
  ALTER TABLE public.xlg_logging
    ADD COLUMN lg_sql_raw text,
    ADD COLUMN lg_sql_params jsonb,
    ADD COLUMN lg_sql_readable text;
  ```
- [ ] Trigger a genuine SQL failure (e.g. call `table_query` with a query that references a mismatched parameter type, similar to the original "inconsistent types deduced for parameter $2" case) and confirm the resulting `xlg_logging` row has `lg_sql_raw` (the exact query text), `lg_sql_params` (a JSON array of the bound values, correctly typed), and `lg_sql_readable` (the same query with values substituted inline) all populated — not just a bare `lg_msg`.
- [ ] Confirm a successful write (e.g. via `table_write` or `table_update`) also produces a log row with `lg_sql_raw`/`lg_sql_params`/`lg_sql_readable` populated, not just error rows.
- [ ] On the Owner page's Logging tab, click "Generate Logs" (Generate Data tab) and confirm it succeeds, then go to the Logging tab and confirm the new sample rows appear (including the `upgradePositionEvaluation_gev_upsert` / "inconsistent types deduced" row).
- [ ] On the SQL column header, click each of `Raw`/`Readable`/`Params` and confirm the grid column's content switches accordingly for every row, and that the selected button is visually highlighted.
- [ ] For the `upgradePositionEvaluation_gev_upsert` row specifically, switch to `Params` view and confirm the second array element renders as the `{"__undefined__":true}` marker rather than `null`, while the 4th element renders as `null` — i.e. the two are visibly distinguishable.
- [ ] Type into the SQL column's filter box under each of the 3 toggle states and confirm it narrows results correctly each time (including under `Params`, which filters via the `lg_sql_params::text` cast).
- [ ] Confirm the Message column is visibly narrower than before and the new SQL column is wide, and that long values in either truncate with an ellipsis rather than overflowing.
- [ ] Click a row with `lg_sql_raw` populated and confirm the detail popup shows the full raw SQL, pretty-printed params, and readable SQL sections.
- [ ] Confirm a `write_logging` call with no SQL context (e.g. from outside a table_ function) still inserts cleanly with `lg_sql_raw`/`lg_sql_params`/`lg_sql_readable` all `NULL`, and that the Logging table renders those cells as empty rather than erroring.
- [ ] Confirm via `npx tsc --noEmit` that the whole package still type-checks (already run clean during this execution — re-run after pulling into a consuming project to be sure nothing else regressed).
