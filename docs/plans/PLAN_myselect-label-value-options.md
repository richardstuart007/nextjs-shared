# PLAN_myselect-label-value-options — nextjs-shared

## Title
Support label/value option objects in MySelect

## Plan
- [ ] `src/components/MySelect.tsx`: widen the `options` prop type from `string[]` to
      `string[] | { value: string; label: string }[]` (same union `MySelectMulti`'s `Option` type
      already uses), and add a `normalize` helper (`typeof opt === 'string' ? { value: opt, label: opt } : opt`)
      so existing flat-string usage is unaffected.
- [ ] Update `updatedOptions`/`filteredOptions` to work on normalized `{value,label}` objects —
      filter by `.label` (case-insensitive substring) instead of the raw string, and prepend
      `{ value: '', label: '' }` for `includeBlank` instead of `''`.
- [ ] Update the `<option>` render to `filteredOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)`.
- [ ] Update the auto-select-on-single-match `useEffect` (added in the earlier searchEnabled fix)
      to compare/set `filteredOptions[0].value` instead of the raw string.
- [ ] Update the MySelect tab in `src/UI/OwnerComponentTest.tsx`: add an `optionsMode: 'flat' | 'labelValue'`
      control, plus a second textarea for the label/value form ("Label,Value" per line, parsed via
      a new `parseLabelValueOptions` helper), so both option shapes are exercisable in the demo.
- [ ] Update `CONSUMING_PROJECTS.md`'s MySelect props table to document the widened `options` type.
- [ ] Bump the version in `package.json` per release rules.
- [ ] Run `npx tsc --noEmit` to verify.

## Changes
