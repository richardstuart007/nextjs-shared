# PLAN_myselect-label-value-options — nextjs-shared

## Title
Support label/value option objects in MySelect, as part of decommissioning MyDropdown

## Execution note
When `#code` runs on this plan, execute one `## Plan` checklist step at a time — pause and wait
for confirmation after each step before starting the next, rather than the usual uninterrupted
run-through.

## Background — why this plan exists

`MyDropdown` is being decommissioned in favor of `MySelect` (pre-supplied data) and
`MySelectTable` (fetches from a table). Before consuming projects can migrate off `MyDropdown`,
every gap between it and its two replacements has to be closed. This plan covers the
nextjs-shared side of that (steps 1-2 below); steps 3-5 are the full decommission scope, but
only step 3 (the usage survey) is actual work performed *in* this repo — steps 4 and 5 are
tracked here and executed elsewhere/later per project isolation (see "Deferred work" below).

### 1) Gap review — MyDropdown vs. MySelect/MySelectTable

- **MySelectTable**: already accepts `optionLabel`/`optionValue` against a fetched table — no
  label/value gap. Already a drop-in replacement for any `MyDropdown` call site using `table=`.
- **MySelect**: only accepts flat `options: string[]` — no way to give a value that differs from
  its displayed label. This is the real, confirmed gap (see survey below for real call sites that
  need it).
- **Single-option auto-collapse**: `MyDropdown` renders a plain `<p>` of the label (no `<select>`
  at all) when only one option exists. `MySelectTable` already has this (it's effectively a copy
  of `MyDropdown`), so every `table=` migration keeps it automatically. `MySelect` has no
  equivalent — considered adding it for parity, but decided against: no confirmed `tableData=`
  call site actually depends on a dynamic single-row result, so this stays out of scope rather
  than adding speculative behavior. Revisit only if a real call site turns out to need it.
- **Loading/empty states**: `MyDropdown` has these because it can fetch asynchronously (`table=`).
  `MySelect` only ever receives options synchronously via props, so there's no loading state to
  replicate, and the existing disabled "No options found" `<option>` already covers the empty
  case — not treated as a gap, not in scope here.

### 2) Fix the differences — nextjs-shared changes (this plan's `## Plan`)

See the checklist below.

### 3) Cross-project MyDropdown usage survey (read-only, done as part of this plan)

- **chess** — already fully migrated. `ChessBoardView.tsx`'s two former `MyDropdown` call sites
  (`chesscom-p1`/`chesscom-p2`) already use `MySelect` with flat string options (label === value
  for player names). The `.claude/CLAUDE.md` "Outstanding items" note claiming this is still
  pending is stale and needs correcting (tracked as a Plan step below, since that file is this
  project's own `.claude/CLAUDE.md`).
- **next-bridgeschool** — 34 `MyDropdown` call sites across 14 files, confirmed still present via
  a fresh grep (2026-08-21):
  - **26 sites pass `table=`** → straight rename to `MySelectTable`, no label/value gap, no
    dependency on this plan's MySelect change.
  - **8 sites pass `tableData=`** → need the widened `MySelect` `options` type from this plan.
    Spot-checked and confirmed label ≠ value in real cases: `formattedCountries` (country code as
    value, country name as label, `src/ui/dashboard/users/form.tsx:249`) and `LEVEL_OPTIONS`
    (`src/ui/admin/subject/form.tsx:181`, `src/ui/admin/subject/table.tsx:345`). The remaining 5
    (`User_limitMonths_Average_Options`, `Recent_usersReturned_Options`,
    `Recent_usersAverage_Options`, `Top_limitMonths_Options`, `Comparison_values`) all follow the
    same `{value, label}` shape and are assumed to need it too pending a closer look during the
    actual next-bridgeschool migration.
- **infostore, next-bridge, next-dbadmin, richard-dashboard** — no `MyDropdown` usage found.
  Already clear, matches the "fully done" notes already in `.claude/CLAUDE.md`.

### 4) Replace MyDropdown call sites in other projects — deferred, not this plan

Project isolation means the actual edits in next-bridgeschool must happen in a Claude Code
session opened in that project, not here. This plan's job is to leave nextjs-shared ready (the
widened `MySelect`) and leave an accurate, actionable note in `.claude/CLAUDE.md`'s Outstanding
items so that session has the exact file/line mapping (already present from the 2026-08-20 survey
— this plan corrects/confirms it, doesn't replace it).

### 5) Decommission MyDropdown — deferred until step 4 is confirmed complete

Cannot happen until next-bridgeschool's migration is done and re-verified (no consuming project
still imports `MyDropdown`). At that point: delete `src/components/MyDropdown.tsx`, remove its
export, remove its tab from `OwnerComponentTest.tsx`, and update `CONSUMING_PROJECTS.md`. Note
`MySelectTable` currently imports `MyDropdown_dftClass`/`MyDropdown_labelDftClass`/
`MyDropdown_searchDftClass` from `constants.ts` — those constants stay (only `MyDropdown.tsx`
itself and its own export/demo tab go), unless renaming them is separately agreed at that time.
Not part of this plan's `## Plan` checklist — tracked here for continuity, to be turned into its
own PLAN when step 4 is actually complete.

