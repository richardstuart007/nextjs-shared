# PLAN_myselectmulti-reset — nextjs-shared

## Title
Add opt-in showReset/resetLabel props to MySelectMulti

## Plan
- [x] Add `showReset?: boolean` (default `false`) and `resetLabel?: string` (default `'All'`) props to `src/components/MySelectMulti.tsx`
- [x] When `showReset` is `true` and `selected.length > 0`, render an extra row as the first item inside the open panel, visually separated from the checkbox options (bottom border, distinguishing style). Clicking it calls `onChange([])` and closes the panel (`setOpen(false)`). Label text is `resetLabel`.
- [x] Purely additive/opt-in — no change to default rendering or behavior for any caller not passing `showReset`
- [x] Update `CONSUMING_PROJECTS.md`'s `MySelectMulti` props section with the two new props
- [x] Type-check with `npx tsc --noEmit`

## Changes

### src/components/MySelectMulti.tsx
- Added `showReset?: boolean` (default `false`) and `resetLabel?: string` (default `'All'`) props.
- Added a `resetSelection()` handler (`onChange([])` + `setOpen(false)`).
- When `showReset` is true and `selected.length > 0`, the open panel now renders a reset row first (italic, semibold, bottom border to separate it from the checkbox options), labelled by `resetLabel`, before the mapped option checkboxes.
- Purely additive: no existing caller (chess's future `FilterMultiCheckbox` wrapper, next-bridge's `BuildDataViewer.tsx`) is affected since `showReset` defaults to `false`.

### CONSUMING_PROJECTS.md
- Added `showReset`/`resetLabel` to the `MySelectMulti` props table and a paragraph explaining the behavior and why it exists (one-click way back to the "All" state, needed by next-dbadmin's status filters to safely convert from their hand-rolled version).

### Not done in this task (separate project, out of scope for this session)
- Actually converting next-dbadmin's `SchemaSyncConn.tsx`/`CopyTableConn.tsx` status filters to `MySelectMulti` with `showReset` — that's the next step now that this is unblocked, needs a next-dbadmin session.
