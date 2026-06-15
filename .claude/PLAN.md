# Plan — nextjs-shared

## Current task: Rename write_Logging → write_logging (lowercase)

**Why:** Build error `Module not found: Can't resolve '../tableGeneric/write_logging'` — Turbopack resolves case-sensitively. `package.json` exports already use lowercase `write_logging` but the file on disk was named `write_Logging.ts`. Fix also renames the exported function to match the `table_*` lowercase convention.

**Import pattern for consuming projects (path already correct — name only changes):**
```ts
import { write_Logging } from 'nextjs-shared/write_logging'   // before
import { write_logging } from 'nextjs-shared/write_logging'   // after
// Call sites: write_Logging({...}) → write_logging({...})
```

### Steps — nextjs-shared
- [x] Rename file on disk: `src/tables/tableGeneric/write_Logging.ts` → `write_logging.ts`
- [x] Rename exported function `write_Logging` → `write_logging` inside the file
- [x] Update all internal imports and call sites (20 files)
- [x] Run `npx tsc --noEmit` — clean
- [x] Test: run `npm run locallocal`, generate logs + cache, verify `/owner` tab works end-to-end
- [x] Bump version in `package.json` → 2.0.2
- [x] Commit and push nextjs-shared (v2.0.2, commit e2bfd2b)

### Steps — consuming projects (after push)

Sequence per project:
1. Update `.claude/PLAN.md` — add task for this rename
2. Search/replace `write_Logging` → `write_logging` in all `.ts` files (skip for projects with 0 occurrences)
3. Update `.claude/CHANGES.md` — record files changed
4. `Remove-Item -Recurse -Force node_modules`
5. `Remove-Item -Force package-lock.json`
6. `npm install`
7. `Remove-Item -Recurse -Force .next`
8. `npx tsc --noEmit`
9. `npm run build`
10. Commit all (code + PLAN.md + CHANGES.md + package-lock.json)
11. Clear CHANGES.md

- [x] infostore (4 occurrences) — committed 2026-06-15
- [x] next-bridgeschool (27 occurrences) — committed 2026-06-15
- [x] next-bridge (19 occurrences) — committed 2026-06-15
- [x] next-chess-analysis (1 occurrence) — committed 2026-06-15
- [ ] nextjs-chess (0 occurrences — skip step 2)
- [ ] next-dbadmin (0 occurrences — skip step 2)
- [ ] richard-dashboard (0 occurrences — skip step 2)
