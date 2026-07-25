# PLAN_markdownlite-dataflow — nextjs-shared

## Title
Extract MarkdownLiteView/parseMarkdownLite as shared components; build nextjs-shared's own /owner/dataflow page documenting the DB access flow

## Plan
- [x] Move chess's `src/lib/parseMarkdownLite.ts` into `src/lib/parseMarkdownLite.ts` in nextjs-shared, unchanged (it's already fully generic — no chess-specific coupling: types `InlineNode`/`FlowStep`/`BlockNode`/`LeafBlockNode`/`Section`/`SectionTree`, functions `plainText`/`parseMarkdownLite`/`buildSectionTree`).
- [x] Move chess's `src/ui/MarkdownLiteView.tsx` into `src/components/MarkdownLiteView.tsx` in nextjs-shared, with one adjustment: swap the `AppTab` import (chess's own `MyTab` color-themed wrapper) for bare `nextjs-shared/MyTab` directly, since the shared version can't depend on a consuming project's local wrapper.
- [x] Add `./parseMarkdownLite` and `./MarkdownLiteView` export entries to `package.json`.
- [x] Document both in `CONSUMING_PROJECTS.md` (props/exports for `MarkdownLiteView`; types/functions for `parseMarkdownLite`), including the `` ```flow `` diagram syntax (arrows, side nodes, edges, node tags like `{#id}`/`{loop:id}`/`{top}`/`{pair}`/`{table}`/`{bottom}`/`{process}`) since that's not self-explanatory from the code alone.
- [x] Author `docs/Dataflow.md` for nextjs-shared itself, documenting the DB access flow: consuming project code → `table_*` functions → cache layer (`userCache_store`, read path only) → `db.ts` (`sql()`) → Postgres, plus `write_logging` → `xlg_logging` as a side path off any `table_*` call. Using the same markdown-lite + `` ```flow `` format as chess's own doc.
- [x] Build `src/app/owner/dataflow/page.tsx` (mirroring chess's own page: read `docs/Dataflow.md` from disk, `parseMarkdownLite` → `buildSectionTree` → render via `MarkdownLiteView`), and add a link/nav entry to it from the existing `/owner` page.
- [x] Type-check with `npx tsc --noEmit` and build with `npm run build`

## Changes

### src/lib/parseMarkdownLite.ts
- New file, ported unchanged from chess's `src/lib/parseMarkdownLite.ts` — already fully generic, no adjustments needed.

### src/components/MarkdownLiteView.tsx
- New file, ported from chess's `src/ui/MarkdownLiteView.tsx` with one change: `AppTab` (chess's own color-themed `MyTab` wrapper) replaced with bare `nextjs-shared/MyTab` in the internal `TabBar`, since the shared component can't depend on a consuming project's local wrapper. Everything else (the `FlowDiagram` SVG-curve renderer, inline markdown rendering, section/heading tree walk) is unchanged.

### package.json
- Added `./parseMarkdownLite` and `./MarkdownLiteView` export entries.

### CONSUMING_PROJECTS.md
- Added a full "MarkdownLiteView / parseMarkdownLite" section: usage example, complete `` ```flow `` syntax reference (arrows, side nodes, edges, all node tags), and the exported types/functions list.

### docs/Dataflow.md (new)
- Authored nextjs-shared's own Dataflow doc, documenting the DB access flow per the agreed content scope: consuming project code → `table_*` functions → cache layer (`userCache_store`) → `db.ts` (`sql()`) → Postgres, with `write_logging` → `xlg_logging` as a side path off every `table_*` call. One overview flow diagram plus one Purpose/Input/Processing/Output section per node (`table_*` functions, cache layer, database connection, logging), matching chess's own doc's structure.

### src/app/owner/dataflow/page.tsx (new)
- Mirrors chess's own dataflow page exactly: reads `docs/Dataflow.md` from disk, parses it, renders via `MarkdownLiteView`. Uses relative imports (`../../../lib/...`, `../../../components/...`) matching this package's existing internal convention — nextjs-shared's own `tsconfig.json` has no `@/` path alias, unlike consuming projects.

### src/UI/DevLayoutHeader.tsx
- Added a "Dataflow" nav link (`/owner/dataflow`) alongside the existing "Owner"/"Components" links, same pattern.

## Testing
- [x] Open `/owner/dataflow` and confirm the page renders: the Overview tab shows the flow diagram (project code → table_* functions ↔ cache / → logging, → db.ts → Postgres), and the other tabs (table_* functions, Cache layer, Database connection, Logging) render their Purpose/Input/Processing/Output content correctly.
- [x] Click the "Dataflow" link in the dev header and confirm it navigates correctly from any page.
- [x] Confirm the flow diagram's curves/arrows render sensibly (no obviously broken/overlapping lines) at a typical browser width.
