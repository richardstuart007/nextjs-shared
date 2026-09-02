# PLAN_versions-per-row-sync — nextjs-shared

## Title
Add per-row Sync button to OwnerSyncVersions to sync a single package across all projects

## Plan
- [x] `OwnerSyncVersions_actions.ts` — add optional `packageName?: string` param to `action_syncVersions`:
  - Phase 1 (bump deps/devDeps/peerDeps to npm latest): `if (packageName && dep !== packageName) continue`
  - Phase 2a (dep targets loop): `if (packageName && dep !== packageName) continue`
  - Phase 2b (override targets loop): `if (packageName && dep !== packageName) continue`
  - Stale-override cleanup loop: guarded with `if (packageName && dep !== packageName) continue` (see Changes for why this differs from the `if (!packageName)` wrapper the plan first proposed)
  - Update the function header comment (Params/behavior) to document the new arg
- [x] `OwnerSyncVersions.tsx` — add `handleSyncPackage(pkg: string)` helper: mirrors `handleSync` (sets syncing state, calls `action_syncVersions(pkg)`, re-runs the same post-sync refresh sequence), declared below `handleSync`
- [x] `OwnerSyncVersions.tsx` — add a per-row neutral-styled `MyButton` that calls `handleSyncPackage(pkg)`:
  - New narrow trailing column (after the last project column) with a matching `<th>` in both header rows and a `<td>` per data row
  - Button disabled while `syncing`
  - Global Sync button unchanged (still calls `action_syncVersions()` with no arg)
- [x] Grep for other callers of `action_syncVersions` (e.g. `scripts/sync-versions.ts`) and confirm the added optional param doesn't break fixed-arity call sites — `scripts/sync-versions.ts:4` calls `action_syncVersions()` with no arg; optional param is fully backward-compatible
- [x] `npx tsc --noEmit` passes
- [x] `OwnerSyncVersions.tsx` — add `title=` help text (+ `cursor-help`) to the Latest / Installed / Dep / Override `<th>` cells in the first header row:
  - Latest — `Newest version published to the npm registry right now (live lookup; for nextjs-shared, the local source version minus one patch = last published release). Independent of your projects — a project column only shows this value after a Sync brings it up to date, so rows normally sit behind it.`
  - Installed — `The version actually resolved into node_modules (the highest across all project columns). Project cells show the declared package.json spec instead, so they only match this where the project exact-pins and has been npm install-ed; ranges (^, ~) and stale installs make them differ.`
  - Dep — `Optional pin: the version to set for this package in its dependencies / devDependencies / peerDependencies section on Sync. Blank = Sync uses npm latest.`
  - Override — `Optional pin: the version to force via the package.json "overrides" block on Sync. Blank = no override.`
