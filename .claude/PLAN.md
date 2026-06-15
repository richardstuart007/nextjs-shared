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
- [ ] Commit and push nextjs-shared

### Steps — consuming projects (after push)

Sequence per project: (1) global search/replace `write_Logging` → `write_logging` in all `.ts` files, (2) `npm install --force` to import the updated package, (3) `npx tsc --noEmit` to verify.
Projects with 0 occurrences skip the search/replace step.

- [ ] `next-bridgeschool` (27 occurrences) — search/replace → import → tsc
- [ ] `next-bridge` (19 occurrences) — search/replace → import → tsc
- [ ] `infostore` (4 occurrences) — search/replace → import → tsc
- [ ] `next-chess-analysis` (1 occurrence) — search/replace → import → tsc
- [ ] `nextjs-chess` (0 occurrences) — import → tsc
- [ ] `next-dbadmin` (0 occurrences) — import → tsc
- [ ] `richard-dashboard` (0 occurrences) — import → tsc
