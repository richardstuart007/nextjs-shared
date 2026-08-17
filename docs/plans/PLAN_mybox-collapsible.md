# PLAN_mybox-collapsible — nextjs-shared

## Title
MyBox change — add opt-in collapsible support

## Plan
- [x] `src/components/MyBox.tsx` — add opt-in collapsible support, modeled on next-bridgeschool's
      `SubjectSection.tsx` pattern (button-wrapped title + rotating `ChevronDownIcon`,
      `{isOpen && children}`). `@heroicons/react` (2.2.0) is already a dependency.
      - Add props: `collapsible?: boolean` (default `false`), `defaultOpen?: boolean` (default
        `true`), `toggleButtonClass?: string` (default `MyBox_toggleButtonDftClass`),
        `chevronClass?: string` (default `MyBox_chevronDftClass`)
      - Add `useState(defaultOpen)` for `isOpen`
      - When `collapsible && title`: render button-wrapped title with rotating
        `ChevronDownIcon`, and `{isOpen && children}`
      - Otherwise: existing behavior unchanged (`title && <h3>`, children always rendered)
- [x] `src/constants.ts` — add two new exported defaults:
      - `MyBox_toggleButtonDftClass = 'flex items-center gap-1 mb-2 w-full text-left'`
      - `MyBox_chevronDftClass = 'h-4 w-4 text-gray-500 transition-transform duration-200'`
- [x] Update `CONSUMING_PROJECTS.md` to document the new `collapsible` / `defaultOpen` /
      `toggleButtonClass` / `chevronClass` props on `MyBox`, per this project's standing rule to
      keep that file in sync with prop/export changes.
- [x] (Handled by `#commit`, not `#code`) Bump `package.json` patch version — `#commit` does this
      itself at step 6 of its pipeline, right before staging/committing, so a version bump never
      happens for changes that end up discarded instead of committed.
- [ ] User runs, in the chess project, after the version bump is pushed:
      Remove-Item -Recurse -Force node_modules
      Remove-Item -Force package-lock.json
      npm install
      Remove-Item -Recurse -Force .next
      npx tsc --noEmit
      npm run build
- [ ] Once the chess-side reinstall is confirmed, add chess-side usage
      (`collapsible`/`defaultOpen` on the 5 "Position Analysis" panels) as a further plan step —
      to be scheduled in a chess-project session (project isolation).
- [x] `src/UI/OwnerComponentTest.tsx` — add `collapsible` and `defaultOpen` controls to the
      `MyBoxTab` demo (checkboxes, matching the existing `disabled` checkbox pattern used by
      `MyInputTab`/`MyTextareaTab`) so the new behavior is visible/testable at
      `localhost:4020/owner` → Component Test → MyBox, without changing any other existing tab.

## Design rationale
- `collapsible` defaults to `false` and `title` is still required for the collapsible branch to
  trigger — every existing `MyBox` call site across every consuming project renders exactly as
  before, byte-for-byte unaffected.
- `defaultOpen` (default `true`) matches `SubjectSection.tsx`'s own default, so panels start
  expanded.
- New sub-elements (`toggleButtonClass`, `chevronClass`) get their own override props per this
  project's component-authoring convention (every hardcoded sub-element class needs an escape
  hatch).

## Changes

### src/components/MyBox.tsx
- Added `collapsible`, `defaultOpen`, `toggleButtonClass`, `chevronClass` props. When
  `collapsible && title`, renders a button-wrapped title with a rotating `ChevronDownIcon` and
  collapses `children` via `{isOpen && children}`, matching next-bridgeschool's
  `SubjectSection.tsx` pattern initially — then corrected per user feedback so the chevron sits on
  the right of the title (title first, chevron second, button uses `justify-between`), diverging
  from `SubjectSection.tsx`'s chevron-on-the-left layout. Non-collapsible usage (the default) is
  unchanged.

### src/constants.ts
- Added `MyBox_toggleButtonDftClass` (`'flex items-center justify-between gap-1 mb-2 w-full
  text-left'`) and `MyBox_chevronDftClass` default classes for the new collapsible toggle button
  and chevron icon.

### CONSUMING_PROJECTS.md
- Documented the four new `MyBox` props (`collapsible`, `defaultOpen`, `toggleButtonClass`,
  `chevronClass`) and the two new exported constants in the "MyBox props" section.

### package.json
- Bumped `2.1.67` → `2.1.68` at `#commit` time (step 6 of the commit pipeline), so npm serves the
  updated package to consuming projects on next install.

### src/UI/OwnerComponentTest.tsx
- Added `collapsible` and `defaultOpen` checkboxes to the `MyBoxTab` demo (`BoxProps` type +
  `boxDefaults` extended), so the new `MyBox` behavior is visible/testable at
  `localhost:4020/owner` → Component Test → MyBox. The preview `MyBox` is keyed on
  `collapsible`/`defaultOpen` so toggling `defaultOpen` and clicking Apply remounts it with the new
  initial open state (otherwise its internal `useState(defaultOpen)` wouldn't re-read the new
  value). Added matching `ReturnRow`s for both new props.

## Testing
- [ ] `npx tsc --noEmit` passes (already confirmed during this run — no errors).
- [ ] At `localhost:4020/owner` → Component Test → MyBox tab: with `collapsible` unchecked (the
      default), behavior is unchanged from before this plan.
- [ ] Check `collapsible`, click Apply — the title becomes a clickable button with a chevron;
      clicking it toggles the content open/closed and the chevron rotates.
- [ ] With `collapsible` checked, uncheck `defaultOpen`, click Apply — the box should render
      initially collapsed.
- [ ] Once pushed and reinstalled in chess (see remaining Plan steps below), confirm the 5
      "Position Analysis" panels collapse/expand correctly there.

Note: this run only covers the nextjs-shared side. The last two `## Plan` steps (chess reinstall
and chess-side usage) are intentionally left unchecked — they require pushing this change (via
`#commit`) and then a separate Claude Code session opened in the chess project (project isolation).
