# Changes — nextjs-shared, "version": "2.1.5"

## CONSUMING_PROJECTS.md
- Rewrote Section 7 (UI Components) to document the `defaultClass` / `*_dftClass_Shared` pattern for project-wide wrappers
- Added full props tables for MyButton, MyInput, MyTextarea, MyToggle, MyDropdown, MyCheckbox
- Updated MySelect props table to add missing `containerClass` and `defaultClass`
- Updated MyBox props table to add missing `defaultClass`
- Listed all exported `*_dftClass_Shared` constants for every component

## src/components/MyButton.tsx
- Added `cursor-pointer` to the default class array; coexists with `aria-disabled:cursor-not-allowed` since the variant-prefixed rule wins when the attribute is set

## src/chess/sync.ts
- Wrapped `insertRawGame` call in try/catch inside `syncArchive`; duplicate key errors now increment `skipped` instead of throwing, making concurrent cron instances idempotent
