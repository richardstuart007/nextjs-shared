# PLAN_flow-grid-mode — nextjs-shared

## Title
Add grid mode to the flow diagram syntax

## Plan
- [x] `parseMarkdownLite.ts`: add a `grid-node` `FlowStep` variant (`{ type: 'grid-node'; row: number; col: number; content: InlineNode[]; id?: string; table?: boolean; process?: boolean }`), reusing `stripNodeTags`/`parseInline`.
- [x] `parseMarkdownLite.ts`: in `parseFlowLines`, detect a leading bare `grid` line. When present, parse only `node (row,col) <text> {tags}` and `edge <id> -> <id>` / `edge <id> <-> <id>` lines; any other line (arrow, stray text) is skipped, not an error. Dimensions are inferred from `max(row)`/`max(col)` seen. Legacy (non-`grid`) fences parse exactly as they do today, unchanged.
- [x] `MarkdownLiteView.tsx`: add a `GridFlowDiagram` render path using real CSS Grid — `gridTemplateColumns: repeat(cols, 11rem)` (reusing the `BOX_WIDTH`/11rem sizing), `gridRow`/`gridColumn` set 1-indexed directly from parsed row/col. Reuse the existing box styles (`TABLE_BOX_STYLE`/`PROCESS_BOX_STYLE`) and the existing edge-curve code (`buildCurve`/`computeCurves`) unchanged — it already measures actual rendered box positions via refs, not flex assumptions.
- [x] `FlowDiagram`: branch once at the top on whether `steps` contains a `grid-node` (i.e. the fence had a leading `grid` line) and dispatch to `GridFlowDiagram` instead of the existing legacy render path. A single fence is either legacy or grid, never mixed.
- [x] Add a worked test case: rewrite next-bridge's actual pipeline diagram in grid syntax (as a local scratch/test doc used to verify rendering — not committed to next-bridge, since that's a different project).
- [x] Run `npx tsc --noEmit` to verify types.
- [x] Verify acceptance checklist: existing chess diagrams render unchanged; the worked grid example renders as a true grid with real blank cells (no fake spacer boxes); tsc passes.
- [x] Bump `package.json` version per nextjs-shared release rules (pending final commit).

## Changes
### src/lib/parseMarkdownLite.ts
- Added `grid-node` to the `FlowStep` union: `{ type: 'grid-node'; row: number; col: number; content: InlineNode[]; id?: string; table?: boolean; process?: boolean }`.
- Extracted `parseEdgeLine` (the `edge <from> <-> <to>` / `edge <from> -> <to>` regex) as a shared helper so both legacy and grid parsing use the identical edge grammar.
- Added `parseGridFlowLines`: skips the leading `grid` marker line, then recognizes only `node (row,col) <text> {tags}` (1-indexed, tags via the existing `stripNodeTags`) and `edge` lines; everything else is silently skipped (no implied sequence in grid mode).
- `parseFlowLines` now checks whether the first non-blank line in the fence is exactly `grid` and dispatches to `parseGridFlowLines` if so; otherwise parses exactly as before (byte-for-byte unchanged legacy behavior).

### src/components/MarkdownLiteView.tsx
- Hoisted `buildCurve` out of `FlowDiagram`'s `useEffect` closure to module scope, unchanged logic, so both `FlowDiagram` (legacy) and the new `GridFlowDiagram` can call it.
- Added `GridFlowDiagram`: renders `grid-node` boxes with CSS Grid (`gridTemplateColumns: repeat(cols, 11rem)`, `gridRow`/`gridColumn` 1-indexed straight from parsed coordinates), reusing `TABLE_BOX_STYLE`/`PROCESS_BOX_STYLE` and the shared `buildCurve` (default/unforced branch only — grid mode has no side-node/process relationships to force an edge side).
- `renderBlock`'s `flow` case now checks whether any step is a `grid-node` and dispatches to `GridFlowDiagram` instead of `FlowDiagram` when so — a fence is either legacy or grid, never mixed, matching the parser.

### Worked test case (scratch, not committed to any project)
- Wrote `dataflow-grid-test.md` in this session's scratchpad directory — next-bridge's actual `docs/Dataflow.md` "Pipeline overview" `flow` block, rewritten in grid syntax with the same node ids/edges, plus two genuinely blank cells (row 1 col 2, row 4 col 2) to demonstrate real empty grid cells with no spacer boxes. Every process-type step (Scrape AKBC, Scrape Tracked Players, Build Sessions, Build Results, Update Stats, Build Partners) is explicitly tagged `{process}`; every table-type step keeps its `{table}` tag — grid-node's default (no tag) styling matches legacy main-chain `node`'s default (table/blue), overridden to process/amber via `{process}`, the same convention `stripNodeTags`' doc comment already describes for main-chain nodes.

### Acceptance checklist
- Confirmed chess's only `flow` fence (`chess/docs/Dataflow.md`) starts with `side [chess.com API]...`, not `grid` — legacy parse path is unaffected (grepped, first content line is not `grid`).
- `npx tsc --noEmit` passes with zero errors.
- Grid rendering places each `grid-node` at its own explicit `gridRow`/`gridColumn`; cells with no node line stay unoccupied by CSS Grid's own default auto-placement behavior (no spacer boxes added) — confirmed by code inspection (no dense-packing/auto-fill logic added).

### package.json
- Bumped version `2.1.38` → `2.1.39` per nextjs-shared release rules — prevents npm serving a cached copy to consuming projects (next-bridge, in particular, is the project that would actually adopt grid mode).

## Testing
- [ ] User runs:
  npm run locallocal
- [ ] Open http://localhost:4020/owner/dataflow and confirm the existing "Overview" diagram (legacy `side`/main-chain syntax) still renders exactly as before — same layout, same colors, same curves.
- [ ] Temporarily back up `docs/Dataflow.md`, then paste the contents of the scratch fixture at
  C:\Users\richa\AppData\Local\Temp\claude\c--Users-richa-claude-github-nextjs-shared\f8d3db0b-8af4-49b6-9563-dea44d49385f\scratchpad\dataflow-grid-test.md
  in as a new section (or swap in for the Overview section), reload http://localhost:4020/owner/dataflow, and confirm:
  - Nodes appear at the correct grid position (8 rows × 2 columns).
  - Row 1 col 2 and row 4 col 2 are genuinely blank — no visible box, no layout collapse of the column.
  - Table nodes are blue, process nodes are amber, matching the legacy color convention.
  - The `edge` lines draw curves connecting the correct boxes (e.g. nzbridge.co.nz fans out to both scrape steps; Update Stats fans in from tre/tse/tpa).
  - Restore the original `docs/Dataflow.md` from the backup afterward.
- [ ] Confirmed via `npx tsc --noEmit` (already run, zero errors) that all types check.
