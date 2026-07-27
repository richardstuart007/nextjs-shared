# PLAN_tab-update-on-navigation — nextjs-shared

## Title
tab update on navigation — MyBackHomeNav can't distinguish tabs on the same route

## Plan
- [x] Add `nuqs` as a dependency of `nextjs-shared` (via safe-install)
- [x] Fix `MyBackHomeNav.tsx` comparison to stop stripping query strings before comparing `backPath`/`homePath`
- [x] Add new shared hook `useTabQueryState` (built on `nuqs`) for syncing a tabbed component's active tab into the URL query string, exported from `package.json`
- [x] Bump `package.json` version
- [x] Document `MyBackHomeNav` fix behavior and `useTabQueryState` usage in `CONSUMING_PROJECTS.md`
- [x] Verify with `npx tsc --noEmit`

## Changes

### package.json
- Added `nuqs` (2.9.2, exact-pinned to match this project's other dependency versions) to `dependencies`.
- Added `"./useTabQueryState": "./src/components/useTabQueryState.ts"` to `exports`.
- Bumped version `2.1.45` → `2.1.46` (per this repo's release rule — prevents npm serving a stale cached copy to consuming projects).

### src/components/MyBackHomeNav.tsx
- Fixed the Back-link visibility check: it previously stripped query strings (`backPath.split('?')[0] !== homePath.split('?')[0]`) before comparing, so any `backPath` sharing the same pathname as `homePath` was always treated as "same as home," even when only the query string differed. Now compares the full strings (`backPath !== homePath`), so a same-pathname-different-tab `backPath` (e.g. `/?tab=rankings` vs. `/`) is correctly treated as distinct and renders the Back link. Backward-compatible: existing callers passing a `backPath` on a genuinely different route already differed at the pathname level and are unaffected — only the same-pathname case changes (from always-suppressed to correctly-shown).

### src/components/useTabQueryState.ts (new)
- New hook wrapping `nuqs`'s `useQueryState` — syncs a tabbed component's active tab to a URL query param (`paramName`), with a `defaultValue` used when the param is absent. Returns nuqs's own `[value, setValue]` tuple. Relies on nuqs's defaults (shallow update, `history: 'replace'`, `scroll: false`, `clearOnDefault: true`) rather than overriding any of them — those defaults already match what this plan needed (no full navigation/scroll jump on tab switch, clean URLs when on the default tab).

### CONSUMING_PROJECTS.md
- Added `useTabQueryState` row to the UI Components table.
- Added a note to the `MyBackHomeNav` prop docs explaining the fixed same-pathname/different-query behavior.
- Added a new "useTabQueryState — syncing a tabbed component's active tab to the URL" section: the required one-time `NuqsAdapter` root-layout setup (nuqs's own requirement, not something `nextjs-shared` needs to provide), a usage example replacing a local `useState` for tab switching, and how it combines with `saveBackNav`/`useBackNav`/`MyBackHomeNav` to round-trip the active tab through a detail-page navigation and back.

## Testing
- [ ] In a scratch/local check, confirm `npx tsc --noEmit` and `npm run build` both still pass in `nextjs-shared` itself (already re-verified via `tsc --noEmit` during this run — `npm run build` not run separately since no app-facing route in this package's own dev app was touched).
- [ ] Adopt `useTabQueryState` in next-bridge's `HomePageClient.tsx` (Players/Sessions/Rankings tabs) from a next-bridge Claude Code session — this plan only builds the shared piece; wiring it into a real consumer is out of scope here (project isolation).
- [ ] After that adoption: click into a detail page from the Rankings tab, then click "← Back" — confirm it returns to the Rankings tab specifically (not just `/`), and that "⌂ Home" still returns to the page's default tab.
- [ ] Confirm switching tabs updates the address bar (`?tab=...`) without a full page reload or scroll jump, and that browser back/forward + a hard reload restore the correct tab from the URL.
- [ ] Confirm reinstalling `nextjs-shared` in each consuming project (`Remove-Item -Recurse -Force node_modules`, `Remove-Item -Force package-lock.json`, `npm install`) still builds cleanly, since this bump adds a new transitive dependency (`nuqs`) to all of them.
