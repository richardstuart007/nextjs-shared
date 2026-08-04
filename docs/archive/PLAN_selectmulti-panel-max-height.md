# PLAN_selectmulti-panel-max-height — nextjs-shared

## Title
MySelectMulti height truncation fix + audit other dropdowns for same issue

## Plan
- [x] Audit finding (already checked, no further action needed): `MySelectMulti` is the only
      custom-rendered dropdown panel in the package — its options panel is a plain `<div
      role='listbox'>` with `MySelectMulti_panelDftClass` (`'absolute z-10 mt-1 top-full left-0
      min-w-max bg-white border border-gray-200 rounded shadow-md p-1'`), which has no
      `max-h`/`overflow` at all today, so a long option list grows unbounded and gets clipped by
      the viewport/parent overflow. `MySelect` and `MyDropdown` both render a native `<select>`
      element — the browser owns that dropdown's rendering and scrolling, so they are not affected
      and need no change.
- [x] Add `MySelectMulti_panelMaxHeightDftClass = 'max-h-60 overflow-y-auto'` to `src/constants.ts`,
      alongside the existing `MySelectMulti_panelDftClass`.
- [x] Add a new `panelMaxHeightClass?: string` prop to `MySelectMulti.tsx`, defaulting to
      `MySelectMulti_panelMaxHeightDftClass`, kept separate from `panelClass` so a caller
      overriding the height doesn't have to re-type the rest of the panel styling (border, shadow,
      rounded corners, padding, position).
