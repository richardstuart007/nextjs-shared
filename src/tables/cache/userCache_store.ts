import { write_logging } from '../tableGeneric/write_logging'

type CacheEntry<T> = {
  data: T
  sql: string
  caller: string
  tables: string[]
  rowCount: number
  hitCount: number
}

// Singleton cache anchored to globalThis so all Next.js bundles share the same instance
const globalForCache = globalThis as unknown as { _Cache: Map<string, CacheEntry<any>> }
if (!globalForCache._Cache) globalForCache._Cache = new Map()
const cache = globalForCache._Cache

//---------------------------------------------------------------------
//  normalizeSql - Remove extra whitespace from SQL for cleaner cache keys
//
//  Params:
//    sql — the SQL string to normalize
//
//  Returns:
//    sql with runs of whitespace collapsed to a single space, trimmed
//---------------------------------------------------------------------
function normalizeSql(sql: string): string {
  return sql
    .replace(/\s+/g, ' ') // Replace multiple whitespace characters with a single space
    .trim() // Remove leading/trailing spaces
}

//---------------------------------------------------------------------
//  extractTables - Extract all table names from FROM and JOIN clauses
//
//  Params:
//    sql — the SQL string to scan
//
//  Returns:
//    every table name found after a FROM or JOIN keyword
//---------------------------------------------------------------------
function extractTables(sql: string): string[] {
  return [...sql.matchAll(/\b(?:FROM|JOIN)\s+(\w+)/gi)].map(m => m[1])
}

//---------------------------------------------------------------------
//  cache_get - Get cached data by SQL key
//
//  Params:
//    sql             — the SQL string used as the cache key (normalized internally)
//    caller          — logging caller identity
//    table           — table name, for logging only
//    level, severity — logging level/severity; default 1/'I'
//
//  Returns:
//    the cached value, or null on a miss
//---------------------------------------------------------------------
export function cache_get<T>(
  sql: string,
  caller: string = '',
  table: string = '',
  level: number = 1,
  severity: string = 'I'
): T | null {
  const functionName = 'cache_get'
  const normalizedSql = normalizeSql(sql)
  const entry = cache.get(normalizedSql)

  if (entry) {
    entry.hitCount = (entry.hitCount ?? 0) + 1
    const hitMsg = `CACHE_HIT | ${entry.sql} | rows: ${getDataInfo(entry.data)}`
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: hitMsg,
      lg_severity: severity,
      lg_table: table,
      lg_level: level
    })
    return entry.data as T
  }

  const missMsg = `CACHE_MISS | ${normalizedSql}`
  write_logging({
    lg_caller: caller,
    lg_functionname: functionName,
    lg_msg: missMsg,
    lg_severity: severity,
    lg_table: table,
    lg_level: level
  })
  return null
}

//---------------------------------------------------------------------
//  cache_set - Store data in cache with SQL key
//
//  Params:
//    sql             — the SQL string used as the cache key (normalized internally)
//    data            — the value to cache
//    caller          — logging caller identity
//    table           — table name, for logging only
//    level, severity — logging level/severity; default 1/'I'
//---------------------------------------------------------------------
export function cache_set<T>(
  sql: string,
  data: T,
  caller: string = '',
  table: string = '',
  level: number = 1,
  severity: string = 'I'
): void {
  const functionName = 'cache_set'
  const normalizedSql = normalizeSql(sql)

  const setMsg = `CACHE_SAV | ${normalizedSql} | rows: ${getDataInfo(data)}`
  write_logging({
    lg_caller: caller,
    lg_functionname: functionName,
    lg_msg: setMsg,
    lg_severity: severity,
    lg_table: table,
    lg_level: level
  })

  cache.set(normalizedSql, {
    data,
    sql: normalizedSql,
    caller,
    tables: extractTables(normalizedSql),
    rowCount: Array.isArray(data) ? data.length : -1,
    hitCount: 0
  })
}

