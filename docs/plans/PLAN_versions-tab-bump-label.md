# PLAN_versions-tab-bump-label — nextjs-shared

## Title
Change the Versions-tab header row label from #reinstall to #version-bump

## Plan
- [x] `src/UI/OwnerSyncVersions.tsx` line ~261: change the `<th>` text from `#reinstall` to `#version-bump` (label text only — leave the `reinstallCounts` variable name and the `//  ... #reinstall header row ...` comment unchanged, per the user's "Label only" scope choice)
- [x] `npx tsc --noEmit` passes

## Plan (added during testing)
- [x] Add a `MyHelp` "?" popover next to the `#version-bump` header-row label. Agreed wording
  (user, 2026-09-04): `"Does a #plan, #reinstall and #commit to implement the latest nextjs-shared code."`
  New `HELP_VERSION_BUMP` const in `OwnerSyncVersions.tsx`, rendered like the Latest/Installed
  header helps (`<MyHelp text={HELP_VERSION_BUMP} buttonClass={HELP_BUTTON_CLASS} />`).
- [x] Register `#version-bump` as an alias of the `version-bump` skill so the hash form matches
  `/version-bump` exactly (and matches the row label). `#bump` stays as an alias too. Two edits,
  both under `~/.claude/`:
  - `~/.claude/skills/version-bump/SKILL.md` frontmatter `description`: `... when the user sends
    "#bump" or "/version-bump".` → `... when the user sends "#bump", "#version-bump", or
    "/version-bump".`
  - `~/.claude/COMMANDS.md` line ~54: `## /version-bump  (alias: #bump)` → `## /version-bump
    (aliases: #bump, #version-bump)`
  - (No `#bump`/`version-bump` reference exists in `~/.claude/CLAUDE.md` — nothing to change there.)

## Changes
### src/UI/OwnerSyncVersions.tsx
- Versions-tab matrix `<thead>`: changed the third header row's label cell from `#reinstall` to `#version-bump`, pointing the reader at the new end-to-end bump skill instead of the bare reinstall step. Only the visible `<th>` text changed — the `reinstallCounts` `useMemo` and the comment above it that describes it as "the #reinstall header row" were left as-is per the agreed "Label only" scope.
- Added `HELP_VERSION_BUMP` const and a `MyHelp` "?" popover next to the `#version-bump` header-row label (same pattern as the Latest/Installed/Dep/Override header helps): `"Does a #plan, #reinstall and #commit to implement the latest nextjs-shared code."` — so the row's purpose is discoverable in the UI.

### ~/.claude/skills/version-bump/SKILL.md
- Frontmatter `description`: added `#version-bump` to the recognised triggers (now `"#bump", "#version-bump", or "/version-bump"`) so the hash form matches the slash command exactly, consistent with the Versions-tab row label. `#bump` retained.

### ~/.claude/COMMANDS.md
- `/version-bump` heading: `(alias: #bump)` → `(aliases: #bump, #version-bump)` to keep COMMANDS.md in sync with the skill's trigger list.

## Testing
- [ ] Open the nextjs-shared dev app at http://localhost:3009/owner, Versions tab
- [ ] In the matrix header, confirm the third row (below "Version", yellow background) is now labelled `#version-bump` instead of `#reinstall`
- [ ] Hover/click the `?` next to `#version-bump` — the popover shows "Does a #plan, #reinstall and #commit to implement the latest nextjs-shared code."
- [ ] Confirm that row's per-project `⟳ N` purple counts are unchanged (same numbers as before — only the label changed)
- [ ] In a fresh Claude Code session in any project, typing `#version-bump` is recognised and runs the `version-bump` skill (same as `#bump` / `/version-bump`)
