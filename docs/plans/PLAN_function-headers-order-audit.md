# PLAN_function-headers-order-audit — nextjs-shared

## Title
Run the function-headers and function-order code audit on nextjs-shared

## Plan
Scope: every .ts/.tsx file under src/ (89 files). Audit done with scratch scripts (function
declaration list, header-presence/Params check, first-use ordering check), then fixes applied one
at a time with `npx tsc --noEmit` after each. Both passes were run per file rather than as two
full sweeps, since the survey showed the project was already mostly compliant.
- [x] Survey: list every `const` arrow named function and every out-of-order function across src/ (result: zero const-arrow named functions; 8 files with an ordering question; ~10 helpers missing headers)
- [x] function-order pass: src/components/
- [x] function-order pass: src/UI/
- [x] function-order pass: src/app/ (nothing to change)
- [x] function-order pass: src/tables/ and src/constants.ts (nothing changed — flagged, see Changes)
- [x] function-headers pass: src/components/
- [x] function-headers pass: src/UI/
- [x] function-headers pass: src/app/ (nothing to change)
- [x] function-headers pass: src/tables/ and src/constants.ts
- [x] Final npx tsc --noEmit

## Changes
### src/UI/OwnerSyncVersions.tsx
- Reordered nested handlers to first-use order: handleTargetBlur now sits before handleSyncPackage
- Moved module-level versionDiff to after extractBaseVersion (first-use order: semverCompare, extractBaseVersion, versionDiff)

### src/components/MyInputNumeric.tsx
- Reordered helpers to first-use order: formatValue, handleChange, sanitizeRaw (callee directly after its caller), handleKeyDown, handleFocus, handleBlur

### src/components/MyMergeClasses.ts
- Moved the TEXT_SIZES const above isTextSizeClass's header (it had been wedged between the header and the function)
- Reordered guard helpers caller-then-callee: sameTextType, isTextSizeClass, sameBorderType, isBorderColorClass

### src/UI/OwnerComponentTest.tsx
- Reordered demo tab components to match their order of use in OwnerComponentTest: MySelectMultiTab and MySelectRowsTab now follow MySelectTableTab; MyToggleTab now precedes MyLoadingMessageTab

### Headers added / fixed
- src/components/MyCheckbox.tsx — sortFn: unbordered comment replaced with a full bordered header
- src/components/MyHelp.tsx, MyHelpStep.tsx, MySelectMulti.tsx — onClickOutside: added header
- src/components/MySelectTable.tsx — determineRows: unbordered comment reformatted to a bordered header with Returns
- src/components/MyPagination.tsx — handleClick: added header
- src/tables/cache/userCache_store.ts — cache_getEntriesInfo: header moved from above the two exported types to directly above the function

### Border-length normalisation (101 lines across 11 files)
- Helper-header dash borders normalised to the convention: 82 dashes for top-level, 94 for indented (was 69/73/94 at top level in several files, 92 in two indented spots). Border lines only; no text changed.
- Files: OwnerConstants, OwnerTableCache, OwnerTableLogging, OwnerComponentTest, MyMergeClasses, MyPagination, userCache_store, db, table_copy_data, buildSqlQuery, tableFetchUtils

### Flagged, not changed (ambiguous or multi-export — per skill, never guessed)
- src/UI/OwnerSyncVersions_actions.ts, src/tables/cache/userCache_store.ts, src/tables/db.ts — multi-export modules (no single main) with private helpers declared partly above and partly below the exports, e.g. discoverProjects/readPkgFlat, normalizeSql/extractTables above but getDataInfo below, log_query last though used early. No single "main" to order under, so left as-is.
- src/components/MyMergeClasses.ts — getCoreClass is called by both inAnyGroup and mergeGroup (and getVariantPrefix by mergeGroup); left in current order, not guessed.
- src/UI/OwnerComponentTest.tsx — shared demo helpers (ThreeSection, ControlRow, parseRestProps, ClassInfo, ReturnRow, parseLabelValueOptions, parseHelpItems, parseNumberList) are declared above the tabs that use them. Each is used by many tabs (the ambiguous multi-caller case), and they sit under a "Layout helpers" section comment with their Props types interleaved, so moving them would split that grouping. Left as-is; say if you want them moved below the tabs.
- Multi-export files (no numbered main header): OwnerSyncVersions_actions, app/actions, isSelectionFiltering, useBackNav, cache_actions, userCache_store, buildSqlQuery, tableFetchUtils — kept their plain per-function headers.

## Testing
- [ ] Confirmed via `npx tsc --noEmit` after every individual change and once at the end — no type errors
- [ ] Run `npm run build` (comment/ordering-only change, but confirms nothing was disturbed)
- [ ] Open /owner → Components tab and step through the tabs (especially MySelectMulti, MySelectRows, Toggle, LoadingMessage, InputNumeric) — each renders as before
- [ ] Open /owner → Versions tab (OwnerSyncVersions) — loads, per-row Sync and target-version blur still work
- [ ] Review git diff for OwnerComponentTest.tsx and OwnerSyncVersions.tsx — only function blocks moved, nothing edited