- [x] Merge the two into the panel's className via `myMergeClasses(panelClass,
      panelMaxHeightClass)` (already confirmed `max-h-` is a recognized group in
      `MyMergeClasses.ts`, so an override cleanly replaces just the `max-h-*`/`overflow-y-auto`
      pair and leaves `panelClass`'s other styling untouched).
- [x] Update `CONSUMING_PROJECTS.md`'s "MySelectMulti props" section (around line 575) — add the
      new `panelMaxHeightClass` prop row and the new exported constant to the props table and the
      exported-constants list.
- [x] Bump the version number in `package.json`.
- [x] Run `npx tsc --noEmit` to verify.
- [x] Add two new local constants to `src/UI/OwnerComponentTest.tsx`, scoped to the
      `MySelectMulti` demo tab (not promoted to `src/constants.ts` — single-use demo data):
      a 6-fruit list and a 20-fruit list, alphabetical, 20-list is a superset of the 6-list
      (Apple, Banana, Cherry, Date, Elderberry, Fig, Grape, Honeydew, Kiwi, Lemon, Mango,
      Nectarine, Orange, Papaya, Quince, Raspberry, Strawberry, Tangerine, Ugli Fruit,
      Watermelon).
- [x] Add a new `ControlRow` with a `MySelect` ("6 fruits" / "20 fruits") to `MySelectMultiTab`'s
      props form, controlling which constant is passed as `options` to the `MySelectMulti`
      preview. Switching it resets `selected`, same as `handleApply` already does.
- [x] Run `npx tsc --noEmit` to verify.
- [x] Fix horizontal-scrollbar side effect: update `MySelectMulti_panelMaxHeightDftClass` in
      `src/constants.ts` from `'max-h-60 overflow-y-auto'` to `'max-h-60 overflow-y-auto
      overflow-x-hidden'`. Root cause: the panel is sized via `min-w-max` (shrink-to-fit on the
      widest `whitespace-nowrap` row) with no room reserved for a scrollbar; once `overflow-y-auto`
      triggers a vertical scrollbar, CSS also silently promotes the unset `overflow-x` from
      `visible` to `auto` (a visible axis can't coexist with a non-visible one on the same box), so
      the scrollbar-narrowed content overflows horizontally and a horizontal scrollbar appears.
      Explicit `overflow-x-hidden` stops that promotion.
- [x] Run `npx tsc --noEmit` to verify.
- [x] Panel width should default to the trigger button's ("header's") rendered width, not shrink-
      to-fit its widest option. Design (agreed): the trigger button and panel are siblings inside
      a `relative` wrapper `<div>` that is itself a flex item of `containerClass` (default `'flex
      items-center gap-2'`), so it already shrink-wraps to the button's exact rendered width;
      giving the panel `w-full` inherits that same width automatically, no need to set the width on
      both button and panel separately.
      - Remove `min-w-max` from `MySelectMulti_panelDftClass` in `src/constants.ts` (width moves to
        its own prop/constant, matching how height already works).
      - Add `MySelectMulti_panelWidthDftClass = 'w-full'` to `src/constants.ts`.
      - Add `panelWidthClass?: string` prop to `MySelectMulti.tsx`, defaulting to
        `MySelectMulti_panelWidthDftClass`, merged in the same nested-`myMergeClasses` fashion as
        `panelMaxHeightClass` (`myMergeClasses(myMergeClasses(panelClass, panelWidthClass),
        panelMaxHeightClass)`), so a caller can still explicitly override the panel to be
        wider/narrower than the header if needed.
      - Known/accepted trade-off (confirmed by user): rows stay `whitespace-nowrap` — no auto-wrap
        added. If an option label is wider than the header/panel, it gets silently clipped on the
        right (no scrollbar, courtesy of the earlier `overflow-x-hidden` fix). This is intentional:
        truncation surfacing in testing is the signal for the calling project to widen the trigger,
        not something this component should paper over with wrapping.
      - Update `CONSUMING_PROJECTS.md`'s "MySelectMulti props" section: add `panelWidthClass` row
        and `MySelectMulti_panelWidthDftClass` to the exported-constants list, and a short note on
        the width-matches-header default plus the clipping trade-off.
      - Bump the version number in `package.json`.
- [x] Run `npx tsc --noEmit` to verify.
- [x] Add a `panelWidthClass` control row to `MySelectMultiTab`'s demo props form in
      `src/UI/OwnerComponentTest.tsx`, using `MyInput` (free-text, same pattern as `overrideClass`
      but a single-line input rather than a textarea), so the new prop can actually be exercised
      from the `/owner` test UI. Empty string means "use the component's own default" (`w-full`) —
      pass `undefined` rather than `''` when applied so the prop falls through to its default
      instead of being merged as an empty override.
- [x] Run `npx tsc --noEmit` to verify.
- [x] Audit finding: three more hardcoded, non-constant, non-overridable class strings in
      `MySelectMulti.tsx` — the select-all row `<label>` (line 141), the item-row `<label>`
      (identical string duplicated at lines 152 and 166), and the checkbox `<input>` (`'h-3 w-3'`,
      duplicated at lines 146/157/171). Fix:
      - Added to `src/constants.ts`: `MySelectMulti_rowDftClass`, `MySelectMulti_selectAllRowDftClass`,
        `MySelectMulti_checkboxDftClass = 'h-3 w-3'`.
      - Added `rowClass?: string`, `selectAllRowClass?: string`, `checkboxClass?: string` props to
        `MySelectMulti.tsx`, each defaulting to its constant. Unlike `panelWidthClass`/
        `panelMaxHeightClass`, these are direct full-replacement props used as-is at their usage
        site (same pattern as the existing `labelClass`/`containerClass`), not run through
        `myMergeClasses` — each represents a single, non-decomposed concern, so there's no
        "base + override" split to merge. The two duplicated item-row `<label>`s (selected/
        unselected) both use `rowClass`.
      - Excluded from this fix (agreed): the wrapper `<div className='relative'>` — structural
        positioning requirement for the panel's `absolute` positioning, not a stylistic choice, so
        it stays hardcoded inline rather than becoming a constant/prop.
      - Updated `CONSUMING_PROJECTS.md`'s "MySelectMulti props" table and exported-constants list.
      - Bumped the version number in `package.json`.
      - Additionally (per user request mid-step): grouped all style-related props together,
        separate from data/behavior props, in both `MySelectMulti.tsx`'s `Props` type/destructuring
        and the demo's `SelectMultiControlProps` type/form — not a system-wide object-based
        props redesign (explicitly declined), just consistent ordering within the existing flat-
        prop convention.
- [x] Run `npx tsc --noEmit` to verify.
- [x] Remove the "simulated consuming project" test scaffolding from `OwnerComponentTest.tsx` now
      that it has served its purpose (proved `defaultClass` overrides propagate correctly) — it was
      only ever meant to be temporary and is now just a source of confusion (the bright-pink
      `MyInput` border). Revert every component in the demo to the real shared component/constant:
      - `OwnerComponentTest.tsx`: change `import { MyInputProject as MyInput } from
        './components_wrappers/MyInput'` to the real `import { MyInput } from '../components/MyInput'`
        (fixes every `<MyInput>` control field across all tabs, since they all use this one alias).
      - Remove `import { MyInput_dftClass_Project } from './components_wrappers/defaults'`; its one
        usage (`MyInputTab`'s Returns row) switches to the real `MyInput_dftClass` (imported from
        `../constants`).
      - Change `import { MyBoxProject } from './components_wrappers/MyBox'` to the real `import
        MyBox from '../components/MyBox'` (default export) and update its 3 usages in `MyBoxTab`
        (the preview + 2 Returns rows) accordingly.
      - Remove `import { MyBox_dftClass_Project } from './components_wrappers/defaults'`; its 2
        usages switch to the real `MyBox_dftClass` (imported from `../constants`).
      - Delete `src/UI/components_wrappers/MyInput.tsx`, `src/UI/components_wrappers/MyBox.tsx`,
        and `src/UI/components_wrappers/defaults.ts` entirely (confirmed not part of the package's
        public `exports` map — purely internal to this one demo file, safe to delete).
- [x] Run `npx tsc --noEmit` to verify.
- [x] Add the panel's and row/checkbox elements' computed classes to `MySelectMultiTab`'s Returns
      panel in `OwnerComponentTest.tsx`, alongside the existing `count`/`selected`/`className`/
      `isSelectionFiltering` rows — currently only the header's `className` is shown, matching the
      gap flagged earlier in this session. `panelClassName` isn't exposed by the component itself,
      so the demo computes its own equivalent the same way it already does for the header's
      `computedClass`:
      - `panelClassName` Returns row — `myMergeClasses(myMergeClasses(MySelectMulti_panelDftClass,
        applied.panelWidthClass !== '' ? applied.panelWidthClass : MySelectMulti_panelWidthDftClass),
        MySelectMulti_panelMaxHeightDftClass)`.
      - `rowClass`, `selectAllRowClass`, `checkboxClass` Returns rows — each is a direct
        full-replacement prop (no merge), so just `applied.X !== '' ? applied.X :
        MySelectMulti_XDftClass`.
      - Import `MySelectMulti_panelDftClass`, `MySelectMulti_panelWidthDftClass`,
        `MySelectMulti_panelMaxHeightDftClass`, `MySelectMulti_rowDftClass`,
        `MySelectMulti_selectAllRowDftClass`, `MySelectMulti_checkboxDftClass` into
        `OwnerComponentTest.tsx` (currently only `MySelectMulti_dftClass` is imported there).
- [x] Run `npx tsc --noEmit` to verify.
- [x] Process correction: this plan bumped `package.json`'s version 5 times across the steps above
      (`2.1.56` → `2.1.61`), once per `#code` run — wrong. The release rule (`.claude/CLAUDE.md`:
      "Before every commit to GitHub") and the `commit` skill (step 6: patch bump) both bump the
      version exactly once, immediately before `#commit`, not per plan step. Reverted `package.json`
      to `2.1.56` (its value before this plan started) and removed the now-inaccurate "Bumped
      version A → B" lines from `## Changes` below — `#commit` will do the one real bump
      (`2.1.56` → `2.1.57`) when this plan is actually committed.
- [x] Naming/behavior correction (per user feedback — see `feedback_class_prop_merge_default`
      memory): the choice between merge and full-replacement for a class prop must always be
      explicit in the prop's name, never silently picked. Resolution (confirmed via
      `AskUserQuestion`): merge-based props get a `merge` prefix — names the actual behavior
      directly, rather than reusing `override` (which the pre-existing `overrideClass` already uses
      ambiguously for the same merge behavior). Accepted, flagged tradeoff: this means the header's
      existing `overrideClass` now reads inconsistently next to its merge-based siblings
      (`overrideClass` vs. `mergeRowClass`) — renaming `overrideClass` itself would be a much
      bigger, package-wide change affecting every component and consuming project, explicitly not
      proposed or done here. Apply to `MySelectMulti.tsx`:
      - `panelWidthClass` → `mergePanelWidthClass` (rename only — already merge-based).
      - `panelMaxHeightClass` → `mergePanelMaxHeightClass` (rename only — already merge-based).
      - `rowClass` → `mergeRowClass`, `selectAllRowClass` → `mergeSelectAllRowClass`,
        `checkboxClass` → `mergeCheckboxClass` — renamed **and** converted from full-replacement to
        merge (`myMergeClasses(MySelectMulti_XDftClass, mergeXClass)`), fixing the earlier bug
        where a partial override like `rowClass='hover:bg-red-100'` wiped out the rest of the row's
        layout classes instead of just replacing the matching `hover:bg-*` piece.
      - `panelClass` is unchanged — it's the base being merged onto (parallel to `defaultClass`),
        not an override itself, so it keeps its plain name with no prefix.
      - `labelClass`/`containerClass` are unchanged — pre-existing, package-wide full-replacement
        convention predating this rule, out of scope for this fix (flagged separately, not touched).
      - Update `CONSUMING_PROJECTS.md`'s "MySelectMulti props" table, exported-constants list, and
        prose to match the renamed props and the corrected merge behavior for the row/checkbox trio.
      - Update `OwnerComponentTest.tsx`'s `MySelectMultiTab`: rename `SelectMultiControlProps`
        fields, defaults, `ControlRow` labels, the `MySelectMulti` preview's prop names, and the
        `computed*` Returns-panel variables (`computedRowClass` etc.) to match — including changing
        the row/selectAllRow/checkbox Returns computations from the old `applied.X !== '' ?
        applied.X : MySelectMulti_XDftClass` (correct only for full-replacement) to the same merge
        computation now used for `panelClassName` (correct for the new merge-based behavior).
