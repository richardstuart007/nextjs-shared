# PLAN_tab-navigation-back-button — nextjs-shared

## Title
Robust back navigation — back-path tracking plus OwnerPage's own tab persistence

## Plan
- [x] Add `saveBackNav(key: string)` / `useBackNav(key: string): string | null` — new file
      `src/components/useBackNav.ts`. `saveBackNav` stores `pathname + search` under `key` in
      sessionStorage, called at a row/link click site before navigating away. `useBackNav` reads
      and clears it on mount of the return page, for feeding into `MyBackHomeNav`'s `backPath`.
      Generalizes the hand-rolled `NB_BACK_FROM_KEY` pattern in next-bridge's `PlayerPageClient.tsx`.
      This is the only piece of "which page state to restore" that belongs in nextjs-shared — it's
      purely the back-navigation path, not page content state.
- [x] Add an optional `persistKey?: string` prop to `OwnerPage` (`src/UI/OwnerPage.tsx`) — when
      provided, `OwnerPage` persists/restores its own active tab via sessionStorage (implemented
      inline inside `OwnerPage`, not as a separately-exported generic hook, since `OwnerPage` is
      the only thing that needs it) instead of plain `useState`. Omitting the prop keeps today's
      behavior (tab resets to `tabs[0]`) — backward compatible for existing `OwnerPage` callers.
      In scope because `OwnerPage` itself is the shared component that owns tab switching; fixing
      its own forgetfulness is not something a consuming project can reach in from outside.
- [x] Explicitly out of scope for nextjs-shared: persisting filters, pagination, or which row was
      last selected/highlighted, and persisting active-tab state for any `MyTab` usage outside
      `OwnerPage` (e.g. `PlayerPageClient`'s own `activeTab`/`historyView` tabs). All of that is
      consumer-local state defined by each project, not a shared component — each project persists
      it however suits its own state shape, the way `PlayerPageClient` already does by hand.
- [x] Build a live demo in this project's own dev app so the feature can be verified in the
      browser before any consuming project adopts it:
      - Set `persistKey='owner-main'` on the top-level `OwnerPage` in `src/app/owner/page.tsx` —
        dogfoods tab persistence on the real `/owner` navigation, not a synthetic stand-in.
      - Add a new "Back Nav Demo" tab (alongside Logging/Cache/Versions/Components/Generate Data)
        containing a small fake list of rows; each row calls `saveBackNav('backnav-demo')` then
        navigates to a detail route. **Deviation from the original step text:** the detail route
        was built at `src/app/backnav-test/[id]/page.tsx` (outside `/owner`), not
        `src/app/owner/backnav-test/[id]/page.tsx` as originally written — `CONSUMING_PROJECTS.md`
        already documents that pages under `/owner` must not render their own `MyBackHomeNav`
        because `OwnerLayout` supplies one automatically, which would have conflicted with
        demonstrating `useBackNav`'s own `MyBackHomeNav` usage. The standalone route replicates
        `OwnerLayout`'s dev-only gate (`NEXT_PUBLIC_APPENV_ISDEV`) inline instead.
      - The detail route calls `useBackNav('backnav-demo')` and renders `MyBackHomeNav` with the
        restored path, plus the clicked row's id so the round trip is visibly verifiable.
      - Manual test: open `/owner` → "Back Nav Demo" tab → click a row → confirm the detail page
        shows the right row id → click Back → confirm landing back on `/owner` with "Back Nav
        Demo" still the active tab.
- [x] Register `useBackNav` in `package.json` `exports`.
- [x] Bump `package.json` version per release rules.
- [x] Document `useBackNav` (signature + usage example) and the `OwnerPage` `persistKey` prop in
      `CONSUMING_PROJECTS.md`, including the explicit note that filter/pagination/row-selection/
      non-OwnerPage-tab persistence is a per-project concern, not provided by nextjs-shared.
- [x] Record in this project's `.claude/CLAUDE.md` "Outstanding items" that adopting `useBackNav`
      in consuming projects (e.g. next-bridge's `PlayerPageClient` refactor to use it instead of
      its hand-rolled `NB_BACK_FROM_KEY`, and any other project's list pages that want back-path
      restoration) is out of scope for this session — project isolation means that work happens in
      a Claude Code session opened in each consuming project.

## Changes

### src/components/useBackNav.ts (new)
- Added `saveBackNav(key)` and `useBackNav(key)` — sessionStorage-backed save/restore-and-clear
  of the exact path (incl. query string) to return to after navigating into a detail page.
- **Bugfix found during manual testing:** the Back link never appeared on the demo detail page —
  React Strict Mode (default-on for the App Router in dev) double-invokes effects, so the
  original unguarded effect ran its destructive read-and-clear twice: the first invocation read
  the correct path and removed it from sessionStorage, the second invocation immediately read
  `null` (already removed) and overwrote `backPath` with it. Fixed with a `readRef` guard so the
  read-and-clear only executes once per mount.

### src/UI/OwnerPage.tsx
- Added optional `persistKey?: string` prop. When provided, active tab is persisted to
  sessionStorage and restored on mount, using the same restore/save/mark-complete effect
  ordering pattern already established in next-bridge's `PlayerPageClient.tsx` (restore effect →
  guarded save effect → mark-restored effect, in that declaration order) so the initial render's
  default tab never clobbers a previously-saved value. Omitting the prop keeps prior behavior.

