# PLAN_demo-tabs-all-components — nextjs-shared

## Title
create demo tabs for all components

## Plan
- [x] Confirmed missing-tab component list: `MySelectMulti`, `MySelectRows`, `MyPaginationFooter`, `MyBackHomeNav` (every other `My*` component in `src/components/` already has a tab in `src/UI/OwnerComponentTest.tsx`; utilities/hooks like `MyMergeClasses.ts`, `useBackNav.ts`, `useTabQueryState.ts`, `widthUtils.ts` and the full `src/UI/` panels are out of scope)
- [x] Add `MySelectMultiTab` — controls for `label`, `mode` ('any'/'all'), `selectAllLabel`, `minSelected`, `maxSelected`, `showReset`, `resetLabel`, `overrideClass`; preview reuses the existing `checkboxOptions` fruit list; returns show the live `selected` array
- [x] Add `MySelectRowsTab` — controls for `label`, comma-separated `options`; preview renders `MySelectRows`; returns show the selected `value`
- [x] Add `MyPaginationFooterTab` — controls for `totalPages`, comma-separated `rowsOptions`, `overrideClass`; preview renders `MyPaginationFooter`; returns show `currentPage` and `rowsPerPage`
- [x] Add `MyBackHomeNavTab` — controls for `backPath`, `backLabel`, `homePath`, `containerClass`, `linkClass`; preview renders `MyBackHomeNav`; returns show the applied path props
- [x] Register all four new tabs in `OwnerComponentTest`'s `tabs` array
- [x] `npx tsc --noEmit` passes
- [x] Remove `mode` prop entirely from `MySelectMulti` — the component always behaves as what was previously `mode='all'`: full selection = no filter, the select-all row is always shown, individual checkboxes render unchecked when everything is selected, and clicking one item while everything is selected narrows to just that item. No `'any'`-style empty-selection convention remains.
- [x] Remove `showReset`/`resetLabel` props, the reset-to-empty row, and the `resetSelection()` function entirely — there's no "empty selection" state left for a reset button to return to.
- [x] Update `MySelectMultiTab` in `OwnerComponentTest.tsx` (added earlier in this same plan) to drop its `mode`/`showReset`/`resetLabel` controls, since those props no longer exist on the component.
- [x] Update `CONSUMING_PROJECTS.md`'s `MySelectMulti` section to remove all `mode`/`showReset`/`resetLabel` documentation and describe the single always-on "full selection = no filter" behavior directly (no longer framed as one of two modes).
- [x] Flag (not fix — project isolation) the consuming-project fallout for the user to address in separate sessions:
  - **chess** `src/ui/filters/FilterMultiCheckbox.tsx` and **next-bridge** `src/ui/admin/DataTableShared.tsx`'s `FMultiSelect` — both currently pass no `mode` (relying on the `'any'` default). After this change their trigger will show "0 selected" instead of "All" when nothing is checked, even though their surrounding filter logic still treats empty selection as "no filter" — a UI/behavior mismatch until each project's own logic and labeling are revisited.
  - **next-bridge** `src/ui/shared/LookupSelects.tsx`'s `StringMultiSelect` — passes `mode='all'` explicitly; that prop must be deleted (TS compile error otherwise, since the prop no longer exists).
  - **next-dbadmin** `CopyTableConn.tsx` and `SchemaSyncConn.tsx` — both pass `showReset`/`resetLabel='All'`; those props must be deleted (TS compile error otherwise). Functionally the loss is small (the always-present select-all row already provides an equivalent one-click "back to no filter" action), but their own filter logic (currently keyed on "empty selection = no filter") needs to be re-pointed at "everything selected = no filter" to match.
- [x] `npx tsc --noEmit` passes (within nextjs-shared only — the consuming-project fixes above happen in their own sessions)

