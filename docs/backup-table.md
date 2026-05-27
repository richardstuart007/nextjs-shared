# Backup Table (JSON import / export)

Provides a full backup management UI for reading and writing table data as JSON files on the server filesystem, plus lower-level file and directory utilities.

## UI Component — `BackupTable`

Import:
```tsx
import BackupTable from 'nextjs-shared/BackupTable'
```

Props:
| Prop | Type | Purpose |
|------|------|---------|
| `tables` | `string[]` | List of table names to show in the UI |

Features:
- Export any table to a JSON file on the server
- Import a JSON file back into a table (truncates first)
- View JSON file counts
- Duplicate a table's data
- Truncate a table
- Reset sequences

The component is exported as a **default export** from `src/backup/table.tsx`.

---

## Server Utilities — `backupUtils`

Import:
```typescript
import {
  directory_Exists, directory_create, directory_delete, directory_list,
  file_exists, file_delete, file_count_json,
  table_write_toJSON, table_write_fromJSON,
  convertCsvToJson,
} from 'nextjs-shared/backupUtils'
```

### Directory helpers

| Function | Returns | Notes |
|----------|---------|-------|
| `directory_Exists(dirPath, caller?)` | `Promise<boolean>` | |
| `directory_create(dirPath, caller?)` | `Promise<boolean>` | True if new dir was created |
| `directory_delete(dirPath, caller?)` | `Promise<boolean>` | Recursive delete |
| `directory_list(dirPath, caller?)` | `Promise<string[]>` | File names only, not subdirs |

### File helpers

| Function | Returns | Notes |
|----------|---------|-------|
| `file_exists(filePath, caller?)` | `Promise<boolean>` | |
| `file_delete(filePath, caller?)` | `Promise<boolean>` | |
| `file_count_json(filePath, caller?)` | `Promise<number>` | Array length; 0 if not array |

### Table I/O

#### `table_write_toJSON(Props, caller?)`
```typescript
interface Props { table: string; dirPath: string; file_out: string }
table_write_toJSON(Props, caller?: string): Promise<boolean>
```
Queries `SELECT json_agg(t) FROM <table> t` and writes the result as a formatted JSON file at `dirPath/file_out`. Returns `true` on success.

#### `table_write_fromJSON(filePath, tableName, caller?)`
```typescript
table_write_fromJSON(filePath: string, tableName: string, caller?: string): Promise<number>
```
Reads a JSON array from `filePath` and batch-inserts it into `tableName` (100 rows per batch). Returns the total number of rows inserted.

### CSV utility

#### `convertCsvToJson(dirPath, file_in, file_out, caller?)`
Converts a CSV file to a JSON array file. Prompts on stdout if the output file already exists (only usable in a terminal context, not from the Next.js server).

---

## All errors are logged to `xlg_logging`

Every function accepts an optional `caller` string that appears in the `lg_caller` column of `xlg_logging`, making it easy to trace which page or component triggered an error.
