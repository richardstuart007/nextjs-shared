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
