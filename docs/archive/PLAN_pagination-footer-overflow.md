# PLAN_pagination-footer-overflow — nextjs-shared

## Title
MyPaginationFooter right pagination arrow unclickable in narrow containers

## Plan
- [x] Root cause (agreed in discussion): `MyPaginationFooter_dftClass` (`src/constants.ts`) uses
      `grid-cols-3`, giving the rows-select | pagination | total-rows columns a fixed equal third
      each. `MyPagination`'s content (up to 7 page-number cells + 2 arrows, since
      `generatePagination` always caps at 7 items regardless of total page count) doesn't shrink
      below its own natural width — grid/flex items default to `min-width: auto` — so once that
      content is wider than its 1/3 track, it visually overflows into the total-rows column. The
      opaque `<div>` rendering "N rows" (`MyPaginationFooter_totalRowsClass`) then paints on top of
      the overflowing content (later in DOM order) and intercepts clicks meant for the right arrow
      (the rightmost, most-overflowing element).
- [x] `grid-cols-3` → `grid-cols-[auto_1fr_auto]` in `MyPaginationFooter_dftClass`
      (`src/constants.ts`) — sizes the rows-select and total-rows columns to their own content
      instead of a fixed third each, giving the middle pagination column the remaining space.
      Reduces how often the overflow triggers, but does not by itself guarantee no overflow.
- [x] Add `min-w-0` to the middle grid item (the `<div className='flex justify-center'>` wrapper
      around `<MyPagination>` in `src/components/MyPaginationFooter.tsx`) — lets that item actually
      shrink to its track's width instead of refusing to (the `min-width: auto` default).
- [x] Add `overflow-x-auto` to that same wrapper — when the pagination content genuinely can't fit
      the available width, it scrolls within its own box instead of spilling onto the total-rows
      column. This is what actually guarantees the total-rows label can never again sit on top of
      an arrow and steal its click, for any container width or page count — the `grid-cols-3` fix
      alone only shrinks the bug's trigger window, it doesn't close it.
- [x] Verified safe against every other `MyPaginationFooter` consumer (nextjs-shared, infostore,
      next-bridge, chess) via a background audit — none pass a `rowsOptions`/`totalRows` combo
      wide enough to visibly shift position under the new column sizing.
- [x] `npx tsc --noEmit` to verify

## Changes
### src/constants.ts
- `MyPaginationFooter_dftClass`: `grid-cols-3` → `grid-cols-[auto_1fr_auto]` — the rows-select
  and total-rows columns now size to their own content instead of a fixed third each, giving the
  pagination column the remaining space.

### src/components/MyPaginationFooter.tsx
- Added `min-w-0 overflow-x-auto` to the middle grid item (the wrapper around `<MyPagination>`) —
  lets it actually shrink to its track's width and scroll internally instead of spilling onto the
  total-rows column when the pagination content (up to 7 page-number cells + 2 arrows) doesn't
  fit. This is what actually stops the total-rows label from ever again painting over the right
  arrow and intercepting its click, for any container width or page count.
- Added a `3) CHANGE HISTORY` entry (2026-09-13) and expanded `2) NOTES` describing the fix.

## Testing
- [ ] In the nextjs-shared dev app's Components demo tab (`/owner` → Components →
      MyPaginationFooter), shrink the browser/preview to a narrow, sidebar-width column and
      navigate to a page count that produces 7 page-number cells (e.g. set `totalPages` high
      enough, or step through pages until the windowed display shows 5 numbers + 2 ellipses)
- [ ] In that narrow view, confirm the right arrow is clickable and advances the page on every
      page before the last one, not just visually greyed-out-correctly on the true last page
- [ ] Confirm the left arrow and individual page-number cells still work as before
- [ ] Confirm normal (non-narrow) usages — e.g. chess's `GameList`/`MasterGameList`/`habits` pages
      — still look and behave the same as before (no visible shift in the rows-select or
      total-rows label position)
- [ ] If the pagination row does need to scroll in a very narrow container, confirm it scrolls
      smoothly (via `overflow-x-auto`) rather than clipping or visually breaking
