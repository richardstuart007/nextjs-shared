# Setting Up nextjs-shared in a Consuming Project

## 1. Install the package

In the consuming project's `package.json`:

```json
"nextjs-shared": "github:richardstuart007/nextjs-shared"
```

Then:

```bash
npm install
```

Reinstall any time you push changes to nextjs-shared to pick up updates:

```bash
npm install github:richardstuart007/nextjs-shared
```

---

## 2. Create `.env.*` files

The backup tools discover databases by scanning a directory for files named `.env.*`.
Each file must contain:

```
POSTGRES_URL=postgresql://user:password@host/dbname
POSTGRES_DATABASE_LOCATION=local
```

- `POSTGRES_URL` — full connection string (required)
- `POSTGRES_DATABASE_LOCATION` — short human label shown in the UI (e.g. `local`, `prod`, `staging`)

Typical layout in the consuming project root:

```
.env.local     ← local development database
.env.prod      ← production database
.env.staging   ← staging database (if applicable)
```

> The `baseDir` prop passed to the UI components should be the **absolute path** to the
> directory containing these files (e.g. `C:/Users/richa/github/next-bridgeschool`).

---

## 3. Add the two API routes

Create these files in the consuming project's `app/` directory.

### `app/api/backup/schema-compare/route.ts`

```typescript
export { GET } from 'nextjs-shared/routes/schema-compare'
```

### `app/api/backup/copy/route.ts`

```typescript
export { POST } from 'nextjs-shared/routes/copy'
```

> These routes are used internally by the `SchemaSync` and `CopyTable` components.
> Without them the UI buttons will fail with 404 errors.

---

## 4. Mount the UI components

Example page at `app/db-tools/page.tsx`:

```tsx
import SchemaSync from 'nextjs-shared/SchemaSync'
import CopyTable  from 'nextjs-shared/CopyTable'
import BackupTable from 'nextjs-shared/BackupTable'

const BASE_DIR = 'C:/Users/richa/github/my-project'

export default function DbToolsPage() {
  return (
    <div className='p-4 space-y-8'>
      <SchemaSync  baseDir={BASE_DIR} caller='DbToolsPage' />
      <CopyTable   baseDir={BASE_DIR} caller='DbToolsPage' />
      <BackupTable tables={['users', 'orders', 'products']} />
    </div>
  )
}
```

- `baseDir` — absolute path scanned for `.env.*` files; defaults to `''`
- `caller`  — string logged with every server-side error via `xlg_logging`
- `tables` (BackupTable) — explicit list of table names to manage

---

## 5. System tables

Two tables are owned by nextjs-shared and must exist in any database you use:

| Table | Purpose |
|-------|---------|
| `xlg_logging` | Application error and info logs written by all server actions |
| `xsc_schema` | Schema snapshots used by the schema compare utility |

These are prefixed with `x` to avoid name collisions with application tables.

---

## Further reading

| Doc | Topic |
|-----|-------|
| [schema-sync.md](schema-sync.md) | Schema comparison, ALTER SQL generation, and CREATE SQL |
| [copy-tables.md](copy-tables.md) | Copying table data between databases |
| [backup-table.md](backup-table.md) | JSON backup and restore |
| [db-client.md](db-client.md) | Low-level database client utilities |
