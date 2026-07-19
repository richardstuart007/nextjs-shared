# PLAN_fix-backhomenav-label-leak — nextjs-shared

## Title
Fix MyBackHomeNav showing raw backPath as the visible label

## Plan
- [x] Add `backLabel?: string` to `MyBackHomeNav` Props in `src/components/MyBackHomeNav.tsx`
- [x] Render `← {backLabel ?? 'Back'}` instead of `← {backPath}`
- [x] Update `CONSUMING_PROJECTS.md` (MyBackHomeNav section) to document the new `backLabel` prop and the `Back` default text

## Changes
### src/components/MyBackHomeNav.tsx
- Added optional `backLabel?: string` prop
- Back link text now renders `backLabel ?? 'Back'` instead of the raw `backPath`, which could leak query-string details in the UI

### CONSUMING_PROJECTS.md
- Documented the new `backLabel` prop and the `Back` default text for the MyBackHomeNav section
