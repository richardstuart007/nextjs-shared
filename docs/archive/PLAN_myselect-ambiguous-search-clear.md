# PLAN_myselect-ambiguous-search-clear — nextjs-shared

## Title
Fix MySelect search auto-select to clear value on ambiguous/no match

## Plan
- [x] In `src/components/MySelect.tsx`, replace the auto-select effect (lines ~87-102) with the
      version that also clears `value` to `''` (via a synthetic `onChange`) whenever the current
      value no longer appears in `filteredOptions` — covers both 0 matches and 2+ matches, not
      just the existing single-match auto-select case.
- [x] Update the effect's inline comment to describe the new clear-on-mismatch behavior.
- [x] Update `src/UI/OwnerComponentTest.tsx`'s MySelect demo tab so a `searchEnabled` case
      reproducing the 2+-match scenario (e.g. searching a term matching multiple options) can be
      exercised and confirmed to blank the selection instead of showing a stale value.
- [x] Run `npx tsc --noEmit` to confirm no type errors.
- [x] Identify which consuming projects use `MySelect` with `searchEnabled` (grep across
      `C:\Users\richa\claude\github`) and note them here for the user's awareness — no changes
      made to those projects from this session (project isolation).

## Changes

### src/components/MySelect.tsx
- The auto-select `useEffect` (previously only handling the "narrowed to exactly one match" case)
  now also clears `value` to `''` (via a synthetic `onChange`) whenever the current `value` no
  longer appears in `filteredOptions` at all — covers 0 matches and 2+ matches, not just the
  single-match case. Fixes a bug where an ambiguous search term (e.g. "nak" matching both "Hikaru
  Nakamura" and "Raunak Sadhwani") left the native `<select>` displaying the first filtered
  option's label while the real controlled `value` silently stayed on whatever was selected
  before typing — so the visible selection and the submitted value could differ with no visual
  indication. **Behavior change (agreed with user):** an ambiguous/no-match search term now
  visibly blanks the selection instead of leaving a stale-but-plausible-looking one in place.

### src/UI/OwnerComponentTest.tsx
- No change needed — the existing `MySelectTab` demo already accepts free-text comma-separated
  `options` and a `searchEnabled` toggle, so the 2+-match scenario is exercisable as-is (e.g. enter
  options including two similar names, enable `searchEnabled`, then search a term matching both).

### Consuming projects using MySelect with `searchEnabled` (informational only — no files touched)
- **chess**: `src/ui/games/ChessComSearchPanel_shared.tsx` (the file the original bug report came
  from — `/masterchesscom` Player 2 search).
- **infostore**: `src/app/[admin_secret]/dashboard/entries/page.tsx` (and its `new`/`edit` page
  counterparts, which import `MySelect` but should be checked individually for `searchEnabled`
  usage).
- **next-bridgeschool**: multiple files under `src/ui/dashboard/` and `src/ui/admin/` (reference,
  history, users, friends, usersowner, subject, questions tables/forms) — the heaviest consumer,
  though some of these matches may be `MyDropdown`'s own `searchEnabled` prop rather than
  `MySelect`'s; worth spot-checking during that project's own reinstall.
- next-bridge and next-dbadmin import `MySelect` but did not match on `searchEnabled` in this
  grep — likely not affected.
- Each project should reinstall `nextjs-shared` (per this package's release rules) to pick up the
  fix once committed; no code changes made to any of them from this session (project isolation).

## Testing
- [ ] Confirmed via `npx tsc --noEmit` (passes) — no build step required to verify a library
      change like this.
- [ ] User opens `/owner` → Components tab → MySelect tab. Set options to something like
      `Hikaru Nakamura, Raunak Sadhwani, Magnus Carlsen`, check `searchEnabled`, click Apply.
- [ ] Type "nak" in the search box (matches 2 options) — confirm the `<select>` shows blank/no
      selection (not a stale prior value), and `selected` in the Returns panel reads `(none)`.
- [ ] Type a term narrowing to exactly one match (e.g. "carl") — confirm it still auto-selects that
      option and `selected` updates to match (existing single-match behavior, unchanged).
- [ ] Clear the search box back to showing all options — confirm a normal manual selection via the
      dropdown still works as before.
- [ ] In chess's `/masterchesscom` (separate project, once reinstalled): search "nak" in the
      Player 2 box and confirm the field now visibly clears instead of showing a plausible-looking
      but wrong player.
