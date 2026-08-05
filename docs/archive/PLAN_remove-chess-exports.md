# PLAN_remove-chess-exports — nextjs-shared

## Title
Remove dead chess/* export entries from package.json

## Plan
- [x] Remove the four `./chess/*` entries from `package.json`'s `exports` map
      (`./chess/constants`, `./chess/parsePgn`, `./chess/sync`, `./chess/deconstruct`) — their
      backing source files never existed under `src/chess/`, and chess now implements this
      functionality locally, so nothing resolves or depends on these paths.

## Changes

### package.json
- Removed the four dead `./chess/*` entries from the `exports` map (`./chess/constants`,
  `./chess/parsePgn`, `./chess/sync`, `./chess/deconstruct`) — none had a backing source file
  under `src/chess/` (confirmed the folder never existed), and chess already implements this
  functionality locally.

## Testing
- [ ] Confirmed via `npx tsc --noEmit` — pure `package.json` manifest edit, no application code
      touched, no build/runtime behavior change to verify.
