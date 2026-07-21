# PLAN_mypopup-backdrop-close — nextjs-shared

## Title
Add opt-in backdrop-click-to-close to MyPopup

## Plan
- [x] Add optional `closeOnBackdropClick?: boolean` prop to `MyPopup` (default `false`, preserving current behavior for every existing consumer including `MyConfirmDialog`) — clicking the overlay backdrop calls `onClose` only when the prop is `true`; clicking the panel itself must never trigger it (stopPropagation on the inner panel)
- [x] Document the new prop in `CONSUMING_PROJECTS.md`'s `MyPopup` section (currently only listed in the components summary table, no dedicated props section — add one, matching the style used for `MyConfirmDialog`/`MySelect`)
- [x] Type-check with `npx tsc --noEmit`

## Changes

### src/components/MyPopup.tsx
- Added `closeOnBackdropClick?: boolean` prop, default `false`. Overlay `<div>` gets `onClick={closeOnBackdropClick ? onClose : undefined}`; the inner panel `<div>` now always calls `e.stopPropagation()` on click so a click on the panel content never bubbles up to trigger the backdrop close, regardless of the prop's value. Default `false` means every existing consumer (`MyConfirmDialog`, and any other current `MyPopup` usage) is unaffected — the behavior is opt-in.

### CONSUMING_PROJECTS.md
- Added a `MyPopup` props section (previously only listed in the components summary table, no dedicated section) documenting all props including the new `closeOnBackdropClick`, placed after `MyCheckbox`'s section.

### Not done in this task (separate project, out of scope for this session)
- Wiring `closeOnBackdropClick` into richard-dashboard's `AppCard.tsx` `MyPopup` usage (the original motivating case) — that's a richard-dashboard change, needs a separate Claude Code session per project isolation. Instructions to give: add `closeOnBackdropClick` to the `<MyPopup>` call in the `AppCard.tsx` rewrite already provided in chat.
