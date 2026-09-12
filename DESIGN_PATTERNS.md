# DESIGN_PATTERNS.md — Cross-Project Architectural Pattern Index

This file indexes established **architectural/backend mechanisms** that recur (or plausibly will
recur) across projects under `C:\Users\richa\claude\github` — pipeline structuring, run-id/logging
allocation, sync/dedup strategies, data-integrity workarounds, backup/copy tooling, purge/archival
strategies. It exists so a session working in project A can check whether project B already solved
the same design problem, instead of independently re-inventing a variant.

**This is not a UI-component index** — shared React components (dropdowns, buttons, tables,
panels) are documented in [CONSUMING_PROJECTS.md](CONSUMING_PROJECTS.md), not here.

**When to check this file:** at `#plan` time, before designing any new pipeline/sync/batching/
purge/logging mechanism (or similar cross-cutting infrastructure) from scratch — see the global
`~/.claude/CLAUDE.md` section "Mirror an existing pattern instead of designing a new one." If an
entry below matches, propose mirroring it (citing the reference implementation) as part of the
plan.

**When to add an entry:** once a plan implements a genuinely new, reusable pattern — one that
plausibly solves a problem another project will hit too — propose adding an entry here before
considering the task done, the same way `COMMANDS.md` is kept in sync whenever a trigger changes.

**Editing this file** goes through the normal `#plan`/`#code` gate in a `nextjs-shared` session,
same as `CONSUMING_PROJECTS.md` — never written directly from another project's session (project
isolation is absolute). From a non-`nextjs-shared` session, propose the exact entry in chat and
tell the user to add it from a session open in `nextjs-shared`.

---

## 1. Pipeline run-id / logging allocation

### 1.1 Reuse-max-or-allocate-new run-id allocator

**Problem it solves:** A multi-step (and sometimes multi-entity) batch pipeline needs every step's
log row tagged with a shared run id so a UI can group "this run's" rows together, while a
standalone single-step click still needs its own id rather than silently joining — or polluting —
whatever run last happened to execute.

**Reference implementation:** `chess/src/lib/actions/pipelineLog.ts` — `resolvePipRunId(pipelineType, forceNew)` / `logPipelineStep(params)` / `getLatestPipelineRuns`. Independently converged on in `next-bridge/src/lib/actions/pipelineLog.ts` — `resolvePipRunId(step, forceNewRun)` / `logPipelineStep(args)` / `startPipelineRun(toDate, truncateStaging)` / `getPipelineRunStatus(runId)`.

