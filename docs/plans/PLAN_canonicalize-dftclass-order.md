# PLAN_canonicalize-dftclass-order — nextjs-shared

## Title
Rewrite every *_dftClass constant into myMergeClasses' canonical token order

## Plan
- [x] For each of the 14 `*_dftClass` constants in `src/constants.ts` (`MyBox`, `MyButton`, `MyDropdown`, `MyHourGlass`, `MyInput`, `MyInputNumeric`, `MyLink`, `MyPagination`, `MyPaginationFooter`, `MyPopup`, `MySelect`, `MySelectMulti`, `MyTextarea`, `MyToggle`), rewrite the class-token order so the constant's own literal text already matches what `myMergeClasses(constant, '')` produces — verified via a throwaway script (diff of sorted token sets, confirming no class added/dropped), computed 2026-09-12:
  - `MyPagination_dftClass`, `MySelectMulti_dftClass` — already canonical, no change
  - The other 12 — reordered (see `## Changes` for the exact before/after once written)
- [x] Run `npx tsc --noEmit` to verify
- [x] User verifies visually in the browser (`/owner` Components tab) — not done by Claude this round, per user's own choice

## Changes

### src/constants.ts
- Rewrote 12 of the 14 `*_dftClass` constants (`MyBox`, `MyButton`, `MyDropdown`, `MyHourGlass`, `MyInput`, `MyInputNumeric`, `MyLink`, `MyPaginationFooter`, `MyPopup`, `MySelect`, `MyTextarea`, `MyToggle`) so their own literal class-token order already equals `myMergeClasses(constant, '')` — i.e. the raw constant and the "merged with empty overrideClass" result are now byte-identical, eliminating the cosmetic reordering `ClassInfo` was showing on every tab even when nothing was actually being overridden. `MyPagination_dftClass` and `MySelectMulti_dftClass` were already canonical.
- Verified via a throwaway script (removed after use): for each constant, compared the sorted token set before/after to confirm zero classes were added or dropped, then confirmed `myMergeClasses(constant, '') === constant` for all 14 post-edit.
- `MyToggle_dftClass` (the largest, 20 tokens) ends up with its track/dot styling interleaved by Tailwind property category rather than by visual element — a genuine readability tradeoff in the source file, accepted because the `ClassInfo` display (the only place these constants are actually read) must show a valid, non-misleading "no-op merge," which matters more than source-file prose grouping.

## Testing
- [ ] Open the `/owner` dev app's Components tab for each of the 12 changed components (`MyBox`, `MyButton`, `MyDropdown`, `MyHourGlass`, `MyInput`, `MyInputNumeric`, `MyLink`, `MyPaginationFooter`, `MyPopup`, `MySelect`, `MyTextarea`, `MyToggle`) — confirm the `ClassInfo` block's "constant" line and "merged (+ overrideClass)" line are now textually identical when `overrideClass` is left blank
- [ ] Visually confirm each of those 12 components still renders identically to before (no styling regression) — the token set didn't change, only its order
- [ ] Confirmed via `npx tsc --noEmit` (passes clean)
