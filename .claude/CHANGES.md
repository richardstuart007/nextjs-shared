# Changes — nextjs-shared, "version": "2.1.2"

## package.json
- Moved `@heroicons/react` from `peerDependencies` to `dependencies` — nextjs-shared uses it internally; declaring as peer caused npm v7+ peer dep conflicts in consuming projects
- Removed `@heroicons/react` from `devDependencies` (now in `dependencies`, no need for both)
- Removed `@neondatabase/serverless` from `peerDependencies` — already in `dependencies`, the peer dep entry was redundant
- Removed `@types/pg` from `peerDependencies` — type packages don't belong in `peerDependencies`
- `peerDependencies` now correctly contains only `next` and `react` (packages every consuming app must provide)
- Updated `description` to accurately reflect the full scope of the package
- Added `"private": true` to prevent accidental `npm publish`
- Reordered sections to conventional order: name/version/description/private → scripts → dependencies → devDependencies → peerDependencies → overrides → exports; added blank lines between sections

## src/UI/OwnerSyncVersions_actions.ts
- Added `SectionMatrix` type
- Added `action_readSections()` — returns per-project, per-package section code(s): `d` dependencies, `v` devDependencies, `p` peerDependencies, `o` overrides; concatenated when a package appears in multiple sections

## src/UI/OwnerSyncVersions.tsx
- Added `sections` state and fetch via `action_readSections()` on load and after sync
- Each project cell now shows a small grey section indicator after the version (e.g. `19.2.7 d`, `19.2.7 vp`, `8.5.10 o`)
- Rows are now grouped by dominant section (d→v→p→o) with a grey header row between groups; within each group packages are sorted alphabetically
- Extracted load logic from useEffect into component-level handleRefresh() with refreshing state
- Added Refresh button (blue, left) that calls handleRefresh(); disabled while refreshing
- Moved Sync All to the right of Refresh; styled red via overrideClass='bg-red-600 hover:bg-red-700'
- Added parseErrors state; projects with invalid package.json now show as a column with red header and ' !' suffix instead of being silently hidden
