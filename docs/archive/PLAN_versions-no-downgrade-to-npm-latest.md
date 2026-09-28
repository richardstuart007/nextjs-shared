# PLAN_versions-no-downgrade-to-npm-latest — nextjs-shared

## Title
Versions tab — stop Sync offering (and doing) a downgrade to npm latest when a project is ahead

## Background
With no Dep/Override target set, the Versions tab uses npm's `latest` dist-tag as the reference
(`OwnerSyncVersions.tsx:312`). next-auth v5 is only published under the `beta` tag, so npm latest is
`4.24.15`, while next-bridgeschool declares `5.0.0-beta.32`. Any mismatch counts as "would change"
(`OwnerSyncVersions.tsx:337`), so the row shows a red "major" Sync button, and clicking it would
write `4.24.15` into next-bridgeschool's `package.json` (`OwnerSyncVersions_actions.ts:384-388`,
Phase 1) — a v5 → v4 downgrade.

## Decisions (agreed 2026-09-28)
- **D1 — version comparison:** adopt the `semver` npm package (+ `@types/semver`), as exact-pinned
  devDependencies (the Versions tab is only used by this repo's dev app, not exported). Existing
  `semverCompare`/`versionDiff` left unchanged (not in scope).
- **D2 — "ahead" cell:** no Sync button, plus a distinct marker — teal text + tooltip.
- **D3 — explicit Dep/Override targets:** unchanged — an explicit pin may still downgrade. Only the
  npm-latest fallback gets the guard.

## Plan
- [x] Agree D1, D2, D3
- [x] Install `semver` + `@types/semver` (exact-pinned devDependencies)
- [x] Shared helper `isAheadOfLatest` in a new `src/UI/OwnerSyncVersions_semver.ts`, used by both the
      action and the UI (one piece of logic, not two copies)
- [x] `OwnerSyncVersions_actions.ts` Phase 1 (npm-latest fallback): skip a dep when its current
      declared version is newer than npm latest; don't record a change for it
- [x] `OwnerSyncVersions.tsx` row scan: when the reference is npm latest (no Dep/Override target),
      a project cell ahead of it counts toward neither `syncWouldChange` nor `worstDiff`
- [x] `OwnerSyncVersions.tsx` cell display per D2
- [x] Update help texts (`HELP_LATEST`, `HELP_DEP`, `HELP_SYNC_ROW`, `HELP_SYNC_ALL`)
- [x] Change-history / header notes
- [x] `npx tsc --noEmit`

## Changes
### package.json / package-lock.json
- Added `semver` 7.8.5 and `@types/semver` 7.8.0 to devDependencies (exact-pinned, via
  `npm install --save-dev --save-exact`)

### src/UI/OwnerSyncVersions_semver.ts (new)
- `isAheadOfLatest(spec, latest)` — `semver.minVersion(spec) > latest`, prerelease-aware; returns
  false for anything unparseable (`'?'` failed lookup, `github:` URL specs). Sanity-checked via
  `npx tsx`: `5.0.0-beta.32` vs `4.24.15` → true; vs `5.0.0` → false; vs `5.0.0-beta.4` → true;
  `^1.2.3` vs `1.2.3` → false

### src/UI/OwnerSyncVersions_actions.ts
- Phase 1 of `action_syncVersions` skips a dep that is ahead of npm latest; Phase 2a/2b (explicit
  targets) unchanged, so a Dep target still pins even if it is a downgrade
- `action_syncVersions` header notes the never-downgrade rule

### src/UI/OwnerSyncVersions.tsx
- New `referenceIsLatest` flag per row; ahead-of-latest cells skipped in the row scan, so no Sync
  button / severity colour for them
- Ahead cells rendered with new `AHEAD_OF_LATEST_CLASS` (`text-teal-600 font-semibold`) and
  `AHEAD_OF_LATEST_TITLE` tooltip
- Help texts updated for Latest, Dep, row Sync, Sync All
- `3) CHANGE HISTORY` entry added to the main header

### package.json (via the Versions tab Sync All, after the fix)
- Dependency sync to npm latest: `@types/node` 25.9.3 → 26.6.3, `@types/react` 19.2.18 → 19.3.0,
  `react`/`react-dom` 19.2.8 → 19.3.0 (devDependencies and `peerDependencies.react`), `tsx`
  4.23.13 → 4.23.15. Clean `#reinstall` + `tsc` + build all pass against the new versions

### src/UI/sync-targets.json
- Removed the stale `next-auth: 5.0.0-beta.31` Dep pin (no longer needed — Sync now leaves a
  project ahead of npm latest alone)
- Added Dep holds `typescript: 6.0.3` (TS 7 is the new Go-based compiler — wait for Next.js
  support) and `stockfish: 18.0.8` (engine v19 would change evals vs. stored ones)

### Not changed (noted)
- The override-removal "restored to dependencies at <latest>" path (`action_syncVersions`, stale
  override cleanup) still restores to npm latest without the ahead check — only reached when an
  Override target is removed, not part of this issue

## Testing
- [ ] Open the Versions tab on /owner with the next-auth Dep box blank: next-bridgeschool's
      `5.0.0-beta.32` cell shows in teal, hovering shows the "Ahead of npm latest" tooltip, and the
      row has no Sync button
- [ ] Click Sync All: next-bridgeschool's `package.json` still has `"next-auth": "5.0.0-beta.32"`
      and the Sync results show no next-auth change
- [ ] Type `5.0.0-beta.32` in the next-auth Dep box and tab out: cell turns green (aligned), still no
      Sync button
- [ ] Type `5.0.0-beta.31` in the Dep box: the Sync button reappears (an explicit pin may still
      downgrade), then set it back to `5.0.0-beta.32` (or blank) without syncing
- [ ] Check other rows look unchanged: behind cells still red/orange/yellow with a Sync button
