'use server'

//==============================================================================================
//  1) DESCRIPTION
//    table_drop — DROPs a table, with logging on both success and failure
//
//    Parameters:
//      table           — table name to drop
//      caller          — logging caller identity
//      level, severity — logging level/severity; default 1/'I'
//
//    Returns:
//      a TableResult<boolean> — true on success, or an error message
//==============================================================================================

import { sql } from '../db'
import { write_logging } from './write_logging'
import { buildSql_Readable } from './buildSql_Readable'
import { TableResult } from '../structures'

export async function table_drop(
  table: string,
  caller: string = '',
  level: number = 1,
  severity: string = 'I'
): Promise<TableResult<boolean>> {
  const functionName = 'table_drop'
  const sqlQuery = `DROP Table ${table}`
  try {
    //
    // Run query
    //
    const db = await sql()
    await db.query({
      caller: caller,
      query: sqlQuery,
      functionName: functionName,
      table,
      level,
      isupdate: true,
      severity
    })
    //
    // Trace log — always fires, gating lives inside write_logging
    //
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: `Table(${table}) DROP succeeded`,
      lg_severity: severity,
      lg_table: table,
      lg_level: level,
      lg_isupdate: true,
      lg_sql_raw: sqlQuery,
      lg_sql_params: [],
      lg_sql_readable: buildSql_Readable(sqlQuery, [])
    })
    return { ok: true, data: true, error: null }
  } catch (error) {
    //
    // Logging
    //
    const errorMessage = `Table(${table}) DROP FAILED`
    console.error(`${functionName}: ${errorMessage}`, error)
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E',
      lg_table: table,
      lg_level: level,
      lg_sql_raw: sqlQuery,
      lg_sql_params: [],
      lg_sql_readable: buildSql_Readable(sqlQuery, [])
    })
    return { ok: false, data: false, error: errorMessage }
  }
}
