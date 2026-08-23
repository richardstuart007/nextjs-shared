# PLAN_xrtg-routing-update — nextjs-shared

## Title
Add update (edit-in-place) capability to the xrtg_routing UI

## Plan
- [x] Add an Edit button to each row in the "Routing (xrtg_routing)" table in `src/UI/OwnerDbRouting.tsx`
- [x] Clicking Edit turns that row's Table (MyInput) and DbKey (DbKeySelect) into editable fields, with Save/Cancel replacing the Delete button
- [x] Save calls `table_update` on `rtg_rtgid`, updating `rtg_table`/`rtg_dbkey`; on success, reloads rows and exits edit mode; on failure (e.g. unique constraint on `rtg_table`), surfaces the error via the existing `routingMessage` pattern and stays in edit mode
- [x] Cancel discards in-progress edits and exits edit mode without calling the API
- [x] Update `CONSUMING_PROJECTS.md` to document the new update capability on the DB Routing tab
- [x] Split `src/UI/OwnerDbRouting.tsx` into two components: `src/UI/OwnerRoutingMaintenance.tsx` (xrtg_routing write/edit-in-place/delete only) and `src/UI/OwnerRoutingTest.tsx` (ttst_test write/delete only, not exported); delete the old `OwnerDbRouting.tsx`
- [x] Export `OwnerRoutingMaintenance` in `package.json` as `./OwnerRoutingMaintenance`, so consuming projects can import it into their own `/owner` page
- [x] Update nextjs-shared's own `src/app/owner/page.tsx`: replace the single "DB Routing" tab with two tabs — "Routing Maintenance" (`OwnerRoutingMaintenance`) and "Routing Test" (`OwnerRoutingTest`)
- [x] Update `CONSUMING_PROJECTS.md`: document `OwnerRoutingMaintenance` as a new exportable Owner panel for consuming projects to add to their own `/owner` page; note `OwnerRoutingTest` is nextjs-shared-internal only
- [x] Add `OwnerRoutingMaintenance` as a row in `CONSUMING_PROJECTS.md`'s "Available owner panel components" reference table (around line 1486), alongside `OwnerTableLogging`/`OwnerTableCache`/`OwnerTableSessionStorage`
- [x] Restructure nextjs-shared's own `src/app/owner/page.tsx`: top-level tabs become Logging, Cache, Session Storage, Routing Maintenance, Testing (in that order) — Routing Maintenance moves to directly after Session Storage
- [x] Create `src/app/owner/OwnerTestingTabs.tsx` (local, not exported) that renders a nested `<OwnerPage persistKey='owner-testing' tabs={[...]} />` containing: Versions, Components, Constants, Generate Data, Back Nav Demo, Routing Test — everything that isn't Logging/Cache/Session Storage/Routing Maintenance
- [x] `/owner/page.tsx`'s "Testing" tab renders `<OwnerTestingTabs envValues={envValues} />`, passing through the env values `OwnerConstants` needs
- [x] Remove the "Testing" tab from `src/app/owner/page.tsx` entirely — top-level tabs become just Logging, Cache, Session Storage, Routing Maintenance; delete `src/app/owner/OwnerTestingTabs.tsx`
- [x] Create `src/app/test/layout.tsx` — dev-only guarded shell (same pattern as `OwnerLayout`: redirect to `/` and render null when `NEXT_PUBLIC_APPENV_ISDEV !== 'true'`), with a `MyBackHomeNav` back to `/`
- [x] Create six route pages under `src/app/test/`, each rendering one existing testing component: `versions/page.tsx` (`OwnerSyncVersions`), `components/page.tsx` (`OwnerComponentTest`), `constants/page.tsx` (`OwnerConstants`, reading `envValues` from `process.env`), `generate-data/page.tsx` (`OwnerGenerateData`), `back-nav-demo/page.tsx` (`OwnerBackNavDemo`), `routing-test/page.tsx` (`OwnerRoutingTest`)
- [x] Update `src/app/page.tsx` (home page) to render a dev-only-guarded menu of links to the six `/test/*` routes
- [x] Fix the home page test-menu links stretching full width: add `overrideClass='w-40'` to each `MyLink` in `src/app/page.tsx`
- [x] Render `<OwnerGenerateData />` directly on `src/app/page.tsx` (below the menu), remove "Generate Data" from the `TEST_LINKS` menu, and delete the now-unused `src/app/test/generate-data/page.tsx` route

## Changes
### src/UI/OwnerRoutingMaintenance.tsx (new)
- Split out of `OwnerDbRouting.tsx` — the `xrtg_routing` write/edit-in-place/delete panel only (fetch/add/edit/save/cancel/delete for routing rows), unchanged in behavior from what was built for the earlier update-capability steps.
- Exported in `package.json` as `./OwnerRoutingMaintenance`, so consuming projects can import it directly.

