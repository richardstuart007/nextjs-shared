# PLAN_myselect-search-above-and-myselecttable-demo-props — nextjs-shared

## Title
MySelect search-above-select fix + MySelectTable demo tab props

## Plan
- [x] In `src/components/MySelect.tsx`, stop rendering the search `MyInput` as a direct sibling of `label`/`select` inside the flex-row `containerClass` div. Nest `select` (and, when `searchEnabled` is true, the search `MyInput` above it) inside a new `flex flex-col gap-1` wrapper div, which itself becomes the flex child of `containerClass` alongside `label`. `containerClass`'s existing flex-row default is unchanged, so label+select stay side-by-side exactly as today for every call site not using search; only `searchEnabled` call sites get the search box stacked above the select instead of beside it.
- [x] In `src/UI/OwnerComponentTest.tsx`, extend `SelectTableControlProps` / `selectTableDefaults` and the `MySelectTableTab` form with the missing `MySelectTable` props: `tableColumn`, `tableColumnValue`, `orderBy`, `defaultClass_Label`, `defaultClass_Search`, `overrideClass_Label`, `overrideClass_Search`. Wire the new draft/applied fields into the `MySelectTable` preview call so the full documented prop surface is testable from the Components tab.
- [x] `npx tsc --noEmit` to verify.
- [x] Full demo-tab prop-parity pass (user feedback mid-run: demo tabs must always expose every real prop, not just the ones touched by a given change): add `defaultClass` controls to `MySelectTab` and `MySelectTableTab` (both had the prop but no control); add `table`/`optionLabel`/`optionValue`/`name` controls to `MySelectTableTab` (previously hardcoded); rebuild `MyDropdownTab` with a `tableData`/`table` mode toggle plus every previously-missing prop (`name`, `optionLabel`, `optionValue`, `table`, `orderBy`, `defaultClass`, `defaultClass_Label`, `defaultClass_Search`, `overrideClass_Label`, `overrideClass_Search`).
- [x] API change (agreed via AskUserQuestion): replace the single-pair `tableColumn`/`tableColumnValue` props on `MyDropdown` and `MySelectTable` with a `whereColumnValuePairs?: ColumnValuePair[]` prop, matching `table_fetch`'s own existing shape 1:1, so more than one WHERE filter can be applied. Update both components' internals, the two demo tabs (2-pair test UI), and `CONSUMING_PROJECTS.md`.
- [x] `npx tsc --noEmit` to verify.

## Changes
### src/components/MySelect.tsx
- Wrapped `select` (and the search `MyInput`, when `searchEnabled`) in a new `flex flex-col gap-1` div nested inside the existing `containerClass` flex row, so the search box now stacks directly above the select instead of sitting beside it as a third flex-row sibling. `containerClass`'s side-by-side label+select default is unchanged for call sites not using search.

### src/components/MyDropdown.tsx
- Replaced `tableColumn?: string` / `tableColumnValue?: string | number` with `whereColumnValuePairs?: ColumnValuePair[]` (imported from `../tables/structures`), matching `table_fetch`'s own prop shape so more than one WHERE filter can be passed. Updated the internal `fetchOptions` WHERE-building logic and the `useCallback` dependency array accordingly. **Breaking rename** — see note below on consuming-project call sites.

### src/components/MySelectTable.tsx
- Same `whereColumnValuePairs` rename as `MyDropdown.tsx`, for the same reason.

