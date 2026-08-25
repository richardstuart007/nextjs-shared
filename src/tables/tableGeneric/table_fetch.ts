'use server'

//==============================================================================================
//  1) DESCRIPTION
//    table_fetch — SELECTs rows from table, with optional WHERE/ORDER BY/LIMIT, caching
//    successful results by their readable SQL
//
//    Parameters:
//      table                 — table name
//      whereColumnValuePairs — optional WHERE conditions (column/value/operator triples;
//                              operator defaults to '='); IN/NOT IN expects an array value
//      orderBy               — optional ORDER BY clause
//      distinct              — adds SELECT DISTINCT; defaults to false
//      columns               — columns to select; defaults to '*'
//      limit                 — optional LIMIT
//      caller                — logging caller identity
//      skipCache             — bypasses the cache read/write; defaults to false
//      noLog                 — suppresses the query-level trace log; defaults to false
//      level, severity       — logging level/severity; default 1/'I'
//
//    Returns:
//      a TableResult<any[]> — the matching rows, or an error message
//==============================================================================================

import { sql } from '../db'
import { write_logging } from './write_logging'
import { ColumnValuePair, TableResult } from '../structures'
import { cache_get, cache_set } from '../cache/userCache_store'
import { buildSql_Placeholders } from './buildSql_Placeholders'
import { buildSql_Readable } from './buildSql_Readable'

//
// Props
//
export type table_fetch_Props = {
  caller: string
  table: string
  whereColumnValuePairs?: ColumnValuePair[]
  orderBy?: string
  distinct?: boolean
  columns?: string[]
  limit?: number
  skipCache?: boolean
  noLog?: boolean
  level?: number
  severity?: string
}

const functionName = 'table_fetch'

export async function table_fetch({
  caller,
  table,
  whereColumnValuePairs,
  orderBy,
  distinct = false,
  columns,
  limit,
  skipCache = false,
  noLog = false,
  level = 1,
  severity = 'I'
}: table_fetch_Props): Promise<TableResult<any[]>> {
  // Build the SQL with placeholders
  const { sqlQuery: sqlWithPlaceholders, values } = buildSql_Placeholders({
    table,
    whereColumnValuePairs,
    orderBy,
    distinct,
    columns,
    limit
  })
  //
  // Build readable SQL for cache key
  //
  const readableSql = buildSql_Readable(sqlWithPlaceholders, values)
  if (!skipCache) {
    const cachedData = cache_get<any>(readableSql, functionName, table, level, severity)
    if (cachedData) return { ok: true, data: cachedData, error: null }
  }

  try {
    const data = await table_fetch_query({
      caller,
      table,
      whereColumnValuePairs,
      orderBy,
      distinct,
      columns,
      limit,
      noLog,
      level,
      severity
    })
    //
    // Only cache a result that came from a successful query — never cache a fallback empty array
    //
    if (!skipCache) {
      cache_set(readableSql, data, caller, table, level, severity)
    }
    return { ok: true, data, error: null }
  } catch (error) {
    return { ok: false, data: [], error: (error as Error).message }
  }
}

//----------------------------------------------------------------------------------
//  table_fetch_query — runs the actual SELECT (no cache involvement), logging on
//  failure
//
//  Params: same as table_fetch (minus skipCache)
//
//  Returns:
//    the matching rows (throws on failure, after logging)
//----------------------------------------------------------------------------------
async function table_fetch_query({
  caller,
  table,
  whereColumnValuePairs,
  orderBy,
  distinct = false,
  columns,
  limit,
  noLog = false,
  level = 1,
  severity = 'I'
}: table_fetch_Props): Promise<any[]> {
  let sqlQuery = ''
  let values: any[] = []
  try {
    //
    // Build the SQL with placeholders
    //
    const built = buildSql_Placeholders({
      table,
      whereColumnValuePairs,
      orderBy,
      distinct,
      columns,
      limit
    })
    sqlQuery = built.sqlQuery
    values = built.values
    //
    // Execute the query
    //
    const db = await sql()
    const data = await db.query({
      query: sqlQuery,
      params: values,
      functionName: functionName,
      caller: caller,
      noLog,
      table,
      level,
      severity
    })
    //
    // Return rows
    //
    return data.rows.length > 0 ? data.rows : []
    //
    // Errors
    //
  } catch (error) {
    const errorMessage = `Table(${table}) SQL FAILED`
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E',
      lg_table: table,
      lg_level: level,
      lg_sql_raw: sqlQuery,
      lg_sql_params: values,
      lg_sql_readable: buildSql_Readable(sqlQuery, values)
    })
    throw error
  }
}