## Plan
- [x] `src/components/MySelect.tsx`: widen the `options` prop type from `string[]` to
      `string[] | { value: string; label: string }[]` (same union `MySelectMulti`'s `Option` type
      already uses), and add a `normalize` helper (`typeof opt === 'string' ? { value: opt, label: opt } : opt`)
      so existing flat-string usage is unaffected.
- [x] Update `updatedOptions`/`filteredOptions` to work on normalized `{value,label}` objects —
      filter by `.label` (case-insensitive substring) instead of the raw string, and prepend
      `{ value: '', label: '' }` for `includeBlank` instead of `''`.
- [x] Update the `<option>` render to `filteredOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)`.
- [x] Update the auto-select-on-single-match `useEffect` (added in the earlier searchEnabled fix)
      to compare/set `filteredOptions[0].value` instead of the raw string.
- [x] Update the MySelect tab in `src/UI/OwnerComponentTest.tsx`: add an `optionsMode: 'flat' | 'labelValue'`
      control, plus a second textarea for the label/value form ("Label,Value" per line, parsed via
      a new `parseLabelValueOptions` helper), so both option shapes are exercisable in the demo.
- [x] Update `CONSUMING_PROJECTS.md`'s MySelect props table to document the widened `options` type.
- [x] Update `.claude/CLAUDE.md`'s Outstanding items: correct the stale chess entry (already
      migrated — replace with a done note), and confirm/refresh the next-bridgeschool entry against
      this plan's survey (26 `table=` sites → `MySelectTable`, 8 `tableData=` sites → `MySelect`
      once this plan ships).
- [x] Bump the version in `package.json` per release rules.
- [x] Run `npx tsc --noEmit` to verify. Final pass, clean, after all steps above.

## Changes

### src/components/MySelect.tsx
- Widened the `options` prop from `string[]` to a new exported `MySelectOption[]` type
  (`string | { value: string; label: string }`), so a caller can now show one thing and submit
  another — the confirmed gap vs. `MyDropdown`.
- Added `normalizeOption()`, converting a plain string to `{ value: opt, label: opt }` and passing
  a `{value,label}` object through unchanged — existing flat-string call sites are unaffected.
- `updatedOptions`/`filteredOptions`, the `<option>` render, and the search-narrows-to-one
  auto-select effect all now operate on normalized `{value,label}` objects instead of raw strings.

### src/UI/OwnerComponentTest.tsx
- Added `parseLabelValueOptions()` (parses "Label,Value" per line, matching the existing
  `parseTableData` convention already used elsewhere in this file).
- `MySelectTab`: added an `optionsMode` (`flat` | `labelValue`) radio control and a
  `labelValueOptions` textarea, so both `MySelect` option shapes can be exercised in the demo.
- Manually tested in the browser: `flat` mode behaves exactly as before; `labelValue` mode shows
  labels in the dropdown while the `selected` return value reflects the underlying value —
  confirmed working by the user.

### CONSUMING_PROJECTS.md
- Documented `MySelect`'s widened `options` prop (`MySelectOption[]`, string or `{value,label}`,
  mixable), the label-based search-filter behavior, and the `{value:'',label:''}` blank option.

### .claude/CLAUDE.md
- Corrected the stale chess Outstanding-items note: `ChessBoardView.tsx`'s 2 `MyDropdown` call
  sites were already migrated to `MySelect` (re-verified against current file contents) — the
  "New, unfixed" framing was leftover from before that migration happened.
- Refreshed the next-bridgeschool note: re-confirmed the 34-call-site survey via a fresh grep, and
  noted that the 8 `tableData=` sites are now unblocked by this plan's `MySelect` change.

### package.json
- Bumped version 2.1.74 → 2.1.75 per release rules, so consuming projects pick up the change on
  their next reinstall.

### ~/.claude/hooks/claude-md-permission.js (out of band — permission-config fix, not part of this plan's original scope)
- Narrowed the auto-allow rule: a project's own `.claude/CLAUDE.md` is still auto-allowed with no
  prompt, but the global `~/.claude/CLAUDE.md` is now explicitly excluded and falls through to the
  normal ask flow. Came up because editing this project's `.claude/CLAUDE.md` (a plan step above)
  surfaced that the existing hook didn't distinguish the two.

## Testing
- [ ] `/owner` → Components → MySelect: with `optionsMode = flat`, confirm behavior is unchanged
      from before (comma-separated options, label === value).
- [ ] Same tab, switch to `optionsMode = labelValue`, edit the textarea, click Apply, and confirm
      the dropdown shows labels while the `selected` return value shows the underlying value.
- [ ] Confirm `searchEnabled`/`includeBlank` still work correctly together with `labelValue` mode
      (search filters by label; the blank option still appears and is selectable).
- [ ] Confirm existing flat-string `MySelect` call sites elsewhere (e.g. chess's `ChessBoardView.tsx`
      player pickers) still behave identically after upgrading to this version — no visible change
      expected since flat strings are unaffected.
- [ ] `npx tsc --noEmit` passes with no errors (already verified above, re-check if desired).
