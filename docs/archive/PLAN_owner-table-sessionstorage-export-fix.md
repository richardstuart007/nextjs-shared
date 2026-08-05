# PLAN_owner-table-sessionstorage-export-fix — nextjs-shared

## Title
Fix missing `./OwnerTableSessionStorage` entry in package.json exports map

## Plan
- [x] `package.json`: add `"./OwnerTableSessionStorage": "./src/UI/OwnerTableSessionStorage.tsx"`
      to the `exports` map, alongside the existing `./OwnerTableCache`/`./OwnerTableLogging`
      entries. Discovered while rolling the Session Storage tab out to consuming projects
      (infostore, next-bridge, next-bridgeschool, chess) — `npx tsc --noEmit` failed in all four
      with `Cannot find module 'nextjs-shared/OwnerTableSessionStorage'`, even though the
      component file (`src/UI/OwnerTableSessionStorage.tsx`) and its documentation in
      `CONSUMING_PROJECTS.md` have existed since commit `290f595`. That commit added the file and
      wired it into nextjs-shared's own `/owner` page, but never added the corresponding
      `exports` entry — an oversight, not an intentional omission.
- [x] Bump patch version in `package.json` per release rules (2.1.59 → 2.1.60).
- [x] Run:
      npx tsc --noEmit

## Changes

### package.json
- Added missing `"./OwnerTableSessionStorage": "./src/UI/OwnerTableSessionStorage.tsx"` exports
  entry. Bumped version 2.1.59 → 2.1.60.