- [x] Run `npx tsc --noEmit` to verify.
- [x] Remove the `(merged)` suffix from the `rowClass`/`selectAllRowClass`/`checkboxClass` Returns
      row labels in `OwnerComponentTest.tsx`'s `MySelectMultiTab` — back to plain `rowClass`,
      `selectAllRowClass`, `checkboxClass` (the underlying values are still the merged output;
      only the label text changes).
- [x] Remove the trailing `:` from the shared `ReturnRow` component itself (`OwnerComponentTest.tsx`
      line ~137, `<span ...>{label}:</span>` → `<span ...>{label}</span>`) — this is global, every
      tab's Returns panel across the whole `/owner` component demo uses `ReturnRow`, not just
      `MySelectMulti`.
- [x] Run `npx tsc --noEmit` to verify.

## Changes
### src/constants.ts
- Added `MySelectMulti_panelMaxHeightDftClass = 'max-h-60 overflow-y-auto'`, alongside the existing
  `MySelectMulti_panelDftClass`, so the panel's height/scroll behavior is a separate, overridable
  constant from the rest of the panel's styling.

### src/components/MySelectMulti.tsx
- Imported `MySelectMulti_panelMaxHeightDftClass`.
- Added `panelMaxHeightClass?: string` prop, defaulting to `MySelectMulti_panelMaxHeightDftClass`.
- Computed `panelClassName = myMergeClasses(panelClass, panelMaxHeightClass)` and used it as the
  options panel's `className` (previously just `panelClass` directly), so the panel now caps at
  `max-h-60` with `overflow-y-auto` by default instead of growing unbounded and getting clipped by
  the viewport for long option lists.

