# PLAN_fix-select-autoselect-race-remove-mydropdown — nextjs-shared

## Title
Fix MySelect/MyDropdown/MySelectTable searchEnabled auto-select race bug; remove unused MyDropdown

## Plan
- [x] In `src/components/MySelect.tsx`, add a `hasRealOptions` guard (derived from `updatedOptions`,
      pre-search-filter: `updatedOptions.some(opt => opt.value !== '')`) and early-return the
      `searchEnabled` auto-select/auto-clear effect (lines ~98-116) when false — fixes both the
      auto-select branch and the clear-on-no-match branch, since both share the same root defect.
- [x] In `src/components/MyDropdown.tsx`, add the same `hasRealOptions` guard to its
      `filteredOptions`-based auto-select effect (lines ~122-128). Leave the second
      `dropdownOptions.length === 1` effect (lines ~217-223) untouched — it checks raw fetched
      options (not blank-inclusive), starts at length 0, and can't misfire the same way.
- [x] In `src/components/MySelectTable.tsx`, apply the identical guard to its equivalent
      `filteredOptions`-based effect (lines ~117-123). Leave its second
      `dropdownOptions.length === 1` effect (lines ~194-200) untouched, same reasoning.
- [x] Delete `src/components/MyDropdown.tsx` — confirmed via a full grep of every project under
      C:\Users\richa\claude\github that zero consuming projects (chess, infostore, next-bridge,
      next-bridgeschool, next-dbadmin, richard-dashboard, bristol-house) import or render it; only
      historical archived plan docs mention it.
- [x] Remove the `"./MyDropdown"` entry from `package.json`'s `exports` map.
- [x] Keep `MyDropdown_dftClass` / `MyDropdown_labelDftClass` / `MyDropdown_searchDftClass` in
      `src/constants.ts` — `MySelectTable.tsx` still imports and uses them for its own default
      classes.
- [x] Remove the `MyDropdown` demo tab and all references to it from `src/UI/OwnerComponentTest.tsx`.
- [x] Add/update demo coverage in `OwnerComponentTest.tsx` for `MySelect` and `MySelectTable` so the
      fixed race is actually exercisable in the browser — a way to simulate delayed-loading options
      (e.g. a toggle or a setTimeout-based fake fetch) with a pre-set non-blank value, so reopening
      the demo shows the value surviving the load instead of being silently cleared.
- [x] Remove/update `MyDropdown` documentation in `CONSUMING_PROJECTS.md` (currently documented as
      deprecated, referenced around lines ~268, 270, 414, 441, 456).
- [x] Bump the version number in `package.json` (release rule — removing an export is a breaking
      change for any consumer still on an older version, even though none currently use it).
- [x] Run `npx tsc --noEmit` to verify the whole package still type-checks after the removal.

## Changes

### src/components/MySelect.tsx
- Added a `hasRealOptions` guard (`updatedOptions.some(opt => opt.value !== '')`) and early-return
  it from the `searchEnabled` auto-select/auto-clear effect. Fixes a race where the effect fired
  while the caller's async option list hadn't loaded yet (only the blank placeholder present),
  silently clearing an already-selected value (e.g. one restored from sessionStorage).
- Added a `2026-09-18` CHANGE HISTORY entry documenting the fix.

### src/components/MyDropdown.tsx
- Added the identical `hasRealOptions` guard to its `filteredOptions`-based auto-select effect, for
  the same reason. (File deleted later in this same change — see below — but fixed first per the
  agreed plan order.)

### src/components/MySelectTable.tsx
- Added the identical `hasRealOptions` guard to its `filteredOptions`-based auto-select effect.
- Updated the header's `2) NOTES` (removed a now-stale "see MyDropdown for that" cross-reference)
  and added a `3) CHANGE HISTORY` section documenting the fix.

### src/components/MyDropdown.tsx (deleted)
- Deleted entirely — confirmed via a full-codebase grep that no consuming project (chess,
  infostore, next-bridge, next-bridgeschool, next-dbadmin, richard-dashboard, bristol-house)
  imports or renders it; only historical archived plan docs mentioned it.

### package.json
- Removed the `"./MyDropdown"` exports-map entry.
- Bumped version `2.1.91` → `2.1.92` (breaking removal for any consumer still importing it, per
  release rules, even though none currently do).

### src/UI/OwnerComponentTest.tsx
- Removed the `MyDropdown` import, its tab registration, the `MyDropdownTab` function, its
  `DropdownControlProps` type/defaults, and the now-unused `parseTableData` helper (only ever used
  by that tab's `tableData` mode).
- Kept the `MyDropdown_dftClass`/`_labelDftClass`/`_searchDftClass` constant imports — still used
  by `MySelectTableTab`'s demo, matching `MySelectTable.tsx` itself.
- Added a "Simulate delayed load (pre-selected value)" demo button to `MySelectTab`: pre-selects
  the first real option, then withholds `options` (`[]`) for 1.2s before restoring it, so the fix
  is visibly exercisable — the selected value should survive the gap instead of being cleared.
- Added a "Simulate reload (keep current selection)" demo button to `MySelectTableTab`: remounts
  `MySelectTable` (via a `key` bump) while `selectedOption` stays as whatever the user last picked,
  forcing a real re-fetch from the DB table so the same race is reproducible against live data.

### CONSUMING_PROJECTS.md
- Removed the `MyDropdown` component-table rows (both the `nextjs-shared/MyDropdown` import-table
  entry and the plain `MyDropdown` entry further down), its mention in the `overrideClass`
  responsive-default example list, its mention in the `MySelectTable` description ("like
  MyDropdown, but table-only"), and its mention in the shared `whereColumnValuePairs` note (now
  just "MySelectTable's whereColumnValuePairs...").

## Testing
- [ ] Open the nextjs-shared dev app's `/owner` Components tab, select the `MySelect` demo, enable
      `searchEnabled`, click "Simulate delayed load (pre-selected value)", and confirm the selected
      value in the "selected" return row does NOT clear to "(none)" while the demo runs.
- [ ] On the same page, select the `MySelectTable` demo, pick any real value from the dropdown,
      click "Simulate reload (keep current selection)", and confirm the selected value survives the
      table's re-fetch instead of resetting to blank.
- [ ] Confirm the `MyDropdown` tab no longer appears in the Components tab list at all.
- [ ] Confirmed via `npx tsc --noEmit` that the whole package still type-checks after the removal
      (already run — passed clean).
- [ ] Once pushed, reinstall in any consuming project you touch next to confirm none of them still
      reference `nextjs-shared/MyDropdown` (none currently do, per the full-codebase grep run
      during this change).
