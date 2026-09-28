# PLAN_cleanup-skill — nextjs-shared

## Title
Create the #cleanup skill — one per-project trigger that chains the code-convention cleanup passes

## Plan
Design agreed in chat. The skill lives at `~/.claude/skills/cleanup/SKILL.md` (Claude's own skill
files, not project code). It is run per project, in a session open in that project.

**Trigger:** `#cleanup`. Step 0 of a run creates that project's own `docs/plans/PLAN_code-cleanup-<date>.md`
(one Plan step per pass below), then STOPS and waits for that project's `#code`. The skill never
commits — `#commit` stays the user's call. Type-check (`npx tsc --noEmit`) after each pass;
`npm run build` at the end; a per-pass summary listing anything skipped, flagged or ambiguous.

**Automatic passes, in this order** (semantic-change passes first; `function-order` and
`function-headers` last so any function created or changed earlier gets ordered and headed):
1. `require()` → `import`. Flag, don't change: config files (`next.config.js`, `tailwind.config.js`),
   dynamic/conditional `require`, `.cjs` files.
2. `.then()`/`.catch()` → `await` / `try/catch`. Flag where making a function `async` changes its
   callers' return type.
3. `table_query` — add `table:` set to the query's primary `FROM` table. Flag dynamic table names
   and unclear multi-join cases.
4. Return-const — `return <call>` / `return <ternary>` becomes `const result = ...; return result`.
   Covers every call-shaped return (`NextResponse.json(...)`, `new Foo()`, `JSON.stringify(...)`,
   method chains) and `return await fn()` (keep `await` exactly as written — never add/remove it).
   Exempt: JSX returns; inline callbacks passed as arguments (`.map(x => x.toString())`,
   `useCallback(() => fn(a), [])`) — named functions and `function` bodies are covered. Default
   name is `result`; a clear DD item gets its DD name, and every non-`result` name is listed in
   the summary for review.
5. JSX calculation — move ternaries, inline logic, and class-name selection above the `return`
   into named `const`s (after hooks, before the JSX return); JSX keeps only named boolean flags
   with `&&`, `.map()` over prepared arrays, and plain reads. Every new name is listed in the
   summary for review. Hooks stay above early returns.
6. `function-order` — existing skill (arrow→function conversion, then top-down ordering).
7. `function-headers` — existing skill, run last.

**Gated pass — NOT part of the automatic run: `window.location` → Next.js router hooks.**
Big behavior change, needs its own explicit go-ahead and real testing.
- Default = discovery only: scan and report every occurrence as `file:line`, kind (read /
  navigate / reload / origin) and proposed replacement. No code changes.
- Reads of `.pathname`/`.search` → `usePathname()`/`useSearchParams()`. Navigation
  (`.href =`, `.assign`, `.replace`) → `router.push`/`router.replace` (client-side navigation, no
  full reload — behavior change). `.reload()` and `.origin` have no equivalent → flagged and left.
  Other `window` uses (`addEventListener`, `open`, `scrollTo`, etc.) are out of scope.
- Runs only when the user explicitly approves (per file or per project), with its own
  `## Testing` checklist, own type-check and build gate. It is an unchecked, separate Plan step
  in each project's cleanup plan, marked "needs explicit go-ahead + testing".

**Out of scope for now:** the cross-project runner (extending `audit`'s sentinel machinery to
create a cleanup plan in every consuming project). Build and prove the per-project skill first.

Steps:
- [x] Draft `~/.claude/skills/cleanup/SKILL.md` — frontmatter, Step 0 (plan creation then stop for `#code`), the seven automatic passes in the order above with their flag-don't-change rules, the gated `window.location` step, what-NOT-to-do, checklist
- [x] Structure the skill as numbered phases (one pass = one phase), each with a mode of stop or continue; after every phase report an amended-files list (`file: N edits, kind`) plus a few representative `file:line` spot-check spots, in chat and in the plan's `## Changes`; a phase that finds nothing says so and moves on; flagged items listed separately from changes. Review method AGREED: a per-phase record of which source files each phase changed, kept by the skill from its own edits (NOT git diff, which would accumulate earlier phases' changes) — written into the project's cleanup plan `## Changes` as one block per phase (`### Phase N — <pass>`, `- <file> — N edits`, plus a `Flagged (not changed)` line); a file touched in several phases appears in each phase's block. Mode AGREED: every phase stops after finishing — list that phase's changes (the per-phase record above), let the user review, and wait for `continue` before starting the next phase; no auto-continue mode (a phase that finds nothing still reports "no changes" and stops for `continue`) (user: running changes over hundreds of files with no per-phase review would be untestable)
- [x] Fold the return-const and JSX-calculation rules into the skill by reading `~/.claude/CLAUDE.md` fresh at run time (same "read the source of truth, don't keep a copy" approach as `function-headers`/`function-order`)
- [x] Add `#cleanup` to `~/.claude/COMMANDS.md`
- [x] Add `#cleanup` to the `skillslist` skill's list if it keeps a hardcoded one (check first)
- [x] Review EVERY rule in `~/.claude/CLAUDE.md` (Coding Conventions plus the code-related rules elsewhere in it) against the pass list; classify each as auto-fix / flag-only report / not applicable, and agree the additions with the user before drafting the skill (first review done in chat 2026-09-20 — coverage gaps found, see Changes)
- [x] Add a naming pass to `#cleanup`: review the naming conventions and correct historical bad naming (DD-root naming, filter_<column> state, loaded-rows arrays, needless SQL `AS` aliases, URL param names, composite/collection source-naming, FEN/ply). Renames are cross-file, so it proposes an old→new rename table and applies only after the user agrees it; in nextjs-shared a rename of an export breaks every consuming project, so exports are flagged, never auto-renamed
- [x] Restructure EVERY phase as an audit-then-approve cycle (user-raised 2026-09-20): (1) read-only audit; (2) write `### Phase N — proposed` into the cleanup plan as numbered items (`file:line`, short before→after) plus a `Flagged (not changed)` list, summary in chat; (3) user approves all, approves except listed items, drops a file, or comments so the item is amended — plan amended to the agreed list; (4) only approved items are implemented (tsc after each file, failed edits undone + flagged), then `### Phase N — applied` records the files changed from the skill's own edits (not git diff); (5) stop, `continue` starts the next phase's audit. Declined items are recorded in a `Declined` list and never re-proposed by later phases or a second `#cleanup` run. Removes the auto-vs-gated split: only the behaviour-changing phases (My* adoption, window.location, naming) additionally write a `## Testing` checklist. Report-only phases have no apply step. `#code` starts Phase 1's audit; approving a list is the trigger for that phase's coding
- [x] Add ALL further passes from the convention review as numbered phases (user agreed 2026-09-20: "add them all as phases"). Proposed final phase list and numbering (every phase still stops for `continue`; supersedes the 9-phase list in the skill as first written):
  - AUTO: 1 `require`→`import`; 2 `.then`/`.catch`/`.finally`→`await` (+ `useEffect` async work in an inner named function); 3 `table_query` `table:`; 4 return-const; 5 JSX calculation; 6 inline comments 3-line format; 7 `interface`→`type` (exceptions: `extends`, declaration merging); 8 `console.error`→`write_Logging` with `'Consequence: ' + message` format and E/W/I severity; 9 named exports only in server-action files (Next `page.tsx`/`layout.tsx` exempt); 10 SQL text rules (no `table.column` notation except self-joins; in `scripts/schema.sql`: no `SERIAL`/`REFERENCES`/`CASCADE`, `GENERATED BY DEFAULT AS IDENTITY`); 11 file structure (directive first line, top-level constants above the component, `useState` first and grouped); 12 `function-order`; 13 `function-headers` (last of the auto phases so anything created earlier is ordered and headed)
  - REPORT-ONLY: 14 findings list, no code changes — direct `sql()`/`db.query()` or local query wrappers, pipeline/maintenance reads missing `skipCache: true`, missing explicit parameter/return types, hardcoded tunables and literals duplicated across files, hardcoded lists of real-world entities, multiple constants files, destructive SQL (`DROP`/`TRUNCATE`/bulk `DELETE`, `wk_` exempt) or stray `.sql`/migration files in code, tables referenced in code but missing from `schema.sql` or with bad prefixes, local redefinitions of `nextjs-shared/structures` row types, inline dropdown/toggle option lists and duplicate JSX blocks
  - NEXTJS-SHARED ONLY (report-only, runs only in that project): 15 component-authoring checks — `overrideClass` + `myMergeClasses` + `_dftClass` in `constants.ts`, sub-element `labelClass`/`titleClass`/`containerClass`, `label htmlFor`/id linkage, no layout opinions in shared components, `OwnerComponentTest` demo full prop parity, `CONSUMING_PROJECTS.md` sync, logging/DB layer never logging about itself
  - GATED: 16 shared-component adoption (My* over raw HTML, see step above); 17 `window.location`→router hooks; 18 naming corrections
  - Also update `## Plan` seed, Step 0, table and checklist in the skill, and the `/cleanup` entry in `COMMANDS.md`, to the new numbering
- [x] Add a shared-component adoption phase to `#cleanup` (user-raised 2026-09-20: use `My*` components wherever possible, avoid standard HTML). Proposed as GATED Phase 8 (discovery → approved list → testing), renumbering `window.location` to 9 and naming to 10; mapping read fresh from `node_modules/nextjs-shared/CONSUMING_PROJECTS.md` (never hardcoded); known exclusions (segmented pill filters, flush list-item buttons, deliberately project-specific UI) flagged not replaced; near-fit gaps reported as proposed `nextjs-shared` amendments; the `My*` implementations themselves excluded when run in nextjs-shared; phases 4–7 re-checked after it. Placement and gated-vs-auto still to be agreed
- [x] Add a multi-export split phase to `#cleanup` (user-raised 2026-09-20), as an ordinary audit-then-approve phase inserted as Phase 12 (after file structure, before function-order), renumbering function-order→13, function-headers→14, findings list→15, component-authoring→16, My* adoption→17, window.location→18, naming→19, and updating the skill table/Step 0 seed/checklist/COMMANDS.md to match. Audit finds files with several exports and no shared private helper/state (excluded: shared-helper modules, server-action/domain modules like the `table_*` family, constants/types files, an unexported coupled sub-component). The proposal is driven by what the audit finds, per file: the new file name for each export (default = the same name as the exported function, so `foo` → `foo.ts`), which private helpers move with which export, every importer whose import path changes, and — only where a function name itself should change — a recommended new name with the reason (function renames follow the naming rules and are agreed row by row; default is no rename). In nextjs-shared a split that changes an export path is flagged unless a re-export is kept at the old path. Also considered and left out as unnecessary: a separate skill (same cycle; must run before function-order/function-headers); optional later idea: let `#cleanup` run a single named phase
- [x] Verify by reading the finished skill against this plan (no run over any project as part of this plan)

### `#cleanup` run over nextjs-shared (2026-09-20) — tracked in this plan (user chose to continue this plan rather than create `PLAN_code-cleanup-<date>.md`)
Each phase: read-only audit → `### Phase N — proposed` under `## Changes` → user approves/amends → implement → `### Phase N — applied` → stop for `continue`. Removed items go under `## Declined`.
- [x] Phase 1 — require() → import (no changes)
- [x] Phase 2 — .then()/.catch()/.finally() → await / try/catch (no changes)
- [x] Phase 3 — table_query: add table:
- [x] Phase 4 — Return-const
- [x] Phase 5 — JSX calculation moved above the return
- [x] Phase 6 — Inline comments in the 3-line format
- [x] Phase 7 — interface → type
- [x] Phase 8 — console.error → write_logging (no changes; flagged items recorded)
- [x] Phase 9 — Named exports only in server-action files (no changes)
- [x] Phase 10 — SQL text rules (no table.column notation) (no changes)
- [x] Phase 11 — File structure (directive, constants, useState order)
- [x] Phase 12 — Multi-export split (one exported function/component per file)
- [x] Phase 13 — function-order (no changes)
- [x] Phase 14 — function-headers
- [x] Phase 15 — Convention findings list (report-only; findings recorded, awaiting user decision)
- [x] Phase 16 — Component-authoring checks (report-only; nextjs-shared only; findings recorded, awaiting user decision)
- [x] Phase 17 — Shared-component adoption (needs Testing)
- [x] Phase 18 — window.location → router hooks (needs Testing; D18.4/saveBackNav left unchanged, flagged as a separate design question)
- [x] Phase 19 — Naming corrections (needs Testing)