### CONSUMING_PROJECTS.md
- Added the `panelMaxHeightClass` prop row and `MySelectMulti_panelMaxHeightDftClass` to the
  exported-constants list in the "MySelectMulti props" section, plus a short note explaining why
  it's kept separate from `panelClass` and how `myMergeClasses` handles the override.

### src/UI/OwnerComponentTest.tsx
- Added two module-level constants scoped to the `MySelectMulti` demo tab:
  `selectMultiFruitOptions6` (6 fruits) and `selectMultiFruitOptions20` (20 fruits, superset of
  the 6-list), so the demo can exercise both a short list and a long list that actually triggers
  the new panel scroll behavior.
- Added `optionSet: '6 fruits' | '20 fruits'` to `SelectMultiControlProps` (default `'6 fruits'`)
  and a new `ControlRow` with a `MySelect` in `MySelectMultiTab`'s props form to pick between them.
- `MySelectMultiTab` now computes `appliedOptions` from `applied.optionSet` and passes it as the
  `MySelectMulti` preview's `options` (previously always the shared `checkboxOptions` 5-item list);
  `isSelectionFiltering`'s count arg updated to `appliedOptions.length` to match.
  `MyCheckBoxTab`'s use of `checkboxOptions` is untouched.

### src/constants.ts (follow-up)
- Changed `MySelectMulti_panelMaxHeightDftClass` from `'max-h-60 overflow-y-auto'` to `'max-h-60
  overflow-y-auto overflow-x-hidden'` to stop the vertical scrollbar from implicitly promoting
  `overflow-x` to `auto` and producing a horizontal scrollbar on the panel.