**Mechanism:**
- `forceNew=true` → `SELECT COALESCE(MAX(pip_run_id),0)+1 ...` (allocates a fresh run id).
  `forceNew=false` → `SELECT COALESCE(MAX(pip_run_id),1) ...` (joins the current max, i.e. "this
  step belongs to whatever run is already in progress").
- Convention: **the first sub-step of a pipeline's first step passes `forceNewRun: true`; every
  other call in the same run passes `forceNewRun: false`.** The allocator itself has no notion of
  "which step is first" — that responsibility is pushed onto each step's own caller.
- Every log row records `step` / `sub_step` / `step_name` / `run_id` / `input_table+recs` /
  `output_table+recs` / `duration_ms`, so a run's full lineage is reconstructable from
  `tpip_pipelinelog` alone.
- next-bridge's variant adds `pip_batch` (1-indexed batch number, defaults to 1) and `pip_sub_sub`
  (per-tracked-entity index) — two extra dimensions chess's schema doesn't need, because
  next-bridge splits even a single step into several independently-scheduled cron batches (see
  §2). next-bridge also has an explicit `startPipelineRun()` "start" function (called only by
  `/api/build/start-run`) rather than chess's "first sub-step call sets forceNewRun itself"
  convention — a cleaner, more explicit variant of the same idea worth preferring in new pipelines.
- chess's `getLatestPipelineRuns` deliberately shows only the single highest `run_id`'s rows (not
  "latest per step") — a 2026-07-16 decision, since mixing rows from different run ids under one
  "Run #N" header read as misleading even though each row was individually accurate.

**Known gotchas:**
- next-bridge's `pip_batch = 0` only exists on pre-migration backfilled rows; all new rows are
  ≥ 1 — don't reuse `0` as a real batch number.
- A standalone single-step click will show blank/"—" for every other step in a "latest run"
  summary view until the next fully-coordinated run — this is expected, not a bug, given the
  "join current max" allocation rule.

### 1.2 Per-entity run-id allocation via sequential await (not a shared batch id)

**Problem it solves:** When a batch pipeline loops over several independent entities (players,
accounts), giving the *whole batch* one shared run id hides all but the first entity's numbers in
any UI that shows "latest row per (run_id, step, sub_step)" — a real, previously-shipped bug (see
chess's global CLAUDE.md, "Mirror an existing pattern instead of designing a new one").

**Reference implementation:** `chess/src/lib/master/masterSync.ts` — `syncMasterGames`, invoked
once per player from the sequential `for` loop in `chess/src/app/owner/pipelinemastergames/page.tsx` (`handleSync`).

**Mechanism:** The UI loop `await`s `syncMasterGames()` for each tracked player **strictly
sequentially**, passing the *same* `forceNewRun` value to every call. Because §1.1's allocator
computes `MAX(pip_run_id)+1` at call time, and each player's rows are already committed before the
next player's call begins, sequential awaiting naturally gives player 1 run `N+1`, player 2 run
`N+2`, etc. — each player's own steps land under their own run id, with the player's handle baked
into `step_name` (e.g. `"magnus: Query chess.com API"`) for readability.

**Contrast — when NOT to do this:** chess's own *regular* games pipeline (`runGameSync` in
`sync.ts`) loops over every tracked player but aggregates all of them under **one** shared run id
(sub-steps represent pipeline *stages*, not per-player slices) — appropriate because that pipeline
reports batch-level totals, not per-player breakdowns. Choose §1.2 only when a UI genuinely needs
to see each entity's own run distinctly.

**Known gotchas:** This trick is fragile if the loop is ever parallelized (`Promise.all`) — two
concurrent calls would race on the same `MAX+1` read and collide onto the same run id. Keep the
loop sequential, or switch to an explicit per-entity id allocation scheme if concurrency is ever
required.

---

## 2. Multi-step pipeline structuring

### 2.1 Small, independently-runnable steps with persisted DB output between them

**Problem it solves:** Long pipelines (external sync → transform → derive → analyze) are far
easier to debug, re-run, and monitor when each stage writes its own durable table and can be
re-run in isolation, even at some efficiency cost versus one monolithic pass.

**Reference implementation:** `chess/src/app/owner/pipelinegames/page.tsx` — the games pipeline is
9 top-level steps (Game Sync → Build Position Tree → Sync Position Tree → Purge Stale Positions →
Evaluate Positions → Update CP Change → Build Habits → Evaluate Game Endings → Deepen Popular
Positions), each with its own "Run" button and its own persisted output table
(`wk_gr_gamesraw` → `tgd_gamesdecon` → `tgam_game_positions` → `tpos_positions` →
`tpose_positions_eval` → ...). The master-games and FIDE pipelines mirror the same shape.

**Mechanism:** `handleRunAll()` in the same file is **not** a separate implementation — it simply
calls each step's own individual handler function in sequence. This guarantees "Run All" can never
drift from what each individual "Run" button does (see §3).

**Convergent variant — even finer decomposition for platform constraints:**
`next-bridge`'s `/owner/pipeline` (`PipelineTable.tsx`) has the same one-row-per-step,
own-persisted-table, own-Run-button shape (Scrape → Build Sessions → Build Results → Build
Partners → Player Stats → Partner Stats). Production splits the *scrape* step even further, into
12 separately-scheduled cron entries (`start-run`, 2× `scrape-akbc-day` batches, 6×
`scrape-tracked-batch` batches, `partners`, `stats-player`, `stats-partner`) — driven by Vercel's
per-invocation duration ceiling rather than pure debuggability, but the same "small step, persisted
output, independently resumable" shape. The resumability primitive is `getNextScrapeDay()`
(`pipelineScrape.ts`): `MAX(se_date)+1` from the **production** `tse_sessions` table (never the
staging table), so each daily batch naturally resumes where the last one left off.

**Known gotchas:** chess's own outstanding-items list notes that only one pipeline step has been
spot-checked for "does the UI route and the scheduled-cron route stay in sync" (see §3) — the rest
have not been individually audited. When adding a new step to any pipeline following this pattern,
audit both call paths for that step specifically, don't assume the pattern's general soundness
covers every step automatically.

---

## 3. UI replica of production cron must call the identical code path

**Problem it solves:** A manual "run everything" button that approximates a set of independently-
scheduled cron jobs, instead of calling their exact code paths, silently diverges from production
behavior (missed logging, missed side effects) in a way that's invisible until specifically
compared.

**The original incident** (next-bridge, 2026-07-26, documented in the global `~/.claude/CLAUDE.md`):
`/api/cron/update-sessions` — a manual "whole pipeline" fallback — called `buildAllPartnerStats()`
directly instead of going through `/api/build/partners`, which is where that step's
`logPipelineStep` call actually lived, so the manual replica silently skipped that logging every
run.

**Two valid strengths of the fix, both currently in use:**
- **(a) Manual button calls the same shared function the cron route calls.**
  `chess/src/app/api/cron/sync/route.ts` calls `runGameSync()` — the exact same Server Action the
  pipeline UI's own "Run" button calls directly (per that route's own header comment). No parallel
  "run-all" implementation exists (see §2.1's `handleRunAll`). next-bridge's
  `/api/build/partners/route.ts` and `/api/cron/update-sessions/route.ts` both now call
  `buildAllPartnerStats()` and log identically — the original incident is fixed there too, though a
  smaller residual divergence remains (see gotchas).
- **(b) Manual button reads and replays the actual scheduled-job manifest — strictly stronger.**
  `next-bridge/src/ui/admin/PipelineTable.tsx`'s "Run All Cron" button (`handleRunFullCron`)
  computes `CRON_JOBS` as a **direct import of `vercel.json`** (`vercelConfig.crons`) rather than a
  hand-typed mirror list, then `POST`s each `path` verbatim. This cannot drift from the scheduled
  list the way a hand-maintained call list could — a newly-added cron entry is automatically
  included with zero code change to the replica button.

**Reference implementation:** `next-bridge/src/ui/admin/PipelineTable.tsx` (`CRON_JOBS`,
`handleRunFullCron`) for pattern (b); `chess/src/app/owner/pipelinegames/page.tsx`
(`handleRunAll`) for pattern (a). Prefer (b) — reading the real manifest — whenever the scheduled
jobs are declared in one central config file (e.g. `vercel.json`); fall back to (a) when no such
central manifest exists.

**Known gotchas:**
- next-bridge's `update-sessions` route still uses its own local `log()` closure (direct
  `write_logging` calls) rather than the shared `cronStart`/`cronEnd`/`cronFail` boundary-logging
  helper (`cronTrace.ts`) that `/api/build/partners` uses — functionally similar, not
  byte-identical. `update-sessions` is deliberately kept alive for `CRON_SECRET` curl /
  `npm run localprod` catch-up use, so this is a residual inconsistency worth closing but not
  urgent.