## Changes
### ~/.claude/skills/cleanup/SKILL.md (new)
- New `#cleanup` skill (v2.0.0), 18 numbered phases: 1 require→import; 2 .then→await (+ useEffect inner async function); 3 table_query `table:`; 4 return-const; 5 JSX calculation; 6 inline comments 3-line format; 7 interface→type; 8 console.error→write_Logging; 9 named exports in server-action files; 10 SQL text rules (`table.column` removal; schema.sql findings report-only, never edited); 11 file structure; 12 function-order; 13 function-headers; 14 convention findings list (report-only); 15 component-authoring checks (report-only, nextjs-shared only); 16 shared-component (My*) adoption; 17 window.location→router hooks; 18 naming corrections (16–18 also write a `## Testing` checklist)
- EVERY phase is an audit-then-approve cycle: read-only audit → `### Phase N — proposed` (numbered items + `Flagged (not changed)`) written to the cleanup plan → stop → user replies `approve` / `approve except <items>` / `skip <file>` / `skip` / a comment to amend → only approved items implemented (tsc after each file, failed edits undone + flagged) → `### Phase N — applied` → stop for `continue`. No auto-continue; empty phases still stop
- Per-phase applied record kept from the skill's own edits (not `git diff`); `## Declined` in the plan holds user-removed items so they are never re-proposed by later phases or a second run
- Step 0 creates `docs/plans/PLAN_code-cleanup-<date>.md` (18 phase steps, `## Changes`, `## Declined`) and stops for `#code`; `#code` starts Phase 1's audit
- Each phase re-reads its CLAUDE.md rule section fresh; `npm run build` + `## Testing` after Phase 13
- Agreed rules encoded: inline callbacks exempt from return-const, `return await` keeps its `await`, all call-shaped returns covered, default name `result`, nextjs-shared exports never auto-renamed, `window.location` limited to that object, My* mapping read fresh from `CONSUMING_PROJECTS.md` (never hardcoded)

