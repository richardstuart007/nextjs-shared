# PLAN_cross-project-outstanding — nextjs-shared

## Title
Resolve the two remaining cross-project audit items: DevLayoutHeader duplication and MyBackHomeNav adoption

## Plan
- [x] `DevLayoutHeader` gap — for each of chess, infostore, next-bridgeschool, richard-dashboard (next-bridge already confirmed to have its own local `DevHeader.tsx` too, so include it), compare their local `DevHeader.tsx` against `nextjs-shared/DevLayoutHeader.tsx` line-by-line, and produce a concrete verdict per project: safe drop-in replacement, needs a small prop/markup adjustment first, or not worth it for a stated reason. Write up exact per-project instructions (or a nextjs-shared amendment proposal, if the shared version needs a prop to accommodate a project's extra nav link or `dbLocation` usage) rather than leaving it as a vague "check each project" note.
- [x] `MyBackHomeNav` adoption — for infostore, next-bridgeschool, next-dbadmin, richard-dashboard (chess and next-bridge already use it), check whether each project actually has a page needing a hardcoded "back to X" link outside `/owner` (which `OwnerLayout` already handles separately). Confirm per project whether this is a real gap or a non-issue, rather than leaving it as an open question.
- [x] Present findings and, for anything confirmed as real outstanding work, propose next steps (likely further `#audit` rollouts per project).
- [x] Implement the `DevLayoutHeader` amendment (optional `dbLocation`/`extraLinks` props), update nextjs-shared's own `layout.tsx` to pass `extraLinks` explicitly, document in `CONSUMING_PROJECTS.md`, and verify live in a browser.

## Changes

### DevLayoutHeader — bigger gap than the tracker's note suggested
All 5 projects' local `DevHeader.tsx` are byte-for-byte identical to each other, and simpler than
the shared version: just an "Owner" link + the yellow `dbLocation` badge, no "Components"/
"Dataflow" links. Two real blockers to a drop-in, not one:

1. **`dbLocation` won't render at all.** The shared component reads `process.env.POSTGRES_DATABASE_LOCATION`
   directly inside a `'use client'` component. That only works in nextjs-shared's own dev app because
   its `next.config.mjs` explicitly re-exposes that var via the `env` config block — checked all 5
   consuming projects' `next.config`, **none** do this (next-bridge/next-bridgeschool expose
   `POSTGRES_URL` but not `POSTGRES_DATABASE_LOCATION`). Importing the shared component as-is would
   silently drop the badge, not error.
2. **The nav links are hardcoded to nextjs-shared's own routes.** "Components" and "Dataflow" are
   nextjs-shared/chess-specific pages that don't exist in infostore, next-bridge, next-bridgeschool,
   or richard-dashboard — importing the shared component verbatim would show broken links in every
   other project.

Every one of the 5 local `DevHeader.tsx` already receives `dbLocation` as a **prop** from its own
root `layout.tsx` (a server component reading `process.env.POSTGRES_DATABASE_LOCATION` server-side,
no client-exposure needed at all) — this is actually a more portable pattern than what the shared
component currently does. Recommending a nextjs-shared amendment before this is a real drop-in
anywhere: make `dbLocation` an optional prop (falls back to the current internal env read only if
not passed, so nextjs-shared's own zero-prop `<DevLayoutHeader />` call keeps working), and add an
optional `extraLinks?: { href: string; label: string }[]` prop defaulting to none, so nextjs-shared's
own usage passes `[{href:'/owner/components',label:'Components'}, {href:'/owner/dataflow',label:'Dataflow'}]`
explicitly while every other project just gets the bare Owner link + badge, matching what they
already have today.

### MyBackHomeNav — resolved, both ways
- **infostore**: confirmed real gap. 6 files have a hardcoded `← Back to Entries`/`← Back to Entry`
  link with a fixed target: `dashboard/entries/new/page.tsx` (both route trees), `[ent_entid]/edit/page.tsx`
  (both route trees), `[ent_entid]/page.tsx` (both route trees).
- **next-bridgeschool**: confirmed real gap, smaller — 2 genuine candidates: `ui/register/form.tsx:209`
  ("Back to Login" via `MyButton`) and `ui/dashboard/reference/table.tsx:757` ("Back to Subjects" via
  `MyLink`), both fixed-target back links matching `MyBackHomeNav`'s exact purpose. (A third hit,
  `QuizClient.tsx:113`'s `router.back()`, is programmatic history navigation on an incomplete quiz
  submission, not a rendered back-link UI element — excluded, not a candidate.)
- **next-dbadmin**: confirmed **not** a gap — no hardcoded back-link pattern found anywhere.
- **richard-dashboard**: confirmed **not** a gap — same, nothing found.

### src/UI/DevLayoutHeader.tsx
Added `dbLocation?: string` (falls back to the internal `process.env.POSTGRES_DATABASE_LOCATION`
read only when omitted) and `extraLinks?: { href: string; label: string }[]` (default `[]`,
replacing the hardcoded "Components"/"Dataflow" `<a>` tags with a `.map()` over this prop).

### src/app/layout.tsx
Updated the one call site to pass `extraLinks={[{href:'/owner/components',label:'Components'}, {href:'/owner/dataflow',label:'Dataflow'}]}` explicitly, preserving the exact same rendered nav.

### CONSUMING_PROJECTS.md
Added `DevLayoutHeader` to the owner-panel-components table and a full props section explaining
both new props and why each exists (the `next.config` env-exposure gap, and the hardcoded-links
problem), with a usage example for a consuming project.

### Verification
Ran a live browser check (explicitly requested, not the default): started the dev server (now on
port 4020, renumbered along with the other projects), confirmed via Playwright that the nav still
shows exactly "Owner / Components / Dataflow", the `dbLocation` badge still shows "local" via the
fallback path, and clicking "Dataflow" still navigates to `/owner/dataflow` correctly. No console
errors. Screenshot matched the pre-change layout pixel-for-pixel in content. Server stopped
afterward.

## Testing
- [x] Nav links unchanged (Owner/Components/Dataflow) — verified live.
- [x] dbLocation badge still renders via fallback — verified live.
- [x] Dataflow link still navigates correctly — verified live.
