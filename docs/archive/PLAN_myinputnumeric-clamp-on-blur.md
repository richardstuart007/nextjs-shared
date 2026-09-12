# PLAN_myinputnumeric-clamp-on-blur — nextjs-shared

## Title
Add clampOnBlur prop to MyInputNumeric (nextjs-shared) — amendment proposed by chess session

## Plan
- [x] Add optional `clampOnBlur` boolean prop (default `false`) to `src/components/MyInputNumeric.tsx` — corrects an out-of-range value to the nearest `min`/`max` bound on blur instead of only flagging it via `errorClass`; no-op unless `min` and/or `max` is also set; backward compatible for existing consumers
- [x] Update the main header's `Parameters:`/`NOTES`/`CHANGE HISTORY` sections to document the new prop
- [x] Update `src/UI/OwnerComponentTest.tsx`'s MyInputNumeric demo tab to exercise `clampOnBlur`
- [x] Update `CONSUMING_PROJECTS.md` to document the new prop

## Changes
### src/components/MyInputNumeric.tsx
- Added `clampOnBlur?: boolean` prop (default `false`). When true and `min`/`max` is set, `handleBlur` corrects an out-of-range value to the nearest bound, calls `onChange` with the corrected number, and formats the display to `decimals` places — otherwise falls through to the existing behavior unchanged.
- Updated the main header's `Parameters:` (min/max/clampOnBlur), `NOTES`, and added a `3) CHANGE HISTORY` entry dated 2026-09-12.

### src/UI/OwnerComponentTest.tsx
- Added `clampOnBlur` to `InputNumericProps`/`inputNumericDefaults`, a `clampOnBlur` checkbox control row, and wired it through to the `MyInputNumeric` preview, so the new prop can be exercised on the Components demo page.

### CONSUMING_PROJECTS.md
- Updated both `MyInputNumeric` one-line descriptions (components table and full component list) to mention the new `clampOnBlur` option.

## Testing
- [ ] On `/owner` (Components tab → MyInputNumeric), set `min`/`max`, leave `clampOnBlur` unchecked, type an out-of-range value, and confirm blurring only shows `errorClass` styling (unchanged existing behavior)
- [ ] Check `clampOnBlur`, type a value below `min` or above `max`, and confirm blurring snaps the value to the nearest bound and updates the `value`/`isOutOfRange` return rows
- [ ] Confirm `decimals` formatting still applies to the clamped value on blur (e.g. `min=0, decimals=2`, type `-`-blocked so try `max=10`, type `15`, blur → shows `10.00`)
- [ ] Confirmed via `npx tsc --noEmit` — passes with no errors