### src/UI/OwnerRoutingTest.tsx (new)
- Split out of `OwnerDbRouting.tsx` — the `ttst_test` write/delete panel only, used to verify multi-database routing actually reaches the database a table is routed to. Not exported (nextjs-shared-internal only, same category as the other testing tools).

### src/UI/OwnerDbRouting.tsx (deleted)
- Replaced by the two components above.

### package.json
- Added `"./OwnerRoutingMaintenance": "./src/UI/OwnerRoutingMaintenance.tsx"` to `exports`.

### src/UI/DbKeySelect.tsx, src/constants.ts
- Updated stale comments referencing the old `OwnerDbRouting`/"DB Routing tab" name.

### CONSUMING_PROJECTS.md
- Replaced the "Managing routing rows" note to document `OwnerRoutingMaintenance` as an exportable Owner panel (with an import/usage snippet) instead of the old internal-only "DB Routing" tab; noted the routing test tool is nextjs-shared-internal only.
- Added `OwnerRoutingMaintenance` as a row in the "Available owner panel components" reference table.

### src/app/owner/page.tsx
- Now only the production/maintenance panel: top-level tabs are Logging, Cache, Session Storage, Routing Maintenance. No more Testing tab — all shared-package testing/dev tools moved out to standalone `/test/*` routes (see below), since they're relevant only within this project, not something consuming projects model their own `/owner` page on.

### src/app/test/layout.tsx (new)
- Dev-only guarded shell for the new `/test/*` route family, mirroring `OwnerLayout`'s guard (redirects to `/` and renders null unless `NEXT_PUBLIC_APPENV_ISDEV === 'true'`), with a `MyBackHomeNav` (Home-only, no separate Back link needed since these routes are reached directly from `/`).

### src/app/test/versions/page.tsx, components/page.tsx, constants/page.tsx, generate-data/page.tsx, back-nav-demo/page.tsx, routing-test/page.tsx (new)
- One route per testing/dev tool, each rendering the existing component (`OwnerSyncVersions`, `OwnerComponentTest`, `OwnerConstants`, `OwnerGenerateData`, `OwnerBackNavDemo`, `OwnerRoutingTest`) that previously lived as a sub-tab of the now-removed `OwnerTestingTabs`.

### src/app/page.tsx
- Home page now renders a dev-only-guarded menu of links to the `/test/*` routes (using `MyLink`), replacing the previously-empty page.
- Each `MyLink` now passes `overrideClass='w-40'` — without it, the links stretched to the full width of the `flex flex-col` `<ul>` (default `align-items: stretch`) instead of sizing to their text.
- `OwnerGenerateData` (the "Generate Logs"/"Generate Cache" buttons) is now rendered directly on `/`, below the menu — since it's just two buttons, a dedicated route was unnecessary overhead. Removed "Generate Data" from the `TEST_LINKS` menu accordingly.

### src/app/test/generate-data/page.tsx (deleted)
- No longer needed — `OwnerGenerateData` is now rendered directly on `/` instead of behind its own route.

## Testing
- [ ] Open `/owner` and confirm only four tabs remain: Logging, Cache, Session Storage, Routing Maintenance — no Testing tab
- [ ] On "Routing Maintenance": click Edit on an existing routing row, change the DbKey via the dropdown, click Save — confirm the row updates and the edit fields close
- [ ] On "Routing Maintenance": click Edit, change the Table name to one that collides with another existing row's Table, click Save — confirm an error message appears (unique constraint) and the row stays in edit mode
- [ ] On "Routing Maintenance": click Edit, change a field, then click Cancel — confirm the row reverts and no update is sent
- [ ] On "Routing Maintenance": confirm Add and Delete still work as before
- [ ] Open `/` and confirm a menu with five links appears: Versions, Components, Constants, Back Nav Demo, Routing Test — no "Generate Data" link
- [ ] Click each link and confirm it renders the correct tool at its own route (`/test/versions`, `/test/components`, `/test/constants`, `/test/back-nav-demo`, `/test/routing-test`), with a "⌂ Home" link back to `/`
- [ ] On `/` itself, below the menu, confirm the "Generate Logs" and "Generate Cache" buttons appear and work (each shows a status message after clicking)
- [ ] On `/test/routing-test`: confirm writing and deleting `ttst_test` rows still works as before
- [ ] Set `NEXT_PUBLIC_APPENV_ISDEV` to anything other than `'true'` (or check prod behavior) and confirm `/` shows no test menu and any direct `/test/*` URL redirects to `/`
- [ ] In a consuming project, after pulling the updated `nextjs-shared` package, confirm `import OwnerRoutingMaintenance from 'nextjs-shared/OwnerRoutingMaintenance'` resolves and renders correctly when added to that project's own `/owner` page