//---------------------------------------------------------------------
//  cache_clearUser - Clear all entries containing userId in SQL
//  (userId appears in the WHERE clause, not in table names, so SQL string search is correct)
//
//  Only matches equality filters (`= <userId>`) — a userId inside an IN (...) list
//  (e.g. `usr_usrid IN (5, 8, 12)`) will NOT be matched, so that entry won't be cleared.
//  Not currently a problem: the only consumer (next-bridgeschool's userCache_purge) always
//  clears one user at a time after that user's own record changed, so every affected query
//  filters by plain equality. Revisit if a batched per-user IN-list query is ever added.
//
//  Params:
//    userId          — the user id to search for (as a plain equality match)
//    caller          — logging caller identity
//    level, severity — logging level/severity; default 1/'I'
//
//  Returns:
//    the number of entries cleared
//---------------------------------------------------------------------
export function cache_clearUser(
  userId: number,
  caller: string = '',
  level: number = 1,
  severity: string = 'I'
): number {
  const functionName = 'cache_clearUser'
  let cleared = 0
  const entries: string[] = []

  for (const [key, entry] of cache.entries()) {
    if (new RegExp(`= ${userId}(?!\\d)`).test(entry.sql)) {
      entries.push(entry.sql)
      cache.delete(key)
      cleared++
    }
  }

  if (cleared > 0) {
    const clearMsg = `CACHE_CLR_USER | UserId: ${userId} | Cleared ${cleared} entries: ${entries.join(', ')}`
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: clearMsg,
      lg_severity: severity,
      lg_level: level
    })
  } else {
    const noEntriesMsg = `CACHE_CLR_USER | UserId: ${userId} | No entries found`
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: noEntriesMsg,
      lg_severity: severity,
      lg_level: level
    })
  }

  return cleared
}

//---------------------------------------------------------------------
//  cache_clearTable - Clear all entries referencing a table (uses stored tables array)
//
//  Params:
//    tableName       — table name to clear entries for (case-insensitive)
//    caller          — logging caller identity
//    level, severity — logging level/severity; default 1/'I'
//
//  Returns:
//    the number of entries cleared
//---------------------------------------------------------------------
export function cache_clearTable(
  tableName: string,
  caller: string = '',
  level: number = 1,
  severity: string = 'I'
): number {
  const functionName = 'cache_clearTable'
  let cleared = 0
  const entries: string[] = []
  const lowerName = tableName.toLowerCase()

  for (const [key, entry] of cache.entries()) {
    const entryTables: string[] = entry.tables ?? []
    if (entryTables.some(t => t.toLowerCase() === lowerName)) {
      entries.push(entry.sql)
      cache.delete(key)
      cleared++
    }
  }

  if (cleared > 0) {
    const clearMsg = `CACHE_CLR_TABLE | Table: ${tableName} | Cleared ${cleared} entries: ${entries.join(', ')}`
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: clearMsg,
      lg_severity: severity,
      lg_table: tableName,
      lg_level: level
    })
  } else {
    const noEntriesMsg = `CACHE_CLR_TABLE | Table: ${tableName} | No entries found`
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: noEntriesMsg,
      lg_severity: severity,
      lg_table: tableName,
      lg_level: level
    })
  }

  return cleared
}

//---------------------------------------------------------------------
//  cache_clearAll - Clear entire cache
//
//  Params:
//    caller          — logging caller identity
//    level, severity — logging level/severity; default 1/'I'
//---------------------------------------------------------------------
export function cache_clearAll(
  caller: string = '',
  level: number = 1,
  severity: string = 'I'
): void {
  const functionName = 'cache_clearAll'
  const count = cache.size
  cache.clear()

  const clearAllMsg = `CACHE_CLR_ALL | Removed ${count} total entries`
  write_logging({
    lg_caller: caller,
    lg_functionname: functionName,
    lg_msg: clearAllMsg,
    lg_severity: severity,
    lg_level: level
  })
}

//---------------------------------------------------------------------
//  cache_getStats - Get cache statistics
//
//  Params:
//    caller          — logging caller identity
//    level, severity — logging level/severity; default 1/'I'
//
//  Returns:
//    size — total entry count
//    sqls — every cached SQL key
//---------------------------------------------------------------------
export function cache_getStats(caller: string = '', level: number = 1, severity: string = 'I') {
  const functionName = 'cache_getStats'
  const sqls: string[] = Array.from(cache.keys())

  write_logging({
    lg_caller: caller,
    lg_functionname: functionName,
    lg_msg: `CACHE_STATS | Total entries: ${cache.size}`,
    lg_severity: severity,
    lg_level: level
  })

  sqls.forEach(function (sql) {
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: `  - ${sql}`,
      lg_severity: severity,
      lg_level: level
    })
  })

  return {
    size: cache.size,
    sqls
  }
}