### src/UI/OwnerBackNavDemo.tsx (new)
- New `OwnerPage` tab: renders 3 demo rows; clicking one calls `saveBackNav('backnav-demo')` then
  navigates to `/backnav-test/[id]`. Exports `BACKNAV_DEMO_KEY` so the detail route uses the same
  key rather than duplicating the literal string.

### src/app/backnav-test/[id]/page.tsx (new)
- Demo detail route. Calls `useBackNav(BACKNAV_DEMO_KEY)` and renders `MyBackHomeNav` with the
  restored path. Lives outside `/owner` (see plan deviation note above) and replicates
  `OwnerLayout`'s `NEXT_PUBLIC_APPENV_ISDEV` dev-only gate inline since it isn't wrapped by
  `OwnerLayout`.

### src/app/owner/page.tsx
- Added `persistKey='owner-main'` to the top-level `OwnerPage` and a new "Back Nav Demo" tab
  wired to `OwnerBackNavDemo`.

### package.json
- Registered `./useBackNav` export. Bumped version 2.1.43 → 2.1.44 per release rules.

### CONSUMING_PROJECTS.md
- Documented `OwnerPage`'s `persistKey` prop, and added a `useBackNav` row to the UI Components
  table plus a full usage section (save at click site / restore on detail-page mount), including
  the note that it must not be used under `/owner` (conflicts with `OwnerLayout`'s own back link)
  and that it only tracks the return path, not filters/pagination/selected-row state.

### .claude/CLAUDE.md
- Added a "`useBackNav` adoption" entry under "Cross-project, not yet handed off to any project"
  — rollout into consuming projects (starting with next-bridge's `PlayerPageClient.tsx`) is out of
  scope for this session per project isolation.

## Testing
- [x] User runs:
      npm run locallocal
- [x] Open /owner, click the "Back Nav Demo" tab
- [x] Click "Row Two" — confirm it navigates to a detail page showing "You clicked row 2"
- [x] Click the "Back Nav Demo" link on the detail page — confirm it returns to /owner with the
      "Back Nav Demo" tab still active (not reset to "Logging")
- [x] Switch to a different tab (e.g. "Components"), reload the page — confirm "Components" stays
      active after reload (persistKey survives a full page reload, not just client navigation)
- [x] Open a couple of other tabs (Logging, Cache, Versions, Generate Data) — confirm they still
      render normally with no regressions from the OwnerPage changes