### CONSUMING_PROJECTS.md (follow-up)
- Updated the quoted default value for `panelMaxHeightClass` to match the new constant.

### src/constants.ts (panel-width follow-up)
- Removed `min-w-max` from `MySelectMulti_panelDftClass` (width is no longer part of this
  constant's concern).
- Added `MySelectMulti_panelWidthDftClass = 'w-full'`.

### src/components/MySelectMulti.tsx (panel-width follow-up)
- Imported `MySelectMulti_panelWidthDftClass`.
- Added `panelWidthClass?: string` prop, defaulting to `MySelectMulti_panelWidthDftClass`.
- `panelClassName` now computed as `myMergeClasses(myMergeClasses(panelClass, panelWidthClass),
  panelMaxHeightClass)` — the panel now defaults to the trigger button's rendered width (via the
  shared flex-item wrapper shrink-wrapping to the button) instead of shrink-wrapping to its own
  widest option row.

### CONSUMING_PROJECTS.md (panel-width follow-up)
- Added `panelWidthClass` prop row and `MySelectMulti_panelWidthDftClass` to the exported-constants
  list, plus a note explaining the width-matches-header default and the intentional clipping
  trade-off (no auto-wrap; truncation is the signal to widen the trigger or override
  `panelWidthClass`).

### src/UI/OwnerComponentTest.tsx (panel-width demo follow-up)
- Added `panelWidthClass: string` to `SelectMultiControlProps` (default `''`) and a new
  `ControlRow` with a `MyInput` in `MySelectMultiTab`'s props form.
- `MySelectMulti` preview now passes `panelWidthClass={applied.panelWidthClass !== '' ?
  applied.panelWidthClass : undefined}` — an empty field falls through to the component's own
  default (`w-full`, matching the header) rather than merging in an empty-string override.

### src/constants.ts (row/checkbox follow-up)
- Added `MySelectMulti_rowDftClass`, `MySelectMulti_selectAllRowDftClass`,
  `MySelectMulti_checkboxDftClass = 'h-3 w-3'`.

### src/components/MySelectMulti.tsx (row/checkbox follow-up)
- Imported the three new constants.
- Added `rowClass?: string`, `selectAllRowClass?: string`, `checkboxClass?: string` props, each
  defaulting to its constant and used directly (no merge) at the select-all `<label>`, the two
  selected/unselected item `<label>`s, and all three checkbox `<input>`s.
- Reorganized the `Props` type and the function's destructured parameters into two grouped
  sections — `//  Data / behavior` then `//  Style` — so the growing set of style props stays
  clustered together rather than interspersed.

### CONSUMING_PROJECTS.md (row/checkbox follow-up)
- Added `rowClass`, `selectAllRowClass`, `checkboxClass` prop rows and their constants to the
  exported-constants list, plus a note on the direct full-replacement pattern (vs.
  `panelWidthClass`/`panelMaxHeightClass`'s merge pattern) and the excluded `relative` wrapper.

### src/UI/OwnerComponentTest.tsx (row/checkbox demo + grouping follow-up)
- Added `rowClass`, `selectAllRowClass`, `checkboxClass` fields to `SelectMultiControlProps`
  (default `''` each) and matching `ControlRow`/`MyInput` entries in `MySelectMultiTab`'s form,
  passed through as `undefined` when empty (same empty-string-falls-to-default pattern as
  `panelWidthClass`).
- Reorganized `SelectMultiControlProps`, its defaults object, and the form's `ControlRow` order
  into two grouped sections — data/behavior (`label`, `optionSet`, `selectAllLabel`, `minSelected`,
  `maxSelected`) then style (`overrideClass`, `panelWidthClass`, `rowClass`, `selectAllRowClass`,
  `checkboxClass`) — matching the same grouping now used in `MySelectMulti.tsx` itself.

### src/UI/OwnerComponentTest.tsx (scaffolding-removal follow-up)
- Changed `import { MyInputProject as MyInput } from './components_wrappers/MyInput'` to the real
  `import { MyInput } from '../components/MyInput'` — every `<MyInput>` control field across every
  tab in the file now renders with the real shared component's actual default styling (no more
  bright-pink `border-4` from the removed project-simulation wrapper).
