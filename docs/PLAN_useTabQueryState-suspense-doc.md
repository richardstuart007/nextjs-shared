# useTabQueryState Suspense-boundary documentation

## Plan
- [x] Add a "Suspense boundary required" callout to the `useTabQueryState` section of
      `CONSUMING_PROJECTS.md`, placed right after the `NuqsAdapter` setup snippet and before the
      "Usage" paragraph. Content: the exact build error text, the `<Suspense>` wrapping fix with a
      code example, and a one-line note that this applies to any component using
      `useSearchParams()` (directly or via a hook built on it) on a route that isn't already
      dynamic.

## Changes
### CONSUMING_PROJECTS.md
- Added a "Suspense boundary required" callout to the `useTabQueryState` section, right after the
  `NuqsAdapter` setup snippet: the exact `useSearchParams() should be wrapped in a suspense
  boundary` error text, the `<Suspense>` wrapping fix with a code example, and a note that this
  applies to any `useSearchParams()`-based component on a non-dynamic route, not just this hook.

## Testing
- [ ] Documentation-only change — no source files touched. Confirm by reading the updated
      `useTabQueryState` section in `CONSUMING_PROJECTS.md` and checking the new callout reads
      correctly in context.