- `next-bridge/src/lib/actions/cronTrace.ts` is explicitly marked temporary scaffolding in its own
  file header ("part of the bring-up trace logging for the split-cron rollout... remove once the
  new cron model is proven") — don't treat it as settled permanent infrastructure without checking
  whether it's still present. chess's analogous `src/lib/logStep.ts` (`logStart`/`logEnd`) is
  permanent, pervasive (every pipeline function, not just cron-triggered ones), and additionally
  carries a call-hierarchy `level` parameter for tracing depth that `cronTrace.ts` lacks — prefer
  chess's shape as the reference if this is ever generalized into a shared boundary-logging helper.

---

## 4. Incremental-sync resume cursor independent of the truncatable staging table

**Problem it solves:** If an incremental sync's "resume from here" cutoff is derived from the same
raw/staging table that gets truncated or archived for storage reasons, every truncation makes the
sync think there's no history and re-fetches everything from scratch.

**Reference implementation:** `chess/src/lib/actions/players.ts` —
`getPlayerLastSyncedEndTime()` / `markPlayerSynced()`, read/written by
`chess/src/lib/actions/sync.ts`'s `runGameSync`. Independently mirrored in
`next-bridge/src/lib/actions/pipelineScrape.ts` — `getNextScrapeDay()`.

**Mechanism — two variants, different resilience:**
- **Durable explicit cursor column (chess):** `tpl_players.pl_last_synced_end_time` is a column on
  the per-player row, written only after a sync completes successfully. The raw workfile
  (`wk_gr_gamesraw`) is truncated unconditionally at the start of every run — safe specifically
  *because* the cursor lives on a different, non-truncated table.
- **Derived-MAX cursor over the production table (next-bridge):** `getNextScrapeDay()` computes the
  resume point as `MAX(se_date)+1` from `tse_sessions` (the built production table), never from the
  staging tables (`ts1_sessions`/`ts2_results`) that get truncated by `start-run`. Falls back to a
  configured lookback window when no sessions exist yet, and caps at `toDate`/today so nothing
  scrapes into the future.

**Known gotchas:** the derived-MAX variant would silently rewind the resume point if rows were ever
deleted from the production table it reads — only the explicit-cursor-column variant is resilient
to retroactive deletion of already-processed rows. Prefer the explicit-column form for a new sync
mechanism unless the production table is known to be append-only.

---

## 5. Grace-period purge with dependent-reference handling (no FK/CASCADE)

**Problem it solves:** Deleting "stale, rarely-reached" rows must (a) not delete something that
simply hasn't had a chance to repeat yet, and (b) when a row references two independent things (a
"before" and a "resulting" state), decide full-delete vs. null-out per reference individually
rather than by an OR of both — while the workspace-wide "never add FK/CASCADE" rule means none of
this is enforced by the database.

