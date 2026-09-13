# PLAN_logging-table-bug — nextjs-shared

## Title
logging table bug. Error fetching logging: "table_fetch_pages_filtered, Table(xlg_logging) SQL(SELECT * FROM xlg_logging WHERE lg_level = 'e' ORDER BY lg_lgid DESC LIMIT 40 OFFSET 0) FAILED"

## Plan
- [x] Root cause: the "Level" column filter (`lg_level`, a numeric log-level column) in
      `src/UI/OwnerTableLogging.tsx` renders as a plain `MyInput type='text'`, so any text can be
      typed in — including `e`, which produces `WHERE lg_level = 'e'` and fails against the
      numeric column. (Distinct from the "Severity" column, `lg_severity`, which correctly holds
      'E'/'W'/'I' letters and already accepts text.)
- [x] In `src/UI/OwnerTableLogging.tsx`: import `MyInputNumeric` from `../components/MyInputNumeric`
- [x] Change `level` state from `useState('')` to `useState<number | ''>('')`, and the matching
      `prevFilters.current.level` initial value
- [x] Replace the Level column's `MyInput type='text'` (lines ~139-146) with `MyInputNumeric`,
      using `integerOnly` (no `min`), calling `setlevel(v ?? '')` on change
- [x] Confirm the `{ column: 'lg_level', value: level, operator: '=' }` filter push in
      `fetchdata()` still type-checks with `level: number | ''`
- [x] `npx tsc --noEmit` to verify
- [x] Found during testing: `e` can still be typed into the `MyInputNumeric`-based Level filter and
      is never visually cleared, including on blur. Root cause is in
      `src/components/MyInputNumeric.tsx` itself (shared component, affects every consumer): a
      native `type='number'` input sanitizes an invalid string like `"e"` to `""` on the `.value`
      IDL property, but the browser keeps showing the raw typed text in the box; since React state
      (`displayValue`) is already `''`, `setDisplayValue('')` is a no-op and React never re-pushes
      a value to the DOM node, so the stale "e" stays visible indefinitely (app state `level`
      itself does stay `''` — this is a visual defect, not the original SQL bug recurring). Fix: in
      `handleChange`, when `raw === ''`, also explicitly set `e.target.value = ''` to force the
      native element to actually discard the invalid text, bypassing React's bail-out.
- [x] Found on further testing: `e` (and untested but same class: `E`, `+`) still gets typed and
      sticks in the field — the `e.target.value = ''` fix above only clears it after the fact, and
      isn't reliably clearing the native edit buffer in all browsers. Refined root cause: native
      `type='number'` inputs allow `e`/`E`/`+`/`-`/`.`/digits as raw keystrokes (chars that could
      form valid scientific notation, e.g. `1e5`); `handleKeyDown` already blocks `-` (and `.` when
      `integerOnly`) but never blocked `e`/`E`/`+` — that's the actual gap letters like `q`/`r`/`z`
      don't have, since the browser blocks those outright as not part of any valid number syntax.
      Fix: block `e`/`E`/`+` in `handleKeyDown` the same way `-` already is — `MyInputNumeric` was
      never meant to accept scientific notation, so there's no case where these should be typable.
- [x] User requirement, stated directly: only `0`-`9` should be accepted, plus the decimal point
      when it's allowed (`!rejectDecimalPoint`) — nothing else. Replace the current blocklist
      approach in `handleKeyDown` (block `-`/`e`/`E`/`+`/`.`-when-integer, whack-a-mole prone) with
      a strict allowlist: allow only digit keys, `.` when decimals are permitted, and the
      navigation/editing keys needed for usability (Backspace, Delete, Tab, arrow keys, Home, End,
      Enter) plus Ctrl/Cmd-held shortcuts (copy/paste/select-all) — block every other keystroke.