### src/UI/OwnerComponentTest.tsx
- Added `MyDropdown_labelDftClass`/`MyDropdown_searchDftClass` imports and a `useMemo` import.
- `MySelectTab`: added a `defaultClass` control, wired into the preview and the `className` return row (previously used the raw `MySelect_dftClass` constant instead of the actual applied value).
- `MySelectTableTab`: added controls for `table`, `optionLabel`, `optionValue`, `name`, `defaultClass` (all previously hardcoded or missing), plus `orderBy`, `defaultClass_Label`, `defaultClass_Search`, `overrideClass_Label`, `overrideClass_Search`, and two `whereColumn`/`whereValue` pairs (combined into a `whereColumnValuePairs` array via `useMemo`) replacing the old single `tableColumn`/`tableColumnValue` fields.
- `MyDropdownTab`: rebuilt with a `mode` radio toggle (`tableData` vs `table`) so table-fetch-only props are actually reachable, plus every previously-missing prop: `name`, `optionLabel`, `optionValue`, `table`, `orderBy`, `defaultClass`, `defaultClass_Label`, `defaultClass_Search`, `overrideClass_Label`, `overrideClass_Search`, and the same two-pair `whereColumnValuePairs` construction as `MySelectTableTab`.

### CONSUMING_PROJECTS.md
- Updated the `MyDropdown` and `MySelectTable` prop tables: removed `tableColumn`/`tableColumnValue` rows, added `whereColumnValuePairs` (`ColumnValuePair[]`).

## Outstanding — other project, cannot fix from this session (project isolation)
`next-bridgeschool` has 9 `MyDropdown` call sites passing the now-renamed `tableColumn`/`tableColumnValue` props — these will fail to compile once this package is reinstalled there. Needs a Claude Code session opened in `next-bridgeschool` to change each to `whereColumnValuePairs={[{ column: '...', value: ... }]}`:
- `src/ui/admin/reference/form.tsx:144-145` — `tableColumn='sb_owner'`, `tableColumnValue={rf_owner}`
- `src/ui/admin/reference/table.tsx:342-343` — `tableColumn='sb_owner'`, `tableColumnValue={owner}`
- `src/ui/admin/questions/table.tsx:365-366` — `tableColumn='sb_owner'`, `tableColumnValue={owner}`
- `src/ui/admin/questions/detail/form.tsx:169-170` — `tableColumn='sb_owner'`, `tableColumnValue={qq_owner}`
- `src/ui/admin/questions/detail/form.tsx:256-257` — `tableColumn='rf_sbid'`, `tableColumnValue={qq_sbid}`
- `src/ui/dashboard/reference/table.tsx:496-497` — `tableColumn='uo_usid'`, `tableColumnValue={ref_selected_cx_usid.current}`
- `src/ui/dashboard/reference/table.tsx:518-519` — `tableColumn='sb_owner'`, `tableColumnValue={owner}`
- `src/ui/dashboard/history/table.tsx:521-522` — `tableColumn='uo_usid'`, `tableColumnValue={sessionContext.cx_usid}`
- `src/ui/dashboard/history/table.tsx:543-544` — `tableColumn='sb_owner'`, `tableColumnValue={owner}`

All 9 are single-pair filters, so each becomes a one-element array, e.g. site #3: `whereColumnValuePairs={[{ column: 'sb_owner', value: owner }]}`.

## Testing
- [ ] Open `/owner` → Components tab → `MySelect` tab. With `searchEnabled` checked, confirm the search box now renders on its own line directly above the select, not beside it — and confirm the label still sits beside the select (side-by-side), matching the pre-change layout.
- [ ] In the same tab, uncheck `searchEnabled` and confirm the layout looks identical to before this change (label beside select, no regression for non-search usage).
- [ ] Open `/owner` → Components tab → `MySelectTable` tab. Confirm the new `table`/`optionLabel`/`optionValue`/`name`/`defaultClass` controls work (try pointing it at a different table), and that entering `whereColumn 1=lg_severity` / `whereValue 1=E` plus `whereColumn 2=lg_caller` / `whereValue 2=<some caller>` and clicking Apply filters the dropdown's options by both conditions.
- [ ] Open `/owner` → Components tab → `MyDropdown` tab. Toggle between `tableData` and `table` mode and confirm both work; in `table` mode, confirm the two `whereColumn`/`whereValue` pairs filter correctly.
- [ ] Confirmed via `npx tsc --noEmit` — passes with no errors.
- [ ] Once this is pushed and reinstalled in `next-bridgeschool`, apply the 9 call-site updates listed above in a session opened in that project — it will fail to build otherwise.