- [x] `npx tsc --noEmit` passes (after help-text change)
- [x] `OwnerSyncVersions.tsx` — replace the hover `title=` help on the Latest / Installed / Dep / Override `<th>` cells with a click-based `?` popover using the shared `nextjs-shared/MyHelp` component:
  - Removed `title=` and `cursor-help` from those four `<th>` cells (reverted the previous run's tooltip change)
  - Imported `MyHelp` from `../components/MyHelp`
  - Each heading now renders `<label> <MyHelp text={HELP_*} buttonClass={HELP_BUTTON_CLASS} />` inside an `inline-flex items-center gap-1` wrapper; help strings hoisted to module consts `HELP_LATEST` / `HELP_INSTALLED` / `HELP_DEP` / `HELP_OVERRIDE`
  - `HELP_BUTTON_CLASS` module const — compact `text-xxs` `?` trigger to fit the header row
  - Latest / Installed heading widths bumped `w-20` → `w-24` so the label + `?` don't crowd
- [x] `OwnerSyncVersions.tsx` — colour the per-row Sync button to match the row's worst version mismatch, so it visually reads the same as the coloured cells that a Sync would fix:
  - Compute a row-level worst `versionDiff` across all of that package's project cells vs. `reference` (Dep target → Override target → Latest): `major` > `minor` > `patch` > none (via `DIFF_RANK` module const)
  - Map to the button `overrideClass` background using the same palette as the cells: major → `bg-red-600 hover:bg-red-700`, minor → `bg-orange-500 hover:bg-orange-600`, patch → `bg-amber-500 hover:bg-amber-600`, none → default (`h-4 px-1.5 text-xxs`)
  - "Needs npm install" (purple) rows are left neutral — a package.json Sync doesn't resolve that state
  - Button colour reflects the true worst diff regardless of the Major/Minor/Patch filter toggles
  - Supersedes the earlier "pink when differs from latest" idea
- [x] `npx tsc --noEmit` passes (after MyHelp + button-colour changes)
- [x] `OwnerSyncVersions.tsx` — fix the per-row Sync button height: `syncBtnClass` now builds on `syncBtnSize = 'h-6 md:h-6 px-1.5 md:px-1.5 text-xxs'`. `MyButton_dftClass` is `h-6 md:h-8` / `px-1 md:px-2`, and `myMergeClasses` only replaces a variant class with the same variant, so a bare `h-4` left `md:h-8` winning at the dev app's viewport — the button was stuck at 32px through the earlier h-6/h-5/h-4 changes. With the `md:` variant repeated the height is now controllable; settled on `h-6` (h-4 read too short once `md:h-8` was actually displaced).
- [x] `OwnerSyncVersions.tsx` — add `MyHelp` `?` popovers to the two Sync controls (not to each row button — too noisy):
  - **"Sync" column heading** (`<th>` in the first header row) — `HELP_SYNC_ROW`, using `HELP_BUTTON_CLASS`; `<th>` width bumped `w-16` → `w-20` to fit label + `?`
  - **Global red "Sync" button** (top bar) — `HELP_SYNC_ALL` in a `<MyHelp>` with default styling, in a `flex items-center gap-1` wrapper next to the button
- [x] `npx tsc --noEmit` passes (after height fix + Sync-help changes)
- [x] `OwnerSyncVersions.tsx` — the Sync column-heading `MyHelp` popover overflows the right edge of the window. Fixed: `SYNC_HELP_PANEL_CLASS` module const = `MyHelp_panelDftClass` + `right-0`, passed as `panelClass` to that one `MyHelp` so its popover opens leftward. Other headings' popovers unchanged (they're near the left edge). Decided via AskUserQuestion — "Open the popover leftward".
- [x] `OwnerSyncVersions.tsx` — severity colours red-600 / orange-500 / amber-500 are too similar; changed the major / minor / patch palette to **Red / Orange / Yellow** (decided via AskUserQuestion). This aligns them with the existing Major/Minor/Patch filter chips, which are already red / orange / yellow.
  - Cell text colour matches the button colour (user instruction) — one shared trio drives both:
    - major → button `bg-red-600 hover:bg-red-700`, cell `text-red-600` (unchanged)
    - minor → button `bg-orange-500 hover:bg-orange-600`, cell `text-orange-500` (was `text-orange-600`)
    - patch → button `bg-yellow-500 hover:bg-yellow-600 text-gray-900`, cell `text-yellow-500` (was `text-amber-600`)
  - Landed on `yellow-500` for both (not the preview's `yellow-400`): as cell text on a light cell, `yellow-400` is ~1.6:1 contrast and unreadable at `text-xxs`; `yellow-500` keeps button and text matched and is more legible. Flagged in chat before `#code`; user proceeded.
  - Patch button gets `text-gray-900` so the label stays readable on yellow; the cell has no equivalent (it's coloured text on a light bg).
  - Applied in both the URL `urlMismatchClass` and non-URL `mismatchClass` branches (the two `diff === 'major' ? … : …` ternaries).
  - The Override column-heading accent (`text-amber-600` on that `<th>`) left as-is — decorative column colour, not a severity indicator.
- [x] `npx tsc --noEmit` passes (after popover + colour changes)
- [x] `OwnerSyncVersions.tsx` — hide the per-row Sync button when a Sync would be a no-op (user: "why have a blue button if it is already aligned?"). The row scan now also sets `syncWouldChange` = any project whose declared spec ≠ `reference` (for a URL-referenced dep, only when a Dep/Override target is set, since Sync otherwise skips URL refs). The `<td>` is kept for table alignment but renders the `<MyButton>` only when `syncWouldChange`. Covers both fully-aligned rows and "needs npm install"-only rows (Sync writes package.json, so it can't fix a stale node_modules). A caret-only difference (`^1.2.3` vs `1.2.3`) still shows the button — Sync would rewrite it to exact even though there's no version gap.
- [x] `npx tsc --noEmit` passes (after hide-when-noop change)
- [x] `OwnerSyncVersions_actions.ts` — `action_readLocalPackageVersions` reported a false "Latest" for GitHub-referenced packages: it read the working-copy `package.json` and called `bumpDownPatch`, so once a release bump is committed+pushed (local === GitHub) the column showed one patch too low (nextjs-shared: local 2.1.84 → shown 2.1.83), producing a bogus yellow "patch" mismatch on that whole row. Fixed (chosen via AskUserQuestion — "Read the committed package.json"):
  - Imported `execFileSync` from `child_process`
  - Each package now first tries `git show HEAD:package.json` in `GITHUB_DIR/<pkg>` and uses that `version` (what a `github:` consumer install resolves to); verified in a shell that HEAD's `package.json` is `2.1.84`
  - Falls back to the working-copy `package.json` version (no `bumpDownPatch`) if the git call throws (git missing / not a repo / no HEAD)
  - No longer calls `bumpDownPatch`; `bumpDownPatch` itself kept (still used by `action_readProjectVersions`)
  - Function header comment updated to describe the new source
- [x] `npx tsc --noEmit` passes (after Latest-source fix)
- [x] `OwnerSyncVersions.tsx` — added a third header row (`#reinstall`) below the "Version" row, giving a per-project "needs `#reinstall`" signal:
  - `reinstallCounts` `useMemo` (after `installedMax`): for each project, counts package rows where `ver !== null && !ver.includes(':') && ver === reference && !isInstalled`, with `reference = targets.deps[pkg] ?? targets.overrides[pkg] ?? latest?.[pkg]` and `isInstalled = instVer != null && semverCompare(instVer, extractBaseVersion(reference)) >= 0`. URL-referenced packages skipped. Deps `[projects, packages, matrix, installed, latest, targets]`.
  - New `<tr className='bg-yellow-100 text-left'>` directly after the Version row: `<th>#reinstall</th>`, 4 empty `<th>` (Latest/Installed/Dep/Override), one `<th>` per project showing `⟳ {n}` in `text-purple-600 font-semibold` when `reinstallCounts[proj] > 0` (else empty), 1 empty `<th>` for the Sync column.
  - Read-only status row, styled like "Version" — no button look, no handler.
- [x] `npx tsc --noEmit` passes (after #reinstall row)

## Changes

### src/UI/OwnerSyncVersions_actions.ts
- `action_syncVersions` now takes an optional `packageName?: string`. When omitted it behaves exactly as before (sweeps every package in every project). When set, it only touches that one package:
  - Phase 1 (bump deps/devDeps/peerDeps to npm latest) skips every dep except `packageName`.
  - Phase 2a (dep-target pinning) skips every target except `packageName`.
  - Phase 2b (override-target pinning) skips every target except `packageName`.
  - The "remove overrides no longer in targets" cleanup loop skips every override key except `packageName`.
- Judgment call, flagged: the plan first proposed wrapping the cleanup loop in `if (!packageName) { ... }` (skip cleanup entirely for a scoped run). Implemented instead as a per-key `if (packageName && dep !== packageName) continue` guard. This still fully satisfies the plan's stated goal ("a single-package sync never strips other packages' overrides") but is more correct: if you clear a package's Override target and then click its row Sync, its now-stale override is removed and it's restored to `dependencies` at latest — the row button honours "target if set, else latest" completely, instead of leaving a dead override behind.
- Header comment updated with a `Params:` section describing `packageName`.

### src/UI/OwnerSyncVersions.tsx
- Added `handleSyncPackage(pkg)` immediately below `handleSync` — identical body except it calls `action_syncVersions(pkg)`, then runs the same post-sync reload (`action_readVersions` / `action_readInstalledVersions` / `action_readSections` / `action_fetchLatestVersions` / `action_readLocalPackageVersions`). Mirrors the existing `handleSync` / `handleRefresh` duplication rather than extracting a shared helper (no restructuring of existing functions).
- Added a trailing "Sync" column: a `<th>` in each of the two header rows, and a per-row `<td>` containing a small neutral `MyButton` (`overrideClass='h-4 px-1.5 text-xxs'`) that calls `handleSyncPackage(pkg)` and is disabled while `syncing`.
- Section-divider row `colSpan` bumped `5 + projects.length` → `6 + projects.length` for the new column.
- The global red "Sync" button is unchanged — still calls `action_syncVersions()` with no argument.
- Column-heading help for Latest / Installed / Dep / Override: first added as hover `title=` tooltips, then (per user preference for a non-hover affordance) replaced with the shared `MyHelp` component — a `?` button that toggles a click popover. Help strings live in module consts `HELP_LATEST` / `HELP_INSTALLED` / `HELP_DEP` / `HELP_OVERRIDE`; `HELP_BUTTON_CLASS` gives the `?` a compact `text-xxs` style. Each heading is now an `inline-flex items-center gap-1` span of `label` + `<MyHelp>`. Latest/Installed `<th>` widths bumped `w-20` → `w-24` to fit. New import: `MyHelp` from `../components/MyHelp`.
- Per-row Sync button is now colour-coded to the row's worst version gap, matching the cell colour scheme: for each package a row-level worst `versionDiff` is computed across every project cell vs. `reference` (Dep target → Override target → Latest), ranked by `DIFF_RANK`. major → `bg-red-600`, minor → `bg-orange-500`, patch → `bg-amber-500`, fully aligned → default blue. "Needs npm install" (purple) rows stay neutral since a Sync doesn't clear that. Colour ignores the Major/Minor/Patch filter toggles (always shows true state). The button's `overrideClass` is now `syncBtnClass` instead of the fixed `'h-4 px-1.5 text-xxs'`.
- Per-row Sync button height fix: `syncBtnClass` builds on `syncBtnSize = 'h-6 md:h-6 px-1.5 md:px-1.5 text-xxs'`. `MyButton_dftClass` carries `h-6 md:h-8` / `px-1 md:px-2`, and `myMergeClasses` only replaces a variant-prefixed class with the same variant — so the earlier bare `h-4` never displaced `md:h-8` and the button rendered at 32px on the dev app's `md`+ viewport. Repeating the `md:` variant makes the height controllable; `h-6` chosen (`h-4` was too short once `md:h-8` was actually overridden).
- Sync-control help: a `?` `MyHelp` popover on the "Sync" column heading (`HELP_SYNC_ROW`, compact `HELP_BUTTON_CLASS`, `<th>` widened `w-16` → `w-20`) explaining the per-row button and its colour code; and a `?` next to the global red Sync button (`HELP_SYNC_ALL`, default `MyHelp` styling) explaining the all-packages sweep. Not added per-row (≈40 buttons — too noisy). The Sync-heading popover uses `panelClass={SYNC_HELP_PANEL_CLASS}` (`MyHelp_panelDftClass` + `right-0`) so it opens leftward and stays on-screen for the far-right column.
- Severity palette recoloured Red / Orange / Yellow (from red-600 / orange-500 / amber-500, which read as near-identical). Button and matrix cell text now share the trio: major `red-600`, minor `orange-500`, patch `yellow-500` (patch button also `text-gray-900` for label contrast). Applied to `syncBtnClass` and both cell-mismatch ternaries (`urlMismatchClass`, `mismatchClass`). Now consistent with the Major/Minor/Patch filter chips, which were already red/orange/yellow.
- Per-row Sync button is hidden when it would do nothing: the row scan sets `syncWouldChange` (any project whose declared spec differs from `reference`; URL-referenced deps only count when a target is set, matching that Sync skips URL refs otherwise), and the `<td>` renders `<MyButton>` only when true. Aligned rows and "needs npm install"-only rows now show an empty Sync cell instead of an inert blue button; caret-only differences still show the button since Sync would rewrite them.

- `action_readLocalPackageVersions` (drives the "Latest" column for `github:`-referenced packages) now reads the version from the package's *committed* `package.json` via `git show HEAD:package.json`, instead of `bumpDownPatch(working-copy version)`. The old heuristic assumed the working copy is always one unreleased patch bump ahead of GitHub, so once a bump was pushed it under-reported by one patch (nextjs-shared showed Latest 2.1.83 while everything ran 2.1.84 — a permanent false yellow "patch" flag on that row). Falls back to the working-copy version (un-bumped) if git isn't available. New import: `execFileSync` from `child_process`. `bumpDownPatch` is untouched and still used by `action_readProjectVersions`.
- New `#reinstall` header row (third row of the matrix `<thead>`, below "Version"): per-project count of packages whose declared version now matches the reference but whose `node_modules` is still behind — the purple "needs npm install" cells. Shows `⟳ N` in purple under each project with pending installs, blank when clean. Backed by the `reinstallCounts` `useMemo`. Read-only status row, no button. Gives an at-a-glance "which projects still need a `#reinstall`" after a Sync pass.

### scripts/sync-versions.ts
- No change. Verified its `action_syncVersions()` call still compiles against the new optional-param signature.

## Testing
- [ ] Start the nextjs-shared dev app and open `http://localhost:3009/owner` → Versions tab
- [ ] Confirm the table renders with a new "Sync" column on the far right, a small "Sync" button on each row that has something to sync (rows with nothing to change show an empty cell); the header/version rows have a matching empty cell; section-divider bars still span the full table width
- [ ] Pick a low-risk patch/minor row (e.g. `@xyflow/react` or `@tailwindcss/postcss`), leave its Dep/Override cells blank, click its row "Sync" — confirm only that package's version changes across the project columns, every other row is untouched, and the "Updated N project(s)" note appears
- [ ] Set a Dep target version on one row, click that row's "Sync" — confirm it pins to the typed target (not npm latest) in the projects that have it
- [ ] Set an Override target on a row, row-Sync it, then clear the Override target and row-Sync again — confirm the override is removed and the package falls back to `dependencies` at latest, while any other package's `overrides` entries (e.g. `postcss`) are left intact
- [ ] Confirm the per-row Sync button renders at `h-6` (~24px) — a touch shorter than the Refresh / global Sync buttons — at a normal desktop window width, not the old 32px
- [ ] Click the `?` next to Latest / Installed / Dep / Override, and the `?` beside the big red Sync button — confirm each popover opens on click (not hover), closes on a second click / outside click / its ×, text readable and not clipped
- [ ] Click the `?` on the **Sync column heading** specifically — confirm its popover opens **leftward** and stays fully on-screen (doesn't run off the right edge)
- [ ] Confirm the per-row Sync button colour matches the row's worst coloured cell, and that red / orange / yellow are now clearly distinct: red for a major gap (e.g. `typescript`), orange for minor (e.g. `next` in `claude_setup`), yellow for patch (e.g. `@xyflow/react`)
- [ ] Confirm the coloured matrix cell text uses the same red / orange / yellow, and the yellow patch text is still legible at the small font size
- [ ] Confirm rows where a Sync would change nothing show **no** button in the Sync cell: fully-aligned rows, and rows that are only "needs npm install" (all cells purple). The empty `<td>` should keep column alignment
- [ ] Row-Sync a coloured row and confirm its Sync button **disappears** after the refresh (nothing left to change); the `nextjs-shared` row shows no button (URL ref, no target set)
- [ ] Toggle the Major/Minor/Patch filter chips and confirm the button colours do NOT change (they track true state, not the filter)
- [ ] Confirm the `nextjs-shared` row now shows Latest = 2.1.84 (matching the committed `package.json`), the cells are no longer flagged yellow, and next-dbadmin's `2.1.82` cell is the only one still coloured
- [ ] Confirm the new `#reinstall` header row (below "Version"): after a row-Sync, the projects that got a new version but haven't reinstalled show `⟳ N` in purple under their column; projects with nothing pending show a blank cell; the count matches the number of purple cells down that column; `nextjs-shared`'s own column is unaffected by URL-ref rows
- [ ] Click the global red "Sync" button and confirm it still sweeps every package as before
- [ ] In each project reported as changed, run:
  Remove-Item -Recurse -Force node_modules; Remove-Item -Force package-lock.json; npm install
  then confirm the project still builds
