# Copy Tables

Copies selected table data from one PostgreSQL database to another using `pg_dump` / `psql`.
The target table is **truncated before the copy** — all existing rows are replaced.

## UI Component — `CopyTable`

Import:
```tsx
import CopyTable from 'nextjs-shared/CopyTable'
```

Props:
| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `baseDir` | `string` | `''` | Directory scanned for `.env.*` files |
| `caller` | `string` | `'CopyTable'` | Logged with server-side errors |

Workflow:
1. Enter the `baseDir` (or it uses the prop default).
2. Select source and target from the `.env.*` dropdowns.
3. Click **Load Tables** — fetches the table list from the source database.
4. Tick the tables you want to copy (or **Select All**).
5. Click **Copy N Tables** — streams progress to the Copy Log.

> The target will be overwritten. A safety check prevents copying when source and target
> are the same `POSTGRES_DATABASE_LOCATION`.

---

## Server Functions — `copyTables`

Import:
```typescript
import { list_env_files, get_tables, copy_tables } from 'nextjs-shared/copyTables'
import type { EnvFile, CopyLog, CopyResult } from 'nextjs-shared/copyTables'
```

### `list_env_files(dir)`
```typescript
list_env_files(dir: string): Promise<EnvFile[]>
// EnvFile = { file: string; location: string }
```
Returns all `.env.*` files in `dir` sorted alphabetically, each with its `POSTGRES_DATABASE_LOCATION`.

### `get_tables({ url, caller? })`
```typescript
get_tables({ url: string; caller?: string }): Promise<string[]>
```
Returns all user table names in the `public` schema. Returns `[]` on error.

### `copy_tables({ sourceUrl, targetUrl, tables, ... })`
```typescript
copy_tables({
  sourceUrl: string
  targetUrl: string
  tables: string[]
  sourceLabel?: string
  targetLabel?: string
  caller?: string
}): Promise<CopyResult>
// CopyResult = { success: boolean; logs: CopyLog[] }
// CopyLog = { event: CopyEvent; detail: string }
// CopyEvent = 'DROP' | 'CREATE_TABLE' | 'COPY' | 'INDEX' | 'SEQUENCE' | 'ERROR'
```
Processes one table at a time:
1. `pg_dump` the table from source to a temp file
2. Strip unsupported params (`transaction_timeout`, `setval`)
3. `psql` the file into target
4. Repair sequences using `MAX(pk_column)` to prevent future insert collisions

FK constraints are bypassed during copy via `SET session_replication_role = replica`.

All events are written to `xlg_logging` for audit.

---

## How pg_dump / psql Are Found

Both tools are searched for in these paths (Windows), then `PATH`:

```
C:\Program Files\PostgreSQL\18\bin
C:\Program Files\PostgreSQL\17\bin
C:\Program Files\PostgreSQL\16\bin
C:\Program Files\PostgreSQL\15\bin
```

---

## API Route (SSE)

The route at `app/api/backup/copy/route.ts` handles POST requests with a streaming (SSE) response.

```
POST /api/backup/copy
Content-Type: application/json

{ "tables": ["users", "orders"], "source": "/abs/path/.env.local", "target": "/abs/path/.env.prod" }
```

Stream events:
```
data: {"table":"users","status":"starting"}
data: {"table":"users","status":"truncating"}
data: {"table":"users","status":"copying"}
data: {"table":"users","status":"done","rows":42}
data: {"done":true,"ok":1,"errors":0}
```
