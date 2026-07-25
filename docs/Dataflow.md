# Dataflow

## Overview

```flow
Consuming project code (UI component / server action) {process} {#project-code}
↓
`table_*` functions — table_fetch, table_write, table_update, table_upsert, table_delete, table_count, table_check, table_query {process} {#table-functions}
↓ writes always bypass the cache; reads check it first
`db.ts` (`sql()`) {process} {#db-sql}
↓
Postgres {#postgres}
side [`userCache_store`](#cache-layer) {#flow-cache} {process}
side [`xlg_logging`](#logging) {#flow-xlg} {table}
edge flow-cache <-> table-functions
edge table-functions -> flow-xlg
```

## `table_*` functions {#table-functions-section}

### Purpose

The single entry point every consuming project uses for database access — `table_fetch`,
`table_write`, `table_update`, `table_upsert`, `table_delete`, `table_count`, `table_check`, and
`table_query` (for anything too complex for the others — joins, computed `WHERE`, subqueries).
Consuming projects never call `sql()`/`db.query()` directly.

### Input

A `table` name, `whereColumnValuePairs`/`columnValuePairs`, and a `caller` string for logging —
or, for `table_query`, a raw SQL string with parameters.

### Processing

Read functions (`table_fetch`, `table_count`, `table_check`, `table_query` when not `isupdate`)
check [`userCache_store`](#cache-layer) first, keyed on the built SQL string — a cache hit returns
immediately with no database round-trip. A miss (or any write function) builds parameterized SQL
via `buildSql_Placeholders`, runs it through [`db.ts`](#db-connection), and — for cacheable reads —
stores the result before returning it. Every call also fires [`write_logging`](#logging),
success or failure.

### Output

Rows (as `any[]`) for reads; nothing meaningful for writes beyond success/failure, since result
handling is the caller's responsibility.

## Cache layer {#cache-layer}

### Purpose

`userCache_store` is an in-memory, per-process cache keyed on the exact SQL string a read would
run — not table name, not TTL-based. It has no expiry; the only way an entry leaves it is a
server restart or an explicit cache-clear action.

### Input

The readable SQL string (built by `buildSql_Readable`) as the cache key, from any `table_*` read
function that didn't pass `skipCache: true`.

### Processing

A plain key→rows map. `cache_get` returns the stored rows on a hit; `cache_set` stores a fresh
result after a miss. Writes never populate or check it — `table_write`/`table_update`/
`table_upsert`/`table_delete` always bypass it entirely, and any read passing `skipCache: true`
(pipeline/maintenance/"what does the live database look like right now" checks) does too.

### Output

Cached rows on a hit (no database round-trip at all); nothing on a miss (falls through to
[`db.ts`](#db-connection)).

## Database connection {#db-connection}

### Purpose

`db.ts`'s `sql()` is the only file in the whole package that actually opens a Postgres connection
and runs a query — every `table_*` function funnels through it, and no consuming project imports
it directly.

### Input

A built SQL string + parameter array, forwarded from whichever `table_*` function is running (on
a cache miss, or a write).

### Processing

Opens (or reuses) a connection per `NEXT_PUBLIC_APPENV_DBHANDLER`/`POSTGRES_URL`, executes the
query against Postgres, and returns the raw driver result up to the calling `table_*` function.

### Output

Postgres's own result set — rows and metadata — handed back up to the `table_*` function that
called it, which then shapes it into the return type callers actually see.

## Logging {#logging}

### Purpose

Every `table_*` call — read or write, success or failure — writes one row to `xlg_logging` via
`write_logging`, so any operation across any consuming project can be traced from one place.

### Input

`lg_caller` (which project function initiated the call), `lg_functionname` (which `table_*`
function ran), `lg_msg`, and `lg_severity` (`'I'`/`'W'`/`'E'`).

### Output

One row in `xlg_logging` per call, viewable via the shared `OwnerTableLogging` panel in any
consuming project's `/owner` page.