- Removed the `MyInput_dftClass_Project` import; its one usage (`MyInputTab`'s `className` Returns
  row) now reads the real `MyInput_dftClass` (added to the existing `../constants` import block).
- Changed `import { MyBoxProject } from './components_wrappers/MyBox'` to the real `import MyBox
  from '../components/MyBox'`; updated its 3 usages in `MyBoxTab` (preview + 2 Returns rows).
- Removed the `MyBox_dftClass_Project` import; its 2 usages now read the real `MyBox_dftClass`
  (added to the same `../constants` import block).

### src/UI/components_wrappers/ (deleted)
- Deleted `MyInput.tsx`, `MyBox.tsx`, and `defaults.ts` (and the now-empty `components_wrappers/`
  directory) — the "simulated consuming project" scaffolding these provided has served its purpose
  (proving `defaultClass` overrides propagate correctly) and was never part of the package's public
  exports, so nothing outside this one demo file referenced it.

### src/UI/OwnerComponentTest.tsx (Returns rows follow-up)
- Imported `MySelectMulti_panelDftClass`, `MySelectMulti_panelWidthDftClass`,
  `MySelectMulti_panelMaxHeightDftClass`, `MySelectMulti_rowDftClass`,
  `MySelectMulti_selectAllRowDftClass`, `MySelectMulti_checkboxDftClass` into the existing
  `../constants` import block.
- `MySelectMultiTab` now computes `computedPanelClass` (replicating the component's own
  `myMergeClasses(myMergeClasses(panelClass, panelWidthClass), panelMaxHeightClass)`),
  `computedRowClass`, `computedSelectAllRowClass`, and `computedCheckboxClass` (each falling back
  to its default constant when the corresponding form field is empty), and added `panelClassName`,
  `rowClass`, `selectAllRowClass`, `checkboxClass` Returns rows alongside the existing
  `count`/`selected`/`className`/`isSelectionFiltering` rows.

### package.json
- No version bump recorded here — corrected mid-plan (see note below) to defer the single patch
  bump to `#commit`, per the actual release process, instead of bumping once per `#code` step.

### src/components/MySelectMulti.tsx (rename + merge-behavior follow-up)
- Renamed `panelWidthClass` → `mergePanelWidthClass` and `panelMaxHeightClass` →
  `mergePanelMaxHeightClass` (behavior unchanged — already merge-based).
- Renamed `rowClass` → `mergeRowClass`, `selectAllRowClass` → `mergeSelectAllRowClass`,
  `checkboxClass` → `mergeCheckboxClass`, each now defaulting to `''` and merged via
  `myMergeClasses(MySelectMulti_XDftClass, mergeXClass)` — computed as `rowClassName`,
  `selectAllRowClassName`, `checkboxClassName` and used at their JSX usage sites — fixing the bug
  where a partial value like `rowClass='hover:bg-red-100'` previously wiped out the row's entire
  layout instead of just replacing the matching `hover:bg-*` piece.
- `panelClass`, `labelClass`, `containerClass`, `overrideClass`/`defaultClass` are unchanged.

### CONSUMING_PROJECTS.md (rename + merge-behavior follow-up)
- Updated the "MySelectMulti props" table, exported-constants list, and prose to the renamed
  `merge`-prefixed props and their corrected merge behavior; added a note on the `merge` naming
  convention and the accepted, explicitly-flagged inconsistency with the pre-existing
  `overrideClass` (not renamed — would be a package-wide breaking change, out of scope here).

### src/UI/OwnerComponentTest.tsx (rename follow-up)
- Renamed `SelectMultiControlProps` fields, defaults, `ControlRow` labels, the `MySelectMulti`
  preview's prop names, and the `computed*` Returns-panel variables to match the renamed props.
