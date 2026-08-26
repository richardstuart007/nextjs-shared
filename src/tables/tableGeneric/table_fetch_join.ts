'use server'

//==============================================================================================
//  1) DESCRIPTION
//    table_fetch_join — SELECTs rows from table with LEFT JOINs, optional WHERE/ORDER
//    BY/LIMIT, caching successful results by their readable SQL
//
//    Parameters:
//      table                 — table name
//      joins                 — LEFT JOINs to add, injected right after FROM table
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
import type { JoinParams } from '../structures'

//
// Props
//
export type table_fetch_join_Props = {
  caller: string
  table: string
  joins?: JoinParams[]
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

const functionName = 'table_fetch_join'

export async function table_fetch_join({
  caller,
  table,
  joins = [],
  whereColumnValuePairs,
  orderBy,
  distinct = false,
  columns,
  limit,
  skipCache = false,
  noLog = false,
  level = 1,
  severity = 'I'
}: table_fetch_join_Props): Promise<TableResult<any[]>> {
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
  // Inject JOIN clauses after FROM ${table}
  //
  const sqlWithJoins = injectJoins(sqlWithPlaceholders, table, joins)
  //
  // Build readable SQL for cache key
  //
  const readableSql = buildSql_Readable(sqlWithJoins, values)
  if (!skipCache) {
    const cachedData = cache_get<any>(readableSql, functionName, table, level, severity)
    if (cachedData) return { ok: true, data: cachedData, error: null }
  }

  try {
    const data = await table_fetch_join_query({
      caller,
      table,
      joins,
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
//  Inject LEFT JOIN clauses immediately after "FROM ${table}" — shared by the cache-key
//  build above and the actual query build in table_fetch_join_query, so the two can't diverge
//
//  Params:
//    sqlQuery — a base 'SELECT ... FROM table' query
//    table    — the table name (must match the FROM clause exactly, for the replace)
//    joins    — the joins to inject
//
//  Returns:
//    sqlQuery with 'FROM table LEFT JOIN ... LEFT JOIN ...' in place of 'FROM table'
//----------------------------------------------------------------------------------
function injectJoins(sqlQuery: string, table: string, joins: JoinParams[]): string {
  if (joins.length === 0) return sqlQuery
  const joinSql = joins.map(({ table: jt, on }) => `LEFT JOIN ${jt} ON ${on}`).join(' ')
  return sqlQuery.replace(`FROM ${table}`, `FROM ${table} ${joinSql}`)
}

//----------------------------------------------------------------------------------
//  table_fetch_join_query — runs the actual SELECT (no cache involvement), logging
//  on failure
//
//  Params: same as table_fetch_join (minus skipCache)
//
//  Returns:
//    the matching rows (throws on failure, after logging)
//----------------------------------------------------------------------------------
async function table_fetch_join_query({
  caller,
  table,
  joins = [],
  whereColumnValuePairs,
  orderBy,
  distinct = false,
  columns,
  limit,
  noLog = false,
  level = 1,
  severity = 'I'
}: table_fetch_join_Props): Promise<any[]> {
  let finalQuery = ''
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
    values = built.values
    //
    // Inject JOIN clauses after FROM ${table}
    //
    finalQuery = injectJoins(built.sqlQuery, table, joins)
    //
    // Execute the query
    //
    const db = await sql()
    const data = await db.query({
      query: finalQuery,
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
      lg_sql_raw: finalQuery,
      lg_sql_params: values,
      lg_sql_readable: buildSql_Readable(finalQuery, values)
    })
    throw error
  }
}
