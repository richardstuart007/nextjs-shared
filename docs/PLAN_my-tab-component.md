# PLAN_my-tab-component — nextjs-shared

## Title
MyTab component

## Plan
- [x] Create `src/components/MyTab.tsx` — single tab button primitive, two visual variants (`underline` / `pill`), active state controlled by the caller (no internal tab-group state), following the exact code given in the task description, including the four exported default-class constants (`MyTab_underlineActiveClass_Shared`, `MyTab_underlineInactiveClass_Shared`, `MyTab_pillActiveClass_Shared`, `MyTab_pillInactiveClass_Shared`) and `overrideClass` merged via `myMergeClasses`
- [x] Register the export in `package.json`'s `"exports"` map:
  ```
  "./MyTab": "./src/components/MyTab.tsx",
  ```
- [x] Update `CONSUMING_PROJECTS.md` — add `MyTab` to the UI Components section (same style as existing `MyButton`/`MySelect` entries), with a usage example showing both `underline` and `pill` variants
- [x] Update this package's own `.claude/CLAUDE.md` — add `MyTab` to the "UI Components" export bullet list
- [x] Bump the version number in `package.json` (per this package's release rules, so npm doesn't serve a stale cached copy)
- [x] Run `npx tsc --noEmit` to confirm it type-checks
- [x] Add project-wide-wrapper flexibility to `MyTab` — four `defaultClass`-style override props (`underlineActiveClass`, `underlineInactiveClass`, `pillActiveClass`, `pillInactiveClass`), each defaulting to its matching `_Shared` constant, mirroring `MyButton`'s `defaultClass` pattern at per-combination granularity (confirmed via AskUserQuestion)
- [x] Update `CONSUMING_PROJECTS.md`'s `### MyTab props` table to document the four new props
- [x] Bump the version number in `package.json` again
- [x] Run `npx tsc --noEmit` to confirm it still type-checks
- [x] Convert `src/UI/OwnerPage.tsx`'s inline tab `<button>` to `MyTab` (`variant='underline'`), passing `underlineActiveClass="pb-2 border-b-2 border-gray-900 text-gray-900 font-medium"` and `underlineInactiveClass="pb-2 text-gray-500 hover:text-gray-700"` so the `/owner` page's visual appearance is unchanged (confirmed via AskUserQuestion — keep current gray/black look, not MyTab's default blue)
- [x] Run `npx tsc --noEmit` to confirm it still type-checks
- [ ] Visually verify `/owner` tab bar in the browser — same appearance as before, tab switching still works (user testing manually, server not started by Claude)
- [x] Add a `MyTab` tab to `src/UI/OwnerComponentTest.tsx` (so `MyTab` is testable at `/owner/components` alongside the other component tabs) — new `MyTabTab()` following the existing `ThreeSection` (Props | Display | Returns) pattern: controls for `label`, `variant` (`underline`/`pill` select), `overrideClass`, `rest props`; preview renders `<MyTab>` with an internal `active` toggle-on-click (mirrors `MyToggleTab`'s controlled-preview pattern, since `MyTab`'s active state is caller-owned); returns show `active`, `variant`, and the computed `className`. Added `{ label: 'MyTab', content: <MyTabTab /> }` to the tabs array
- [x] Run `npx tsc --noEmit` to confirm it still type-checks

## Changes

### src/components/MyTab.tsx
- New file — `MyTab` single tab button primitive, `underline`/`pill` variants, caller-controlled `active` state, `overrideClass` merged via `myMergeClasses`. Exports four default-class constants (`MyTab_underlineActiveClass_Shared`, `MyTab_underlineInactiveClass_Shared`, `MyTab_pillActiveClass_Shared`, `MyTab_pillInactiveClass_Shared`).

### package.json
- Added `"./MyTab": "./src/components/MyTab.tsx"` to the `exports` map.
- Bumped version `2.1.25` → `2.1.26` so npm doesn't serve a stale cached copy to consuming projects.

### CONSUMING_PROJECTS.md
- Added `MyTab` row to the UI Components summary table.
- Added a `### MyTab props` section with the props table, exported constants list, and a usage example for both variants.

### .claude/CLAUDE.md
- Added `MyTab` to the "UI Components" export bullet list.

`npx tsc --noEmit` ran clean with no errors.

### src/components/MyTab.tsx
- Added four override props — `underlineActiveClass`, `underlineInactiveClass`, `pillActiveClass`, `pillInactiveClass` — each defaulting to its matching `_Shared` constant. `variant`/`active` select which one is used as the base for `myMergeClasses`, giving consuming projects the same project-wide-wrapper pattern as `MyButton`'s `defaultClass`, at per-combination granularity (shape confirmed via AskUserQuestion — 4 separate props over a single unified `defaultClass`).

### package.json
- Bumped version `2.1.26` → `2.1.27`.

### CONSUMING_PROJECTS.md
- Added the four new props to the `### MyTab props` table.
- Added an `AppTab` project-wide wrapper example showing `pillActiveClass` override, matching the existing `AppButton` example style.

`npx tsc --noEmit` ran clean with no errors.

### src/UI/OwnerPage.tsx
- Converted the inline tab `<button>` to `MyTab` (`variant='underline'`), passing `underlineActiveClass`/`underlineInactiveClass` overrides so the `/owner` page's tab bar keeps its existing gray/black look (confirmed via AskUserQuestion — not MyTab's default blue).

`npx tsc --noEmit` ran clean with no errors.

### src/UI/OwnerComponentTest.tsx
- Added `MyTabTab()` — new component test tab for `MyTab`, following the existing `ThreeSection` (Props | Display | Returns) pattern used by every other component tab. Controls: `label`, `variant` (`underline`/`pill` select via `MySelect`), `overrideClass`, `rest props`. Preview renders `<MyTab>` with a click-to-toggle `active` state (mirrors `MyToggleTab`'s controlled-preview pattern). Returns show `active`, `variant`, computed `className`, and any parsed rest props.
- Added `{ label: 'MyTab', content: <MyTabTab /> }` to the `OwnerComponentTest` tabs array, so it's testable at `/owner/components`.

`npx tsc --noEmit` ran clean with no errors.
