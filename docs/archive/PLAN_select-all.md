# PLAN_select-all — nextjs-shared

## Title
Add SELECTION_ALL sentinel + serializeSelection helper next to isSelectionFiltering

## Plan
- [x] In `src/components/isSelectionFiltering.ts`, add alongside the existing
      `isSelectionFiltering` export:
      - `SELECTION_ALL` — exported sentinel constant, value `'all'`.
      - `serializeSelection(selected: string[], totalOptions: number): typeof SELECTION_ALL | string[]`
        — returns `SELECTION_ALL` when `isSelectionFiltering` is false (nothing selected or
        everything selected), otherwise returns `selected` as-is. Purpose: let consuming projects
        persist a `MySelectMulti`'s "everything selected = no filter" state (e.g. to
        sessionStorage) as a stable sentinel instead of a frozen snapshot of currently-selected
        values, which goes stale and silently becomes a partial filter once the option list grows.
      - Same comment-header format/style as the existing function in this file.
- [x] Run `npx tsc --noEmit` to verify.
- [x] Update `CONSUMING_PROJECTS.md` to document the new `SELECTION_ALL` / `serializeSelection`
      export alongside the existing `isSelectionFiltering` documentation.
- [x] In `src/UI/OwnerComponentTest.tsx`, add `serializeSelection` to the MySelectMulti demo's
      "Returns" panel so its live output is visible in the Components tab: import it alongside the
      existing `isSelectionFiltering` import (line 24), and add a new `ReturnRow` right after the
      existing `isSelectionFiltering` row (line 1600), rendering
      `JSON.stringify(serializeSelection(selected, appliedOptions.length))`.

## Changes
### src/components/isSelectionFiltering.ts
- Added `SELECTION_ALL` sentinel constant (`'all'`) and `serializeSelection(selected,
  totalOptions)` helper, exported alongside the existing `isSelectionFiltering`. Returns the
  sentinel instead of a literal array snapshot whenever the selection means "no filter" (nothing
  or everything selected), so persisted state doesn't go stale as a `MySelectMulti`'s option list
  grows over time.

### CONSUMING_PROJECTS.md
- Documented `SELECTION_ALL` / `serializeSelection` directly after the existing
  `isSelectionFiltering` section, with the rationale (stale snapshot problem) and a
  persist/restore usage example (`sessionStorage.setItem`/`getItem` round-trip).

### src/UI/OwnerComponentTest.tsx
- Imported `serializeSelection` alongside the existing `isSelectionFiltering` import.
- Added a `serializeSelection` `ReturnRow` to the MySelectMulti demo's Returns panel, right after
  the existing `isSelectionFiltering` row, so its live output (`"all"` vs. the raw array) is
  visible in the Components tab without writing a separate test script.

## Testing
- [ ] Open the nextjs-shared dev app's `/owner` page → Components tab → MySelectMulti demo. With
      `optionSet` set to "20 fruits": check every box individually (or use the "select all" row) —
      confirm the new `serializeSelection` return row shows `"all"`. Uncheck all — confirm it also
      shows `"all"`. Check a partial subset (e.g. 3 of 20) — confirm it shows the JSON array of
      just those 3 selected values, matching `selected`.
- [ ] Confirmed via `npx tsc --noEmit` for the underlying helper — this is a new, currently-unused
      pure helper (no consuming project wired up yet). When a consuming project adopts it (e.g.
      persisting a `MySelectMulti` filter to sessionStorage), verify there that: (a) selecting
      "all" then reloading restores every current option (including one added after the value was
      first persisted), and (b) a genuine partial selection round-trips unchanged through
      `serializeSelection`.
