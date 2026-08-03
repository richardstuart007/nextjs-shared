# PLAN_add-isselectionfiltering-helper — nextjs-shared

## Title
Add isSelectionFiltering helper for MySelectMulti consumers

## Plan
- [x] Add `src/components/isSelectionFiltering.ts` exporting:
  ```ts
  export function isSelectionFiltering(selected: string[], totalOptions: number): boolean {
    return selected.length > 0 && selected.length < totalOptions
  }
  ```
  with the function comment header per convention, explaining that both extremes (empty,
  full) mean "no filter" since MySelectMulti reports the same full array whether reached by
  hand or via "select all".
- [x] Add `"./isSelectionFiltering": "./src/components/isSelectionFiltering.ts"` to
  `package.json` `exports` (matches the existing convention for small standalone helpers like
  `MyMergeClasses`, `widthUtils`).
- [x] Update `CONSUMING_PROJECTS.md` — add a short subsection near the MySelectMulti docs
  explaining the "both extremes mean no filter" convention and this helper, with a usage
  example:
  ```ts
  import { isSelectionFiltering } from 'nextjs-shared/isSelectionFiltering'

  if (isSelectionFiltering(selectedClubs, clubOptions.length)) {
    params.set('clubs', selectedClubs.join(','))
  }
  ```
- [x] Bump version in `package.json` per release rules.
- [x] Run `npx tsc --noEmit` and confirm it passes.
- [x] Add an `isSelectionFiltering` result row to the `MySelectMultiTab` demo tab in
  `src/UI/OwnerComponentTest.tsx` (the dev app's component-test page), so the helper's live
  output against the tab's own selection state is visible for manual testing.

## Changes
- Added `src/components/isSelectionFiltering.ts` — new helper exporting `isSelectionFiltering(selected, totalOptions)`.
- Added `"./isSelectionFiltering"` entry to `package.json` `exports`.
- Bumped `package.json` version 2.1.54 → 2.1.55.
- Added an `isSelectionFiltering` subsection to `CONSUMING_PROJECTS.md`, placed after the `MySelectMulti` usage examples and before `### MySelectRows props`.
- `npx tsc --noEmit` passes clean.

### src/UI/OwnerComponentTest.tsx
- Imported `isSelectionFiltering` from `../components/isSelectionFiltering`.
- Added a `ReturnRow label='isSelectionFiltering'` to `MySelectMultiTab`'s `returns` panel,
  showing `isSelectionFiltering(selected, checkboxOptions.length)` live against the tab's own
  selection state.

## Testing
- [ ] Confirmed via `npx tsc --noEmit` only for the helper itself — it's a standalone pure
  function with no existing call sites yet.
- [ ] Optional sanity check: in a scratch file/REPL, call
  `isSelectionFiltering(['a'], 3)` → `true`, `isSelectionFiltering([], 3)` → `false`,
  `isSelectionFiltering(['a','b','c'], 3)` → `false`, confirming the "both extremes mean no
  filter" behavior described in `CONSUMING_PROJECTS.md`.
- [ ] Open the nextjs-shared dev app's component-test page, go to the `MySelectMulti` tab, and
  confirm a new `isSelectionFiltering` row appears in the returns panel: `false` with nothing
  selected, `true` after selecting some (not all) fruits, `false` after using "select all" or
  reselecting every fruit individually.
