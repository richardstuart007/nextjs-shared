'use server'

import { sql } from '../db'
import { write_logging } from './write_logging'
import { ColumnValuePair } from '../structures'
import { cache_get, cache_set } from '../cache/userCache_store'
import { buildSql_Placeholders } from './buildSql_Placeholders'
import { buildSql_Readable } from './buildSql_Readable'

//----------------------------------------------------------------------------------
//  Main function
//----------------------------------------------------------------------------------
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
}: table_fetch_Props): Promise<any[]> {
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
    if (cachedData) return cachedData
  }

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
  if (!skipCache) {
    cache_set(readableSql, data, caller, table, level, severity)
  }
  return data
}

//----------------------------------------------------------------------------------
// Run the query
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
  try {
    //
    // Build the SQL with placeholders
    //
    const { sqlQuery, values } = buildSql_Placeholders({
      table,
      whereColumnValuePairs,
      orderBy,
      distinct,
      columns,
      limit
    })
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
      lg_level: level
    })
    return []
  }
}
