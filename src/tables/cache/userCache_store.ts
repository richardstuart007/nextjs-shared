import { write_Logging } from '../tableGeneric/write_logging'

type CacheEntry<T> = {
  data: T
  sql: string
  caller: string
}

// Singleton cache anchored to globalThis so all Next.js bundles share the same instance
const globalForCache = globalThis as unknown as { _bridgeCache: Map<string, CacheEntry<any>> }
if (!globalForCache._bridgeCache) globalForCache._bridgeCache = new Map()
const cache = globalForCache._bridgeCache

//---------------------------------------------------------------------
//  normalizeSql - Remove extra whitespace from SQL for cleaner cache keys
//---------------------------------------------------------------------
function normalizeSql(sql: string): string {
  return sql
    .replace(/\s+/g, ' ') // Replace multiple whitespace characters with a single space
    .trim() // Remove leading/trailing spaces
}

//---------------------------------------------------------------------
//  cache_get - Get cached data by SQL key
//---------------------------------------------------------------------
export function cache_get<T>(sql: string, caller: string = ''): T | null {
  const functionName = 'cache_get'
  const normalizedSql = normalizeSql(sql)
  const entry = cache.get(normalizedSql)

  if (entry) {
    const hitMsg = `CACHE_HIT | ${entry.sql} | rows: ${getDataInfo(entry.data)}`
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: hitMsg,
      lg_severity: 'I'
    })
    return entry.data as T
  }

  const missMsg = `CACHE_MISS | ${normalizedSql}`
  write_Logging({
    lg_caller: caller,
    lg_functionname: functionName,
    lg_msg: missMsg,
    lg_severity: 'I'
  })
  return null
}

//---------------------------------------------------------------------
//  cache_set - Store data in cache with SQL key
//---------------------------------------------------------------------
export function cache_set<T>(sql: string, data: T, caller: string = ''): void {
  const functionName = 'cache_set'
  const normalizedSql = normalizeSql(sql)

  const setMsg = `CACHE_SAV | ${normalizedSql} | rows: ${getDataInfo(data)}`
  write_Logging({
    lg_caller: caller,
    lg_functionname: functionName,
    lg_msg: setMsg,
    lg_severity: 'I'
  })

  cache.set(normalizedSql, {
    data,
    sql: normalizedSql,
    caller
  })

  // Print entire cache after save
  // console.log('\n=== CACHE CONTENTS ===')
  // console.log(`Total entries: ${cache.size}`)
  // for (const entry of cache.values()) {
  //   console.log(`  ${entry.sql} | rows: ${getDataInfo(entry.data)}`)
  // }
  // console.log('=====================\n')
}

//---------------------------------------------------------------------
//  cache_clearUser - Clear all entries containing userId in SQL
//---------------------------------------------------------------------
export function cache_clearUser(userId: number, caller: string = ''): number {
  const functionName = 'cache_clearUser'
  let cleared = 0
  const entries: string[] = []

  for (const [key, entry] of cache.entries()) {
    if (
      entry.sql.includes(`userId:${userId}`) ||
      new RegExp(`= ${userId}(?!\\d)`).test(entry.sql)
    ) {
      entries.push(entry.sql)
      cache.delete(key)
      cleared++
    }
  }

  if (cleared > 0) {
    const clearMsg = `CACHE_CLR_USER | UserId: ${userId} | Cleared ${cleared} entries: ${entries.join(', ')}`
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: clearMsg,
      lg_severity: 'I'
    })
  } else {
    const noEntriesMsg = `CACHE_CLR_USER | UserId: ${userId} | No entries found`
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: noEntriesMsg,
      lg_severity: 'I'
    })
  }

  return cleared
}

