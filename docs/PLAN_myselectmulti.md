# PLAN_myselectmulti — nextjs-shared

## Title
Build MySelectMulti — compact checkbox-dropdown multi-select component

## Plan
- [x] Create `src/components/MySelectMulti.tsx`: checkbox-dropdown multi-select (trigger button showing "All"/"N selected", click-to-open panel of checkboxes, closes on outside click), following MySelect's default styling family and this package's component-authoring conventions (`overrideClass` merge via `myMergeClasses`, exposed `labelClass`/`containerClass`/`panelClass`, `id`/`htmlFor` linking, `aria-haspopup`/`aria-expanded`/`role='listbox'`/`aria-multiselectable`)
- [x] Add `./MySelectMulti` export entry to `package.json`
- [x] Document `MySelectMulti` in `CONSUMING_PROJECTS.md`
- [x] Type-check with `npx tsc --noEmit`

## Changes

### src/components/MySelectMulti.tsx
- New component: compact checkbox-dropdown multi-select. Options accepted as `string[]` or `{value,label}[]` (same convention as `MySelect`/chess's `FilterMultiCheckbox`). Trigger button shows "All" or "N selected"; panel opens on click, closes on outside `mousedown`. Styled with `MySelectMulti_dftClass_Shared` (matches `MySelect`'s `h-6 md:h-8`/`border-blue-500`/`rounded-md` family) merged via `myMergeClasses`. Exposes `labelClass`/`containerClass`/`panelClass` overrides and derives `id` from `label` for `htmlFor` linking, per this package's component-authoring conventions. Adds `aria-haspopup`/`aria-expanded` on the trigger and `role='listbox'`/`aria-multiselectable` on the panel — accessibility attributes the chess/next-dbadmin local reimplementations this formalizes don't currently have.

### package.json
- Added `"./MySelectMulti": "./src/components/MySelectMulti.tsx"` export entry, alongside `./MySelect`.

### CONSUMING_PROJECTS.md
- Added `MySelectMulti` to the components summary table and a full props section (with usage example) after `MySelect`'s section, noting the distinction from the existing `MyCheckbox` (always-expanded, dedicated form space) vs. this one (collapsed, filter-bar use).

### Not done in this task (separate projects, out of scope for this session)
- Swapping `MySelectMulti` into its actual candidate call sites — chess's `FilterMultiCheckbox.tsx`, next-bridge's `BuildDataViewer.tsx` `FMultiSelect`, and next-dbadmin's `SchemaSyncConn.tsx`/`CopyTableConn.tsx` status filters — requires separate Claude Code sessions in those projects, per project isolation. Instructions can be written on request, same as done earlier for next-bridgeschool/chess/next-bridge fixes.
