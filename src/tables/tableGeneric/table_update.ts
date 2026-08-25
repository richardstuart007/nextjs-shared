'use server'

//==============================================================================================
//  1) DESCRIPTION
//    table_update — UPDATEs rows matching whereColumnValuePairs, clears the table's cache
//    entries, and logs the outcome
//
//    Parameters:
//      table                 — table name
//      columnValuePairs      — the columns/values to SET (equality only)
//      whereColumnValuePairs — the WHERE conditions (equality only)
//      caller                — logging caller identity
//      noLog                 — suppresses the query-level trace log; defaults to false
//      skipCache             — skips clearing this table's cache entries; defaults to false
//      level, severity       — logging level/severity; default 1/'I'
//
//    Returns:
//      a TableResult<any[]> — the updated row(s) (via RETURNING *), or an error message
//==============================================================================================

import { sql } from '../db'
import { write_logging } from './write_logging'
import { cache_clearTable } from '../cache/userCache_store'
import { WriteColumnValuePair, TableResult } from '../structures'
import { buildSql_Readable } from './buildSql_Readable'
//
// Props
//
interface Props {
  caller: string
  table: string
  columnValuePairs: WriteColumnValuePair[]
  whereColumnValuePairs: WriteColumnValuePair[]
  noLog?: boolean
  skipCache?: boolean
  level?: number
  severity?: string
}

export async function table_update({
  caller,
  table,
  columnValuePairs,
  whereColumnValuePairs,
  noLog = false,
  skipCache = false,
  level = 1,
  severity = 'I'
}: Props): Promise<TableResult<any[]>> {
  const functionName = 'table_update'
  //
  // Create the SET clause for the update statement
  //
  const setClause = columnValuePairs
    .map(({ column }, index) => `${column} = $${index + 1}`)
    .join(', ')
  //
  // Create the WHERE clause from the key-value pairs
  //
  const whereClause = whereColumnValuePairs
    .map(({ column }, index) => `${column} = $${index + 1 + columnValuePairs.length}`)
    .join(' AND ')
  //
  // Combine values for SET and WHERE clauses
  //
  const values = [
    ...columnValuePairs.map(({ value }) => value),
    ...whereColumnValuePairs.map(({ value }) => value)
  ]
  //
  // Construct the SQL UPDATE query
  //
  const sqlQuery = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`
  try {
    //
    //  Execute the sql
    //
    const db = await sql()
    const data = await db.query({
      caller: caller,
      query: sqlQuery,
      params: values,
      functionName: functionName,
      noLog,
      table,
      level,
      isupdate: true,
      severity
    })
    //
    // Clear cache entries for this table
    //
    if (!skipCache) cache_clearTable(table, functionName)
    //
    // Trace log — always fires, gating lives inside write_logging
    //
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: `Table(${table}) UPDATE succeeded, ${data.rows.length} row(s)`,
      lg_severity: severity,
      lg_table: table,
      lg_level: level,
      lg_isupdate: true,
      lg_sql_raw: sqlQuery,
      lg_sql_params: values,
      lg_sql_readable: buildSql_Readable(sqlQuery, values)
    })
    //
    // Return rows updated
    //
    return { ok: true, data: data.rows, error: null }
    //
    //  Errors
    //
  } catch (error) {
    const errorMessage = `Table(${table}) WHERE(${whereClause}) FAILED`
    console.error(`${functionName}: ${errorMessage}`, error)
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
    return { ok: false, data: [], error: errorMessage }
  }
}
