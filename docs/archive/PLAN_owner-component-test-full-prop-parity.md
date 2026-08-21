# PLAN_owner-component-test-full-prop-parity — nextjs-shared

## Title
Full prop parity for every OwnerComponentTest.tsx demo tab

## Plan
- [x] MyButtonTab: add `defaultClass` control (textarea, same pattern as `overrideClass`), wire into preview.
- [x] MyInputTab: add `defaultClass` control, wire into preview.
- [x] MyTextareaTab: add `defaultClass` control, wire into preview.
- [x] MyBoxTab: add `defaultClass`, `titleClass`, `toggleButtonClass`, `chevronClass` controls, wire into preview.
- [x] MyCheckBoxTab: add `defaultClass_Label`, `defaultClass_Search`, `defaultClass_Container`,
      `defaultClass_CheckboxItem`, `overrideClass_Label`, `overrideClass_Search`,
      `overrideClass_Container`, `overrideClass_CheckboxItem`, `sortBy` controls, wire into preview.
- [x] MyPaginationTab: add `defaultClass`, `overrideClass`, `numbersContainerClass`, `ellipsisClass`,
      `numberClass`, `numberActiveClass`, `numberInactiveClass`, `arrowClass`, `arrowDisabledClass`,
      `arrowEnabledClass`, `arrowIconClass` controls, wire into preview.
- [x] MyConfirmDialogTab: add `line3`, `line4`, `line5`, `line6` controls, wire into `openDialog()`.
- [x] MyLinkTab: add `defaultClass`, `caller` controls, wire into preview.
- [x] MyToggleTab: add `defaultClass` control, wire into preview.
- [x] MyPopupTab: add `defaultClass` control, wire into preview.
- [x] MyHourGlassTab: add `defaultClass` control, wire into preview.
- [x] MyHelpTab: add a way to exercise the `items` structured-content path (alongside the existing
      `text` path) and a `closeButtonClass` control, wire into preview.
- [x] MyHelpFieldTab: add `className` control, wire into preview.
- [x] MyHelpStepTab: add `closeButtonClass` control, wire into preview.
- [x] MyTabTab: add `underlineActiveClass`, `underlineInactiveClass`, `pillActiveClass`,
      `pillInactiveClass` controls, wire into preview.
- [x] MySelectMultiTab: add `id`, `defaultClass`, `labelClass`, `containerClass`, `panelClass`,
      `mergePanelMaxHeightClass` controls, wire into preview.
- [x] MySelectRowsTab: add `id`, `defaultClass`, `overrideClass`, `labelClass`, `containerClass`
      controls, wire into preview.
- [x] MyPaginationFooterTab: add `totalRows`, `defaultClass`, `paginationOverrideClass`,
      `selectRowsOverrideClass`, `totalRowsClass` controls, wire into preview.
- [x] MyDropdownTab: add `labelClassName` and `searchClassName` computed `ReturnRow`s
      (`myMergeClasses(applied.defaultClass_Label, applied.overrideClass_Label)` /
      `myMergeClasses(applied.defaultClass_Search, applied.overrideClass_Search)`).
- [x] MySelectTableTab: same as above — add `labelClassName` and `searchClassName` computed
      `ReturnRow`s.
- [x] MyCheckBoxTab: add a `ReturnRow` surfacing the component's internal `error`/validation state
      (set when a selection violates `maxSelections`/`minSelections`), and add computed
      `ReturnRow`s for the four merged classNames (`className_Label`, `className_Search`,
      `className_Container`, `className_CheckboxItem`) alongside the new controls for those props.
      Required adding a new `onError?: (message: string) => void` prop to `MyCheckbox.tsx` itself
      (agreed with the user via AskUserQuestion — the error was previously private internal state
      with no way for a caller to read it).
- [x] MySelectRowsTab: fix `computedClass` (currently `myMergeClasses(MySelectRows_dftClass, '')`)
      to read `applied.overrideClass` once that control is added.
- [x] MyHelpStepTab: add `processing` and `consumers` to the returns block, alongside the existing
      `title`/`input`/`output` rows.
- [x] MyBackHomeNavTab: add a computed `ReturnRow` (e.g. `backLinkShown`) confirming whether
      `backPath && backPath !== homePath` evaluated true, and echo `backLabel`.
- [x] Run `npx tsc --noEmit` to verify.
- [x] MyDropdownTab: `tableData` mode currently always renders the fixed module-level
      `dropdownData` constant with no way to edit its contents through the Props panel. Add a
      `tableDataText` control ("label,value" per line, `MyTextarea`) and a `parseTableData` helper
      that builds row objects keyed by the current `optionLabel`/`optionValue` field names, so the
      preview's `tableData` prop is actually editable/testable like every other prop.

## Changes

### src/components/MyCheckbox.tsx
- Added an optional `onError?: (message: string) => void` prop, called via a `useEffect` on the
  internal `error` state whenever it's set or cleared (empty string on clear). Backward-compatible
  — defaults to `undefined`, no behavior change for existing callers. Needed so the demo tab (and
  any consuming project) can observe the min/max validation error, which was previously private
  internal state with no external signal.

