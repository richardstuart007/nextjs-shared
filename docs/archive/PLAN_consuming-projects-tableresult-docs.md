## Title
Document remaining table_ functions' TableResult<T> contract in CONSUMING_PROJECTS.md

## Plan
- [x] Audit CONSUMING_PROJECTS.md section 5 against actual tableGeneric/ source to find which
      functions' TableResult<T> return-shape change (from the multi-database-routing work) were
      never documented with a full example
- [x] Add a `table_fetch_join` section (after `table_fetch`)
- [x] Add a `table_upsert` section (after `table_write`)
- [x] Add a combined `table_seqGet` / `table_seqReset` section (after `table_count`)
- [x] Add a combined `table_drop` / `table_truncate` / `table_duplicate` / `table_copy_data`
      section (after the above, before `table_query`)

## Changes
### CONSUMING_PROJECTS.md
- Added dedicated `### table_fetch_join`, `### table_upsert`, `### table_seqGet` / `table_seqReset`,
  and `### table_drop` / `table_truncate` / `table_duplicate` / `table_copy_data` sections to
  section 5 ("Generic Table Operations"), each with a usage example showing the `TableResult<T>`
  (`{ ok, data, error }`) contract — verified against each function's current source signature.
  These 8 functions previously had no dedicated example (or, for `table_seqGet`/`table_seqReset`/
  `table_drop`, no mention at all), even though the intro paragraph's "applies to every function in
  this section" already covered them by inference.

## Testing
- [x] Cross-checked every new section's signature/behavior against the actual source file
      (`table_fetch_join.ts`, `table_upsert.ts`, `table_seq_get.ts`, `table_seq_reset.ts`,
      `table_drop.ts`, `table_truncate.ts`, `table_duplicate.ts`, `table_copy_data.ts`)
- [ ] User review of the new doc sections for accuracy/tone