//---------------------------------------------------------------------
//  cache_getEntriesInfo - Return a page of cache entries matching the given filters, simulating
//  SQL LIMIT/OFFSET over the in-memory cache (there is no table behind this data)
//
//  Params:
//    limit, offset                        — pagination over the filtered result
//    keyFilter, tableFilter, callerFilter — optional case-insensitive substring
//                                           filters, applied together (AND)
//
//  Returns:
//    entries     — the page of matching entries
//    totalCount  — total matching entries (before pagination)
//    overallSize — total entries in the cache (before filtering)
//---------------------------------------------------------------------
export type CacheEntryInfo = {
  sql: string
  tables: string[]
  info: string
  rowCount: number
  caller: string
  hitCount: number
}

export type CacheEntriesPage = {
  entries: CacheEntryInfo[]
  totalCount: number
  overallSize: number
}

export function cache_getEntriesInfo({
  limit,
  offset,
  keyFilter = '',
  tableFilter = '',
  callerFilter = ''
}: {
  limit: number
  offset: number
  keyFilter?: string
  tableFilter?: string
  callerFilter?: string
}): CacheEntriesPage {
  const allEntries: CacheEntryInfo[] = Array.from(cache.entries()).map(([key, entry]) => {
    return {
      sql: key,
      tables: entry.tables ?? [],
      info: getDataInfo(entry.data),
      rowCount: entry.rowCount ?? (Array.isArray(entry.data) ? entry.data.length : -1),
      caller: entry.caller,
      hitCount: entry.hitCount ?? 0
    }
  })

  const matchedEntries = allEntries.filter(entry => {
    const matchKey = keyFilter === '' || entry.sql.toLowerCase().includes(keyFilter.toLowerCase())
    const matchTable =
      tableFilter === '' ||
      entry.tables.some(t => t.toLowerCase().includes(tableFilter.toLowerCase()))
    const matchCaller =
      callerFilter === '' || entry.caller.toLowerCase().includes(callerFilter.toLowerCase())
    return matchKey && matchTable && matchCaller
  })

  return {
    entries: matchedEntries.slice(offset, offset + limit),
    totalCount: matchedEntries.length,
    overallSize: allEntries.length
  }
}

//---------------------------------------------------------------------
//  cache_getEntryData - Return the raw data stored for a cache entry
//
//  Params:
//    sql — the SQL string used as the cache key (normalized internally)
//
//  Returns:
//    the cached value, or null if not found
//---------------------------------------------------------------------
export function cache_getEntryData(sql: string): any | null {
  const normalizedSql = normalizeSql(sql)
  const entry = cache.get(normalizedSql)
  return entry ? entry.data : null
}

//---------------------------------------------------------------------
//  cache_deleteEntry - Delete a single cache entry by SQL key
//
//  Params:
//    sql             — the SQL string used as the cache key (normalized internally)
//    caller          — logging caller identity
//    level, severity — logging level/severity; default 1/'I'
//
//  Returns:
//    whether an entry was actually found and removed
//---------------------------------------------------------------------
export function cache_deleteEntry(
  sql: string,
  caller: string = '',
  level: number = 1,
  severity: string = 'I'
): boolean {
  const functionName = 'cache_deleteEntry'
  const normalizedSql = normalizeSql(sql)
  const deleted = cache.delete(normalizedSql)

  write_logging({
    lg_caller: caller,
    lg_functionname: functionName,
    lg_msg: `CACHE_DEL | ${deleted ? 'Deleted' : 'Not found'} | ${normalizedSql}`,
    lg_severity: severity,
    lg_level: level
  })

  return deleted
}

//---------------------------------------------------------------------
//  cache_getEntries - Return all cached SQL strings for display
//
//  Returns:
//    every cached SQL key
//---------------------------------------------------------------------
export function cache_getEntries(): string[] {
  return Array.from(cache.keys())
}

//---------------------------------------------------------------------
//  getDataInfo - Helper to get data info for logging
//
//  Params:
//    data — the cached value
//
//  Returns:
//    'empty' for null/undefined, 'N rows' for an array, 'object' for a plain
//    object, or 'type: value' for a primitive
//---------------------------------------------------------------------
function getDataInfo(data: any): string {
  if (data === null || data === undefined) {
    return 'empty'
  }
  if (Array.isArray(data)) {
    return `${data.length} rows`
  }
  if (typeof data === 'object') {
    return 'object'
  }
  return `${typeof data}: ${data}`
}
