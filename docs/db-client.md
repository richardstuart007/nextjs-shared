# Database Client Utilities

Low-level helpers for reading `.env.*` files and creating PostgreSQL connections.

## Exports — `dbClient` (compiled, Node.js safe)

Import in server-side code or utilities:
```typescript
import { createClient, readEnvVar, read_url, read_location } from 'nextjs-shared/dbClient'
```

### `readEnvVar(envFile, varName)`
```typescript
readEnvVar(envFile: string, varName: string): string
```
Reads a single `KEY=value` line from a `.env` file. Returns `''` if the file does not exist or the variable is not present. Synchronous.

### `read_url(envFile)`
```typescript
read_url(envFile: string): string
```
Shorthand for `readEnvVar(envFile, 'POSTGRES_URL')`.

### `read_location(envFile)`
```typescript
read_location(envFile: string): string
```
Shorthand for `readEnvVar(envFile, 'POSTGRES_DATABASE_LOCATION')`. Returns the human label used in the UI (e.g. `local`, `prod`).

### `createClient(envFile?)`
```typescript
createClient(envFile?: string): Promise<Client>
```
Creates and connects a `pg.Client`.
- If `envFile` is given, reads `POSTGRES_URL` from that file.
- Otherwise falls back to `process.env.POSTGRES_URL`.

**The caller is responsible for calling `client.end()` when done.** Use a `try/finally` block:

```typescript
const client = await createClient('/abs/path/.env.prod')
try {
  const result = await client.query('SELECT ...')
} finally {
  await client.end().catch(() => {})
}
```

---

## `list_env_files` (from `copyTables`)

```typescript
import { list_env_files } from 'nextjs-shared/copyTables'
// or from the compiled dist version:
import { list_env_files } from 'nextjs-shared/copyTables'

list_env_files(dir: string): Promise<EnvFile[]>
// EnvFile = { file: string; location: string }
```

Scans `dir` for files matching `/^\.env\./` and returns them sorted alphabetically, each paired with its `POSTGRES_DATABASE_LOCATION` value. Both `SchemaSync` and `CopyTable` call this to populate their dropdowns.

---

## System tables owned by this package

| Table | Purpose |
|-------|---------|
| `xlg_logging` | Error and info logs; written by every server action via `write_Logging` |
| `xsc_schema` | Schema comparison snapshots |

The `x` prefix keeps these out of the way of application table names.

### `xlg_logging` columns

| Column | Type | Notes |
|--------|------|-------|
| `lg_caller` | `varchar` | Page or component that triggered the action |
| `lg_functionname` | `varchar` | Function name that logged the message |
| `lg_msg` | `text` | The log message |
| `lg_severity` | `char(1)` | `'E'` for error, `'I'` for info |
| `lg_datetime` | `timestamp` | Auto-set by the DB default |
