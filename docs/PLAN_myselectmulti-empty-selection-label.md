# PLAN_myselectmulti-empty-selection-label — nextjs-shared

## Title
MySelectMulti bug — empty selection should display "All", not "0 selected"

## Plan
- [x] In `src/components/MySelectMulti.tsx`, fix the trigger `display` logic so `selected.length === 0` is treated the same as `allSelected` (both show `selectAllLabel`), matching the already-documented "no filter" convention (`CONSUMING_PROJECTS.md`'s `isSelectionFiltering` section: "both extremes (nothing selected, everything selected) mean 'no filter'"). Scope: trigger button label text only — the panel's "select all" checkbox stays unchecked when `selected.length === 0` (individual item checkboxes are also unchecked in that state, so this stays visually consistent within the panel).
- [x] Update `CONSUMING_PROJECTS.md`'s `MySelectMulti props` section (around the "Selection convention: every option selected = no filter" paragraph) to reflect that an empty selection also displays `selectAllLabel`.
- [x] `npx tsc --noEmit` passes

## Changes
### src/components/MySelectMulti.tsx
- `display` now shows `selectAllLabel` when `selected.length === 0`, in addition to the existing `allSelected` case — matches the already-documented "no filter" convention used by `isSelectionFiltering` (both extremes mean "no filter"). No change to the panel's checkbox states.

### CONSUMING_PROJECTS.md
- Updated the "Selection convention" paragraph under `MySelectMulti props` to document that an empty selection also displays `selectAllLabel`, and added a note that the "select all" row's own checkbox stays unchecked in that state (only the trigger label changes).

## Testing
- [ ] In the nextjs-shared dev app (`/owner`, Components/Demo tab or wherever a `MySelectMulti` instance is exercised), open a `MySelectMulti`, check one or more options, then uncheck all of them — confirm the trigger button now reads "All" (or the configured `selectAllLabel`) instead of "0 selected".
- [ ] Confirm the trigger also still reads "All" when every option is checked (unchanged existing behavior).
- [ ] With some but not all options checked, confirm the trigger still reads "N selected" (or "N/M selected" if `maxSelected` is set) — unchanged.
- [ ] With the panel open and selection empty, confirm the "select all" row's checkbox is unchecked (not visually flagged as checked) — only the trigger label changed, not the panel checkbox state.
- [ ] Confirmed via `npx tsc --noEmit` (passed).
