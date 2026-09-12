# PLAN_design-patterns — nextjs-shared

## Title
DESIGN_PATTERNS.md

## Plan
- [x] Read each consuming project's own `.claude/CLAUDE.md` and (where accessible) its Claude auto-memory for documented incidents that describe a reusable architectural mechanism (not a UI component) — these are the most reliable source of "this was designed once and should be reused."
- [x] Read across all projects under `C:\Users\richa\claude\github` for recurring architectural mechanisms: pipeline run-id/logging allocation schemes, sync/dedup strategies for external data, batching/caching approaches, multi-step pipeline structuring, purge/archival strategies with grace periods.
- [x] Verify the three known candidate patterns against actual current code before writing them up:
  - Per-entity run-id allocation in a batch pipeline (next-bridge's `runGameSync` — confirmed precedent chess's games pipeline mirrors, and the one chess's master-games pipeline should have mirrored but didn't).
  - Debuggable multi-step pipelines (chess convention — small independently-runnable steps with persisted DB output between them; check whether next-bridge/other projects follow the same shape).
  - UI-replica-of-production-cron must call the identical code path (documented incident in next-bridge; check whether any project's manual triggers currently violate this).
- [x] Draft `DESIGN_PATTERNS.md` entries for every verified pattern found, each with: Pattern name, Problem it solves (one line), Reference implementation (project + file/function), Mechanism summary (a few lines), Known gotchas (if any).
- [x] Create `DESIGN_PATTERNS.md` at the root of nextjs-shared (alongside `CONSUMING_PROJECTS.md`) with the drafted entries.

## Changes
### DESIGN_PATTERNS.md (new file)
- Created as a cross-project index of architectural/backend mechanisms, populated from a parallel research pass across all 8 projects under `C:\Users\richa\claude\github` (chess, next-bridge, next-bridgeschool, infostore, next-dbadmin, richard-dashboard, bristol-house, claude_setup) plus their own `.claude/CLAUDE.md` files.
- Correction to the plan's original premise: the "per-entity run-id" pattern (§1.2) originates in **chess** (`masterSync.ts`'s per-player sequential-await allocation, fixing the incident where the master-games pipeline diverged from the regular pipeline), not in next-bridge as initially assumed — next-bridge's `pipelineLog.ts` allocator is an independently-convergent design on the same underlying reuse-max-or-allocate-new mechanism (§1.1), not the origin of §1.2's per-entity technique.
- 8 pattern sections written: pipeline run-id allocation (§1, two sub-patterns), multi-step pipeline structuring (§2), UI-replica-of-cron-must-match (§3, with both a "same function" and a stronger "reads the actual manifest" variant found in next-bridge), incremental-sync resume cursors (§4, two resilience-tiers found), grace-period purge with dependent-reference handling (§5, chess-only), data integrity without FK/CASCADE (§6, three sub-patterns across next-bridgeschool and infostore), database backup/copy tooling (§7, three sub-patterns, next-dbadmin-specific), and per-user cache invalidation at write sites (§8, next-bridgeschool).
- Explicitly documented three projects (richard-dashboard, bristol-house, claude_setup) as having no qualifying mechanism, so a future pass doesn't need to re-scan them from scratch.
- No UI-component patterns were included — those stay in `CONSUMING_PROJECTS.md` per the existing split.

## Testing
- [ ] Open [DESIGN_PATTERNS.md](../../DESIGN_PATTERNS.md) and confirm it reads coherently and the file/function references match what you'd expect from each named project.
- [ ] Spot-check a couple of cited files still exist and match the described mechanism, e.g. `chess/src/lib/actions/pipelineLog.ts` (§1.1) and `next-bridge/src/ui/admin/PipelineTable.tsx` (§3) — no server needed, this is a documentation-only change.
- [ ] Confirm the §1.2 correction (per-entity run-id pattern originating in chess, not next-bridge) matches your own understanding of the original incident.
