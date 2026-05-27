# Schema Sync

Compares two PostgreSQL databases' schemas and generates SQL to bring the target in line with the source.

## UI Component — `SchemaSync`

Import:
```tsx
import SchemaSync from 'nextjs-shared/SchemaSync'
```

Props:
| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `baseDir` | `string` | `''` | Directory scanned for `.env.*` files |
| `caller` | `string` | `'SchemaSync'` | Logged with server-side errors |

The component has four panels:

### Panel 1 — Compare Schemas
Select a source and target `.env.*` file from `baseDir`. Click **Compare Schemas**.

Results show:
- **Table Summary** — every table in either database with a colour-coded badge:
  - `✓ Identical` — same columns and types
  - `! Different` — exists in both but columns/types differ
  - `+ <label> only` — table is in source but not in target
  - `− <label> only` — table is in target but not in source
- **Only in source** — columns/tables missing from target
- **Only in target** — columns/tables not in source (shown as comments in the SQL)
- **Changed columns** — columns present in both but with different type, nullable, or default

### Panel 2 — Generated SQL
After a compare, a `textarea` is pre-populated with `ALTER TABLE` / `CREATE TABLE` statements.
Edit the SQL before applying if needed.

### Panel 3 — Apply SQL
Click **Apply SQL to \<target\>** to execute the SQL against the target database.
Results show how many statements succeeded and any that failed.

> This is irreversible — always review the SQL before applying.

### Panel 4 — Create SQL
Select a source env file and click **Generate from \<source\>**.
Uses `pg_dump --schema-only` to produce full `CREATE TABLE` + index DDL for every table.
A table list on the left lets you browse one table at a time on the right.
Use this to recreate an empty environment from scratch.

---

## Server Actions — `schemaSync`

Import:
```typescript
import { compareSchemas, generateCreateSQL, applySQL } from 'nextjs-shared/schemaSync'
import type { SchemaCompareResult, TableDDL, ApplyResult } from 'nextjs-shared/schemaSync'
```

### `compareSchemas(env1, env2)`
```typescript
compareSchemas(env1: string, env2: string): Promise<SchemaCompareResult>
```
Connects to both databases and returns a full schema diff.
`env1` / `env2` are **full paths** to `.env.*` files.

### `generateCreateSQL(envFile)`
```typescript
generateCreateSQL(envFile: string): Promise<TableDDL[]>
// TableDDL = { table_name: string; sql: string }
```
Runs `pg_dump --schema-only --no-owner --no-acl` and returns per-table DDL.
Requires `pg_dump` to be on PATH (Windows: searches `PostgreSQL\15-18\bin` automatically).

### `applySQL(envFile, sqlText)`
```typescript
applySQL(envFile: string, sqlText: string): Promise<ApplyResult>
// ApplyResult = { ok: number; errors: Array<{ sql: string; error: string }> }
```
Splits `sqlText` on `;` and executes each statement against the database.

---

## Pure Utilities — `schemaUtils`

Import:
```typescript
import { fetchSchema, diffSchemas, generateAlterSQL } from 'nextjs-shared/schemaUtils'
```

These are used internally by `compareSchemas` and the route handler.
Use them directly if you need programmatic access without the UI.

### `fetchSchema(client)`
Queries `information_schema.columns` with PK, unique, and index flags.

### `diffSchemas(rows1, rows2, label1, label2)`
Pure function — returns `{ onlyIn1, onlyIn2, changed, tableSummary }`.

### `generateAlterSQL(result)`
Returns an array of SQL strings. Tables entirely missing from target get `CREATE TABLE IF NOT EXISTS`.
Identity column defaults (`nextval(...)` with no target default) are skipped with a `--` comment.

---

## Types

```typescript
type TableStatus = 'identical' | 'different' | 'only_in_source' | 'only_in_target'

type TableSummary = { table_name: string; status: TableStatus }

type SchemaCompareResult = {
  label1: string
  label2: string
  onlyIn1: DiffRow[]
  onlyIn2: DiffRow[]
  changed: ChangeRow[]
  tableSummary: TableSummary[]
}
```

---

## API Route

The route at `app/api/backup/schema-compare/route.ts` handles GET requests:

```
GET /api/backup/schema-compare?env1=/abs/path/.env.local&env2=/abs/path/.env.prod
```

Returns `{ label1, label2, onlyIn1, onlyIn2, changed, diffs }`.
`diffs` is `[...onlyIn1, ...onlyIn2]` kept for backward compatibility.
