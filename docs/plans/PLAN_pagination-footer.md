# PLAN_pagination-footer — nextjs-shared

## Title
PaginationFooter

## Plan
- [x] `src/components/MyPaginationFooter.tsx`: add optional `totalRows?: number` prop. Right-hand
      slot (currently the empty `<div />` spacer in the 3-column grid) renders `{totalRows} rows`
      when `totalRows` is provided. When not provided, falls back to an estimate —
      `totalPages * rowsPerPage` (the max possible, i.e. every page full) — rendered the same way,
      `{estimate} rows`. No separate "empty" state, so this is a behavior change for existing
      callers in chess/next-bridge/infostore (they'll now show an estimated count instead of the
      old blank spacer) — acceptable since it's additive display only, not a breaking prop change.
- [x] Add a `totalRowsClass?: string` override prop for the new element (component-authoring rule:
      every sub-element with hardcoded classes needs a named override), with a new
      `MyPaginationFooter_totalRowsClass` default constant added to `src/constants.ts` alongside
      the existing `MyPaginationFooter_dftClass`.
- [x] Update `CONSUMING_PROJECTS.md`'s `MyPaginationFooter props` table: add `totalRows` and
      `totalRowsClass` rows, and update the prose description of the 3-column layout.
- [x] Bump `package.json` version per the nextjs-shared release rule.

## Changes
### src/components/MyPaginationFooter.tsx
- Added optional `totalRows?: number` prop. Right-hand grid slot (previously an empty spacer
  `<div />`) now renders `{displayRows} rows`, where `displayRows` is `totalRows` if provided,
  otherwise falls back to the estimate `totalPages * rowsPerPage`.
- Added `totalRowsClass?: string` override prop (default `MyPaginationFooter_totalRowsClass`) for
  the new element, following the component's existing override-prop pattern.

### src/constants.ts
- Added `MyPaginationFooter_totalRowsClass = 'flex justify-end text-xs text-gray-700'` — matches
  the existing `MySelectRows_staticTextClass` styling convention for this kind of static row-count
  text, right-aligned to sit opposite the rows-per-page dropdown.

### CONSUMING_PROJECTS.md
- Updated `MyPaginationFooter props` table: added `totalRows` and `totalRowsClass` rows, and
  updated the layout description to mention the right-hand total-rows slot and its fallback
  estimate behavior.

### package.json
- Bumped version 2.1.63 → 2.1.64 per the nextjs-shared release rule.

## Testing
- [ ] In this project's own `/owner` dev app (or `OwnerComponentTest.tsx`'s component gallery),
      find the `MyPaginationFooter` demo and confirm the right-hand slot now shows a rows count
      (e.g. "60 rows") instead of being blank, aligned to the right of the row.
- [ ] Temporarily pass a `totalRows` prop (e.g. `totalRows={42}`) in that same demo and confirm it
      shows "42 rows" — i.e. the passed-in exact value takes priority over the estimate.
- [ ] Confirmed via `npx tsc --noEmit` — passes with no errors, and the new prop is optional so no
      existing call site (chess/next-bridge/infostore) needed changes to keep compiling.
- [ ] Note for later: existing consuming-project call sites will now show an *estimated* row count
      (`totalPages * rowsPerPage`) instead of a blank spacer, until each project is updated to pass
      a real `totalRows`. Confirm that's acceptable as an interim look before rolling this out
      further.
