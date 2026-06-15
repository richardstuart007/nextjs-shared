# Changes — 2026-06-15

## src/tables/tableGeneric/write_Logging.ts → write_logging.ts
- Renamed file on disk (two-step via temp name on Windows — git already had it indexed as lowercase)
- Renamed exported function `write_Logging` → `write_logging` to match lowercase `table_*` convention
- Updated internal `functionName` string constant from `'write_Logging'` to `'write_logging'`

## src/tables/db.ts
- Updated import name and all call sites: `write_Logging` → `write_logging`
- Updated guard string `'write_Logging'` → `'write_logging'` (used to skip recursive logging)

## src/app/actions.ts
- Updated import name and call site

## src/tables/cache/cache_actions.ts
- Updated import name and call site

## src/tables/cache/userCache_store.ts
- Updated import name and all call sites (multiple)

## src/tables/tableGeneric/table_check.ts, table_copy_data.ts, table_count.ts, table_delete.ts, table_drop.ts, table_duplicate.ts, table_fetch.ts, table_fetch_join.ts, table_query.ts, table_seq_get.ts, table_seq_reset.ts, table_truncate.ts, table_update.ts, table_upsert.ts, table_write.ts
- Updated import name and call sites in all 15 files

## src/tables/tableGeneric/table_pages/tableFetchUtils.ts
- Updated import name and call sites

## package.json
- Bumped version 2.0.1 → 2.0.2 (required before commit per release rules)
