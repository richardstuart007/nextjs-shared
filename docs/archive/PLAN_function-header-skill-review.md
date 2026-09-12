# PLAN_function-header-skill-review — nextjs-shared

## Title
Review of function-header skill

## Plan
- [x] `~/.claude/CLAUDE.md` — "Function comment headers" section: remove the helper-function
      judgment-call carve-out ("a short, self-explanatory helper... needs only the title"). Every
      helper function's header must always include `Parameters:` and `Returns:` analysis, same as
      the main numbered header — a sub-section is omitted only when genuinely empty (no params, or
      nothing meaningful returned), never skipped just because the helper "seemed simple enough."
- [x] `nextjs-shared`'s own `.claude/CLAUDE.md` — mirror the identical change in its own
      "Function header comments" section (this project duplicates the convention verbatim).
- [x] `~/.claude/skills/function-headers/SKILL.md` step 5 — remove the "Title alone doesn't convey
      purpose" judgment call entirely; every helper always gets the fuller
      description + `Params:`/`Returns:` treatment, not just a bare title comment.
- [x] `~/.claude/skills/function-headers/SKILL.md` — clarify that `#code` itself (not only a
      standalone "check headers"/`#audit` pass) is responsible for bringing the header of any
      function it actually adds or edits up to the full standard, scoped to that function only —
      not a full-file or project-wide sweep triggered just because `#code` happened to touch the
      file for an unrelated change.
- [x] Re-read all three edited files back to confirm the carve-out language is fully gone and the
      three documents agree with each other.

### Project-wide header audit (added after the standard above was agreed)
Every function in this project is consumed by other projects, so it gets held to the full
standard just adopted above — no title-only helpers anywhere. Scope: all 90 source files under
`src/`. 77 already have a numbered main header (helpers still need checking); 13 have no numbered
main header at all — `constants.ts`, `structures.ts`, `table_pages/page_constants.ts`,
`tableGeneric/table_comparison_values.ts`, `table_pages/buildSqlQuery.ts`,
`table_pages/tableFetchUtils.ts`, `cache/cache_actions.ts`, `cache/userCache_store.ts`,
`app/actions.ts`, `UI/OwnerSyncVersions_actions.ts`, `components/isSelectionFiltering.ts`,
`components/useBackNav.ts`, `tables/db.ts` — each confirmed individually as a genuine
multi-export module (no numbered header applies) rather than skipped by assumption; every
function inside still gets the full helper treatment. Batched by directory, `npx tsc --noEmit`
after each batch:
- [x] Audit & fix headers: `src/components/` (every `.ts`/`.tsx` file)
- [x] Audit & fix headers: `src/UI/` (every `.ts`/`.tsx` file)
- [x] Audit & fix headers: `src/tables/tableGeneric/` (excluding `table_pages/`)
- [x] Audit & fix headers: `src/tables/tableGeneric/table_pages/`
- [x] Audit & fix headers: `src/tables/cache/`, plus `src/tables/db.ts` and
      `src/tables/structures.ts`
- [x] Audit & fix headers: `src/app/` (every route/layout/actions file)
- [x] Audit & fix headers: `src/constants.ts` — no functions in this file (constants only), nothing
      to audit
- [x] Final `npx tsc --noEmit` across the whole project to confirm no batch introduced a break

## Changes

### C:\Users\richa\.claude\CLAUDE.md
- "Function comment headers" section: helper-function paragraph no longer treats `Params:`/
  `Returns:` as "when warranted" — they're always analyzed and included, omitted only when
  genuinely empty. Added an explicit floor: the description/purpose itself is never optional
  (every function states its purpose, via the title's own text or a fuller description line) —
  only `Params:`/`Returns:` may be omitted, and only when empty.

### c:\Users\richa\claude\github\nextjs-shared\.claude\CLAUDE.md
- Mirrored the identical change in this project's own "Function header comments" section (helper
  functions), keeping the two documents in agreement.

### C:\Users\richa\.claude\skills\function-headers\SKILL.md
- Procedure step 5: removed the "Title alone doesn't convey purpose" judgment call — every helper
  now always gets title + description + `Params:`/`Returns:`, with a sub-section omitted only when
  genuinely empty. Updated the "Missing entirely" / "title-only" / "ad hoc form" / "already
  complete" sub-bullets to match (a title-only comment is no longer ever "complete").
