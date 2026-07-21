# PLAN_followup-audit-outstanding-items — nextjs-shared

## Title
follow-up audit — compile an outstanding-items list of every previously-identified but not-yet-applied finding across all consuming projects (nextjs-shared component adoption gaps, table_ function gaps, MySelectMulti candidates), re-verify each is still actually outstanding, and record it in nextjs-shared's .claude/CLAUDE.md under an Outstanding items section

## Plan
- [x] Re-verify each previously-identified finding (chess, infostore, next-bridge, next-bridgeschool, next-dbadmin, richard-dashboard) is still actually outstanding — re-check the actual files rather than trusting the earlier summary, since code may have changed independently since the original audit (as happened with the src/chess removal mid-task last time)
- [x] Also fold in the newer findings surfaced since the original shared-review audit: the DevLayoutHeader gap (5 projects duplicate its logic locally instead of importing it), the MyBackHomeNav gap (5 of 6 projects never use it), and the MySelectMulti candidates (chess, next-bridge, next-dbadmin)
- [x] Compile the consolidated, still-outstanding items into a single list, organized per project, each with file:line and a one-line description of what's needed
- [x] Record the list in nextjs-shared's `.claude/CLAUDE.md` under a new `## Outstanding items` section
- [x] Present the list to the user

## Changes

### .claude/CLAUDE.md
- Added a new `## Outstanding items` section at the end of the file, consolidating every still-open finding from the shared-review audit and its follow-ups, organized per project. Re-verified each against actual current file contents rather than trusting the original audit summary — found that next-bridge's `/owner` page, `StagingBar.tsx`, and `BuildDataViewer.tsx`'s `FMultiSelect` had all already been fixed (presumably applied directly in that project since the handoff instructions were given), all 7 of next-bridgeschool's raw-`sql()` calls had been fixed, and chess's `MaintenancePanel.tsx` no longer exists at all — its maintenance UI was restructured into `src/app/owner/pipeline/page.tsx` (which already correctly uses `MySelect`) and `src/ui/player/PlayerProfile.tsx`, mooting the original dead-import finding for that file.
- Also recorded two items not yet given handoff instructions in chat: infostore's category/country checkbox filters (a `MyCheckbox` gap, discovered during the `MySelectMulti` investigation, distinct from that project's already-known `entries` CRUD findings) and the cross-project `DevLayoutHeader`/`MyBackHomeNav` adoption gaps.
