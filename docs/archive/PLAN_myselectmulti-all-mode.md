# PLAN_myselectmulti-all-mode — nextjs-shared

## Title
MySelectMulti allow all selection

## Plan
- [x] Add `minSelected?: number` and `maxSelected?: number` props (both optional, undefined = no limit). `toggle()` refuses to remove a value that would drop `selected.length` below `minSelected` (silent no-op). For adding past `maxSelected`, see the swap-oldest rule below when `minSelected === maxSelected`; otherwise (a genuine range, `minSelected < maxSelected`, or `maxSelected` set with no `minSelected`) adding past the cap is a silent no-op — no disabled/greyed-out checkbox state either way.
- [x] Fixed-count swap: when `minSelected === maxSelected` and `selected.length === maxSelected`, clicking a new unselected item drops the oldest pick (`selected[0]` — the array's existing insertion order, since `toggle()` already appends new picks with `[...selected, value]` and removal uses `filter`, so no new state is needed to track this) and appends the new value at the end, instead of a no-op. This lets a fixed-count picker (e.g. `minSelected={2} maxSelected={2}`) stay changeable — direct uncheck is still blocked by `minSelected`, but picking a new item always works. Note: this "oldest" is insertion order, not the same as the floating-to-top *display* order (which is based on original `options` position) — the two can differ; that mismatch is accepted.
- [x] Clash with the "all selected = no filter" convention: when `maxSelected` is set below `options.length`, reaching "every option selected" is impossible by definition. In that case: the select-all row is not rendered, `selectAll()` is not reachable, and the trigger never shows `selectAllLabel`/"All" for the full-selection state (label always falls back to `${selected.length} selected`). This applies regardless of `mode` — it's a consequence of the cap, not a mode-specific rule.
- [x] Surface `minSelected`/`maxSelected` in the UI: when `maxSelected` is set, the trigger label shows `${selected.length}/${maxSelected} selected` instead of the plain `${selected.length} selected`. Additionally, whenever `minSelected` and/or `maxSelected` is set, add a `title` attribute to the trigger button describing the full constraint (e.g. `"Select 2"` when min===max, `"Select 2-4"` for a range, `"Select at least 2"`/`"Select up to 4"` when only one bound is set) so the detail is available on hover without cluttering the always-visible label.
- [x] Render the "select all" row (labelled `selectAllLabel`, default `'All'`) at the top of the panel unconditionally — in BOTH `mode='any'` and `mode='all'`, with no opt-out prop. Every existing caller gets this row automatically with no call-site changes. Clicking it always sets `selected` to every option's value. The "click one item while all are selected narrows to just that item" behavior stays scoped to `mode='all'` only — `mode='any'` keeps its existing plain add/remove toggle.
- [x] In `mode='all'`, when every option is currently selected, individual per-option checkboxes render as **unchecked** (not flagged), even though they're technically all in `selected` — only the top "All" row's checkbox shows ticked. Matches next-bridge's `StringMultiSelect` exactly (`checked={!allSelected && selected.has(opt)}`). Does not apply in `mode='any'` — there, checking every option manually is just a normal count state and each checkbox reflects `selected.includes(opt.value)` as today.
- [x] Add `mode?: 'any' | 'all'` prop to `MySelectMulti` (default `'any'`) — existing behavior unchanged when omitted
- [x] Add `selectAllLabel?: string` prop (default `'All'`)
- [x] Trigger label logic: in `mode='all'`, show `selectAllLabel` when every option is selected, otherwise `${selected.length} selected` (mirrors existing label logic, evaluated against full-selection instead of empty-selection)
- [x] Render a "select all" row at the top of the panel when `mode='all'`; clicking it sets `selected` to every option's value
- [x] In `mode='all'`, clicking an individual checkbox while everything is currently selected narrows selection to just that one item (not "all minus one") — matches next-bridge's local `StringMultiSelect` behavior being replaced
- [x] Suppress the `showReset`/reset-to-empty row when `mode='all'`, regardless of the `showReset` prop value
- [x] Confirm the "floating selected to top" behavior (from 04c1d04) still applies normally under `mode='all'`
- [x] Update `CONSUMING_PROJECTS.md` with the new `mode`/`selectAllLabel` props and their behavior
- [x] `npx tsc --noEmit` passes

## Changes
### src/components/MySelectMulti.tsx
- Added `mode?: 'any' | 'all'` prop (default `'any'`) and `selectAllLabel?: string` prop (default `'All'`); existing callers with no `mode` prop keep the original label/toggle semantics for empty-vs-full selection.
- Added `minSelected?: number` and `maxSelected?: number` props (both optional, undefined = no limit).
- Added `allSelected` (`selected.length === normalized.length`) and `canSelectAll` (`maxSelected === undefined || maxSelected >= normalized.length`) derived values.
- Rewrote `toggle()`: removing an item is a no-op if it would drop below `minSelected`; the existing `mode==='all' && allSelected` narrow-to-one path also respects `minSelected` before committing. Adding an item past `maxSelected` is a no-op, **unless** `minSelected === maxSelected`, in which case it swaps — drops `selected[0]` (oldest pick, by insertion order) and appends the new value, keeping the count pinned at the cap.
- Added `selectAll()` (guarded by `canSelectAll`) which sets `selected` to every option's value.
- `resetSelection()` is now a no-op when `minSelected > 0`, so `showReset` can't reset to a state that violates a configured minimum.
- Trigger label (`display`) now uses a shared `countLabel` (`${selected.length}/${maxSelected} selected` when `maxSelected` is set, else `${selected.length} selected`), branching on `mode` for the empty/full "no filter" text exactly as before.
- Added `constraintTitle`, a `title` attribute on the trigger button describing `minSelected`/`maxSelected` when either is set (`"Select N"`, `"Select N-M"`, `"Select at least N"`, `"Select up to M"`).
- The "select all" checkbox row now renders whenever `canSelectAll` is true, in **both** modes (previously gated on `mode === 'all'` only) — no opt-out prop, so every existing `mode='any'` caller gains this row automatically. It's hidden only when `maxSelected` makes full selection unreachable.
- Individual option checkboxes now render unchecked when `mode === 'all' && allSelected`, even though they're technically in `selected` — matches next-bridge's `StringMultiSelect` (`checked={!allSelected && selected.has(opt)}`) so the special "all selected" state isn't visually indistinguishable from every item being individually ticked.
- The reset row (`showReset`) stays suppressed in `mode === 'all'` regardless of the `showReset` value, unchanged from the earlier step.
- No changes to the selected/unselected partition or the floating-to-top divider — both apply unchanged under every new behavior.

### CONSUMING_PROJECTS.md
- Added `mode`, `selectAllLabel`, `minSelected`, `maxSelected` rows to the `MySelectMulti props` table.
- Rewrote the `mode` subsection to cover the unchecked-when-full checkbox behavior and the `maxSelected`-adjusted count label.
- Added a new "'Select all' row — always present, both modes" subsection.
- Added a new "`minSelected` / `maxSelected` — capping the selection count" subsection covering the no-op floor/ceiling, the fixed-count swap rule (with the insertion-order vs. floating-display-order caveat), the reset interaction, the all-selected clash, the count label, and the `title` tooltip — with a fixed-count usage example.

## Testing
- [ ] In a consuming project (e.g. next-bridge), swap one of `ClubSelect`/`EventTypeSelect`'s local `StringMultiSelect` for `MySelectMulti` with `mode='all'` and confirm: trigger shows "All" when everything is selected, unchecking one item shows "N selected", clicking any option while all are selected narrows selection to just that one, and none of the individual checkboxes appear ticked while in the "All" state
- [ ] Confirm every existing `mode='any'` call site now shows a new "All" select-all row at the top of the panel, and that clicking it selects every option
- [ ] Confirm no reset row appears in `mode='all'` even if `showReset` is passed `true`
- [ ] With `minSelected={2} maxSelected={2}`: confirm you can't uncheck down to 1 or 0 directly, and that clicking a third, unselected item swaps out the oldest of the current two instead of being rejected
- [ ] With `maxSelected` set below the option count (e.g. 2 of 5 options): confirm the "All" select-all row does not render, and the trigger label shows `N/2 selected`, never "All"
- [ ] Hover the trigger button with `minSelected`/`maxSelected` set and confirm the tooltip text matches (`"Select 2"`, `"Select 2-4"`, `"Select at least 2"`, `"Select up to 4"` as applicable)
- [ ] Confirm floating-selected-to-top still works under all the above (checking an item moves it above the divider; the "select all" row itself doesn't move)
- [ ] Confirmed via `npx tsc --noEmit` (passed) — no build step run in this session
