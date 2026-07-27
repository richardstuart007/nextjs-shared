# PLAN_remove-markdown-lite — nextjs-shared

## Title
Remove the markdown-lite / flow-diagram feature entirely

## Plan
- [x] Delete `src/lib/parseMarkdownLite.ts` and `src/components/MarkdownLiteView.tsx`.
- [x] Delete `src/app/owner/dataflow/page.tsx` (nextjs-shared's own dev-app demo page — the last
      remaining consumer of these exports) and this repo's own `docs/Dataflow.md`.
- [x] Remove the `/owner/dataflow` entry from the `extraLinks` array in `src/app/layout.tsx`.
- [x] Remove the `./MarkdownLiteView` and `./parseMarkdownLite` entries from `package.json`'s
      `exports` map.
- [x] Remove the `### MarkdownLiteView / parseMarkdownLite` section from `CONSUMING_PROJECTS.md`,
      and drop the `/owner/dataflow` line from its `extraLinks` usage example.
- [x] Confirm via `npx tsc --noEmit` that nothing else in nextjs-shared references the removed
      files.
- [x] Bump `package.json` version per nextjs-shared release rules.

## Changes
### src/lib/parseMarkdownLite.ts, src/components/MarkdownLiteView.tsx
- Deleted — the entire markdown-lite parser/renderer pair, including the legacy and grid-mode
  `flow`-diagram code. No consuming project (chess, next-bridge, infostore, next-bridgeschool,
  next-dbadmin, richard-dashboard) imports either export anymore — verified by grepping every
  project's `src/` before deleting. Chess and next-bridge had already migrated their own
  `/owner/dataflow` pages off this to a hand-written TSX approach.

### src/app/owner/dataflow/page.tsx, docs/Dataflow.md
- Deleted — nextjs-shared's own dev-app demo page and the doc it rendered, the last remaining
  consumer of the removed exports anywhere in the repo (including this package itself).
- Removed the now-empty `src/app/owner/dataflow/` directory.

### src/app/layout.tsx
- Removed the `{ href: '/owner/dataflow', label: 'Dataflow' }` entry from `DevLayoutHeader`'s
  `extraLinks` array — the route no longer exists.

### package.json
- Removed the `./MarkdownLiteView` and `./parseMarkdownLite` entries from the `exports` map — no
  longer resolvable as package subpaths.
- Bumped version `2.1.40` → `2.1.41` per the nextjs-shared release rules (prevents npm serving a
  cached copy to consuming projects).

### CONSUMING_PROJECTS.md
- Removed the entire `### MarkdownLiteView / parseMarkdownLite` documentation section (usage
  example, the `` ```flow `` diagram syntax reference, and the list of exported types/functions).
- Updated the `DevLayoutHeader`'s `extraLinks` prop example to drop the `/owner/dataflow` entry,
  replacing it with the still-real `/owner/components` example.

## Testing
- [ ] Confirmed via `npx tsc --noEmit` (clean) and `npm run build` (succeeds; route table no
      longer lists `/owner/dataflow`) — no user-facing page exists to click through since the
      feature and its demo page are both gone.
- [ ] After pulling this version in any consuming project, confirm `npm install` /
      `npx tsc --noEmit` / `npm run build` all still succeed (none of the six currently import the
      removed exports, so this should be a no-op for all of them).