**Reference implementation:** `chess/src/lib/analysis/purgePositions.ts` —
`purgeStaleReachOnePositions()`, the one explicit, user-approved exception to "never embed
destructive SQL in application code."

**Mechanism:**
1. Seed a scratch workfile with candidates: reach count at or below a floor, within an analysis
   move-range, **and** every occurrence's owning record is older than a configured grace-period
   (derived from an existing timestamp column — no extra column needed).
2. Delete the purely-derived/cached rows for the candidate set first.
3. **Full-delete** rows whose "before" reference is a candidate.
4. **Null out** (row kept) the "resulting" reference on any surviving row whose *resulting* side is
   a candidate, but whose "before" side is not.
5. Stamp a **resurrection guard** on any parent record now left with zero children, so a later
   rebuild step never mistakes a purged record for an unprocessed one and regenerates what was just
   purged. (A real incident: removing this guard without a replacement caused thousands of
   already-purged records to be silently reprocessed.)
6. Delete the now-safe base rows last, after every reference to them has been resolved in steps 3–4.
7. Leave the scratch workfile populated (not re-truncated) as an inspectable record of exactly what
   the run purged.

**Known gotchas:**
- This pattern is chess-only today — no equivalent exists in next-bridge or any other project
  scanned. If another project needs a purge/retention mechanism, mirror this shape rather than
  designing a new one.
- A live estimate column like Postgres's `pg_stat_user_tables.n_live_tup` is stale without a recent
  `ANALYZE` — never trust it as a purge-candidate count without checking `last_analyze`.
- Postgres `IDENTITY` keys never reuse deleted ids, so a dangling reference left behind by a bug can
  never later silently point at an unrelated row — relevant when deciding how urgently a cleanup
  step needs fixing.

---

## 6. Data integrity without FK constraints or CASCADE

The workspace forbids real foreign keys and `CASCADE` (every table is standalone) — these two
patterns are the application-layer substitutes, used in different projects for different sides of
the same problem (delete-time safety vs. actually removing dependents).

### 6.1 Pre-delete referential-integrity check via `table_check`

**Problem it solves:** Without FK constraints, nothing stops an admin UI from deleting a parent row
that other tables still reference.

**Reference implementation:** `next-bridgeschool` — repeated across ~19 admin table components,
e.g. `src/ui/admin/subject/table.tsx`'s `handleDeleteClick_subject()`.