- Top summary line and checklist item updated to match the same standard.
- "Before starting" step 2/3: split scope determination into a standalone-request case (unchanged)
  vs. an as-part-of-`#code` case — `#code` completing a function's header is scoped to just the
  function(s) it touched, not a file-wide or project-wide sweep, and doesn't need the standalone
  large-pass `#plan`/`#code` confirmation gate (it's already inside an agreed plan step).
- "What NOT to do" bullet on the project-wide `#plan`/`#code` gate clarified to say it governs
  standalone passes only, not `#code` completing a header it's already editing.

### Project-wide header audit (all 90 files under src/)
Run as 5 parallel batches; 4 initially hit a session-wide rate limit partway through and were
resumed once capacity returned (no duplicate work — each resume was told exactly which files in
its batch were already done). `npx tsc --noEmit` passed clean after every batch and again for the
whole project at the end.

- **`src/tables/tableGeneric/` (19 files, excl. `table_pages/`)** — all already fully compliant,
  no changes needed anywhere in this batch.
- **`src/tables/tableGeneric/table_pages/`, `src/tables/cache/`, `src/tables/db.ts`,
  `src/tables/structures.ts` (10 files)** — `src/tables/db.ts`: replaced `sql()`'s old ad hoc
  comment with a full numbered `1) DESCRIPTION` header. `page_constants.ts` and `structures.ts`:
  confirmed no functions present, nothing to audit. The other 7 files were already fully
  compliant.
- **`src/UI/` (16 files)** — `OwnerComponentTest.tsx`: added the missing `Params: e — the form's
  submit event...` line to all 24 identical `handleApply` helper comments (one `replace_all`
  edit). The other 15 files were already fully compliant, including `OwnerSyncVersions_actions.ts`
  (correctly left without a numbered header — multi-export actions module).
- **`src/app/` (14 files)** — added a `Parameters:` sub-section (either omitted or stated
  explicitly as "none", both accepted as valid per your call mid-run) to every page/layout/action
  component that had zero props but hadn't had that sub-section analyzed before:
  `backnav-test/[id]/page.tsx`, `owner/OwnerGenerateData.tsx`, `owner/functiontest/page.tsx`,
  `owner/page.tsx`, `page.tsx`, `test/back-nav-demo/page.tsx`, `test/components/page.tsx`,
  `test/constants/page.tsx`, `test/routing-test/page.tsx`, `test/versions/page.tsx`. The remaining
  4 files (`actions.ts`, `layout.tsx`, `owner/layout.tsx`, `test/layout.tsx`) were already fully
  compliant.
- **`src/components/` (29 files)** — `MyInputNumeric.tsx`: added missing `Params:` (and one
  `Returns:`) to 5 helpers (`formatValue`, `handleKeyDown`, `handleFocus`, `handleBlur`,
  `handleChange`). `MyMergeClasses.ts`: reformatted the nested `inAnyGroup` helper from a loose
  prose comment into the canonical bordered style with proper `Params:`/`Returns:`.
  `useLazyFetch.ts`: restored a `2) NOTES` section that had been dropped, so it now matches its own
  canonical example in `~/.claude/CLAUDE.md`. 14 other files (`MyBox`, `MyButton`, `MyDropdown`,
  `MyHourGlass`, `MyInput`, `MyLink`, `MyPagination`, `MyPaginationFooter`, `MyPopup`, `MySelect`,
  `MySelectMulti`, `MySelectRows`, `MySelectTable`, `MyTextarea`, `MyToggle`) were fixed in the
  first (pre-rate-limit) pass — helper functions filled in with missing `Params:`/`Returns:`. The
  remaining files were already fully compliant.
- **`src/constants.ts`** — confirmed no functions present (constants only), nothing to audit.

Judgment calls made during the audit (none required further input — each matched an existing rule
in the skill/convention already agreed): several multi-export utility modules (`buildSqlQuery.ts`,
`tableFetchUtils.ts`, `cache_actions.ts`, `isSelectionFiltering.ts`, `useBackNav.ts`/`saveBackNav`,
`OwnerSyncVersions_actions.ts`, `actions.ts`) were correctly left without a numbered main header,
per the "several equally-weighted exports, no single main one" rule. Nested one-line event-listener
functions wired up purely for `document.addEventListener` inside a `useEffect` (`MyHelp.tsx`,
`MyHelpStep.tsx`) were treated as part of the `useEffect`'s structural block rather than as
standalone documented helpers.

## Testing
- [ ] Open [C:\Users\richa\.claude\CLAUDE.md](C:\Users\richa\.claude\CLAUDE.md), search for
      "Helper (non-main) functions keep the plain" and confirm the new wording reads correctly and
      matches the agreed rule (Params:/Returns: always analyzed, description never optional).
- [ ] Open [.claude/CLAUDE.md](../../.claude/CLAUDE.md) in this project, search for "Helper
      functions keep the existing plain style", and confirm it says the same thing as the global
      file above.
- [ ] Open [C:\Users\richa\.claude\skills\function-headers\SKILL.md](C:\Users\richa\.claude\skills\function-headers\SKILL.md)
      and read it top to bottom — confirm step 5, the checklist, "Before starting", and "What NOT
      to do" are all internally consistent with each other and with the two CLAUDE.md files above.
- [ ] Next time `#code` (or a standalone "check headers" request) actually touches a file with a
      helper function that has only a title comment, confirm it now adds a description +
      `Params:`/`Returns:` rather than leaving the title-only comment as "already fine."
- [ ] Confirmed via `npx tsc --noEmit` (passes clean, run after every batch and once more at the
      end) — this was a comment/header-only pass across all 90 files under `src/`, no behavior
      changed, so there's no functional path to click through.
- [ ] Spot-check a few of the actually-changed files to confirm the added headers read correctly:
      [OwnerComponentTest.tsx](../../src/UI/OwnerComponentTest.tsx) (24 `handleApply` comments),
      [MyInputNumeric.tsx](../../src/components/MyInputNumeric.tsx) (5 helpers),
      [db.ts](../../src/tables/db.ts) (`sql()`'s new numbered header),
      [useLazyFetch.ts](../../src/components/useLazyFetch.ts) (restored `2) NOTES`).
- [ ] `git diff --stat` shows only the 90-file scope plus the two `.claude/CLAUDE.md` files and the
      skill file — confirm nothing outside that touched.
