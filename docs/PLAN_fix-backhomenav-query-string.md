# PLAN_fix-backhomenav-query-string — nextjs-shared

## Title
Fix MyBackHomeNav strict path comparison to ignore query strings

## Plan
- [x] Compare only the pathname portion of `backPath` and `homePath` (strip `?query`) instead of the full string, so a query-string variant of the home route doesn't render a redundant Back link

## Changes
### src/components/MyBackHomeNav.tsx
- Changed the Back-link visibility check from `backPath !== homePath` to compare `backPath.split('?')[0] !== homePath.split('?')[0]`, so `backPath='/?highlight=74167'` vs `homePath='/'` is correctly treated as the same page. Fixes a live incident in the chess project where analyzing a game and clicking Back showed a redundant, unfriendly `← /?highlight=74167` link.