### ~/.claude/skills/cleanup/SKILL.md (updated: multi-export split phase)
- Added Phase 12 — Multi-export split, inserted before function-order; the skill is now 19 phases (function-order 13, function-headers 14, findings list 15, component-authoring checks 16, My* adoption 17, window.location 18, naming 19); all tables, Step 0 seed, rules, headings and checklist renumbered
- Phase 12 audit finds files with several exports and no shared private helper/state; the proposal is driven per file by what the audit finds — new file name per export (default = the exported function's name), helpers that move with each export, importers to update, and a recommended function rename with a reason only where a name is actually wrong (default no rename, agreed row by row); shared-helper files, server-action/domain modules, constants/types files, barrels and Next special files listed as non-candidates; nextjs-shared splits that change an export path flagged unless a re-export is kept at the old path

### ~/.claude/COMMANDS.md
- Added the `/cleanup` (alias `#cleanup`) entry, updated to the 18-phase audit-then-approve description and the `approve`/`skip`/`continue` replies

### ~/.claude/skills/skillslist/SKILL.md
- No change needed — it re-globs `~/.claude/skills/*/SKILL.md` on every run rather than keeping a hardcoded list

### ~/.claude/CLAUDE.md
- Naming rule's closing sentence ("Applies going forward… unless separately asked") reworded: during ordinary plan work, no renaming of untouched code; `#cleanup` Phase 18 (naming) is the explicit exception (a cleanup exists to change code outside the current plan), applied only via an agreed old→new rename table

### Not done (out of this plan's scope)
- The `code` skill's checklist does not yet list the new write-time rules (return-const, no JSX calculation, `await`, `table:`, `import`) so new code comes out clean first time — a separate skill edit needing its own `#plan`
- The cross-project runner (extending `audit`'s sentinel) — deliberately deferred until the per-project skill is proven
- The skill has not been run over any project

### `#cleanup` run over nextjs-shared — phase records
#### Phase 1 — require → import (audit)
No changes. Scanned every file outside node_modules/.next/docs/.git (src/, scripts/, root configs) for `require(`, `require.resolve` and `module.exports`; the root configs (`next.config.mjs`, `postcss.config.mjs`) are ESM.
Flagged (not changed): CONSUMING_PROJECTS.md:27 — a `node -e "const p = require('./node_modules/nextjs-shared/package.json'); …"` one-liner in project documentation, not source; documentation edits go through the normal `#plan`/`#code` gate.

#### Phase 2 — .then / .catch / .finally → await (audit)
No changes. No `.then(`, `.catch(` or `.finally(` anywhere in `src/` or `scripts/`, and no async `useEffect` callback or async IIFE inside an effect (the only `async () =>` found is `fetchOptions` in `src/components/MySelectTable.tsx:139`, wrapped in `useCallback` — already correct).
Flagged (not changed): six effects call a component-level async function instead of wrapping an inner named function — `OwnerTableSessionStorage.tsx:18` (`refresh`), `OwnerSyncVersions.tsx:87` (`handleRefresh`), `MySelectTable.tsx:201` (`fetchOptions`), `DbKeySelect.tsx:42` (`fetchOptions`), `OwnerRoutingTest.tsx:27` (`fetchTest`), `OwnerRoutingMaintenance.tsx:34` (`fetchRouting`). None is an async callback, and each function is also used by other handlers/buttons, so inlining it into the effect would duplicate or restructure code — left for your decision.

#### Phase 3 — every table_ function passed a table name (proposed — approved 2026-09-20, applied)
Scope widened by the user (2026-09-20): not just `table_query` — ALL `table_*` functions must be passed a table name.
Audit of all `table_*` functions in `src/tables/tableGeneric/`: `table_fetch`, `table_fetch_join`, `table_write`, `table_update`, `table_upsert`, `table_delete`, `table_count`, `fetchFiltered`/`fetchTotalPages`/`fetchTotalRows` all declare `table: string` (required), `table_seqGet`/`table_seqReset` declare `tableName: string`, `table_duplicate`/`table_copy_data` declare `table_from`/`table_to`, `table_truncate`/`table_drop` take `table` as their first positional argument, and `table_check` takes an array of `{ table, … }` — so a missing table is already a compile error for every one of them (`npx tsc --noEmit` passes). The only optional one is `table_query` (`table?: string`, default `''`). No call passes an empty-string table (the only `table: ''` matches are UI filter state in `OwnerTableLogging.tsx:63`, not a `table_` call). Exactly two `table_query(...)` calls exist (its own definition at `src/tables/tableGeneric/table_query.ts:44` is excluded), both in `src/app/owner/functiontest/page.tsx`.
- 3.1 src/app/owner/functiontest/page.tsx:149 — `table_query({ caller: functionName, query: \`SELECT * FROM ${BOGUS_TABLE}\` })` → add `table: BOGUS_TABLE` (the same constant every other failure test in this file already passes as `table:`)
Flagged (not changed):
- src/app/owner/functiontest/page.tsx:148 — `table_query({ caller: functionName, query: 'SELECT 1 as one' })` has no `FROM` table, so there is no primary table to name

#### Phase 3 — applied
- src/app/owner/functiontest/page.tsx — 1 edit (3.1: added `table: BOGUS_TABLE` to the failure-case `table_query`)
`npx tsc --noEmit` passes (exit 0).

#### Phase 4 — Return-const (proposed — approved as proposed 2026-09-20, applied)
Audit: 26 direct returns of a call or ternary in 16 files. Each becomes `const result = <expr>` then `return result` (`if (…) return call()` one-liners get braces). Default name `result`; the three non-`result`/special names are marked ⚠ for your check.
- 4.1 src/tables/cache/userCache_store.ts:397 — `return entry ? entry.data : null`
- 4.2 src/tables/cache/userCache_store.ts:439 — `return Array.from(cache.keys())`
- 4.3 src/components/isSelectionFiltering.ts:64 — `return isSelectionFiltering(selected, totalOptions) ? selected : SELECTION_ALL`
- 4.4 src/tables/cache/cache_actions.ts:60 — `return cache_getEntriesInfo({ … })`
- 4.5 src/tables/cache/cache_actions.ts:73 — `return cache_getEntryData(sql)`
- 4.6 src/tables/cache/cache_actions.ts:94 — `return cache_deleteEntry(sql, caller, level, severity)`
- 4.7 src/UI/OwnerTableLogging.tsx:365 — `return val.length > … ? val.slice(…) + '…' : val`
- 4.8 src/UI/OwnerTableLogging.tsx:381 — `return row.lg_sql_params ? JSON.stringify(row.lg_sql_params) : null`
- 4.9 src/UI/OwnerTableLogging.tsx:395 — `return d.toISOString().slice(0, 16).replace('T', ' ')`
- 4.10 ⚠ src/UI/OwnerTableCache.tsx:408 — `if (val instanceof Date) return val.toISOString().slice(0, 16).replace('T', ' ')` → braces + `const dateText = …` (not `result`, because 4.11 declares `result` in the same function and a same-named inner const would shadow it)
- 4.11 src/UI/OwnerTableCache.tsx:409 — `return String(val)`
- 4.12 src/UI/OwnerSyncVersions_actions.ts:38 — `return readdirSync(GITHUB_DIR, …).filter(…).map(…)`
- 4.13 src/UI/OwnerSyncVersions_actions.ts:212 — `return Object.fromEntries(entries)`
- 4.14 src/UI/OwnerSyncVersions.tsx:638 — `return value.replace(/^[>=<^~\s]+/, '')`
- 4.15 src/UI/OwnerDbRouting_actions.ts:18 — `return keys.length > 0 ? keys : [POSTGRES_URL_PREFIX]`
- 4.16 src/tables/tableGeneric/table_pages/buildSqlQuery.ts:166 — `return sqlQuery.replace('SELECT *', 'SELECT COUNT(*)')`
- 4.17 src/tables/tableGeneric/table_fetch_join.ts:131 — `return sqlQuery.replace(\`FROM ${table}\`, …)`
- 4.18 src/tables/tableGeneric/table_fetch_join.ts:192 — `return data.rows.length > 0 ? data.rows : []`
- 4.19 src/tables/tableGeneric/table_fetch.ts:161 — `return data.rows.length > 0 ? data.rows : []`
- 4.20 src/tables/tableGeneric/table_pages/tableFetchUtils.ts:76 — `return data.rows.length > 0 ? data.rows : []`
- 4.21 src/components/MyCheckbox.tsx:170 — inside `sortFn`: `return String(a.value).localeCompare(String(b.value))`
- 4.22 src/components/MyCheckbox.tsx:172 — inside `sortFn`: `return a.label.localeCompare(b.label)`
- 4.23 ⚠ src/components/MyMergeClasses.ts:71 — nested `inAnyGroup`: `return allPatterns.some(p => core.startsWith(p))` → const named `inGroup` (the enclosing function already declares `result` at line 92, so `result` would shadow it)
- 4.24 src/components/MyMergeClasses.ts:138 — `return match ? match[0] : ''`
- 4.25 src/components/MySelectMulti.tsx:303 — `return typeof opt === 'string' ? { value: opt, label: opt } : opt`
- 4.26 src/components/MyPagination.tsx:149 — `if (totalPages <= 7) return Array.from({ length: totalPages }, …)` → braces + `result`
Exempt (inline callbacks passed as arguments, not proposed): MyCheckbox.tsx:113/115/365 (`.sort` comparators), OwnerSyncVersions.tsx:121 (`.sort` comparator), MyMergeClasses.ts:87 (`flatMap` callback), OwnerComponentTest.tsx:1541 (`useMemo` callback). Not call-shaped, left alone: `return \`SELECT COUNT(*) FROM (${…})…\`` in buildSqlQuery.ts:161 (template literal).
Flagged (not changed):
- src/components/MySelectTable.tsx:219-222 — four sibling `return renderXxx()` calls (loading / empty / single option / dropdown) that dispatch to JSX-returning render functions; converting needs four `result` consts in nested scopes that shadow each other, so it isn't a clean mechanical change — left for your decision

#### Phase 4 — applied
All 26 items applied as proposed (including the two ⚠ names: `dateText` in OwnerTableCache.tsx `fmtCellValue`, `inGroup` in MyMergeClasses.ts `inAnyGroup`).
- src/tables/cache/userCache_store.ts — 2 edits (4.1, 4.2)
- src/components/isSelectionFiltering.ts — 1 edit (4.3)
- src/tables/cache/cache_actions.ts — 3 edits (4.4–4.6)
- src/UI/OwnerTableLogging.tsx — 3 edits (4.7–4.9)
- src/UI/OwnerTableCache.tsx — 1 edit covering 4.10 + 4.11
- src/UI/OwnerSyncVersions_actions.ts — 2 edits (4.12, 4.13)
- src/UI/OwnerSyncVersions.tsx — 1 edit (4.14)
- src/UI/OwnerDbRouting_actions.ts — 1 edit (4.15)
- src/tables/tableGeneric/table_pages/buildSqlQuery.ts — 1 edit (4.16)
- src/tables/tableGeneric/table_fetch_join.ts — 2 edits (4.17, 4.18)
- src/tables/tableGeneric/table_fetch.ts — 1 edit (4.19)
- src/tables/tableGeneric/table_pages/tableFetchUtils.ts — 1 edit (4.20)
- src/components/MyCheckbox.tsx — 1 edit covering 4.21 + 4.22 (inside `sortFn`)
- src/components/MyMergeClasses.ts — 2 edits (4.23, 4.24)
- src/components/MySelectMulti.tsx — 1 edit (4.25)
- src/components/MyPagination.tsx — 1 edit (4.26)
`npx tsc --noEmit` passed after each file or small batch of files and passes on the final tree. A re-scan of the same patterns now finds only the exempt inline callbacks and the flagged MySelectTable.tsx dispatch returns.

#### Phase 5 — JSX calculation (proposed — approved in full 2026-09-20, applied)
The audit found roughly 120 sites across ~25 `.tsx` files where a ternary, an `&&` on an inline expression, a template-literal `className`, or other computation sits inside JSX. Many components are already clean (`MyTab`, `MyInputNumeric`, `MyPagination`, `MyBox`'s `className` all compute above the return), so the sites are concentrated in: `OwnerComponentTest.tsx` (~30, mostly `applied.x !== '' ? Number(applied.x) : undefined` prop values), `OwnerSyncVersions.tsx` (~15), `OwnerTableCache.tsx` (~12), `OwnerTableLogging.tsx` (~9), `functiontest/page.tsx` (~7), `MyHelpStep.tsx` (~7), `MySelectMulti.tsx` (~6), `MyCheckbox.tsx` (~5), plus a handful each in `OwnerRoutingMaintenance`, `MyHelp`, `MySelect`, `MySelectTable`, `OwnerConstants`, `OwnerPage`, `OwnerTableSessionStorage`, `MyHelpField`, `MyBox`, `MyPopup`, `MyBackHomeNav`. Already compliant and not counted: `{label && …}`/`{open && …}`/`{error && …}` (a plain named value), `.map()` over a prepared array, and consts computed inside a callback block before its own `return`.
Scoping decisions AGREED by the user (2026-09-20): (1a) per-row values inside a concise `.map(row => (…))` callback are computed by converting the callback to a block body and declaring the consts just before its own JSX `return`; (2a) an element-choosing ternary `cond ? (<A/>) : (<B/>)` becomes two `&&` blocks driven by named flags; (3) the dev-only demo page `OwnerComponentTest.tsx` IS in scope.
What counts as a site: a ternary in JSX; an `&&` whose left side is an expression rather than a plain named value (`{label && …}`, `{open && …}`, `{error && …}` are fine and left alone); a template-literal/`+`/arithmetic string or number built inside JSX; a comparison/boolean expression in a prop (`disabled={a || !b}`, `checked={x === 'y'}`, `active={a === b}`); an inline `.slice()`/`Object.entries()` feeding a `.map()`. Not counted (left alone, mention if you want them included): `??`/`||` display defaults (`{x ?? ''}`, `applied.x || undefined`), and helper-call formatting (`fmtDate(...)`, `JSON.stringify(...)`, `.join(', ')` on its own). Where TypeScript needs narrowing (`popup`, `matrix`, `rows`, `backPath`), the plain named value stays in the `&&` chain (`{popup && …}`, `{matrix && …}`, `{backPath && differsFromHome && …}`) and only the extra expression becomes a flag. New consts sit after the hooks / just before the JSX `return` (or before the callback's own `return`). The scan is pattern-based, so a second `#cleanup` audit after this phase may find stragglers.
Items (each names its new const; the const goes immediately above the JSX `return` of the function/callback that contains the site):
**src/UI/OwnerTableLogging.tsx**
- 5.1 :121-130 — `(['raw','readable','params'] as const).map(opt => (` concise callback → block body; :126 className template ternary → `chipClass`
- 5.2 :128 — `opt === 'raw' ? 'Raw' : opt === 'readable' ? 'Readable' : 'Params'` → `chipLabel` (same callback as 5.1)
- 5.3 :237-267 — `tabledata && tabledata.length > 0 ? (rows) : (empty row)` → `tablerows = tabledata ?? []`, `hasRows`, `noRows`; `{hasRows && tablerows.map(…)}` + `{noRows && <tr>…}`
- 5.4 :241 — row className `popup?.lg_lgid === row.lg_lgid ? … : …` → `rowClass` (row callback → block body)
- 5.5 :249 — `row.lg_isupdate ? 'Y' : 'N'` → `isupdateText` (row callback)
- 5.6 :254 — `row.lg_msg.length > … ? row.lg_msg.slice(…) + '…' : row.lg_msg` → `msgText` (row callback; moved as-is, not swapped for the existing `truncateDisplay`)
- 5.7 :284 — `isOpen={popup !== null}` → `popupOpen`
- 5.8 :285 — `{popup !== null && <LoggingDetail row={popup} />}` → `{popup && <LoggingDetail row={popup} />}` (plain named value; `popup` is an object or null)
- 5.9 :435 — `row.lg_isupdate ? 'Y' : 'N'` in `LoggingDetail` → `isupdateText`
- 5.10 :468 — `row.lg_sql_params !== null && row.lg_sql_params !== undefined &&` → `hasSqlParams`
**src/UI/OwnerTableCache.tsx**
- 5.11 :73 — `disabled={loading || overallSize === 0}` → `clearAllDisabled`
- 5.12 :132-167 — `entries.length > 0 ? (rows) : (empty row)` → `hasEntries`, `noEntries`; `{hasEntries && entries.map(…)}` + `{noEntries && <tr>…}`
- 5.13 :139 — `(currentPage - 1) * rowsPerPage + idx + 1` → `rowNumber` (entries callback → block body)
- 5.14 :145 — `entry.rowCount >= 0 ? entry.rowCount : entry.info` → `rowCountText` (same callback as 5.13)
- 5.15 :164 — `loading ? 'Loading...' : 'No cache entries'` → `emptyMessage`
- 5.16 :184-185 — `isOpen={popup !== null}` → `popupOpen`; `{popup !== null && <CacheEntryDetail …/>}` → `{popup && …}`
- 5.17 :268 — `{extra > 0 && …}` in `TablesBadge` → `hasExtra`
- 5.18 :297 — `entry.tables.length > 0 ? entry.tables.join(', ') : '—'` → `tablesText`
- 5.19 :305 — `entry.rowCount >= 0 ? entry.rowCount : entry.info` in `CacheEntryDetail` → `rowCountText`
- 5.20 :323-325 — `rows ? \` (${rows.length} row…)\` : ''` (nested ternaries + template) → `cachedDataSuffix`
- 5.21 :328-391 — `rows && columns.length > 0 ? (grid) : (<pre>JSON)` → `hasColumns`, `showRawJson`; `{rows && hasColumns && (…)}` + `{showRawJson && <pre>…}`
- 5.22 :342 — `rows.slice(0, MAX_DISPLAY_ROWS).map(` → `displayRows = rows?.slice(0, MAX_DISPLAY_ROWS) ?? []`
- 5.23 :345 — row className `i === selectedIdx ? … : …` → `rowClass` (callback → block body)
- 5.24 :350-354 — per-cell `row[col] === null || row[col] === undefined ? (null span) : (div)` → `isNullCell`, `hasCellValue` (`columns.map(col => …)` callback → block body)
- 5.25 :363 — `{selectedRow !== null && (` → `hasSelectedRow`, plus `selectedRowEntries = selectedRow !== null ? Object.entries(selectedRow) : []` used at :369
- 5.26 :366 — `selectedIdx! + 1` → `selectedRowNumber`
- 5.27 :373-379 — per-entry `val === null || val === undefined ? (…) : (…)` → `isNullValue`, `hasValue` (`([col, val]) =>` callback → block body)
**src/UI/OwnerSyncVersions.tsx**
- 5.28 :163 — `refreshing ? 'Refreshing...' : 'Refresh'` → `refreshLabel`
- 5.29 :170-172 — `syncResults.every(…) ? 'All already at target' : \`Updated ${…} project(s)\`` → `syncSummary`
- 5.30 :176 — `disabled={syncing || !matrix}` → `syncDisabled`
- 5.31 :177 — `syncing ? 'Syncing...' : 'Sync'` → `syncLabel`
- 5.32 :187 / 5.33 :193 / 5.34 :199 — Major / Minor / Patch chip className ternaries → `majorChipClass`, `minorChipClass`, `patchChipClass`
- 5.35 :209-475 — `!matrix ? (<p>Loading…</p>) : (<div>table</div>)` → `matrixLoading = !matrix`; `{matrixLoading && <p…>}` + `{matrix && (<div…>)}`
- 5.36 :242-243 — `projects.map(p => (` concise → block body; className `parseErrors.includes(p) ? … : …` and `' !'` suffix → `hasParseError`, `headerClass`, `headerText`
- 5.37 :279 — `reinstallCounts[proj] > 0 ? \`⟳ ${…}\` : ''` → `reinstallText` (callback → block body)
- 5.38 :395 — URL-cell className template + nested ternary → `urlCellClass` (before that branch's `return`)
- 5.39 :406 — `{instVer != null && sectionCode && (` → `showUrlSectionCode`
- 5.40 :433 — cell className template + nested ternary → `cellClass`
- 5.41 :443 — `ver === null ? '' : ver` → `verText`
- 5.42 :444 — `{ver !== null && sectionCode && (` → `showSectionCode`
- 5.43 :465 — `colSpan={6 + projects.length}` → `sectionColSpan`
- 5.44 :477 — `syncResults && syncResults.some(…) &&` → `anySyncChanges = syncResults?.some(r => r.changes.length > 0) ?? false`
**src/UI/OwnerRoutingMaintenance.tsx**
- 5.45 :79-121 — three `isEditing ? (edit control) : (display)` cells (Table, DbKey, actions) → `notEditing = !isEditing` (declared beside the existing `isEditing`); each becomes `{isEditing && …}` + `{notEditing && …}`
**src/UI/OwnerTableSessionStorage.tsx**
- 5.46 :29 + :45-67 — `disabled={entries.length === 0}` and `entries.length > 0 ? (rows) : (empty row)` → `hasEntries`, `noEntries`
- 5.47 :48 — `{idx + 1}` → `rowNumber` (entries callback → block body)
**src/UI/OwnerConstants.tsx**
- 5.48 :38 + :42 — `subTab === 'constants'` → `isConstantsTab` (used in the `active` prop and the `&&`)
- 5.49 :39 + :69 — `subTab === 'env'` → `isEnvTab` (same two uses)
- 5.50 :49 — `active={activeGroup === group}` → `isActiveGroup` (`groupNames.map(group => …)` callback → block body)
**src/UI/OwnerPage.tsx**
- 5.51 :56 and :69 — `activeTab === tab.label` in both `tabs.map(tab => …)` callbacks → block body with `isActive` in each
**src/app/owner/functiontest/page.tsx**
- 5.52 :62 — `running ? 'Running...' : 'Run Tests'` → `runLabel`
- 5.53 :64-65 — `{results.length > 0 && (` → `hasResults`; `failCount === 0 ? … : …` className → `summaryClass`
- 5.54 :82-86 — row callback → block body: `rowClass`, `expectedText`, `actualText`, `passText`
**src/components/MyPagination.tsx**
- 5.55 :82 and :125 — `isDisabled={statecurrentPage <= 1}` / `>= totalPages` → `atFirstPage`, `atLastPage`
- 5.56 :111 — `isActive={statecurrentPage === pageItem}` → `isActive` (inside the existing block-body callback)
**src/components/MyBox.tsx**
- 5.57 :55 — `` `${chevronClass} ${isOpen ? 'rotate-0' : '-rotate-90'}` `` → `chevronClassName`
**src/components/MyPopup.tsx**
- 5.58 :56 — `onClick={closeOnBackdropClick ? onClose : undefined}` → `overlayOnClick`
**src/components/MyBackHomeNav.tsx**
- 5.59 :38 — `backPath && backPath !== homePath &&` → `differsFromHome = backPath !== homePath`; `{backPath && differsFromHome && (…)}`
**src/components/MyHelp.tsx**
- 5.60 :89 — `title ? <p>…</p> : <span />` → `noTitle = !title`; `{title && <p…>}` + `{noTitle && <span />}`
- 5.61 :96-105 — `text ? (<p>) : (items?.map…)` → `noText = !text`; `{text && <p…>}` + `{noText && items?.map(…)}`
**src/components/MyHelpStep.tsx**
- 5.62 :118, :142, :155 — `className={i > 0 ? 'mt-0.5' : ''}` in three `.map((s, i) => (` callbacks → block body with `itemClass`
- 5.63 :134 — label-cell className template with `consumers ? … : ''` → `outputLabelClass`
- 5.64 :139 — value-cell className template with `consumers ? … : ''` → `outputValueClass`
**src/components/MySelect.tsx**
- 5.65 :148 — `searchEnabled && options.length > 0 &&` → `showSearch`
- 5.66 :165-178 — `options.length > 0 ? (<>…</>) : children` → `hasOptions`, `noOptions`; `{hasOptions && (<>…</>)}` + `{noOptions && children}`
**src/components/MySelectMulti.tsx**
- 5.67 :221 and 5.68 :235 — `checked={allSelected ? false : selected.includes(opt.value)}` in the `selectedItems.map` / `unselectedItems.map` callbacks → block body with `isChecked`
- 5.69 :228 — `selectedItems.length > 0 && unselectedItems.length > 0 &&` → `showDivider`
**src/components/MyCheckbox.tsx**
- 5.70 :220 — `showSelectedFirst ? 'Show Original Order' : 'Show Selected First'` → `resortButtonLabel`
- 5.71 :243-260 — `filteredOptions.length > 0 ? (…) : (<p>No options found</p>)` → `hasFilteredOptions`, `noFilteredOptions`
- 5.72 :269 — `selectedOptions.length !== 1 ? 's' : ''` → `itemSuffix`
- 5.73 :270 — `minSelections !== undefined && \` (min: …)\`` → `minSelectionsText`
- 5.74 :271 — `maxSelections !== undefined ? … : ' (max: unlimited)'` → `maxSelectionsText`
**src/components/MySelectTable.tsx**
- 5.75 :296-306 — in `renderDropdown`: `filteredOptions.length > 0 ? (…) : (<option>No options found</option>)` → `hasFilteredOptions`, `noFilteredOptions`
**src/UI/OwnerComponentTest.tsx (demo page, agreed in scope)** — each new const sits above that tab function's JSX `return`:
- 5.76 :578 (`MyInputNumericTab`) — `value === '' ? '(empty)' : String(value)` → `valueText`
- 5.77 :868, :871 (`MyCheckboxTab`) — `checked={draft.sortBy === 'label'}` / `'value'` → `sortByLabelChecked`, `sortByValueChecked`
- 5.78 :913, :914 (`MyCheckboxTab`) — `applied.maxSelections !== '' ? Number(applied.maxSelections) : undefined` (and min) → `maxSelectionsNum`, `minSelectionsNum`
- 5.79 :930 (`MyCheckboxTab`) — `selected.length > 0 ? selected.join(', ') : '(none)'` → `selectedText`
- 5.80 :1038 (`MyPaginationTab`) — `applied.totalPages !== '' ? Number(applied.totalPages) : 1` → `totalPagesNum`
- 5.81 :1380, :1389 (`MySelectTab`) — `checked={draft.optionsMode === 'flat'}` / `'labelValue'` → `optionsModeFlatChecked`, `optionsModeLabelValueChecked`
- 5.82 :1431 (`MySelectTab`) — `simulatingDelayedLoad ? [] : parsedOptions` → `demoOptions`
- 5.83 :1447-1454 (`MySelectTab`) — `simulatingDelayedLoad ? 'options withheld — …' : '(idle — …)'` → `delayedLoadStatus`
- 5.84 :1651, :1652 (`MySelectTableTab`) — `selectedOption !== '' ? String(selectedOption) : '(none)'` / `typeof selectedOption : '—'` → `selectedOptionText`, `selectedOptionType`
- 5.85 :1762, :1763 (`MySelectMultiTab`) — min/max `!== '' ? Number(…) : undefined` → `minSelectedNum`, `maxSelectedNum`
- 5.86 :1768, :1769 (`MySelectMultiTab`) — `applied.mergePanelWidthClass !== '' ? … : undefined` (and max-height) → `mergePanelWidthClassProp`, `mergePanelMaxHeightClassProp`
- 5.87 :1779 (`MySelectMultiTab`) — `selected.length > 0 ? selected.join(', ') : '(none)'` → `selectedText`
- 5.88 :2182, :2185 (`MyHelpTab`) — `checked={draft.mode === 'text'}` / `'items'` → `helpModeTextChecked`, `helpModeItemsChecked`
- 5.89 :2219, :2220, :2237 (`MyHelpTab`) — `applied.mode === 'text' ? applied.text : undefined`, `applied.mode === 'items' ? parseHelpItems(…) : undefined`, `… ? JSON.stringify(parseHelpItems(…)) : '(unused)'` → `helpText`, `helpItems`, `helpItemsText`
- 5.90 :2404, :2421 (`MyHelpStepTab`) — `parseList(applied.consumers).length > 0 ? … : …` (parsed once) → `consumersParsed`, `consumersProp`, `consumersText`
- 5.91 :2718, :2724 (`MyPaginationFooterTab`) — `totalPages` / `totalRows` `!== '' ? Number(…) : …` → `totalPagesNum`, `totalRowsNum`
- 5.92 :2812 (`MyBackHomeNavTab`) — `String(Boolean(applied.backPath) && applied.backPath !== applied.homePath)` → `backLinkShown`
Flagged (not changed): `(['raw','readable','params'] as const).map` in OwnerTableLogging.tsx:121 is an inline literal option list (a Phase 15 "named reusable option set" finding, not a JSX calculation); OwnerTableLogging.tsx:254's truncation duplicates the existing `truncateDisplay` helper (moved as-is by 5.6, dedupe is your call); the `??`/`||` display defaults and helper-call formatting listed above are deliberately not counted.

#### Phase 5 — applied
All 92 items applied as proposed, with one simplification: in OwnerTableLogging.tsx item 5.3 the proposed `tablerows = tabledata ?? []` const was not needed (`tabledata` is always an array), so only `hasRows = tabledata.length > 0` / `noRows` were added and the JSX maps `tabledata` directly.
- src/components/MyBox.tsx — 2 edits (5.57)
- src/components/MyPopup.tsx — 1 edit (5.58)
- src/components/MyBackHomeNav.tsx — 1 edit (5.59)
- src/components/MyHelp.tsx — 3 edits (5.60, 5.61)
- src/components/MyPagination.tsx — 4 edits (5.55, 5.56)
- src/components/MyHelpStep.tsx — 4 edits (5.62–5.64)
- src/components/MySelect.tsx — 3 edits (5.65, 5.66)
- src/components/MySelectMulti.tsx — 2 edits (5.67–5.69)
- src/components/MyCheckbox.tsx — 4 edits (5.70–5.74)
- src/components/MySelectTable.tsx — 2 edits (5.75)
- src/UI/OwnerPage.tsx — 2 edits (5.51)
- src/UI/OwnerConstants.tsx — 3 edits (5.48–5.50)
- src/UI/OwnerTableSessionStorage.tsx — 3 edits (5.46, 5.47)
- src/UI/OwnerRoutingMaintenance.tsx — 2 edits (5.45)
- src/app/owner/functiontest/page.tsx — 3 edits (5.52–5.54)
- src/UI/OwnerTableLogging.tsx — 7 edits (5.1–5.10)
- src/UI/OwnerTableCache.tsx — 12 edits (5.11–5.27)
- src/UI/OwnerSyncVersions.tsx — 15 edits (5.28–5.44)
- src/UI/OwnerComponentTest.tsx — 33 edits (5.76–5.92)
`npx tsc --noEmit` passed after each file (or small batch) and passes on the final tree. A re-scan of the same patterns now finds only plain-value/named-flag `&&`, consts above their returns, and two handler-logic template strings in MyCheckbox.tsx (:330, :341, `setError(...)` — logic, not JSX).

#### Phase 6 — Inline comments in the 3-line format (proposed — approved in full 2026-09-20, applied)
Audit: scanned every `//` comment block in `src/` and `scripts/` (skipping `//----`/`//====` header borders, directive comments, top-level comments and blocks already wrapped in empty `//` lines). 16 blocks inside function bodies are not in the 3-line format. Each gets an empty `//` above and below and the text on a `//  text` line (two spaces, per the convention example); wording and indentation unchanged.
- 6.1 src/components/MyPagination.tsx:99 — `// Handle '...' separately to render non-clickable placeholders`
- 6.2 src/tables/db.ts:149 — `// Create a single pool per dbKey for serverless environment`
- 6.3 src/tables/tableGeneric/table_count.ts:54 — `// Changed destructuring to include operator with default`
- 6.4 src/tables/tableGeneric/table_count.ts:56 — `// Added multi-value handling`
- 6.5 src/tables/tableGeneric/table_count.ts:64 — `// Changed from index-based to paramIndex-based`
- 6.6 src/tables/tableGeneric/table_delete.ts:66 — `// Changed destructuring`
- 6.7 src/tables/tableGeneric/table_delete.ts:68 — `// Added multi-value handling`
- 6.8 src/tables/tableGeneric/table_delete.ts:127 — `// Logging`
- 6.9 src/tables/tableGeneric/table_fetch.ts:64 — `// Build the SQL with placeholders`
- 6.10 src/tables/tableGeneric/table_fetch_join.ts:68 — `// Build the SQL with placeholders`
- 6.11 src/UI/OwnerSyncVersions_actions.ts:307 — `// migrate old flat format — treat everything as overrides`
- 6.12 src/UI/OwnerSyncVersions_actions.ts:373 — `// Phase 1 — update deps/devDeps/peerDeps to npm latest (…)`
- 6.13 src/UI/OwnerSyncVersions_actions.ts:388 — `// Phase 2a — dep targets: pin directly in whichever dep section …`
- 6.14 src/UI/OwnerSyncVersions_actions.ts:398 — `// Remove from overrides if it was previously there`
- 6.15 src/UI/OwnerSyncVersions_actions.ts:405 — `// Phase 2b — override targets: write to npm overrides block`
- 6.16 src/UI/OwnerSyncVersions_actions.ts:420-421 — two-line block `// Remove overrides for packages no longer in override targets` / `// (when scoped to one package, only that package is eligible for removal)` (one opening and one closing `//` around both lines)
Flagged (not changed):
- src/components/MyMergeClasses.ts:32, 37, 42, 47 — `// — Sizing & Spacing —` / `Typography` / `Visual` / `Effects` group labels inside the module-level `CLASS_GROUPS` array literal, not a function body, so the rule doesn't reach them
- src/tables/db.ts:145-147 and 157-159 — already three-line blocks bordered by `//....` dotted lines instead of empty `//`; looks like deliberate decorative style, left for your decision
- Trailing same-line comments (would have to be moved): OwnerSyncVersions_actions.ts:379, table_delete.ts:63 and :76, table_upsert.ts:37, table_count.ts:50, db.ts:152, userCache_store.ts:28 and :29

#### Phase 6 — applied
All 16 items applied as proposed.
- src/components/MyPagination.tsx — 1 edit (6.1)
- src/tables/db.ts — 1 edit (6.2)
- src/tables/tableGeneric/table_count.ts — 3 edits (6.3–6.5)
- src/tables/tableGeneric/table_delete.ts — 3 edits (6.6–6.8)
- src/tables/tableGeneric/table_fetch.ts — 1 edit (6.9)
- src/tables/tableGeneric/table_fetch_join.ts — 1 edit (6.10)
- src/UI/OwnerSyncVersions_actions.ts — 6 edits (6.11–6.16)
`npx tsc --noEmit` passes. Re-running the same read-only scan now reports only the flagged items (MyMergeClasses.ts group labels and the two db.ts dotted-border blocks).

#### Phase 7 — interface → type (proposed — approved in full 2026-09-20, applied)
Audit: 12 `interface` declarations in `src/` and `scripts/`. None is exported, none uses `extends`, `implements` or `declare module`, and none is declaration-merged, so every one converts directly: `interface X { … }` → `type X = { … }` (body unchanged).
- 7.1 src/UI/OwnerTableLogging.tsx:34 — `interface TableProps`
- 7.2 src/tables/tableGeneric/table_seq_get.ts:25 — `interface Props`
- 7.3 src/tables/tableGeneric/table_seq_get.ts:34 — `interface ReturnValues`
- 7.4 src/tables/tableGeneric/table_write.ts:28 — `interface Props`
- 7.5 src/tables/tableGeneric/table_delete.ts:32 — `interface Props`
- 7.6 src/tables/tableGeneric/table_update.ts:29 — `interface Props`
- 7.7 src/tables/tableGeneric/table_count.ts:26 — `interface Props`
- 7.8 src/tables/tableGeneric/table_upsert.ts:32 — `interface Props`
- 7.9 src/tables/tableGeneric/table_duplicate.ts:23 — `interface Props`
- 7.10 src/tables/tableGeneric/table_copy_data.ts:23 — `interface Props`
- 7.11 src/tables/tableGeneric/table_copy_data.ts:193 — nested `interface ColumnRow` (declared inside a function)
- 7.12 src/tables/tableGeneric/table_seq_reset.ts:23 — `interface Props`
Flagged (not changed): none. Comment text at table_write.ts:26 and table_upsert.ts:30 ("Define the props interface for …") is prose, left as-is.

#### Phase 7 — applied
All 12 items applied as proposed (`interface X {` → `type X = {`, bodies unchanged).
- src/UI/OwnerTableLogging.tsx — 1 edit (7.1)
- src/tables/tableGeneric/table_seq_get.ts — 2 edits (7.2, 7.3)
- src/tables/tableGeneric/table_write.ts — 1 edit (7.4)
- src/tables/tableGeneric/table_delete.ts — 1 edit (7.5)
- src/tables/tableGeneric/table_update.ts — 1 edit (7.6)
- src/tables/tableGeneric/table_count.ts — 1 edit (7.7)
- src/tables/tableGeneric/table_upsert.ts — 1 edit (7.8)
- src/tables/tableGeneric/table_duplicate.ts — 1 edit (7.9)
- src/tables/tableGeneric/table_copy_data.ts — 2 edits (7.10, 7.11)
- src/tables/tableGeneric/table_seq_reset.ts — 1 edit (7.12)
`npx tsc --noEmit` passes. Re-scan finds no `interface` declarations; only the two prose comments mentioning "props interface" remain.

#### Phase 8 — console.error → write_logging (audit)
No changes proposed. Every `console.*` call in `src/` and `scripts/` falls into a case the phase must not change or must flag (the shared function is actually named `write_logging`, lower-case l):
Flagged (not changed):
- The logging / DB-access layer itself — never touched (it must not log about itself), and each of these `console.error` calls already sits next to a `write_logging({ … })` call, so it is not "console.error alone": `src/tables/db.ts:113`; `table_check.ts:113`, `table_delete.ts:135`, `table_count.ts:101`, `table_drop.ts:64`, `table_duplicate.ts:92`, `table_copy_data.ts:149`, `table_truncate.ts:66`, `table_seq_get.ts:184`, `table_upsert.ts:129`, `table_seq_reset.ts:89`, `table_write.ts:108`, `table_update.ts:118` (all under `src/tables/tableGeneric/`); and `write_logging.ts:57`, `:138`, `:139` (its own console fallback when there is no database or the insert fails).
- Client-component error handlers (`'use client'` files): `src/UI/OwnerTableLogging.tsx:336` and `:348` (`console.error('Error fetching logging…')`), `src/UI/OwnerTableCache.tsx:217`, `:232`, `:260` (`console.error('Error fetching cache entries:' / 'Error clearing cache:' / 'Error deleting entry:', error)`). `CONSUMING_PROJECTS.md` documents `write_logging` for server actions and `table_` functions ("All server actions use `write_logging`"), not browser-side handlers, so these are left. Converting them would mean a client component calling the `'use server'` `write_logging` action from the browser — your decision.
- `console.log` debug/CLI output (never converted by this phase): `src/tables/db.ts:214` (`xrtg_routing loaded — routing map`), `scripts/sync-versions.ts:6-14` (CLI progress output).

#### Phase 8 — reopened by the user (2026-09-20, option c) and applied
After the audit above the user asked whether the UI already shows these errors (it did not — only `console.error`, nothing on screen) and chose "(c) convert to `write_logging` AND show the error". Applied as follows (behaviour change, so noted for Testing):
- src/UI/OwnerTableCache.tsx — 6 edits:
  - imported `write_logging` from `../tables/tableGeneric/write_logging`
  - `fetchdata`, `handleClearAll`, `handleDelete`: the `console.error` in each `catch` is replaced by `setMessage('<consequence>: ' + (error as Error).message)` (shows in the existing red message line) plus an awaited `write_logging({ lg_functionname, lg_caller: functionName, lg_msg, lg_severity: 'E' })`
  - `handleRowClick` (had no error handling): wrapped in `try/catch` with the same message + log
  - `fetchdata` now starts with `setMessage('')` so a previous error clears on refresh, and `handleClearAll`'s `finally { setMessage('') }` was removed (it would have erased the error message immediately); success now clears via `fetchdata`'s reset
- src/UI/OwnerTableLogging.tsx — 2 edits: the two `console.error` calls (`fetchFiltered` / `fetchTotalRows` returning `ok: false`) became `setMessage('Error fetching logging…: ' + error)`. No `write_logging` here: those are `table_` functions that already log their own failure server-side, and the viewer writing into the table it just failed to read is the case flagged as a poor fit.
`npx tsc --noEmit` passes.

#### Phase 9 — Named exports only in server-action files (audit)
No changes. 25 files in `src/` start with `'use server'` (the `table_*`/`write_logging`/`fetch*` family under `src/tables/tableGeneric/`, `cache_actions.ts`, `app/actions.ts`, and the `OwnerSyncVersions_actions`, `OwnerDbRouting_actions`, `OwnerTableLogging_actions` files); none of them has an `export default`. The 34 files that do use `export default` are components, hooks-free UI panels and Next.js `page`/`layout` files, none of which is a `'use server'` file.

#### Phase 10 — SQL text rules (audit)
No changes. No SQL string in `src/` or `scripts/` uses `table.column` notation: the only dotted names are `information_schema.columns` (`table_copy_data.ts:86`, `:175` — schema-qualified system catalog, not a project table.column) and `EXCLUDED.gev_cp` / `EXCLUDED.gev_mate` (`app/actions.ts:61`, `:63` — PostgreSQL's mandatory alias inside `ON CONFLICT … DO UPDATE`, and only inside sample log text). `scripts/schema.sql` (report-only): no `SERIAL`/`BIGSERIAL`, no `REFERENCES`, no `CASCADE`; all three tables (`xlg_logging`, `xrtg_routing`, `ttst_test`) use `GENERATED BY DEFAULT AS IDENTITY`.
Flagged (not changed): none.

#### Phase 11 — File structure (proposed — approved in full 2026-09-20, applied)
Audit (read-only scripts over every `.ts`/`.tsx` in `src/` and `scripts/`): (a) `'use client'`/`'use server'` is line 1 in every file that has one — no findings. (b) top-level constants used above their declaration, and (c) `useState` declared after other hooks/logic in a component, gave the items below. The constants that merely sit below the first function but ahead of the function that uses them (`SELECTION_ALL`, `TEXT_SIZES`, `rawHandlers`, `MAX_DISPLAY_ROWS`, and the per-tab `*Defaults` that sit directly above their own tab function) are already correct and not listed.
- 11.1 src/UI/OwnerComponentTest.tsx — `const toggleDefaults` (declared ~line 2037) is used by `MyToggleTab` (~line 1913): move the declaration to just above `function MyToggleTab`
- 11.2 src/UI/OwnerComponentTest.tsx — `const selectMultiFruitOptions6`, `selectMultiFruitOptions20` and `selectMultiDefaults` (declared ~lines 2610–2640) are used by `MySelectMultiTab` (~lines 1693–1697): move the three declarations to just above `function MySelectMultiTab`
- 11.3 src/UI/OwnerComponentTest.tsx — `const selectRowsDefaults` (declared ~line 2666) is used by `MySelectRowsTab` (~line 1830): move the declaration to just above `function MySelectRowsTab`
- 11.4 src/UI/OwnerTableLogging.tsx:68-69 — the `message` and `popup` `useState` declarations sit after the `prevFilters` `useRef` block: move them up beside the other `useState` lines (above `prevFilters`)
- 11.5 src/app/backnav-test/[id]/page.tsx:21 — `const [isDev, setIsDev] = useState(false)` sits after `useParams()` and `useBackNav(...)`: move it to the top of the component
- 11.6 src/UI/OwnerLayout.tsx:20 — `const [backPath, setBackPath] = useState<string | null>(null)` sits after `const pathname = usePathname()`: move it above `usePathname`
Flagged (not changed):
- src/UI/OwnerConstants.tsx:32 — `const [activeGroup, setActiveGroup] = useState(groupNames[0])` comes after `constantGroups`/`groupNames` because its initial value is derived from them (moving it up would change behaviour), so it can't be moved
- Neutral, left as-is: simple string constants such as `const functionName = '…'` that precede the `useState` lines in several components

#### Phase 11 — applied
All 6 items applied as proposed. One small addition: for 11.1–11.3 each moved constant took its `type …ControlProps` declaration with it (the type stays directly above its `const`, as in every other tab), rather than leaving the type behind.
- src/UI/OwnerComponentTest.tsx — 6 edits (11.1: `ToggleControlProps` + `toggleDefaults` moved above `MyToggleTab`; 11.2: the fruit option sets, `SelectMultiControlProps` and `selectMultiDefaults` moved above `MySelectMultiTab`; 11.3: `SelectRowsControlProps` + `selectRowsDefaults` moved above `MySelectRowsTab` — each move is an insert plus a removal at the old location)
- src/UI/OwnerTableLogging.tsx — 2 edits (11.4: `message` and `popup` states moved above the `prevFilters` ref)
- src/app/backnav-test/[id]/page.tsx — 1 edit (11.5)
- src/UI/OwnerLayout.tsx — 1 edit (11.6)
`npx tsc --noEmit` passes. Re-running both read-only scans: no top-level constant is used above its declaration, and the only remaining "useState after other logic" hit is the flagged `OwnerConstants.tsx:32`.

#### Phase 12 — Multi-export split (proposed — approved in full 2026-09-28 via "continue", applied)
Audit (read-only script over every `.ts`/`.tsx` in `src/` and `scripts/`): 9 files export more than one function/component/hook. Two are real split candidates; the other seven are correctly multi-export.
Candidates (default new file name = the exported function's name; no function renames recommended — every name already matches what the function does):
- 12.1 src/tables/tableGeneric/table_pages/buildSqlQuery.ts — three independent exports (`buildSqlQuery`, `applyFetchSuffix`, `buildCountQuery`), no private helper or module state shared between them (they only share imported types/none). Split: `buildSqlQuery` stays in `buildSqlQuery.ts`; `applyFetchSuffix` → new `applyFetchSuffix.ts`; `buildCountQuery` → new `buildCountQuery.ts` (each function's header comment moves with it; no directive needed, the original has none). Importers to update to the new files: `fetchFiltered.ts:22`, `fetchTotalPages.ts:22`, `tableFetchUtils.ts:7`, `fetchTotalRows.ts:23`. The path is in `package.json` exports (`./buildSqlQuery`) but no sibling project imports it (searched `C:\Users\richa\claude\github\*/src`), so nothing external breaks; per the nextjs-shared rule a re-export of the two moved names is kept in `buildSqlQuery.ts` unless you drop it.
- 12.2 src/components/useBackNav.ts (`'use client'`) — two exports, `saveBackNav` and `useBackNav`, no private helper shared (both only use the imported `SessionStorageKeyPrefixShared`). Split: `useBackNav` stays in `useBackNav.ts`; `saveBackNav` → new `saveBackNav.ts` (starts with `'use client'`, imports `SessionStorageKeyPrefixShared`). Importer to update: `src/UI/OwnerBackNavDemo.tsx:10`. This one IS consumed externally — `next-bridge` imports both names from `nextjs-shared/useBackNav` in 8 files — so `useBackNav.ts` MUST keep `export { saveBackNav } from './saveBackNav'` or those 8 imports break. Caveat for your decision: the two are a paired write/read protocol (the key must match) documented together; you may prefer to keep them in one file even though they share no code.
Not candidates (correctly multi-export, listed with the reason):
- src/app/actions.ts — `'use server'` module of peer test actions (`action_generateLogs`, `action_generateCache`); a `'use server'` file may only export async functions
- src/tables/cache/cache_actions.ts — `'use server'` module of four peer cache actions
- src/tables/tableGeneric/table_pages/tableFetchUtils.ts — `'use server'` module of three peer page-fetch functions
- src/UI/OwnerSyncVersions_actions.ts — `'use server'` module of ten actions that also share private helpers
- src/tables/cache/userCache_store.ts — ten functions sharing the module-level `cache` store and helpers
- src/tables/db.ts — `sql` and `resolveDbKey` share the routing map and handler state
- src/components/isSelectionFiltering.ts — `serializeSelection` calls `isSelectionFiltering` and uses the exported `SELECTION_ALL`
Flagged (follow-up, not part of this phase): `CONSUMING_PROJECTS.md` points at `src/components/useBackNav.ts` for `saveBackNav`; if 12.2 is applied that pointer would need updating, and documentation edits go through their own `#plan`/`#code` gate.

#### Phase 12 — applied
Both items applied as proposed, each keeping a re-export at the old path so nothing external (package.json's `./buildSqlQuery` and `./useBackNav` entries, and next-bridge's `nextjs-shared/useBackNav` imports) needed to change.
- src/tables/tableGeneric/table_pages/applyFetchSuffix.ts — new file (function + header moved from buildSqlQuery.ts)
- src/tables/tableGeneric/table_pages/buildCountQuery.ts — new file (function + header moved from buildSqlQuery.ts)
- src/tables/tableGeneric/table_pages/buildSqlQuery.ts — kept `buildSqlQuery` only; added `export { applyFetchSuffix } from './applyFetchSuffix'` and `export { buildCountQuery } from './buildCountQuery'`
- src/tables/tableGeneric/table_pages/fetchFiltered.ts, fetchTotalPages.ts, fetchTotalRows.ts, tableFetchUtils.ts — 1 edit each, import the split functions from their own new files instead of via buildSqlQuery.ts
- src/components/saveBackNav.ts — new file (`'use client'`, function + header moved from useBackNav.ts)
- src/components/useBackNav.ts — kept `useBackNav` only; added `export { saveBackNav } from './saveBackNav'`
- src/UI/OwnerBackNavDemo.tsx — 1 edit, imports `saveBackNav` from its new file directly
`npx tsc --noEmit` passes. package.json's `exports` map was left unchanged — both moved names remain reachable at their existing `./buildSqlQuery` and `./useBackNav` package paths via the re-exports.

#### Phase 13 — function-order (audit)
No changes. Conversion pass: a project-wide scan for `const name = (...) => {` (the named-arrow-function pattern this pass converts) found **zero** matches in `src/` or `scripts/` — consistent with the earlier `PLAN_function-headers-order-audit` full sweep, which also found zero.
Ordering pass: `PLAN_function-headers-order-audit` already ran a full top-down-ordering sweep over every file in this project (see that plan, archived earlier). This cleanup run's own edits (phases 4–12) only added/relocated top-level `const`s (return-const, JSX-calculation, file-structure moves) and split two files each into single-function files (Phase 12) — none of them reordered an existing function declaration or introduced a new one out of first-use order, so no new violation was introduced by this run. This is reasoned from what changed, not a fresh full re-scan of every function in every file — if you want a full re-verification rather than this reasoning, say so and it'll be run as its own item.
Flagged (not changed): none.

#### Phase 14 — function-headers (proposed — approved in full 2026-09-28 via "continue", applied)
Audit: `PLAN_function-headers-order-audit` already brought every pre-existing file's headers into compliance. This run's own edits (phases 4–12) added no new named helper functions needing a header (Phase 5's block-body callbacks are inline arrow callbacks, same as every other `.map(...)` callback already in the codebase — not given individual headers under the existing convention) — except Phase 12's file split, which left 5 files with the *old* plain dashed helper-style header even though each now has exactly one main export (plus, for two of them, re-export lines) and so now qualifies for the numbered main header.
- 14.1 src/tables/tableGeneric/table_pages/applyFetchSuffix.ts — convert to numbered header. `1) DESCRIPTION`: name + one-line summary from the existing comment; `Parameters:`/`Returns:` from the existing `Params:`/`Returns:`. `2) NOTES`: the existing extra paragraph about LIMIT/OFFSET being bound as params while ORDER BY/DISTINCT ON stay string-interpolated (genuine behavioural detail, not just a signature restatement) — moved here rather than folded into the one-line summary. `3) CHANGE HISTORY`: one entry, since this is part of an actual code change this session — "2026-09-28 — split out of buildSqlQuery.ts (one-export-per-file cleanup); no signature change."
- 14.2 src/tables/tableGeneric/table_pages/buildCountQuery.ts — convert to numbered header, same treatment. `2) NOTES`: not needed (the "shared by X's cache-key build and Y's actual query build" context fits in the one-line summary). `3) CHANGE HISTORY`: "2026-09-28 — split out of buildSqlQuery.ts (one-export-per-file cleanup); no signature change."
- 14.3 src/tables/tableGeneric/table_pages/buildSqlQuery.ts — convert its remaining function (`buildSqlQuery`) to the numbered header; the two `export { … } from …` re-export lines are noted in `2) NOTES` ("also re-exports `applyFetchSuffix`/`buildCountQuery` for existing consumers — see their own files") since they're not functions living in this file. `3) CHANGE HISTORY`: "2026-09-28 — applyFetchSuffix/buildCountQuery moved to their own files; re-exported here for existing consumers."
- 14.4 src/components/saveBackNav.ts — convert to numbered header (placed after `'use client'`, before the import, per convention). `3) CHANGE HISTORY`: "2026-09-28 — split out of useBackNav.ts (one-export-per-file cleanup); no signature change."
- 14.5 src/components/useBackNav.ts — convert its remaining function (`useBackNav`) to the numbered header; the `export { saveBackNav } from './saveBackNav'` line noted in `2) NOTES` (already has genuine NOTES content — the Strict Mode double-invoke guard — so the re-export line is added to that same section). `3) CHANGE HISTORY`: "2026-09-28 — saveBackNav moved to its own file; re-exported here for existing consumers (incl. next-bridge's `nextjs-shared/useBackNav` imports)."
Flagged (not changed): none.

#### Phase 14 — applied
All 5 items applied as proposed.
- src/tables/tableGeneric/table_pages/applyFetchSuffix.ts — 1 edit (14.1), numbered header with `2) NOTES` and `3) CHANGE HISTORY`
- src/tables/tableGeneric/table_pages/buildCountQuery.ts — 1 edit (14.2), numbered header with `3) CHANGE HISTORY`
- src/tables/tableGeneric/table_pages/buildSqlQuery.ts — 1 edit (14.3), numbered header (moved to the very top of the file, before the import and the two re-export lines, since this file has no `'use client'`/`'use server'` directive) with `2) NOTES` and `3) CHANGE HISTORY`
- src/components/saveBackNav.ts — 1 edit (14.4), numbered header placed after `'use client'`, before the import, with `3) CHANGE HISTORY`
- src/components/useBackNav.ts — 1 edit (14.5), numbered header with `2) NOTES` (Strict Mode guard + re-export note) and `3) CHANGE HISTORY`
`npx tsc --noEmit` passes. `npm run build` also passes (full production build, all 10 routes generated) — this is the end-of-automatic-phases gate per the skill.

## Testing (automatic phases 1–14)
- [ ] `npx tsc --noEmit` and `npm run build` both pass (confirmed by this run — re-run yourself to double check)
- [ ] Open `/owner` → Logging tab: confirm the table loads, filters still work, and truncate still works (Phase 8 touched its error handling; Phase 5 touched its JSX; Phase 11 reordered its `useState`s)
- [ ] Open `/owner` → Cache tab: confirm entries load/paginate, click a row to open detail, delete an entry, click "Clear All" — then stop the dev server and click Refresh to confirm an error now shows in red under the table (Phase 8's reopened behaviour change) and clears again on the next successful refresh
- [ ] Open `/owner` → Versions tab (OwnerSyncVersions): spot-check the Major/Minor/Patch filter chips, the project version-diff table cell colours/section codes, and the Sync button — heavily touched by Phase 5's JSX-calculation split
- [ ] Open `/owner` → Constants tab: confirm the Constants/.env sub-tabs and the pill group tabs still switch correctly (Phase 5 + Phase 11 both touched this file)
- [ ] Open `/owner/functiontest`: run the tests and confirm the pass/fail table still renders (Phase 3, 4, 5 all touched this file/page)
- [ ] Open `/test/components` (OwnerComponentTest): spot-check the MyInputNumeric, MyCheckbox, MyPagination, MySelect, MySelectTable, MySelectMulti, MyHelp, MyHelpStep, MyPaginationFooter and MyBackHomeNav demo tabs — all had props/derived-value changes in Phase 5 or 11
- [ ] Open `/test/back-nav-demo` → click a row → confirm the Back link returns to the same tab (Phase 12 split `useBackNav`/`saveBackNav` into separate files)
- [ ] Confirm nextjs-shared's own consuming-project contract is unaffected: `package.json`'s `./buildSqlQuery` and `./useBackNav` exports still resolve (re-exports added in Phase 12) — no action needed in next-bridge unless its own reinstall surfaces an issue

#### Phase 15 — Convention findings list (report-only)
Read-only. Findings below; pick which (if any) become work — selected ones get appended as new unchecked `## Plan` steps for a later `#code`, this phase itself changes nothing.

**Findings:**
- F15.1 src/UI/OwnerTableCache.tsx:316 — `const MAX_DISPLAY_ROWS = 100` (module-level, not in `src/constants.ts`) — a genuinely tunable display cap ("would the user want to change this without changing the function's logic?" — yes), currently scattered in the file it's used in rather than the project's one constants file
- F15.2 src/UI/OwnerTableLogging.tsx:32 — `const LOGGING_ROWS_PER_PAGE = 40` (module-level, not in `src/constants.ts`) — same reasoning, a page-size tunable

**Checked, no finding (for the record):**
- direct `sql()`/`db.query()` calls — confined entirely to `src/tables/db.ts` and the `table_*`/`write_logging`/`fetch*` files under `src/tables/tableGeneric/` — i.e. the shared data-access layer's own implementation, not a bypass of it. No UI/action file calls `sql()`/`db.query()` directly.
- `skipCache: true` on maintenance/status reads — every `table_fetch`/`fetchFiltered`/`fetchTotalRows` call outside the tableGeneric layer itself (`OwnerTableLogging.tsx`, `OwnerRoutingTest.tsx`, `OwnerRoutingMaintenance.tsx`) already passes it
- `DROP`/`TRUNCATE`/`DELETE FROM` in application code — the only literals are inside `table_drop.ts`/`table_truncate.ts`/`table_delete.ts` themselves, i.e. this project's whole purpose is to *provide* those as generic, parameterized shared functions to consuming projects — not "application code embedding a destructive operation," the case the rule targets. Not re-flagged, consistent with reasoning already accepted for other self-referential cases in this project (write_logging not logging about itself, MyDropdown/MySelect intentional split — see `[[project_mydropdown_vs_myselect_intent]]`, `[[project_next_bridge_truncate_accepted]]`-style precedent).
- stray `.sql` files — only `scripts/schema.sql` exists
- tables referenced in code but missing from `scripts/schema.sql` — `xlg_logging`, `xrtg_routing`, `ttst_test` are the only tables referenced anywhere in `src/`, and all three are in `scripts/schema.sql`
- more than one constants file — only `src/constants.ts`
- row types redefined locally that `src/tables/structures.ts` already exports — `table_Logging`/`table_Routing`/`table_Test` are each imported from `structures.ts` everywhere they're used, never redeclared
- hardcoded lists of real-world entities — none found beyond the existing, already-reviewed `ENV_VARS`/`Constants` grouping in `OwnerConstants.tsx`, which is the intended display list for that dev page, not a project/path/URL list
- inline dropdown/toggle option lists reused across files, and duplicate JSX blocks across files — none found; the "No options found" fallback in `MyCheckbox.tsx` and `MySelectTable.tsx` render different element types (`<p>` vs `<option>`) for different UI paradigms (checkbox list vs. native `<select>`), not a true duplicate
- missing explicit parameter/return types — spot-checked, not exhaustively swept; no gaps found in the files touched by this cleanup run

#### Phase 15 — F15.1/F15.2 applied (2026-09-28, user: "follow the plan. constants must be external")
Per the Coding Conventions "Constants" test and rule (2) under "Explicit choices" — both were already-decided existing values, not new constraints needing a fresh number agreed, so this is a mechanical externalization, not a judgment call requiring a new value to be picked.
- src/constants.ts — 2 edits: added `OwnerTableCache_maxDisplayRows = 100` (next to the other `OwnerTableCache_*` constants) and `OwnerTableLogging_rowsPerPage = 40` (next to the other `OwnerTableLogging_*` constants, matching its existing `OwnerTableLogging_rowsOptions = [10, 20, 40, 100]` default)
- src/UI/OwnerTableCache.tsx — 4 edits: removed the local `const MAX_DISPLAY_ROWS = 100`, imported `OwnerTableCache_maxDisplayRows`, replaced both usages
- src/UI/OwnerTableLogging.tsx — 2 edits: removed the local `const LOGGING_ROWS_PER_PAGE = 40`, imported `OwnerTableLogging_rowsPerPage`, replaced its one usage
`npx tsc --noEmit` passes.

#### Phase 16 — Component-authoring checks (report-only; nextjs-shared only)
Applies here since this project is nextjs-shared. Read "Component authoring rules" fresh from `.claude/CLAUDE.md`. Read-only; nothing changed.

**Findings — hardcoded sub-element classes with no override prop (stylistic, not structural — per `[[project_overrideclass_responsive_variant_gotcha]]`-adjacent precedent `[[feedback_structural_classes_not_constants]]`, a mechanical class like `flex`/`relative` stays hardcoded, but a specific size/color choice needs a constant + override prop):**
- F16.1 src/components/MyHelpStep.tsx:116 — `<td className="font-semibold text-gray-500 w-24 px-3 py-2 border-b border-gray-100 whitespace-nowrap">` — the `w-24` column width is a style choice with no override prop
- F16.2 src/components/MyPopup.tsx:60 — `<XMarkIcon className='h-6 w-6' />` — hardcoded icon size, no override prop (the button itself has `closeButtonClass`, but not the icon inside it)
- F16.3 src/components/MyConfirmDialog.tsx:91 — `<ExclamationCircleIcon className='h-24 w-24 text-current' />` — same, hardcoded icon size
- F16.4 src/components/MyCheckbox.tsx:260 — the raw `<input type='checkbox' ... className='h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500' />` inside each option row — hardcoded checkbox styling, distinct from the already-overridable `className_CheckboxItem` on its wrapping `<label>`

**Checked, no finding (for the record):**
- `overrideClass` + `myMergeClasses` + a `_dftClass` constant in `src/constants.ts` — every one of the 22 components with a single styled main element follows this
- Sub-element override props (`labelClass`/`titleClass`/`containerClass` naming) — present wherever a sub-element has a stylistic default, except the four F16.x gaps above
- `<label htmlFor>` / input id linkage — every `<label>` either has explicit `htmlFor`+matching `id` (`MySelect`, `MySelectMulti`, `MySelectTable`, `MyCheckbox`'s main label) or directly wraps its `<input>` (implicit association — `MyToggle`, `MySelectMulti`'s per-option/select-all labels, `MyCheckbox`'s per-option labels), both valid
- Layout opinions (width/height/padding/scroll/border) hardcoded in shared components beyond the F16.x items — `MyPaginationFooter.tsx:86`'s `flex justify-center min-w-0 overflow-x-auto` wrapper is mechanical (required for the horizontal-scroll-on-overflow behavior to function at all, not a style choice), so not flagged, consistent with the structural-classes precedent
- `OwnerComponentTest` demo tabs full prop parity — no shared component's props, defaults, or exports changed anywhere in this cleanup run (phases 1–15 only reordered/reformatted/relocated code and fixed two constants), so parity is unaffected either way
- `CONSUMING_PROJECTS.md` in sync — same reasoning: Phase 12's file split kept the public `./buildSqlQuery`/`./useBackNav` import paths unchanged via re-exports, and Phase 8's `OwnerTableCache`/`OwnerTableLogging` error-display change is internal dev-app behavior, not a documented component API — nothing in this session needs a doc update
- Logging/DB layer logging about itself — already checked in Phase 8/15, no finding

#### Phase 16 — F16.1–F16.4 applied (2026-09-28, user: "add all the overrides for the classes")
Each hardcoded class externalized as a named override prop, following the file's own existing `_dftClass`/prop naming pattern exactly — never a generic name.
- src/constants.ts — 4 edits: `MyCheckbox_checkboxDftClass`, `MyConfirmDialog_iconDftClass`, `MyHelpStep_labelColumnDftClass` (`'w-24'`), `MyPopup_closeIconDftClass` — each placed next to that component's other constants
- src/components/MyPopup.tsx — added `closeIconClass?: string` (default `MyPopup_closeIconDftClass`), applied to the `XMarkIcon`
- src/components/MyConfirmDialog.tsx — added `iconClass?: string` (default `MyConfirmDialog_iconDftClass`), applied to the `ExclamationCircleIcon` (distinct from the existing `iconContainerClass` on its wrapping div)
- src/components/MyCheckbox.tsx — added the matching pair `defaultClass_Checkbox?: string` / `overrideClass_Checkbox?: string` (mirroring its existing `_Label`/`_Search`/`_Container`/`_CheckboxItem` pairs), merged via `myMergeClasses` into `className_Checkbox`, applied to the raw `<input type='checkbox'>` (distinct from `className_CheckboxItem` on its wrapping `<label>`)
- src/components/MyHelpStep.tsx — added `labelColumnClass?: string` (default `MyHelpStep_labelColumnDftClass`); applied only to the Input row's label `<td>`, which is the one that actually sets the table's label-column width (unchanged behaviour — the other rows' label cells never had `w-24` to begin with)
- src/UI/OwnerComponentTest.tsx — demo-tab parity for all four components, required by this project's own "demo page must stay in sync with component changes" rule: added the new control row, defaults entry, preview prop, and (for MyCheckbox) a new `ReturnRow` to `MyPopupTab`, `MyConfirmDialogTab`, `MyCheckBoxTab`, `MyHelpStepTab`; added the 3 new constant imports
- `CONSUMING_PROJECTS.md` — checked, no update needed: it documents each component with only a one-line description and a pointer to its source file, no per-prop tables to keep in sync (confirmed against its current MyCheckbox/MyConfirmDialog/MyPopup/MyHelpStep entries)
`npx tsc --noEmit` and `npm run build` both pass (full production build, all 10 routes).

#### Phase 17 — Shared-component adoption (proposed — approved in full 2026-09-28, applied)
Audit: read the exported component list fresh from `src/components/`/`src/UI/` (this is nextjs-shared itself, so the `My*` implementations are excluded — they legitimately use raw HTML). Scanned every `<select>`/`<input>`/`<textarea>`/`<button>` in `src/UI/` and `src/app/` (outside `src/components/`).
- 17.1 src/UI/OwnerComponentTest.tsx:418-427 — the `type` control-row in `MyInputTab` uses a raw `<select>` with hardcoded `className` and four plain `<option>`s (text/number/email/password) → `MySelect` with `options={['text', 'number', 'email', 'password']}`, `value={draft.type}`, `onChange={...}` (unchanged), `overrideClass='w-full'` (matching every other control row's width convention in this same file, replacing the ad hoc `'text-sm border border-gray-300 rounded px-1 h-9 w-full'`)
- 17.2 src/app/owner/OwnerGenerateData.tsx:21-26 — "Generate Logs" raw `<button onClick className='px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600'>` → plain `<MyButton onClick={...}>` with no `overrideClass` — `MyButton_dftClass` already provides `text-xs`, white text, `bg-blue-500 hover:bg-blue-600`, rounded corners and padding; adopting the shared component means taking its default look (near-identical, minor pixel differences in padding/corner-radius) rather than reconstructing the old raw button's exact values via override
- 17.3 src/app/owner/OwnerGenerateData.tsx:30-35 — "Generate Cache" — same conversion as 17.2
Flagged (not changed) — segmented pill/toggle filter buttons, matching this phase's own stated exclusion for "segmented pill filters... deliberately project-specific" UI:
- src/UI/OwnerSyncVersions.tsx:197-214 — the Major/Minor/Patch filter-toggle buttons (`majorChipClass`/`minorChipClass`/`patchChipClass`, active/inactive styling)
- src/UI/OwnerTableLogging.tsx:124-136 — the Raw/Readable/Params SQL-view toggle buttons (`chipClass`, active/inactive styling)
- Every `<input type='checkbox'>`/`<input type='radio'>` across `OwnerComponentTest.tsx` — no shared component covers a plain checkbox/radio primitive (MyCheckbox is a full multi-select group, not a single toggle); consistent with the established precedent that checkboxes are excluded from this kind of audit in other projects

#### Phase 17 — applied
All 3 items applied as proposed.
- src/UI/OwnerComponentTest.tsx — 1 edit (17.1): the `type` control-row's raw `<select>` replaced with `MySelect` (`options={['text','number','email','password']}`, same `value`/`onChange`, `overrideClass='w-full'`)
- src/app/owner/OwnerGenerateData.tsx — 3 edits (17.2, 17.3): imported `MyButton`; both raw `<button>`s replaced with plain `<MyButton onClick={...}>`, taking the shared component's own default styling (no `overrideClass`)
`npx tsc --noEmit` and `npm run build` both pass (full production build, all 10 routes).

## Testing (Phase 17 — behaviour/appearance change)
- [ ] Open `/test/components` → MyInput tab: confirm the `type` dropdown (text/number/email/password) still switches the preview input's type correctly, and looks like every other dropdown in the demo page
- [ ] Open `/owner` → confirm the "Generate Logs"/"Generate Cache" buttons (OwnerGenerateData, likely on the Owner landing tab) still trigger their actions and show the result message; the buttons will look very slightly different — `MyButton`'s default height/padding/corner-radius instead of the old raw button's exact values — confirm this is acceptable

#### Phase 18 — window.location → router hooks (GATED — discovery, then option (a) approved 2026-09-28, applied)
Audit: 4 uses of `window.location` in `src/`, all `.href =` (navigate) or `.pathname`/`.search` (read); none is `.reload()` or `.origin`.

**Discovery list:**
- D18.1 src/app/test/layout.tsx:17 — navigate — `window.location.href = '/'` inside a `useEffect` dev-guard (`if (NEXT_PUBLIC_APPENV_ISDEV !== 'true') { window.location.href = '/' }`) → could become `router.push('/')` (needs `useRouter()` from `next/navigation` added)
- D18.2 src/UI/OwnerLayout.tsx:24 — navigate — identical dev-guard pattern → same proposed replacement
- D18.3 src/app/backnav-test/[id]/page.tsx:25 — navigate — identical dev-guard pattern → same proposed replacement
- D18.4 src/components/saveBackNav.ts:25 — read — `path ?? window.location.pathname + window.location.search` → the textbook replacement is `usePathname()`/`useSearchParams()`, but **cannot be applied as a mechanical swap**: `saveBackNav` is a plain imperative function called from `onClick` handlers (not a component/hook), including from 8 files in next-bridge (`nextjs-shared/useBackNav`) plus this project's own `OwnerBackNavDemo.tsx` — hooks can't be called outside a component's render. Converting this would mean redesigning `saveBackNav`'s own calling convention (e.g. becoming a hook itself, or taking pathname/search as arguments from a caller who already has them) — a real API change to a function 8+ external call sites depend on, not a same-behavior swap. Flagged as a genuine architectural question, not proposed as an in-place edit.

**Decision needed for D18.1–D18.3 before anything is applied — this is exactly the deliberate-hard-reload case this phase exists to catch, not auto-convert:** all three are dev-only "kick a non-dev visitor out entirely" guards. `window.location.href` forces a full page reload (clean slate, no leftover client state/loaded modules); `router.push('/')` would instead do a soft client-side navigation, which is the general Next.js-preferred pattern but changes behavior here specifically — a full reload may be the deliberately safer choice for a dev-only access guard. Tell me whether to (a) convert all three to `router.push('/')`, (b) leave all three as `window.location.href` (a documented, deliberate exception to the router-hooks rule), or (c) decide per-file.

D18.4 (`saveBackNav.ts`) is not something this phase can resolve by itself — it would need a separate design decision about `saveBackNav`'s API, out of scope for a mechanical Phase 18 conversion. Left unchanged. User confirmed 2026-09-28: leave noted for later (not pursued now) — real design decision, not broken today, and the fix would ripple into next-bridge's 8 call sites, a separate cross-project session.

#### Phase 18 — applied (D18.1–D18.3, option (a): convert all three)
- src/app/test/layout.tsx — 1 edit: added `useRouter` from `next/navigation`, `window.location.href = '/'` → `router.push('/')`, `router` added to the effect's dependency array
- src/UI/OwnerLayout.tsx — 1 edit: added `useRouter` alongside its existing `usePathname` import, same replacement, `router` added to the effect's dependency array (alongside the existing `pathname` dependency)
- src/app/backnav-test/[id]/page.tsx — 1 edit: added `useRouter` alongside its existing `useParams` import, same replacement, `router` added to the effect's dependency array
`npx tsc --noEmit` and `npm run build` both pass (full production build, all 10 routes).

## Testing (Phase 18 — behaviour change: full reload → soft client-side navigation)
- [ ] With `NEXT_PUBLIC_APPENV_ISDEV` unset/`false`, visit `/test/components` (or any `/test/*` route) and confirm it now navigates to `/` via client-side routing rather than a full page reload — should still land on `/` correctly
- [ ] Same check for `/owner` (or any `/owner/*` route) — confirm the dev guard still redirects to `/` in non-dev
- [ ] Same check for `/backnav-test/<id>` — confirm the dev guard still redirects to `/` in non-dev
- [ ] With `NEXT_PUBLIC_APPENV_ISDEV=true` (normal dev use), confirm all three routes still load normally and are unaffected (the guard's early-return branch is untouched)

#### Phase 19 — Naming (GATED — proposal, then full table + flagged aside approved 2026-09-28, applied)
Read "Variable and identifier naming — always match the Data Dictionary source" fresh, in full, before auditing. Used `scripts/schema.sql` as the DD source. Scanned for: SQL `AS` aliases restating a column, filter-state naming, loaded-row-array naming, invented names for DD values, URL query-param mismatches, shape-named collections, position/ply/FEN misuse (N/A — this project has no such concept).

**The one real finding: filter state in the two Owner inspector tabs doesn't use the documented `filter_<column>`/`setFilter_<column>` form — and the two files don't even match each other.**

*`OwnerTableCache.tsx`* uses a **suffix** form:
| Old | New |
|---|---|
| `keyFilter` / `setKeyFilter` | `filter_key` / `setFilter_key` |
| `tableFilter` / `setTableFilter` | `filter_table` / `setFilter_table` |
| `callerFilter` / `setCallerFilter` | `filter_caller` / `setFilter_caller` |
| `prevFilters.current.{keyFilter,tableFilter,callerFilter}` (a work/tracking ref, not primary state) | `prevFilters.current.{filter_key,filter_table,filter_caller}` — field names realigned to match |

*`OwnerTableLogging.tsx`* uses **bare column names**, no prefix or suffix at all, and lowercase setters (`setmsg`, not `setMsg`) — inconsistent with every other setter in the same file (`setSqlView`, `setRowsPerPage`, `setMessage`):
| Old | New |
|---|---|
| `msg` / `setmsg` | `filter_msg` / `setFilter_msg` |
| `caller` / `setcaller` | `filter_caller` / `setFilter_caller` |
| `functionname` / `setfunctionname` | `filter_functionname` / `setFilter_functionname` |
| `severity` / `setseverity` | `filter_severity` / `setFilter_severity` |
| `level` / `setlevel` | `filter_level` / `setFilter_level` |
| `dbkey` / `setdbkey` | `filter_dbkey` / `setFilter_dbkey` |
| `table` / `settable` | `filter_table` / `setFilter_table` |
| `isupdate` / `setisupdate` | `filter_isupdate` / `setFilter_isupdate` |
| `sqlfilter` / `setsqlfilter` | `filter_sql` / `setFilter_sql` (its underlying column varies with `sqlView` — `lg_sql_raw`/`lg_sql_readable`/`lg_sql_params`; `filter_sql` names the search text itself, not a fixed column, so no bare DD root applies here) |
| `prevFilters.current.{msg,caller,functionname,severity,level,dbkey,table,isupdate,sqlfilter}` | same 9 fields renamed to match |

Every renamed identifier is local component state (not exported), so the nextjs-shared "exports are flagged, never auto-renamed" carve-out doesn't apply here — these are safe to rename in place once agreed.

**Flagged aside (not a DD-naming issue, so not in the table above, but noted since it was found in the same scan):** `OwnerTableLogging.tsx`'s pagination setter `setcurrentPage` (line ~51) is also all-lowercase, inconsistent with the file's own `setRowsPerPage`/`setTotalPages`/`setMessage`. It isn't a DD value (it's pagination state, not a filtered column), so it's outside this phase's actual scope — flagging only because fixing the filter setters right next to it would leave this one oddly still lowercase. Your call whether to include it.

**Checked, no finding:**
- SQL `AS` aliases — `table_seq_get.ts`'s `AS column_name`/`AS sequence_name` are aliases over Postgres system-catalog columns (`pg_attribute`/`pg_class`), which have no project DD name to restate — legitimate, not a violation
- Loaded-row-array naming (`data`/`rows` inside `table_fetch`/`table_delete`/etc.) — these are generic, multi-table functions (the table is a runtime parameter), so there is no single fixed DD root to name them after; `data`/`rows` correctly describes the `pg` query-result shape at that generic level, not a specific table's rows
- URL query-param names — no `useSearchParams`/query-string-driven state exists anywhere in this project's own UI (filters here are plain `useState`, not URL-synced)
- Collections named by shape instead of source — `results: SyncResult[]` (`OwnerSyncVersions.tsx`/`OwnerSyncVersions_actions.ts`) is a sync-operation's own result array, not DB rows, so a shape/operation-based name is correct, not a violation
- FEN/ply/position naming — not applicable; this project has no such concept

#### Phase 19 — applied (user: "update as suggested" — both files' full tables, plus the flagged setcurrentPage aside)
- src/UI/OwnerTableCache.tsx — renamed `keyFilter`/`setKeyFilter` → `filter_key`/`setFilter_key`, `tableFilter`/`setTableFilter` → `filter_table`/`setFilter_table`, `callerFilter`/`setCallerFilter` → `filter_caller`/`setFilter_caller`; `prevFilters.current` fields realigned; every JSX `id`/`name`/`value`/`onChange` usage and the debounce effect's dependency array updated to match. `cacheAction_getEntries`'s own call-site keys (`keyFilter:`/`tableFilter:`/`callerFilter:`) left as-is — that's a separate exported function's own parameter names, not in scope for this file-local rename; the call site now maps `keyFilter: filter_key` etc.
- src/UI/OwnerTableLogging.tsx — renamed all 9 filter fields (`msg`→`filter_msg`, `caller`→`filter_caller`, `functionname`→`filter_functionname`, `severity`→`filter_severity`, `level`→`filter_level`, `dbkey`→`filter_dbkey`, `table`→`filter_table`, `isupdate`→`filter_isupdate`, `sqlfilter`→`filter_sql`) and their setters to `setFilter_*` (properly cased, replacing the all-lowercase `setmsg`/`setcaller`/etc.); `prevFilters.current` fields, the debounce effect's dependency array, every `MyInput`/`MyInputNumeric`/`DbKeySelect` `id`/`name`/`value`/`onChange`, and `fetchdata`'s `filtersToUpdate` array all updated to match. Also folded in the flagged aside: `setcurrentPage` → `setCurrentPage` (3 call sites), matching the file's other properly-cased setters. `MyPaginationFooter`'s own `statecurrentPage`/`setStateCurrentPage` props (that component's fixed API) and the unrelated `tableName`/`table: tableName` local (the actual DB table name passed to `fetchFiltered`/`fetchTotalRows`, a different concept from the `lg_table` filter) were left untouched — confirmed distinct from the renamed filter state throughout
`npx tsc --noEmit` and `npm run build` both pass (full production build, all 10 routes).

## Testing (Phase 19 — renamed local state, no behaviour change intended)
- [ ] Open `/owner` → Cache tab: type in each of the three filter boxes (Table, Caller, Key) and confirm filtering still works exactly as before
- [ ] Open `/owner` → Logging tab: type in each of the filter boxes (Level, Severity, DbKey, Table, IsUpdate, Caller, Function Name, Message, and the SQL search box) and confirm filtering still works exactly as before; confirm the Raw/Readable/Params toggle still changes which SQL field the search box searches
- [ ] Logging tab: confirm pagination (page number, rows-per-page) still works, and Truncate still resets to page 1 correctly

## Declined
Items the user removes or accepts-as-is from a phase are recorded here as `Phase N — file — short snippet`.
- Phase 2 — OwnerTableSessionStorage.tsx, OwnerSyncVersions.tsx, MySelectTable.tsx, DbKeySelect.tsx, OwnerRoutingTest.tsx, OwnerRoutingMaintenance.tsx — `useEffect` calling a component-level async function (`refresh`/`handleRefresh`/`fetchOptions`/`fetchTest`/`fetchRouting`) instead of an inner named function — accepted as-is by the user

## Testing
- [ ] Run `/skillslist` and confirm `cleanup` appears in the skills list and `/cleanup` appears in the trigger commands
- [ ] Read `~/.claude/skills/cleanup/SKILL.md` and confirm the 19-phase table (Phase 12 = multi-export split) and the audit → propose → approve → implement → record cycle
- [ ] In a session open in a small project, send `#cleanup` and confirm it only creates `docs/plans/PLAN_code-cleanup-<date>.md` (19 phases unchecked, plus `## Changes` and `## Declined`) and stops without editing any source
- [ ] Send `#code` and confirm Phase 1 only AUDITS: it writes `### Phase 1 — proposed` with numbered items into the plan, edits no source file, and waits
- [ ] Reply `approve except <an item>` and confirm only the other items are changed, the removed item appears under `## Declined`, and `### Phase 1 — applied` lists exactly the files edited
- [ ] Send `continue` and confirm Phase 2's audit starts only then; confirm a phase with nothing to change reports "No changes." and still stops
- [ ] Run a second `#cleanup` audit over the same project and confirm Declined items are not re-proposed
- [ ] Confirm phases 15–16 write findings only (no code changes), and Phase 16 is skipped as n/a outside nextjs-shared
- [ ] At Phase 12 in a project with a multi-export file, confirm the proposal lists, per file, the new file name for each export (defaulting to the function's name), the helpers that move, and the importers to update; that shared-helper and server-action files appear as non-candidates with a reason; and that a function rename is recommended only with a reason