## Changes
### src/UI/OwnerComponentTest.tsx
- Added imports for `MySelectMulti`, `MySelectRows`, `MyPaginationFooter`, `MyBackHomeNav`, and their default-class constants (`MySelectMulti_dftClass`, `MySelectRows_dftClass`, `MyPaginationFooter_dftClass`, `MyBackHomeNav_containerDftClass`, `MyBackHomeNav_linkDftClass`).
- Added a shared `parseNumberList` helper (comma-separated string → `number[]`), next to the existing `parseRestProps` helper, used by both `MySelectRowsTab` and `MyPaginationFooterTab` to avoid duplicating the same parsing logic in two places.
- Added `MySelectMultiTab`: exercises `label`, `mode`, `selectAllLabel`, `minSelected`, `maxSelected`, `showReset`, `resetLabel`, `overrideClass` — reuses the file's existing `checkboxOptions` fruit list as the option set; returns show the live `selected` count/array and computed `className`.
- Added `MySelectRowsTab`: exercises `label` and a comma-separated `options` list; returns show the selected `value`, parsed `options`, and computed `className`.
- Added `MyPaginationFooterTab`: exercises `totalPages`, a comma-separated `rowsOptions` list, and `overrideClass`; returns show live `currentPage`/`rowsPerPage` state and computed `className`.
- Added `MyBackHomeNavTab`: exercises `backPath`, `backLabel`, `homePath`, `containerClass`, `linkClass`; returns show the applied path props. Default `backPath` is set to `/owner?tab=Components` so clicking the demo link in a browser returns to this same tab rather than navigating away unexpectedly.
- Registered all four new tabs (`MySelectMulti`, `MySelectRows`, `MyPaginationFooter`, `MyBackHomeNav`) in the `tabs` array, appended after the existing `MyTab` entry.
- Follow-up (same plan): removed the `mode`/`showReset`/`resetLabel` fields from `SelectMultiControlProps`/`selectMultiDefaults` and their form controls/preview props in `MySelectMultiTab`, since those props no longer exist on `MySelectMulti`.

### src/components/MySelectMulti.tsx
- Removed the `mode?: 'any' | 'all'` prop entirely. The component now always behaves as the former `mode='all'`: every option selected = no filter.
- Removed `showReset`/`resetLabel` props and the `resetSelection()` function, along with the reset-to-empty row in the panel — there's no more "empty selection" state for a reset action to return to.
- `toggle()`, the trigger `display` label, and the individual checkbox `checked` state no longer branch on `mode` — the "narrow to one item while everything's selected" and "individual checkboxes render unchecked while everything's selected" behaviors now always apply, unconditionally.
- `minSelected`/`maxSelected`, the select-all row, floating-to-top, and the `title` tooltip are unchanged from the prior plan.

### CONSUMING_PROJECTS.md
- Rewrote the `MySelectMulti props` section to describe the single "every option selected = no filter" convention directly, with no more mode table row and no more `mode`/`showReset`/`resetLabel` prose or examples.
- Removed the `mode`, `showReset`, `resetLabel` rows from the props table.
- Removed the `showReset`'s minSelected-interaction bullet and the "regardless of mode" phrasing from the `minSelected`/`maxSelected` section, since there's no longer more than one mode to be regardless of.

## Testing
- [ ] Open the Owner dev app's Components tab and confirm four new sub-tabs appear: MySelectMulti, MySelectRows, MyPaginationFooter, MyBackHomeNav
- [ ] In the MySelectMulti tab: confirm there is no `mode`/`showReset`/`resetLabel` control anymore, and that the trigger always shows "All" only when every option is checked (never on empty selection); set `minSelected`/`maxSelected` to 2/2 and confirm the fixed-count swap behavior still works
- [ ] In the MySelectRows tab: change the comma-separated `options` list and confirm the dropdown updates; confirm the single-option static-text fallback works when only one option is entered
- [ ] In the MyPaginationFooter tab: change `totalPages` and `rowsOptions` and confirm both the pagination control and rows-per-page dropdown update and stay in sync
- [ ] In the MyBackHomeNav tab: confirm the Home and Back links render with the applied `backPath`/`homePath`/labels, and that clicking Back returns to this same Components tab (given the default `backPath` value)
- [ ] Confirmed via `npx tsc --noEmit` (passed) — no build step run in this session
