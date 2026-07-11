'use server'

import { sql } from '../db'
import { write_logging } from './write_logging'
import { ColumnValuePair } from '../structures'
import { cache_get, cache_set } from '../cache/userCache_store'
import { buildSql_Placeholders } from './buildSql_Placeholders'
import { buildSql_Readable } from './buildSql_Readable'
import type { JoinParams } from '../structures'

//----------------------------------------------------------------------------------
//  Main function
//----------------------------------------------------------------------------------
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
}: table_fetch_join_Props): Promise<any[]> {
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
  const joinSql =
    joins.length > 0
      ? joins.map(({ table: jt, on }) => `LEFT JOIN ${jt} ON ${on}`).join(' ')
      : ''
  const sqlWithJoins = joinSql
    ? sqlWithPlaceholders.replace(`FROM ${table}`, `FROM ${table} ${joinSql}`)
    : sqlWithPlaceholders
  //
  // Build readable SQL for cache key
  //
  const readableSql = buildSql_Readable(sqlWithJoins, values)
  if (!skipCache) {
    const cachedData = cache_get<any>(readableSql, functionName, table, level, severity)
    if (cachedData) return cachedData
  }

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
  if (!skipCache) {
    cache_set(readableSql, data, caller, table, level, severity)
  }
  return data
}

//----------------------------------------------------------------------------------
// Run the query
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
    // Inject JOIN clauses after FROM ${table}
    //
    const joinSql =
      joins.length > 0
        ? joins.map(({ table: jt, on }) => `LEFT JOIN ${jt} ON ${on}`).join(' ')
        : ''
    const finalQuery = joinSql
      ? sqlQuery.replace(`FROM ${table}`, `FROM ${table} ${joinSql}`)
      : sqlQuery
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
      lg_level: level
    })
    return []
  }
}