**Mechanism:** Before calling `table_delete`, the handler builds an array of
`{ table, whereColumnValuePairs }` describing every table that could reference the row being
deleted, and passes the whole array to `nextjs-shared`'s `table_check()` in one call. If any match
is found, the delete is aborted and a message is shown; only when nothing is found does the delete
proceed. The same `table_check` primitive is also used pre-*insert* for uniqueness checks (e.g.
`form-validate.ts` checking for an existing name+owner pair before allowing a new row) — one shared
primitive, two different guard roles.

**Known gotchas:** Purely convention-enforced — nothing structurally stops a new admin module from
skipping the check. Copy this shape deliberately for any new delete handler on a table that other
tables reference, rather than reinventing a different check.

### 6.2 Manual cascade delete in explicit dependency order

**Problem it solves:** The direct substitute for `ON DELETE CASCADE` when a parent row's deletion
should also remove its dependents, rather than being blocked by them (§6.1's check-and-refuse is
the other side of this same coin — used when dependents should block deletion instead of being
removed).

**Reference implementation:** `infostore/src/lib/entries.ts` — `deleteEntry()`.

**Mechanism:** Deletes children before the parent, in explicit dependency order, checking success
after each step and aborting (logging, returning `false`) if any step fails.

**Known gotchas:** No transaction wraps the multi-step delete — a failure partway through leaves a
partial cascade (some children deleted, parent and other children intact). Acceptable for the
current low-concurrency admin use; would need a transaction if reused somewhere with real
concurrent-delete risk.

### 6.3 Pre-write duplicate check for externally-sourced records

**Problem it solves:** A simpler, single-column version of dedup-before-insert, for records sourced
from an external identifier (e.g. a URL) where the natural key is a single column.

**Reference implementation:** `infostore/src/lib/entries.ts` — `checkDuplicateUrl()` /
`fetchBySourceUrl()`, called from `createEntry()`.

**Mechanism:** A `table_fetch` existence check (`skipCache: true` — correctly bypassing cache for
an existence check, consistent with the "maintenance/pipeline reads must never use the cache"
principle even outside a pipeline context) on the natural-key column before insert; on a match, the
write is rejected and logged rather than throwing.

**Known gotchas:** Plain read-then-write, no transaction — a race between two concurrent submits of
the same key isn't actually prevented, only the common case is. For a true concurrency guarantee,
insert with `ON CONFLICT DO NOTHING` via `table_write`'s `conflictColumn` (the nextjs-shared-level
primitive both chess's and next-bridge's own dedup-on-insert wrappers already build on) instead of
a separate pre-check.

---

## 7. Database backup / copy tooling (next-dbadmin)

These three patterns are specific to `next-dbadmin`, the one project whose whole purpose is
changing *other* projects' databases via its own UI — not something most projects need, but
documented here in case another admin/ops tool is ever built with similar requirements.

### 7.1 In-database backup-table lifecycle (Duplicate / Copy / Restore / Drop)

**Problem it solves:** Let a user snapshot a table in place before a risky operation, and restore
from it, without leaving the database's normal schema or needing an external backup tool.

**Reference implementation:** `next-dbadmin/src/actions/backupActions.ts` (`table_duplicate_url`,
`table_copy_url`, `table_truncate_url`, `table_drop_url`, `table_seqreset_url`), driven by
`src/components/BackupConn.tsx`.

**Mechanism:** Backup tables are named with a fixed, user-editable prefix. `Duplicate` creates the
backup's structure only (no data); `Copy` truncates the backup then copies all current data into
it; `ToBase` (restore) truncates the base table, copies from the backup back into it, then resets
the base table's identity sequence to `MAX(pk)`; `Drop` removes the backup table entirely. Every
destructive UI action is gated behind a confirm dialog first.

