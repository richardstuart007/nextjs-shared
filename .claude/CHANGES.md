# Changes — nextjs-shared, "version": "2.1.7"

## src/tables/tableGeneric/table_seq_get.ts
- Fixed empty-table bug: `COALESCE(MAX(...), 1)` → `COALESCE(MAX(...), 0)` so maxValue=0 for empty tables instead of 1

## src/tables/tableGeneric/table_seq_reset.ts
- Fixed empty-table bug: `setval($1, $2)` → `setval($1, GREATEST($2::bigint, 1), $2::bigint > 0)` so empty tables (maxValue=0) get next ID=1 instead of 2

## src/tables/tableGeneric/table_write.ts
- Added optional `conflictColumn?: string` parameter
- When provided, appends `ON CONFLICT (column) DO NOTHING` to the INSERT — silent skip on duplicate, no error

## src/chess/sync.ts
- Removed `gameExists` function — existence check replaced by DB-level conflict handling
- Removed sequence reset (`setval`) from `full_replace` path — Postgres owns the SERIAL value
- Changed `insertRawGame` to use `table_write` with `conflictColumn: 'gr_chesscom_uuid'`
- `insertRawGame` now returns `boolean` — true if inserted, false if skipped (conflict)
- Simplified `syncArchive` loop — no separate existence check, no inner try/catch

## .claude/CLAUDE.md (all projects + global)
- Added "Silent file updates — never ask permission" section to global ~/.claude/CLAUDE.md (after trigger section, high visibility)
- Appended same section to all 9 project .claude/CLAUDE.md files: nextjs-shared, nextjs-chess, next-chess-analysis, next-dbadmin, next-bridge, next-bridgeschool, infostore, learning-claude-api, richard-dashboard