- [x] User requirement, stated directly: strip bad characters (including blanks) out of the value
      entirely, leaving just the concatenated good characters — including stripping the decimal
      point when it's not allowed. The keydown allowlist above only guards single keystrokes; it
      doesn't cover paste, drag-and-drop, or IME input, which can insert a whole string at once.
      Add a `sanitizeRaw` step at the top of `handleChange` that strips every character that isn't
      `0`-`9` (and, when decimals are permitted, keeps only the first `.` and strips any others),
      forcing `e.target.value` to the cleaned string when it differs from the raw input so the box
      reflects the stripped result rather than stale pasted text. Keydown allowlist stays in place
      as a first line of defense; this is the paste/IME-safe backstop.

## Changes
### src/UI/OwnerTableLogging.tsx
- Imported `MyInputNumeric`.
- Changed `level` filter state from `string` to `number | ''` (and the matching
  `prevFilters.current.level` initial value) since `lg_level` is a numeric column.
- Replaced the Level column's `MyInput type='text'` with `MyInputNumeric` (`integerOnly`, no
  `min`) — the browser's native number-input sanitization reduces a bare non-numeric keystroke
  like `e` to an empty string before it ever reaches state, so it can no longer produce
  `WHERE lg_level = 'e'` and fail the query.

### src/components/MyInputNumeric.tsx
- In `handleChange`, when the browser sanitizes an invalid keystroke (e.g. a bare `e`) to `''`,
  now also explicitly sets `e.target.value = ''` — forces the native input to actually discard
  the stale invalid text it was still displaying, instead of leaving it stuck on screen (React
  was bailing out of the DOM write since its own tracked state was already `''`). Fixes every
  consumer of `MyInputNumeric`, not just the Level filter.
- In `handleKeyDown`, also blocks `e`/`E`/`+` keystrokes (alongside the existing `-` block) —
  the actual root-cause fix: native `type='number'` inputs treat those as legal partial
  scientific-notation characters, which this component never intended to support, so they were
  reaching the field even though letters like `q`/`r`/`z` were already blocked by the browser.
  This is what stops `e` from being typed in the first place, rather than only clearing it after
  the fact.
- Updated the `3) CHANGE HISTORY` entry (2026-09-13) to describe the combined fix.
- `handleKeyDown` rewritten from a blocklist to a strict allowlist: only digit keys, `.` (when
  decimals are permitted), navigation/editing keys (Backspace, Delete, Tab, arrows, Home, End,
  Enter), and Ctrl/Cmd-held shortcuts pass through — every other keystroke is blocked, per the
  user's explicit "only 0-9, plus decimal point if allowed" requirement.
- Added a `sanitizeRaw` helper: strips every character that isn't `0`-`9` (and, when decimals are
  permitted, keeps only the first `.`, stripping any others) from the raw change-event text.
  `handleChange` now runs this first and forces `e.target.value` to the cleaned string when it
  differs — covers paste/drag-drop/IME input, which the keydown allowlist can't guard since those
  paths don't fire individual keystroke events.
- Updated the `3) CHANGE HISTORY` entry (2026-09-13) to describe the sanitizeRaw addition.

## Testing
- [ ] Open the nextjs-shared dev app's Owner Logging tab (Table_Logging / OwnerTableLogging),
      click into the Level filter box, and confirm only digits `0`-`9` can be typed — every other
      key (`e`, `E`, `+`, `-`, `.`, letters, symbols) is rejected outright and never appears
- [ ] Confirm Backspace, Delete, Tab, arrow keys, Home/End, and copy/paste/select-all
      (Ctrl/Cmd shortcuts) still work normally in the Level filter
- [ ] Confirm typing a whole number (e.g. `1`) into the Level filter still filters the rows to
      that `lg_level` correctly, with no error
- [ ] Confirm the Severity filter (the adjacent column, unaffected by this change) still accepts
      letters (e.g. `E`) as before
- [ ] On the Components demo tab (`/owner` → Components → MyInputNumeric), with `integerOnly`
      off (decimals allowed), confirm a single `.` can still be typed and digits still work —
      general regression check that the allowlist rewrite didn't break decimal entry for other
      consumers of the shared component
- [ ] On that same demo tab, paste `12a b3.4.5` into the field and confirm it's reduced to just
      `123.45` (or, with `integerOnly` on, to `123`) instead of showing the raw pasted garbage
