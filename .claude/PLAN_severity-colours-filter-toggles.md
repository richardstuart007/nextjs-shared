# PLAN_severity-colours-filter-toggles — nextjs-shared

## Title
severity colour coding and filter toggles for version mismatches

## Plan
- [x] Add `versionDiff` helper (major/minor/patch/same)
- [x] Add `filterMajor/Minor/Patch` state
- [x] Replace legend with clickable toggle buttons (amber/orange/red)
- [x] Apply severity bg+text colour to mismatched cells; bold when filtered off

## Changes
### src/UI/OwnerSyncVersions.tsx
- Added `versionDiff` helper: compares two version strings and returns major/minor/patch/same
- Added `filterMajor`, `filterMinor`, `filterPatch` state (all default true)
- Replaced the plain "Version mismatch" legend entry with three clickable toggle buttons — Major (red), Minor (orange), Patch (amber) — active when highlighted, grey when off
- Non-URL mismatched cells now show severity background (bg-red-100 / bg-orange-100 / bg-yellow-100) and matching text colour; when a severity is toggled off the cell shows bold grey text instead
