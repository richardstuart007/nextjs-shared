'use server'

//==============================================================================================
//  1) DESCRIPTION
//    table_duplicate — creates table_to as a structural copy of table_from (CREATE TABLE ...
//    LIKE ... INCLUDING ALL), with logging on both outcomes
//
//    Parameters:
//      table_from      — source table to copy the structure of
//      table_to        — new table name to create
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

interface Props {
  table_from: string
  table_to: string
  caller?: string
  level?: number
  severity?: string
}

export async function table_duplicate({
  table_from,
  table_to,
  caller = '',
  level = 1,
  severity = 'I'
}: Props): Promise<TableResult<boolean>> {
  const functionName = 'table_duplicate'
  const sqlQuery = `
        CREATE TABLE ${table_to}
        (LIKE ${table_from} INCLUDING ALL)`

  try {
    //
    // Execute the query
    //
    const db = await sql()
    await db.query({
      caller: caller,
      query: sqlQuery,
      functionName: functionName,
      table: table_to,
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
      lg_msg: `Table(${table_to}) duplicated from ${table_from} succeeded`,
      lg_severity: severity,
      lg_table: table_to,
      lg_level: level,
      lg_isupdate: true,
      lg_sql_raw: sqlQuery,
      lg_sql_params: [],
      lg_sql_readable: buildSql_Readable(sqlQuery, [])
    })
    //
    // All ok
    //
    return { ok: true, data: true, error: null }
    //
    // Errors
    //
  } catch (error) {
    const errorMessage = `Table(${table_to}) duplicate from ${table_from} FAILED`
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E',
      lg_table: table_to,
      lg_level: level,
      lg_sql_raw: sqlQuery,
      lg_sql_params: [],
      lg_sql_readable: buildSql_Readable(sqlQuery, [])
    })
    console.error('Error:', errorMessage)
    return { ok: false, data: false, error: errorMessage }
  }
}
