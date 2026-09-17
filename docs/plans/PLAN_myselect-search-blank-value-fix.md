# PLAN_myselect-search-blank-value-fix — nextjs-shared

## Title
Fix MySelect searchEnabled first-option click failure when value=''

## Plan
- [x] In `src/components/MySelect.tsx`, when the current controlled `value` is not present in
      `filteredOptions`, render an additional hidden `<option>` for that value (e.g.
      `hidden` attribute, or `style={{ display: 'none' }}`) so the native `<select>` always has an
      `<option>` matching its own `value` — preventing the browser's silent first-option fallback
      that swallows the first click.
- [x] Verify the existing auto-clear `useEffect` (lines ~93-111) still behaves correctly alongside
      the new hidden option — no regression to the auto-select-on-single-match or
      clear-on-mismatch behavior.
- [x] Update the `MySelectTab` demo in `src/UI/OwnerComponentTest.tsx` if needed so this scenario
      (searchEnabled, value='', includeBlank, search narrows to 2+ matches, first option clicked)
      can be exercised and verified in the browser.
- [x] Check `CONSUMING_PROJECTS.md` for any `searchEnabled`/blank-option documentation that should
      note this fix.
- [x] `npx tsc --noEmit` passes.

## Changes

### src/components/MySelect.tsx
- Added a `missingCurrentOption` memo that finds the current `value`'s own option (from
  `updatedOptions`, unfiltered) whenever `searchEnabled` is on and that value has been filtered
  out of `filteredOptions`.
- Rendered that option as a hidden `<option hidden>` alongside the visible `filteredOptions` list,
  so the native `<select>` always has an `<option>` matching its own controlled `value`. This
  prevents the browser's silent fallback to displaying the first visible option as selected (with
  no matching React state and no `change` event), which previously made the first click on a
  search-narrowed list register nothing when `value=''` and the blank option's label didn't match
  the search term.
- Added a `3) CHANGE HISTORY` entry to the main header noting the fix.

### src/UI/OwnerComponentTest.tsx
- No changes needed — `MySelectTab`'s existing demo already wires `searchEnabled`, `includeBlank`,
  and a controlled `value`/`onChange` starting at `''`, so it already exercises this exact scenario.

### CONSUMING_PROJECTS.md
- No changes needed — `searchEnabled` isn't separately documented there, and this is a bug fix with
  no prop/behavior-surface change, not new documented behavior (bugs don't need documenting).

## Testing
- [ ] Open the `/owner` dev app's Components tab, select the `MySelect` demo.
- [ ] Check `searchEnabled` and `includeBlank`, use flat `optionsMode` with options like
      `Magnus,Parham Maghsoodloo,Banana` so two entries share a substring (e.g. both contain "ma"),
      then click Apply.
- [ ] With no option yet selected, type a search term that narrows the list to 2+ matches (e.g.
      "ma") and click the *first* option in the filtered list — confirm `selected` (shown in the
      Returns panel) updates to that option's value.
- [ ] Click a different (non-first) filtered option on a fresh search — confirm it still works as
      before (this already worked pre-fix; confirming no regression).
- [ ] Repeat once a value has already been selected (search again, pick another option) — confirm
      it continues to work as before.
