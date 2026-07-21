# PLAN_help-components-close-behavior — nextjs-shared

## Title
Add close X and outside-click-close to MyHelp and MyHelpStep (not MyHelpField)

## Plan
- [x] `MyHelp` — add a close "×" button (as a new `closeButtonClass` override prop, following this package's sub-element override convention) and close-on-outside-click (`ref` + `mousedown` listener, same pattern already used in chess's `FilterMultiCheckbox`). This is unconditional default behavior, not an opt-in prop — every existing `MyHelp` usage gets both.
- [x] `MyHelpStep` — expose its existing hardcoded "×" close button as a new `closeButtonClass` override prop (currently hardcoded inline, violating the sub-element override convention) and add the same outside-click-close behavior.
- [x] `MyHelpField` — no change. Confirmed out of scope: it's a hover-triggered tooltip (`onMouseEnter`/`onMouseLeave`), not a click-to-open popover, so it already closes on mouse-leave and has no click-open state to add an X or outside-click-close to.
- [x] Update `CONSUMING_PROJECTS.md`'s `MyHelp` and `MyHelpStep` props sections with the new `closeButtonClass` prop and the outside-click-close behavior.
- [x] Type-check with `npx tsc --noEmit`
- [x] ~~`MyHelpStep` — reduce the default panel width from `w-[min(2000px,90vw)]` to `w-[min(640px,90vw)]`~~ — superseded by the step below after live comparison against `MyHelp`'s own strategy.
- [x] `MyHelpStep` — switch to `MyHelp`'s exact width strategy: drop `left-0` and the explicit `w-[...]`, use `max-w-xl` alone so the panel shrink-to-fits its content (capped at 36rem) instead of always rendering at a fixed width. Confirmed visually for short content (clean, no wasted space, matches `MyHelp`'s look); long-content/wrapping behavior not verified by Claude — user will test that directly.

## Changes

### src/components/MyHelp.tsx
- Added `closeButtonClass?: string` prop (default `MyHelp_closeButtonDftClass_Shared`, new exported constant). Panel now has a header row (`flex justify-between items-start`) with the optional title on the left and a "×" close button on the right, always rendered.
- Added a `ref` + `mousedown` document listener (same pattern as chess's `FilterMultiCheckbox`) so clicking anywhere outside the component closes the panel. Unconditional — no prop to opt out, per explicit instruction.

### src/components/MyHelpStep.tsx
- The previously-hardcoded "×" close button's class is now the `closeButtonClass?: string` prop (default `MyHelpStep_closeButtonDftClass_Shared`, new exported constant, same value as before) — fixes a pre-existing violation of this package's sub-element-override-prop convention.
- Added the same `ref` + `mousedown` outside-click-close behavior as `MyHelp`.

### CONSUMING_PROJECTS.md
- Added dedicated `MyHelp` and `MyHelpStep` props sections (previously only listed in the summary table), documenting all props including the new `closeButtonClass`, and explicitly noting both behaviors are unconditional/always-on rather than opt-in. Also noted why `MyHelpField` intentionally has neither.

### Verification
- Started the nextjs-shared dev server and tested both components live in a browser via Playwright at `/owner/components`: `MyHelp` and `MyHelpStep` both show a visible "×" and both close when clicking outside the panel. No console errors.

### src/components/MyHelpStep.tsx (width revision)
- `MyHelpStep_panelDftClass_Shared` changed from a fixed `w-[min(640px,90vw)]` (itself a prior reduction from the original `w-[min(2000px,90vw)]`, copied from chess's 9-step `PipelineHelp.tsx`) to `max-w-xl` alone, with `left-0` also removed — now shrink-to-fits content the same way `MyHelp`'s panel already does, rather than always rendering at a fixed width regardless of content.
- `OwnerComponentTest.tsx`'s `helpStepDefaults.panelClass` updated to match (it holds its own literal copy of the default, shadowing the component's actual default via an explicit prop — same reason the earlier 640px value needed updating there too).
- `CONSUMING_PROJECTS.md`'s `MyHelpStep` section updated with a note on the width strategy.
- Confirmed via Playwright: short-content case renders cleanly, matching `MyHelp`'s visual pattern. Long-content/wrapping behavior was not verified — user will test manually, per instruction to stop testing without being asked.
