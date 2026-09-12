# PLAN_remove-defaultclass-prop — nextjs-shared

## Title
Remove defaultClass as a public prop; demo shows constants + merged result read-only

## Plan
- [x] Confirmed scope: no consuming project (bristol-house, chess, claude_setup, infostore, next-bridge, next-bridgeschool, next-dbadmin, richard-dashboard) overrides `defaultClass` anywhere — grepped and verified. `defaultClass` becomes an internal-only reference to its constant, no longer part of any component's public `Props`.
- [x] Remove `defaultClass` from `Props`/destructuring in each of the 16 affected components, referencing the relevant `*_dftClass` constant directly inside the component body instead. Update each component's header comment to drop the `defaultClass —` line from `Parameters:`. Affected files:
  - `src/components/MyHourGlass.tsx`
  - `src/components/MyInput.tsx`
  - `src/components/MyTextarea.tsx`
  - `src/components/MyButton.tsx`
  - `src/components/MyLink.tsx`
  - `src/components/MyPopup.tsx`
  - `src/components/MyToggle.tsx`
  - `src/components/MyBox.tsx`
  - `src/components/MyPaginationFooter.tsx`
  - `src/components/MySelectRows.tsx`
  - `src/components/MySelect.tsx`
  - `src/components/MySelectTable.tsx`
  - `src/components/MyDropdown.tsx`
  - `src/components/MyPagination.tsx`
  - `src/components/MySelectMulti.tsx`
  - `src/components/MyInputNumeric.tsx`
  - Sub-element default-class props (e.g. `labelClass`, `containerClass`, `searchClass`) are untouched — they're plain replaceable defaults, not a `defaultClass`/`overrideClass` merge pair, and stay real public props.
- [x] Add a shared `ClassInfo` helper component in `src/UI/OwnerComponentTest.tsx`: takes the relevant `*_dftClass` constant(s) for a tab's main element (as `{name, value}` pairs) plus the tab's current `overrideClass` value; renders each constant's name+value read-only, and the live merged result (`myMergeClasses(mainConstant.value, overrideClass)`) read-only. One shared component, not copy-pasted per tab.
- [x] For each of the 16 tabs in `OwnerComponentTest.tsx`: remove the editable `defaultClass` textarea control and its `draft`/`applied` field; render `<ClassInfo>` instead, wired to that component's actual constant(s) and current `overrideClass`. Remove any now-duplicate `className`/merged-value `ReturnRow` that `ClassInfo` supersedes.
- [x] Fix a related demo bug: blanking a `*Class` textarea (`labelClass`, `containerClass`, `searchClass`, `errorClass`, `titleClass`, `overlayClass`, `closeButtonClass`, etc. — any sub-element prop whose real default is a non-empty constant) currently passes `''` explicitly to the real component, which does NOT trigger its own `= X_dftClass` default parameter (JS defaults only trigger on `undefined`, not `''`) — so clearing the field kills that sub-element's styling instead of demonstrating the real default. Fix: when such a textarea is blank, pass `undefined` instead of `''`. `overrideClass` is excluded — its real default already is `''`, so passing `''` there is already correct.
- [x] Update `CONSUMING_PROJECTS.md` — remove `defaultClass` from the documented prop list for all 16 affected components.
- [x] Update this project's own `.claude/CLAUDE.md` — the "overrideClass — main element" convention currently documents `defaultClass` as a prop every single-styled-element component must accept; reword so only `overrideClass` is the public prop, with the default constant referenced internally.
- [x] Run `npx tsc --noEmit` to verify

## Changes

### src/constants.ts
- `MySelectRows_dftClass` (a derived `MySelect_dftClass.replace('w-72','w-24')` string) replaced with `MySelectRows_widthClass = 'w-24'` — `MySelectRows` now narrows via `overrideClass` merging instead of the removed `defaultClass` wholesale-override escape hatch.

### 16 component files (MyHourGlass, MyInput, MyTextarea, MyButton, MyLink, MyPopup, MyToggle, MyBox, MyPaginationFooter, MySelectRows, MySelect, MySelectTable, MyDropdown, MyPagination, MySelectMulti, MyInputNumeric)
- Removed the `defaultClass` prop from each component's `Props`/destructuring; each now references its `*_dftClass` constant directly in its own `myMergeClasses` call. Header comments updated to drop the `defaultClass —` `Parameters:` line.
- `MySelectRows.tsx`: no longer forwards a `defaultClass` into `MySelect` — instead merges `MySelectRows_widthClass` with its own `overrideClass` (via `myMergeClasses`) and passes that combined string as `MySelect`'s `overrideClass`, producing an identical result (verified) without needing the removed escape hatch.
- `defaultClass_Label`/`defaultClass_Search` on `MyDropdown`/`MySelectTable` are untouched — different prop names, out of this plan's scope, still real.

### src/UI/OwnerComponentTest.tsx
- Added a shared `ClassInfo` component: read-only display of a tab's relevant `*_dftClass` constant(s) plus the live merged result (an optional `computedMerged` override for `MySelectRows`'s nested two-step merge).
- Removed the editable `defaultClass` control, its `draft`/`applied` field, and its `defaultClass={...}` prop pass, from all 16 tabs; added `<ClassInfo>` to each tab's `returns` in its place.
- Fixed the related bug: blanking a `*Class` textarea (`labelClass`, `containerClass`, `panelClass`, `overlayClass`, `closeButtonClass`, `errorClass`, `numbersContainerClass`, etc.) now passes `undefined` instead of `''` to the real component, so clearing the field actually demonstrates that component's real default instead of stripping its styling.

### CONSUMING_PROJECTS.md
- Removed the "Project-wide defaults (`defaultClass` pattern)" section and its `AppButton` wrapper example entirely.
- Reworded the `MyTab` cross-reference bullet, which pointed at that removed section, to describe `MyTab`'s own (still-real) per-variant class props directly instead.

### .claude/CLAUDE.md
- Reworded "overrideClass — main element": `defaultClass` is no longer documented as a component prop — components reference their `*_dftClass` constant directly; only `overrideClass` is public. Noted the prior `defaultClass` escape hatch and why it was removed (zero real usage anywhere).

## Testing
- [ ] Open the `/owner` dev app's Components tab; spot-check a few tabs (`MyButton`, `MySelect`, `MyPopup`, `MySelectRows`) — each should show the read-only `ClassInfo` block (constant name(s) + value, and the live merged result) in place of the old editable `defaultClass` textarea
- [ ] On `MySelectRows`'s tab, confirm the merged result still correctly narrows to `w-24` by default (no visual change from before)
- [ ] On a tab with a sub-element class prop (e.g. `MySelect`'s `labelClass`, `MyPopup`'s `overlayClass`), clear that field and confirm the component falls back to its real default styling instead of losing styling entirely
- [ ] Confirmed via `npx tsc --noEmit` (passes clean)
- [ ] No consuming project needs any changes — confirmed zero external usage of `defaultClass` before removing it