**Known gotchas:** Builds SQL with string-interpolated table names — safe only because those names
are always sourced from `pg_tables`/a fixed connections list, never raw user text. This file is
explicitly ineligible for promotion into `nextjs-shared` (per next-dbadmin's own `.claude/CLAUDE.md`)
because every function takes a caller-supplied database URL rather than using one fixed configured
connection, which every other shared DB function assumes.

### 7.2 Cross-database copy with refuse-to-overwrite guard + separate explicit backup step

**Problem it solves:** Copy tables from a source database to a target database (e.g. prod → local)
without silently clobbering existing target data.

**Reference implementation:** `next-dbadmin/src/actions/copyTablesActions.ts` — `copy_tables()` /
`backup_tables()`.

**Mechanism:** For each table, `copy_tables()` first checks the target's current row count —
**if the target table already has any rows, that table is skipped entirely** with an explicit
"has N rows in target, backup and clear manually first" message, rather than trusting the caller to
have already backed it up. Only an empty/missing target proceeds, via `pg_dump`/`psql` (not
app-level row copying), followed by resetting the target's identity sequence. `backup_tables()` is
the separate, explicit pre-copy safety step surfaced in the UI — it snapshots target tables via
`CREATE TABLE ... AS SELECT * FROM ...`, but first checks whether any of the requested backup names
already exist and refuses to create anything if so, preventing an accidental overwrite of a prior
backup.

**Known gotchas:** Strips a `timezone=` query param from connection URLs before shelling out to
`psql`/`pg_dump`, since only the app's own `pg` driver understands that param. A parallel `VACUUM
(FULL, ANALYZE)` helper in the same file takes an exclusive lock and blocks reads/writes for its
duration — documented inline as materially different from a plain `VACUUM`.

### 7.3 DDL schema diff as pre-copy visibility, not enforcement

**Problem it solves:** Give a human-reviewable answer to "how does this table's structure differ
between source and target?" before a copy/backup decision, without trying to auto-reconcile
differences.

**Reference implementation:** `next-dbadmin/src/actions/schemaUtils.ts` (`diffDDLMaps`) +
`src/actions/schemaSyncActions.ts` (`compareDDLsFromUrls`).

**Mechanism:** Pulls `pg_dump --schema-only` DDL per table from both databases, normalizes it
(strips version-specific pg_dump artifacts that would otherwise cause false "different" results —
e.g. sequence-start noise, auto-generated constraint-name differences across Postgres versions),
then classifies each table as identical / different / only-in-source / only-in-target.

**Known gotchas:** The normalization step exists specifically to avoid false positives from
pg_dump/Postgres-version formatting differences rather than real schema drift — preserve it
carefully if this diff logic is ever reused elsewhere.

---

## 8. Per-user server-side cache invalidation at every mutating write site

**Problem it solves:** A per-user server-side cache with no TTL needs an explicit invalidation
call at every site that mutates the underlying user data, or stale cached data persists
indefinitely.

**Reference implementation:** `next-bridgeschool/src/lib/tables/cache/userCache_purge.ts` (wraps
`nextjs-shared`'s `cache_clearUser`) and `userCache_purgeOnSignIn.ts`, called from the NextAuth
sign-in callback.

**Mechanism:** `userCache_purge(userId, caller)` guards against an invalid/zero user id (logs and
no-ops rather than calling the cache layer with a bad key), otherwise clears that user's cache
entries and logs the cleared count. Purpose-specific named wrappers (like the sign-in variant) are
used instead of every call site invoking the generic purge with an inline message, so each
invalidation reason reads distinctly in `xlg_logging`.

**Known gotchas:** This is a documentation-drift trap, not a code gotcha — the project's own
`.claude/CLAUDE.md` described a `cache_get`/`cache_set` read-through flow in `fetch_SessionInfo.ts`
that no longer matches the current source (no caching calls exist there at all). If mirroring this
pattern, verify the *current* source of any "reference" file directly rather than trusting a CLAUDE.md
description of it, since caching logic is exactly the kind of thing that gets quietly removed later.

---

## Not found / explicitly ruled out

Checked and confirmed to have **no** pipeline/cron/run-id/sync/purge mechanism worth indexing:
`richard-dashboard` (no database), `bristol-house` (plain CRUD over `table_*` only, no API routes
at all), `claude_setup` (a documentation/browsing site, not an application with data pipelines).
Re-check these only if their scope materially changes.
