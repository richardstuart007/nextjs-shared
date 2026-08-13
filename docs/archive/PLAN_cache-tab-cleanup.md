# PLAN_cache-tab-cleanup — nextjs-shared

## Title
Cache tab cleanup and Logging-style comparison

## Plan
- [x] Remove the "n / n entries" count text from OwnerTableCache.tsx (top buttons row)
- [x] Add a gap between the tab bar and the content area in OwnerPage.tsx (applies to all tabs)
- [x] Set OwnerTableCache.tsx top buttons row background to `bg-orange-50`, matching Logging's outer wrapper
- [x] Set OwnerTableCache.tsx table header (`thead`) background to `bg-teal-100`, matching Logging
- [x] Set OwnerTableCache.tsx table body (`tbody`) background to `bg-sky-50`, matching Logging
- [x] Switch OwnerTableLogging.tsx's detail view from an inline side panel (flex row, `shrink-0 bg-pink-100` wrapper) to a `MyPopup` modal, matching Cache's pattern — removes the flex layout and the `shrink-0`/pink wrapper div entirely
- [x] Set the new Logging `MyPopup`'s background to light pink (`bg-pink-100`) via its `overrideClass` prop (not a change to `MyPopup`'s shared default, which stays `bg-white` for every other consumer)
- [x] Set Cache's existing `MyPopup` background to light pink (`bg-pink-100`) via its `overrideClass` prop, same as above
- [x] Remove the `bg-gray-100` background from Cache's "Key (SQL)" pre, the Cached Data table header, the selected-row value pre, and the Cached Data JSON fallback pre
- [x] Remove the `bg-gray-100` background from Logging's "Message" pre in the detail popup
- [x] Double the Cache tab's key filter input width from `w-[400px]` to `w-[800px]`
- [x] Remove the "n entries" count text from OwnerTableSessionStorage.tsx's top buttons row
- [x] Set OwnerTableSessionStorage.tsx's color scheme to match Logging/Cache (`bg-orange-50` buttons row, `bg-teal-100` thead, `bg-sky-50` tbody)

## Changes
### src/UI/OwnerTableCache.tsx
- Removed the `{totalCount} / {overallSize} entries` span from the top buttons row.
- Added `bg-orange-50` to the top buttons row div, matching Logging's outer wrapper background.
- Changed `thead` background from `bg-gray-50` to `bg-teal-100`, matching Logging.
- Changed `tbody` background from `bg-white` to `bg-sky-50`, matching Logging.
- Added `bg-pink-100` to the existing `MyPopup`'s `overrideClass`.
- Removed `bg-gray-100` from the Key (SQL) pre, the Cached Data table's `thead`, the selected-row value pre, and the Cached Data JSON fallback pre — all now transparent against the popup's pink background.
- Widened the key filter `MyInput` from `w-[400px]` to `w-[800px]`.

### src/UI/OwnerTableSessionStorage.tsx
- Removed the `{entries.length} entries` span from the top buttons row.
- Added `bg-orange-50` to the top buttons row div, `bg-teal-100` to `thead`, `bg-sky-50` to `tbody`, matching Logging/Cache.

### src/UI/OwnerPage.tsx
- Wrapped the tab content `Fragment` list in a `div` with `pt-4` inside the `Suspense` block, adding a gap between the tab bar and the content area. This is shared across all consuming projects' `/owner` pages, not just this app's Cache tab.

### src/UI/OwnerTableLogging.tsx
- Removed the `flex gap-4 bg-yellow-100` / `shrink-0 bg-pink-100` inline side-panel layout; the table area is now a single `bg-yellow-100` div with no `shrink-0` wrapper.
- Replaced the inline `LoggingDetail` side panel with a `MyPopup` modal (`overrideClass='max-w-[95vw] bg-pink-100'`), matching Cache's popup pattern.
- Removed `bg-gray-100` from the "Message" pre in `LoggingDetail`, now transparent against the popup's pink background.

## Testing
- [ ] Start the dev server and open `/owner`
- [ ] On the Cache tab, confirm the "n / n entries" text is gone and only Refresh / Clear All buttons remain
- [ ] Confirm the Cache tab's buttons row, table header, and table body backgrounds visually match the Logging tab's orange/teal/sky colors
- [ ] Confirm there's a visible gap between the tab bar and the content on every tab (Logging, Cache, Session Storage, Versions, Components, Constants, Generate Data, Back Nav Demo)
- [ ] Click a Logging row and confirm the detail view now opens as a popup modal (pink background) instead of an inline side panel, and that the Message box no longer has a gray/white background
- [ ] Click a Cache row and confirm the popup background is pink, and the Key (SQL), Cached Data table header, and Cached Data values no longer have a gray/white background
- [ ] On the Cache tab, confirm the key filter input is now noticeably wider (800px vs. the previous 400px)
- [ ] On the Session Storage tab, confirm the "n entries" text is gone and the buttons row/table header/table body colors match Logging and Cache
- [ ] Confirmed via `npx tsc --noEmit` — passes with no errors
