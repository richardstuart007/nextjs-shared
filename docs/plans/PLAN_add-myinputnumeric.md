# PLAN_add-myinputnumeric — nextjs-shared

## Title
Add MyInputNumeric component

## Plan
- [x] Add `MyInputNumeric_dftClass` (and an error-state class) to `src/constants.ts`, positioned alphabetically after `MyInput_dftClass`
- [x] Create `src/components/MyInputNumeric.tsx`:
  - Numbered main header (DESCRIPTION with Parameters/Returns)
  - Props: `min?`, `max?`, `decimals?`, `integerOnly?`, `errorClass?`, `showSpinButtons?`, `defaultClass?`, `overrideClass?`, `value: number | ''`, `onChange: (value: number | null) => void`
  - Renders native `<input type="number">`; spin arrows hidden by default (CSS), `showSpinButtons` opts back in
  - min/max violations show error styling (`errorClass`) but do not block typing or clamp the value
  - `decimals === 0` and `integerOnly === true` both route to the same "reject the `.` keystroke entirely" behavior; `decimals >= 1` caps digits typed after the point; neither set = unlimited decimals (native default)
  - No `allowNegative` prop — negative sign is not accepted
- [x] Add `"./MyInputNumeric": "./src/components/MyInputNumeric.tsx"` to `package.json` exports, after the `MyInput` entry
- [x] Add a `MyInputNumericTab` demo tab to `src/UI/OwnerComponentTest.tsx` (mirroring `MyInputTab`'s controls/preview/returns structure) and register it in the `tabs` array
- [x] Update `CONSUMING_PROJECTS.md` — add a one-line row for `MyInputNumeric` to both component reference tables (§7 UI Components, and the component-authoring-rules quick-reference table)
- [x] Run `npx tsc --noEmit` to verify
- [x] Right-justify the input text: add `text-right` to `MyInputNumeric_dftClass` (give it its own class array instead of aliasing `MyInput_dftClass`, so this doesn't affect `MyInput`)
- [x] Remove the `showSpinButtons` prop entirely — spin arrows are always hidden, no opt-back-in:
  - `src/components/MyInputNumeric.tsx`: drop the prop from `Props`/destructuring; apply `hideSpinButtonsClass` unconditionally
  - `src/UI/OwnerComponentTest.tsx`: remove the `showSpinButtons` field from `InputNumericProps`/`inputNumericDefaults`, its `ControlRow`, and the preview prop
  - `docs/plans/PLAN_add-myinputnumeric.md` Testing checklist: drop the "Toggle showSpinButtons" item
- [x] Format the displayed value to a fixed `decimals` places on blur (e.g. `47` → `47.00` when `decimals=2`), since the underlying number can't carry trailing zeros itself:
  - `src/components/MyInputNumeric.tsx`: add local `displayValue` string state; a `useEffect` resyncs it from `value`/`decimals` whenever the field isn't focused; an `onBlur` handler reformats `displayValue` to `value.toFixed(decimals)` when `decimals` is set and `value !== ''`; while focused, `displayValue` just tracks raw typed input (no reformatting mid-edit)
  - Only applies when `decimals` is set; no change when `decimals`/`integerOnly` are unset
- [x] Run `npx tsc --noEmit` to verify
- [x] Update `CONSUMING_PROJECTS.md`'s two `MyInputNumeric` descriptions to mention the blur-formatting-to-fixed-decimals behavior (`47` → `47.00` when `decimals` is set), added after the original doc entries were written

## Changes

### src/constants.ts
- Added `MyInputNumeric_dftClass` — its own class array (not aliased to `MyInput_dftClass`), including `text-right`, so callers see right-justified numeric text — and `MyInputNumeric_errorDftClass` (red border, for the min/max violation state), positioned alphabetically after the `MyInput` block.

### src/components/MyInputNumeric.tsx
- New component: numeric-convenience wrapper over `<input type="number">`. `value`/`onChange` are numeric (`number | ''` / `(value: number | null) => void`), not native string passthrough. `min`/`max` are visual-only (error class on violation, never clamps/blocks). `decimals`/`integerOnly` both route through a "reject the `.` keystroke" path when the effective cap is 0, avoiding a dead-end `"3."` state; `decimals >= 1` caps digits after the point via `onChange` filtering. The `-` key is always rejected (no negative-number support, no `allowNegative` prop). Spin arrows are always hidden via Tailwind arbitrary-property classes — no `showSpinButtons` prop.
- Added a local `displayValue` string (separate from the numeric `value`) so the field shows exactly what's typed while focused — a plain number can't hold a trailing "." or trailing zeros, which would otherwise get silently stripped mid-entry. On blur, `displayValue` reformats to `value.toFixed(decimals)` when `decimals` is set (e.g. `47` → `"47.00"`); a `useEffect` resyncs `displayValue` from `value`/`decimals` whenever the field isn't focused (e.g. a caller resetting the value programmatically).

### package.json
- Added `"./MyInputNumeric"` export entry, after `"./MyInput"`.

### src/UI/OwnerComponentTest.tsx
- Added `MyInputNumeric` import, its two constants (`MyInputNumeric_dftClass`, `MyInputNumeric_errorDftClass`), a `MyInputNumericTab` demo tab (props for min/max/decimals/integerOnly/defaultClass/overrideClass/errorClass/disabled, live preview, and `value`/`isOutOfRange` returns), and registered it in the `tabs` array right after `MyInput`. No `showSpinButtons` control (prop removed).

### CONSUMING_PROJECTS.md
- Added a one-line `MyInputNumeric` row to both component reference tables (§7 UI Components, and the component-authoring-rules quick-reference table).

## Testing
- [ ] Open the `/owner` dev app's Components tab, switch to the new `MyInputNumeric` tab
- [ ] Confirm the field's text is right-justified
- [ ] Confirm no native spin arrows appear (no toggle for this anymore — always hidden)
- [ ] Type a value with no `min`/`max` set — confirm no error styling
- [ ] Set `min`/`max` (e.g. 1/40) and type a value outside that range — confirm the field shows the red error border but the value is still accepted (not clamped, not blocked)
- [ ] Check `integerOnly` — confirm the `.` key does nothing in the field
- [ ] Set `decimals` to `2`, type `47`, then click/tab away — confirm the field shows `47.00` on blur
- [ ] With `decimals=2`, type `47.5` and confirm the decimal point and digit stay visible while typing (not stripped)
- [ ] With `decimals=2`, try typing a third decimal digit — confirm it's rejected while typing
- [ ] Try typing `-` — confirm it's rejected, no negative value can be entered
- [ ] Confirmed via `npx tsc --noEmit` (passes clean) — no existing consumer imports this new export yet, so no build-breakage risk elsewhere
