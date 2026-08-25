'use server'

//==============================================================================================
//  1) DESCRIPTION
//    table_query — runs a raw parameterized SQL query, with logging and (for reads) caching
//    keyed by the readable SQL. Use this when the query is too complex for table_fetch (e.g.
//    multi-table JOINs with CASE WHEN expressions, subqueries, etc.).
//
//    Parameters:
//      caller          — logging caller identity
//      query           — raw SQL, using $1/$2/... placeholders
//      params          — values for each placeholder, in order
//      noLog           — suppresses the query-level trace log; defaults to false
//      table           — table name, for logging/cache-scoping only
//      level, severity — logging level/severity; default 1/'I'
//      isupdate        — marks this as a write; always bypasses the cache; defaults to false
//      skipCache       — bypasses the cache read/write for a read query; defaults to false
//                        (ignored when isupdate is true)
//
//    Returns:
//      a TableResult<any[]> — the result rows, or an error message
//==============================================================================================

import { sql } from '../db'
import { write_logging } from './write_logging'
import { cache_get, cache_set } from '../cache/userCache_store'
import { buildSql_Readable } from './buildSql_Readable'
import { TableResult } from '../structures'

export type table_query_Props = {
  caller: string
  query: string
  params?: (string | number | null | boolean)[]
  noLog?: boolean
  table?: string
  level?: number
  isupdate?: boolean
  severity?: string
  skipCache?: boolean
}

const functionName = 'table_query'

export async function table_query({
  caller,
  query,
  params = [],
  noLog = false,
  table = '',
  level = 1,
  isupdate = false,
  severity = 'I',
  skipCache = false
}: table_query_Props): Promise<TableResult<any[]>> {
  //
  // Reads may be cached; writes (isupdate) always bypass the cache
  //
  const useCache = !skipCache && !isupdate
  const readableSql = buildSql_Readable(query, params)

  if (useCache) {
    const cachedData = cache_get<any[]>(readableSql, caller, table, level, severity)
    if (cachedData) return { ok: true, data: cachedData, error: null }
  }

  try {
    //
    // Execute the query
    //
    const db = await sql()
    const data = await db.query({
      query,
      params,
      functionName: functionName,
      caller: caller,
      noLog,
      table,
      level,
      isupdate,
      severity
    })
    //
    // Return rows
    //
    const rows = data.rows.length > 0 ? data.rows : []
    if (useCache) {
      cache_set(readableSql, rows, caller, table, level, severity)
    }
    return { ok: true, data: rows, error: null }
    //
    // Errors
    //
  } catch (error) {
    const errorMessage = `Table(${table || 'n/a'}) SQL(${readableSql}) FAILED`
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E',
      lg_table: table,
      lg_level: level,
      lg_isupdate: isupdate,
      lg_sql_raw: query,
      lg_sql_params: params,
      lg_sql_readable: readableSql
    })
    return { ok: false, data: [], error: errorMessage }
  }
}
