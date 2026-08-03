# PLAN_myselectmulti-floating-selections — nextjs-shared

## Title
MySelectMulti floating selections — when an item is selected, it should float to the top of the
checkbox panel; when deselected, it should sink back down to its normal position.

## Plan
- [x] **Scope note (agreed via chat):** this changes `MySelectMulti`'s default behavior for
      *every* consumer, not an opt-in — currently used in 4 files across 3 projects
      (`chess/src/ui/filters/FilterMultiCheckbox.tsx`,
      `next-bridge/src/ui/admin/DataTableShared.tsx`,
      `next-dbadmin/src/components/CopyTableConn.tsx`,
      `next-dbadmin/src/components/SchemaSyncConn.tsx`) — each will get the new floating-selection
      ordering automatically once that project reinstalls `nextjs-shared`. No consuming-project
      changes are needed for this to take effect (pure behavior change inside the shared
      component), but flagging the blast radius since it's a visible ordering change, not additive.
- [x] Add `MySelectMulti_selectedDividerClass = 'border-b border-gray-200 mb-1'` to
      `src/constants.ts` — a thin divider line between the floated-selected group and the
      unselected group below it (visually related to, but distinct from, the existing
      `showReset` button's own bottom-border styling).
- [x] `src/components/MySelectMulti.tsx`: replace the single `normalized.map(...)` list render
      with a stable partition:
      - `const selectedItems = normalized.filter(opt => selected.includes(opt.value))`
      - `const unselectedItems = normalized.filter(opt => !selected.includes(opt.value))`
      (both preserve their original relative order from `options` — a plain `.filter()` is
      already stable, so no explicit sort is needed)
      - Render order inside the open panel: reset button (unchanged, if `showReset` and
        `selected.length > 0`) → `selectedItems` checkboxes → divider (only when both
        `selectedItems.length > 0 && unselectedItems.length > 0`) → `unselectedItems` checkboxes.
      - No animation/transition — items snap to their new position instantly on toggle,
        consistent with the rest of this library having no animated components.
      - Checkbox `key`s stay `opt.value` — React reconciles the reorder correctly without any
        extra keying work.
- [x] Update `CONSUMING_PROJECTS.md`'s `MySelectMulti` section to document the floating-selection
      behavior (and the new divider constant).
- [x] Run:
      npx tsc --noEmit
- [x] Run:
      npm run build

## Changes

### src/constants.ts
- Added `MySelectMulti_selectedDividerClass = 'border-b border-gray-200 mb-1'`.

### src/components/MySelectMulti.tsx
- Split the panel's option render into `selectedItems`/`unselectedItems` (stable partition via
  `.filter()`, preserving each group's original relative `options` order). Render order: reset
  button (unchanged) → selected checkboxes → divider (only when both groups non-empty) →
  unselected checkboxes. No animation — instant reorder on toggle.

### CONSUMING_PROJECTS.md
- Documented the floating-selection behavior and the new `MySelectMulti_selectedDividerClass`
  constant in the `MySelectMulti` props section.

## Testing
- [ ] User runs:
      npm run locallocal
- [ ] Open `/owner` → Components → MySelectMulti tab (or any panel using it) and confirm: checking
      an option moves it to the top of the open panel above a thin divider line; unchecking it
      sinks it back to its original position among the unselected options (not to the bottom);
      both groups keep their original relative order; no divider shows when nothing is selected or
      everything is selected.
- [ ] Confirmed via `npx tsc --noEmit` and `npm run build` — both pass cleanly.
- [ ] Note for later: chess, next-bridge, and next-dbadmin will pick up this behavior change
      automatically the next time each reinstalls `nextjs-shared` — no action needed there unless
      you want to verify it live in one of those projects too.
