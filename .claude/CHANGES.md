# Changes — 2026-06-15

## src/UI/OwnerSyncVersions_actions.ts
- Changed `save-exact=true` → `save-exact=false` in the `.npmrc` written/updated by `action_syncVersions`
- `readPkgFlat` now merges `pkg.overrides` last so the matrix displays the effective pinned version when an override is set
- `action_syncVersions` split into two phases: Phase 1 updates ALL deps to npm latest (including packages with a target — overrides handles the pin); Phase 2 writes targets to the `overrides` block and removes overrides for packages whose target has been cleared

## src/UI/OwnerSyncVersions.tsx
- Updated post-sync instruction from `npm install --force` to full reinstall: `Remove-Item -Recurse -Force node_modules; Remove-Item -Force package-lock.json; npm install`

## CLAUDE.md, CONSUMING_PROJECTS.md
- Updated nextjs-shared reinstall sequence to delete all of `node_modules` and `package-lock.json` before `npm install` rather than `npm update nextjs-shared`
