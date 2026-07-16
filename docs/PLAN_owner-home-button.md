# Plan: Owner route home button

## Plan
- [x] In `src/UI/OwnerLayout.tsx`, add a Home link (`href='/'`) alongside the existing back link.
      When `backPath === '/'`, show only the Home link (no duplicate). Otherwise show both.
- [x] Update the `OwnerLayout` row in `CONSUMING_PROJECTS.md` to mention the Home link.
- [x] Reorder the links so Home renders first and back second.

## Changes

### src/UI/OwnerLayout.tsx
- Added a Home link (`⌂ Home`, `href='/'`) next to the existing back link.
- When `backPath === '/'`, the back link is suppressed so only Home shows (avoids a duplicate link to the same place).
- Wrapped both links in a `flex gap-3` container.
- Reordered so Home renders first, back link second (when present).

### CONSUMING_PROJECTS.md
- Updated the `OwnerLayout` description and panel-components table row to document the new Home link and the back-link suppression behavior.
