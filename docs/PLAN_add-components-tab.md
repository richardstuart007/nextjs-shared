# PLAN_add-components-tab — nextjs-shared

## Title
UI changes: add Components tab to /owner (after Versions)

## Plan
- [x] Add a "Components" tab to `src/app/owner/page.tsx`, rendering `OwnerComponentTest`, positioned after the "Versions" tab
- [x] Delete the standalone `src/app/owner/components/page.tsx` route (and its now-empty `src/app/owner/components/` folder) — decided: Components is only reachable via the new tab on `/owner` going forward
- [x] Remove the leftover `/owner/components` extraLinks entry in `src/app/layout.tsx`'s `DevLayoutHeader` — it pointed at the now-deleted route
- [x] Add a new "Generate Data" tab to `src/app/owner/page.tsx` containing the "Generate Logs" and "Generate Cache" buttons (using the existing `action_generateLogs`/`action_generateCache` from `src/app/actions.ts`) — decided: the Logging/Cache tabs must stay an exact, unmodified replica of the shared `OwnerTableLogging`/`OwnerTableCache` components as rendered in consuming projects, so the generate buttons live in their own local-only tab instead of inside those shared components
- [x] Remove the "Generate Logs"/"Generate Cache" buttons and their related state from the home page (`src/app/page.tsx`)

## Changes
### src/app/owner/page.tsx
- Imported `OwnerComponentTest` and added a "Components" tab, positioned after "Versions"

### src/app/owner/components/page.tsx (deleted)
- Removed the standalone route along with the now-empty `components/` folder — its content (`OwnerComponentTest`) is now only reachable via the new tab on `/owner`

### src/app/layout.tsx
- Removed the `extraLinks={[{ href: '/owner/components', label: 'Components' }]}` prop passed to `DevLayoutHeader` — that header link pointed at the now-deleted route; `DevLayoutHeader` defaults `extraLinks` to `[]` so dropping the prop is equivalent

### src/app/owner/OwnerGenerateData.tsx (new)
- New local-only client component (not exported from the package — `package.json` only exports from `src/UI/`, `src/components/`, `src/tables/`) holding the "Generate Logs" and "Generate Cache" buttons, moved verbatim from the home page, calling the existing `action_generateLogs`/`action_generateCache`

### src/app/owner/page.tsx
- Imported `OwnerGenerateData` and added a "Generate Data" tab after "Components" — the Logging/Cache tabs remain untouched, exact replicas of what consuming projects render

### src/app/page.tsx
- Removed the "Generate Logs"/"Generate Cache" buttons and their state (`logMsg`, `cacheMsg`, handlers, action imports) — now just the bare page heading

## Testing
- [ ] Start the dev server and open /owner
- [ ] Confirm tabs read: Logging, Cache, Versions, Components, Generate Data (in that order)
- [ ] Click the Components tab and confirm it renders the full component-test suite (its own inner tab bar: MyButton, MyInput, MyTextarea, etc.) exactly as it did on the old /owner/components page
- [ ] Confirm navigating directly to /owner/components now 404s (route removed)
- [ ] Confirm the top dev header no longer shows a separate "Components" link next to "Owner"
- [ ] Click the Generate Data tab, click "Generate Logs", confirm it reports "N log entries written" and the Logging tab then shows new rows
- [ ] Click "Generate Cache", confirm it reports "N cache entries created" and the Cache tab then shows new entries
- [ ] Confirm the home page (/) no longer shows the Generate Logs/Generate Cache buttons