- `computedRowClass`/`computedSelectAllRowClass`/`computedCheckboxClass` now use
  `myMergeClasses(MySelectMulti_XDftClass, applied.mergeXClass)` (previously an incorrect
  full-replacement fallback ternary, now consistent with `computedPanelClass`'s merge computation).
  Returns row labels for these three suffixed with `(merged)` to make the behavior visible in the
  demo itself.

### src/UI/OwnerComponentTest.tsx (label cleanup follow-up)
- Removed the `(merged)` suffix from the `rowClass`/`selectAllRowClass`/`checkboxClass` Returns row
  labels — plain labels again, values unchanged (still the merged output).
- Removed the trailing `:` from the shared `ReturnRow` component's label `<span>` — affects every
  tab's Returns panel across the whole demo, not just `MySelectMulti`.

## Testing
- [ ] In the nextjs-shared dev app (`npm run locallocal`, port 4020), open the `/owner` component
      demo tab that exercises `MySelectMulti` and confirm a short option list still opens/closes
      and behaves exactly as before (select all, floating selections, min/max constraints).
- [ ] On the `MySelectMulti` tab, switch the new `optionSet` control to "20 fruits" and Apply —
      confirm the panel now stops growing at a fixed height and scrolls internally instead of
      extending past the viewport, that there is no longer a horizontal scrollbar or narrowed
      content, then switch back to "6 fruits" and confirm no scrollbar appears at all since 6 items
      fit within the max height.
- [ ] With `overrideClass='w-40'` applied (as in the earlier test setup), confirm the panel now
      renders at that same narrow width automatically (no separate `panelWidthClass` override
      needed), and that a long label like "Elderberry" is visibly clipped on the right rather than
      wrapping or growing the panel.
- [ ] Reset `overrideClass` back to default width and confirm the panel again matches the header's
      full default width, comfortably fitting every fruit name with no clipping.
- [ ] Type `w-96` into the new `panelWidthClass` field and Apply — confirm the panel now renders
      wider than the (default-width) trigger button, independent of `overrideClass`. Clear the
      field back to empty and Apply again — confirm the panel returns to matching the header width.
- [ ] On the `MySelectMulti` tab, confirm the props form now shows `rowClass`, `selectAllRowClass`,
      and `checkboxClass` fields, grouped together with `overrideClass`/`panelWidthClass` below the
      data fields. Type a value into each (e.g. `rowClass='flex items-center gap-1 px-1 py-0.5
      bg-yellow-100 cursor-pointer text-xs whitespace-nowrap'`) and Apply — confirm each element's
      styling changes independently (row background, select-all row, checkbox size/color).
- [ ] Open every tab in the `/owner` component demo (not just `MySelectMulti`) and confirm all
      `MyInput`-based control fields now render with normal styling — no bright-pink `border-4`
      anywhere. Open the `MyBox` tab specifically and confirm its preview box no longer has the
      thick yellow border, rendering with the real `MyBox_dftClass` styling instead.
- [ ] On the `MySelectMulti` tab's Returns panel, confirm `panelClassName`, `rowClass (merged)`,
      `selectAllRowClass (merged)`, and `checkboxClass (merged)` now appear alongside
      `count`/`selected`/`className`/`isSelectionFiltering`. Type a value into `mergePanelWidthClass`
      (e.g. `w-96`) and Apply — confirm the `panelClassName` Returns row reflects the new width.
      Clear it back to empty — confirm it reverts to the default (`w-full`-based) panel class.
- [ ] Confirm the props form now shows `mergePanelWidthClass`, `mergeRowClass`,
      `mergeSelectAllRowClass`, `mergeCheckboxClass` (renamed from the earlier `panelWidthClass`/
      `rowClass`/`selectAllRowClass`/`checkboxClass`). Type just `hover:bg-red-100` into
      `mergeRowClass` and Apply — confirm the row keeps its layout (flex/padding/cursor/text-size)
      and only the hover color changes, both in the live preview and in the `rowClass` Returns row
      (should show the full class string with only `hover:bg-gray-50` replaced by
      `hover:bg-red-100`, not just the bare `hover:bg-red-100` on its own).
- [ ] Confirm the `rowClass`/`selectAllRowClass`/`checkboxClass` Returns row labels no longer show
      `(merged)`, and that every Returns row on every tab across the whole `/owner` component demo
      (not just `MySelectMulti`) no longer shows a trailing `:` after the label.
- [ ] Confirmed via `npx tsc --noEmit` — no type errors.
- [ ] After committing and pushing, reinstall in any consuming project that uses `MySelectMulti`
      with a long option list (e.g. next-dbadmin's `SchemaSyncConn.tsx`/`CopyTableConn.tsx`) and
      confirm the fix shows up there too, since no call-site changes are required to pick it up.
