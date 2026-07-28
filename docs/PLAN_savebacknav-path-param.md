# saveBackNav — optional explicit path parameter

## Plan
- [x] Add an optional `path?: string` second parameter to `saveBackNav` in
      `src/components/useBackNav.ts`. When omitted, behavior is unchanged (snapshots
      `window.location.pathname + window.location.search`). When provided, that exact string is
      stored under `key` instead — supports chained back-nav forwarding, where a caller already
      holds the original back-target as a value (not the current URL) and needs to persist it
      as-is. Backward-compatible: every existing caller (chess, next-bridge's demo) is unaffected.
- [x] Update `CONSUMING_PROJECTS.md`'s `useBackNav`/`saveBackNav` documentation to describe the new
      optional `path` parameter and the chained-forwarding use case that motivated it.

## Changes
### src/components/useBackNav.ts
- `saveBackNav` now accepts an optional second `path?: string` parameter. When provided, it's
  stored under `key` verbatim instead of the current `window.location` snapshot — needed for
  chained back-nav forwarding where a caller already holds the original back-target as a value.
  Existing single-argument callers are unaffected (default behavior unchanged).

### CONSUMING_PROJECTS.md
- Documented the new optional `path` parameter on `saveBackNav`, with a chained-navigation example
  showing a caller forwarding an already-known `backPath` instead of capturing its own current URL.

## Testing
- [ ] Confirmed via `npx tsc --noEmit` only — this is a backward-compatible optional-parameter
      addition with no existing call sites changed yet (chess's adoption is a separate, later
      plan), so there's no new behavior to exercise in this project directly.