### src/UI/OwnerComponentTest.tsx
- Added missing prop controls (wired into each tab's `preview`) for: MyButtonTab (`defaultClass`),
  MyInputTab (`defaultClass`), MyTextareaTab (`defaultClass`), MyBoxTab (`defaultClass`,
  `titleClass`, `toggleButtonClass`, `chevronClass`), MyCheckBoxTab (`defaultClass_Label`,
  `defaultClass_Search`, `defaultClass_Container`, `defaultClass_CheckboxItem`,
  `overrideClass_Label`, `overrideClass_Search`, `overrideClass_Container`,
  `overrideClass_CheckboxItem`, `sortBy`), MyPaginationTab (11 style props), MyConfirmDialogTab
  (`line3`-`line6`), MyLinkTab (`defaultClass`, `caller`), MyToggleTab (`defaultClass`), MyPopupTab
  (`defaultClass`), MyHourGlassTab (`defaultClass`), MyHelpTab (`items` structured-content mode via
  a new `mode`/`itemsText` control + `parseHelpItems` helper, `closeButtonClass`), MyHelpFieldTab
  (`className`), MyHelpStepTab (`closeButtonClass`), MyTabTab (`underlineActiveClass`,
  `underlineInactiveClass`, `pillActiveClass`, `pillInactiveClass`), MySelectMultiTab (`id`,
  `defaultClass`, `labelClass`, `containerClass`, `panelClass`, `mergePanelMaxHeightClass`),
  MySelectRowsTab (`id`, `defaultClass`, `overrideClass`, `labelClass`, `containerClass`),
  MyPaginationFooterTab (`totalRows`, `defaultClass`, `paginationOverrideClass`,
  `selectRowsOverrideClass`, `totalRowsClass`).
- MyDropdownTab: added a `tableDataText` control ("label,value" per line) and a new
  `parseTableData` helper so the `tableData` prop (used when `mode === 'tableData'`) is actually
  editable through the Props panel, instead of always rendering the fixed module-level
  `dropdownData` constant. Removed that now-unused constant. Added a `tableData` `ReturnRow`
  showing the parsed rows as JSON.
- Fixed `computedClass` in MySelectRowsTab, which previously hardcoded
  `myMergeClasses(MySelectRows_dftClass, '')` regardless of any override — now reads
  `myMergeClasses(applied.defaultClass, applied.overrideClass)`.
- Added missing `returns` rows: MyDropdownTab/MySelectTableTab (`labelClassName`,
  `searchClassName`), MyCheckBoxTab (`error` via the new `onError` prop, plus the four merged
  classNames), MyHelpStepTab (`processing`, `consumers`), MyBackHomeNavTab (`backLabel`,
  computed `backLinkShown`).
- Added several previously-unimported constants needed by the new controls/defaults:
  `MyBox_titleDftClass`, `MyBox_toggleButtonDftClass`, `MyBox_chevronDftClass`,
  `MyCheckbox_labelDftClass`, `MyCheckbox_searchDftClass`, `MyCheckbox_containerDftClass`,
  `MyCheckbox_itemDftClass`, `MyPagination_*` (11 style constants), `MyHelp_closeButtonDftClass`,
  `MyHelpStep_closeButtonDftClass`, `MySelectMulti_labelDftClass`,
  `MySelectMulti_containerDftClass`, `MySelect_labelDftClass`, `MySelect_containerDftClass`,
  `MyPaginationFooter_totalRowsClass`, and the `HelpItem` type from `MyHelp.tsx`.

### CONSUMING_PROJECTS.md
- Documented the new `MyCheckbox` `onError` prop in its props table.

## Testing
- [ ] User runs:
      npm run dev
      Open the "Components" tab on `/owner` and go through each of the 23 tabs.
- [ ] For each tab, confirm every "Props" control has a visible effect after clicking Apply, and
      that the "Returns" panel's computed values (className strings, echoed state) update to match.
- [ ] MyBoxTab: set `toggleButtonClass`/`chevronClass` and confirm the collapsible toggle button and
      chevron icon pick up the new classes.
- [ ] MyCheckBoxTab: set `maxSelections` to 1, select two items, and confirm the `error` row in
      Returns shows the "Maximum 1 selection allowed" message, then clears once a valid selection
      is made.
- [ ] MyPaginationTab: adjust `numberActiveClass`/`arrowDisabledClass` etc. and confirm the visible
      page numbers/arrows pick up the new styling.
- [ ] MyConfirmDialogTab: fill in `line3`-`line6` and confirm all six lines render in the opened
      dialog.
- [ ] MyDropdownTab: with `mode = tableData`, edit `tableData` to a different set of "label,value"
      lines, click Apply, and confirm the dropdown's options change to match (and the `tableData`
      Returns row shows the matching parsed JSON).
- [ ] MyHelpTab: switch `mode` to `items`, enter a couple of "Heading: Body" lines, and confirm the
      structured items render (instead of the plain `text`) when the help popover is opened.
- [ ] MyTabTab: switch `variant` between `underline`/`pill` and confirm the four class-override
      fields visibly change the active/inactive tab styling.
- [ ] MySelectMultiTab: set a small `mergePanelMaxHeightClass` (e.g. `max-h-20`) with the 20-fruit
      option set and confirm the panel becomes scrollable.
- [ ] MyPaginationFooterTab: set `totalRows` and confirm the row count display uses it instead of
      the computed `totalPages * rowsPerPage` fallback.
- [ ] MyBackHomeNavTab: set `backPath` equal to `homePath` and confirm `backLinkShown` reads
      `false` and the Back link disappears from the Display panel; set them different and confirm
      it reads `true` and the link reappears.
- [x] Confirmed via `npx tsc --noEmit` — clean, no errors, after every change including the
      `MyCheckbox.tsx` `onError` addition.
