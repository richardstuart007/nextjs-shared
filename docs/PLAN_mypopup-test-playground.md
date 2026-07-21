# PLAN_mypopup-test-playground — nextjs-shared

## Title
Add closeOnBackdropClick toggle to the MyPopup component-test playground

## Plan
- [x] Add a `closeOnBackdropClick` checkbox control to `MyPopupTab` in `src/UI/OwnerComponentTest.tsx`, wired through to the preview `MyPopup` instance, so the new prop can actually be exercised from `/owner/components` (currently the playground never passes it at all, stuck on the `false` default)
- [x] Verify in browser: with the toggle on, clicking the backdrop closes the popup; with it off (default), it doesn't — matches the fix already confirmed working at the component level, now testable from the UI
- [x] Note (not actioned, out of scope): `MyConfirmDialog` doesn't forward `closeOnBackdropClick` to its internal `MyPopup` at all — `MyConfirmDialogTab` has no prop to add a toggle for. A separate task if backdrop-click-to-cancel on confirm dialogs is wanted.

## Changes

### src/UI/OwnerComponentTest.tsx
- `PopupControlProps` gained `closeOnBackdropClick: boolean` (default `false`, matching `MyPopup`'s own default).
- `MyPopupTab`'s controls form gained a `closeOnBackdropClick` checkbox (same draft/Apply pattern as the other controls in this tab — checkbox updates `draft`, `Apply` copies it into `applied`), wired to the preview `<MyPopup closeOnBackdropClick={applied.closeOnBackdropClick}>`.
- Added a `closeOnBackdropClick` row to the Returns panel so the applied value is visible alongside `isOpen`/`panelClass`.
- Verified in a real browser via Playwright: toggle off (default) — clicking the backdrop leaves the popup open (`isOpen: true`, matches original bug report). Toggle on + Apply — clicking the backdrop closes it (`isOpen: false`). Close X button confirmed visible in both cases. No console errors.
- Confirmed `MyConfirmDialog` does not forward `closeOnBackdropClick` to its internal `MyPopup` — `MyConfirmDialogTab` has no equivalent prop to expose a toggle for. Left as a separate, unactioned item.