//---------------------------------------------------------------------
//  cache_clearTable - Clear all entries referencing a table in FROM or JOIN
//---------------------------------------------------------------------
export function cache_clearTable(tableName: string, caller: string = ''): number {
  const functionName = 'cache_clearTable'
  let cleared = 0
  const entries: string[] = []
  const tableRegex = new RegExp(`\\b(?:FROM|JOIN)\\s+${tableName}\\b`, 'i')

  for (const [key, entry] of cache.entries()) {
    if (tableRegex.test(entry.sql)) {
      entries.push(entry.sql)
      cache.delete(key)
      cleared++
    }
  }

  if (cleared > 0) {
    const clearMsg = `CACHE_CLR_TABLE | Table: ${tableName} | Cleared ${cleared} entries: ${entries.join(', ')}`
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: clearMsg,
      lg_severity: 'I'
    })
  } else {
    const noEntriesMsg = `CACHE_CLR_TABLE | Table: ${tableName} | No entries found`
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: noEntriesMsg,
      lg_severity: 'I'
    })
  }

  return cleared
}

//---------------------------------------------------------------------
//  cache_clearAll - Clear entire cache
//---------------------------------------------------------------------
export function cache_clearAll(caller: string = ''): void {
  const functionName = 'cache_clearAll'
  const count = cache.size
  cache.clear()

  const clearAllMsg = `CACHE_CLR_ALL | Removed ${count} total entries`
  write_Logging({
    lg_caller: caller,
    lg_functionname: functionName,
    lg_msg: clearAllMsg,
    lg_severity: 'I'
  })
}

//---------------------------------------------------------------------
//  cache_getStats - Get cache statistics
//---------------------------------------------------------------------
export function cache_getStats(caller: string = '') {
  const functionName = 'cache_getStats'
  const sqls: Record<string, number> = {}
  for (const entry of cache.values()) {
    sqls[entry.sql] = (sqls[entry.sql] || 0) + 1
  }

  const statsMsg = `CACHE_STATS | Total entries: ${cache.size}`
  write_Logging({
    lg_caller: caller,
    lg_functionname: functionName,
    lg_msg: statsMsg,
    lg_severity: 'I'
  })

  Object.entries(sqls).forEach(function ([sql, cnt]) {
    const idMsg = `  - ${sql}: ${cnt} entries`
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: idMsg,
      lg_severity: 'I'
    })
  })

  return {
    size: cache.size,
    sqls
  }
}

//---------------------------------------------------------------------
//  cache_getEntriesInfo - Return all cache entries with data info for display
//---------------------------------------------------------------------
export type CacheEntryInfo = {
  sql: string
  info: string
  caller: string
  table: string
}

export function cache_getEntriesInfo(): CacheEntryInfo[] {
  return Array.from(cache.entries()).map(([key, entry]) => {
    const tableMatch = key.match(/\bFROM\s+(\w+)/i)
    return {
      sql: key,
      info: getDataInfo(entry.data),
      caller: entry.caller,
      table: tableMatch ? tableMatch[1] : ''
    }
  })
}

//---------------------------------------------------------------------
//  cache_getEntryData - Return the raw data stored for a cache entry
//---------------------------------------------------------------------
export function cache_getEntryData(sql: string): any | null {
  const normalizedSql = normalizeSql(sql)
  const entry = cache.get(normalizedSql)
  return entry ? entry.data : null
}

//---------------------------------------------------------------------
//  cache_deleteEntry - Delete a single cache entry by SQL key
//---------------------------------------------------------------------
export function cache_deleteEntry(sql: string, caller: string = ''): boolean {
  const functionName = 'cache_deleteEntry'
  const normalizedSql = normalizeSql(sql)
  const deleted = cache.delete(normalizedSql)

  write_Logging({
    lg_caller: caller,
    lg_functionname: functionName,
    lg_msg: `CACHE_DEL | ${deleted ? 'Deleted' : 'Not found'} | ${normalizedSql}`,
    lg_severity: 'I'
  })

  return deleted
}

//---------------------------------------------------------------------
//  cache_getEntries - Return all cached SQL strings for display
//---------------------------------------------------------------------
export function cache_getEntries(): string[] {
  return Array.from(cache.keys())
}

//---------------------------------------------------------------------
//  getDataInfo - Helper to get data info for logging
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
