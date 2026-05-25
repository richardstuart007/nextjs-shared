# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Commands

```bash
# Type check
npx tsc --noEmit

# Compile to dist/
npx tsc

# Format
npm run prettier

# Check formatting
npm run prettier:check
```

No test runner is configured. Use `npx tsc --noEmit` to verify correctness after changes.

## Purpose

`nextjs-shared` is a private npm package (`github:richardstuart007/nextjs-shared`) consumed by other Next.js projects. It provides:
- All direct database access (Postgres via `pg`)
- Shared UI components
- Utility functions

Consumer projects never call the DB directly — they always go through this package.

## Architecture

### Stack
- TypeScript (strict mode), compiled to `dist/` for plain Node.js consumers
- Postgres (`pg` library) — no ORM
- React components (for Next.js consumers)

### Exports (src/ → dist/)

**Database — generic table operations**
- `fetchFiltered` — paginated filtered SELECT
- `fetchTotalPages` — page count for pagination
- `table_fetch` — fetch rows from any table
- `table_write` — INSERT a row
- `table_update` — UPDATE a row
- `table_delete` — DELETE a row
- `table_check` — check row existence
- `write_Logging` — write to `xlg_logging`

**Database — backup / schema utilities**
- `schemaSnapshot` — snapshot a DB's public schema into `xsc_schema`
- `schemaCompare` — diff two snapshots stored in `xsc_schema`
- `copyTables` — copy table data between databases

**UI Components**
- `MyButton`, `MyInput`, `MyDropdown`, `MyTextarea`, `MyConfirmDialog`
- `Table_Logging` — paginated view of `xlg_logging`

**Cache**
- `userCache_store` — per-user server-side cache (cache key = SQL string)

### Tables owned by this package

| Table | Purpose |
|---|---|
| `xlg_logging` | Application log entries |
| `xsc_schema` | Schema snapshots for comparison |

Table names use `x` prefix to avoid clashing with consumer project table names. Column names are prefixed with the short table code (e.g. `lg_`, `sc_`).

### File layout

```
src/
  backup/         schemaCompare.ts, copyTables.ts, table.tsx
  components/     Shared React components (MyButton, Table_Logging, etc.)
  tables/
    db.ts         Postgres connection helper (sql())
    structures.ts Row types and shared type definitions
    tableGeneric/ Generic table operations + write_logging
```

### Coding conventions
- Server actions use `write_Logging` (not `console.error`) for errors, severity `'E'`
- Log messages include both a consequence string and `(error as Error).message`
- `dist/` is committed — run `npx tsc` after source changes
