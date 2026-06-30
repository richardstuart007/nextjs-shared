# Changes — nextjs-shared, "version": "2.1.8"

## src/tables/tableGeneric/table_truncate.ts
- Added `restartIdentity` param (default `true`) that conditionally appends `RESTART IDENTITY` to the TRUNCATE SQL
