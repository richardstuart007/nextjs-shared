'use server'

//==============================================================================================
//  1) DESCRIPTION
//    table_check — checks whether any row matching each given table/WHERE pair exists,
//    stopping at the first match found
//
//    Parameters:
//      tableColumnValuePairs — one or more {table, whereColumnValuePairs} checks, evaluated
//                              in order (equality only)
//      caller                — logging caller identity
//      level, severity       — logging level/severity; default 1/'I'
//
//    Returns:
//      a TableResult<{found, message}> — found is true if any pair matched, with a
//      description in message; on error, found is false and error carries the message
//==============================================================================================

import { sql } from '../db'
import { write_logging } from './write_logging'
import { TableColumnValuePairs, TableResult } from '../structures'
import { buildSql_Readable } from './buildSql_Readable'

export async function table_check(
  tableColumnValuePairs: TableColumnValuePairs[],
  caller: string = '',
  level: number = 1,
  severity: string = 'I'
): Promise<TableResult<{ found: boolean; message: string }>> {
  const functionName = 'table_check'
  let currentTable = ''
  let currentSql = ''
  let currentValues: any[] = []

  try {
    //
    // Loop through each table-column-value pair
    //
    for (const { table, whereColumnValuePairs } of tableColumnValuePairs) {
      currentTable = table
      //
      // Create WHERE clause with parameterized queries
      //
      const whereClause = whereColumnValuePairs
        .map(({ column }, index) => `${column} = $${index + 1}`)
        .join(' AND ')
      //
      // Gather values for the WHERE clause
      //
      const values = whereColumnValuePairs.map(({ value }) => value)
      //
      // Construct the SQL SELECT query
      //
      const sqlQuery = `
      SELECT 1
      FROM ${table}
      WHERE ${whereClause}
      LIMIT 1`
      currentSql = sqlQuery
      currentValues = values
      //
      // Execute the query
      //
      const db = await sql()
      const data = await db.query({
        caller: caller,
        query: sqlQuery,
        params: values,
        functionName: functionName,
        table,
        level,
        severity
      })
      //
      // Check if rows exist
      //
      if (data.rows.length > 0) {
        const errorMessage = `Keys exist in ${table} with conditions: ${JSON.stringify(whereColumnValuePairs)}`
        write_logging({
          lg_caller: caller,
          lg_functionname: functionName,
          lg_msg: errorMessage,
          lg_severity: severity,
          lg_table: table,
          lg_level: level,
          lg_sql_raw: sqlQuery,
          lg_sql_params: values,
          lg_sql_readable: buildSql_Readable(sqlQuery, values)
        })
        return { ok: true, data: { found: true, message: errorMessage }, error: null }
      }
    }
    //
    // If no matches were found
    //
    return { ok: true, data: { found: false, message: '' }, error: null }
    //
    //  Errors
    //
  } catch (error) {
    const errorMessage = `Table(${currentTable}) check FAILED`
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E',
      lg_table: currentTable,
      lg_level: level,
      lg_sql_raw: currentSql,
      lg_sql_params: currentValues,
      lg_sql_readable: buildSql_Readable(currentSql, currentValues)
    })
    console.error('Error:', errorMessage)
    return { ok: false, data: { found: false, message: '' }, error: errorMessage }
  }
}
