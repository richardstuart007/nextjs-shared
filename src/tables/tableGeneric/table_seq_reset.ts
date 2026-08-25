'use server'

//==============================================================================================
//  1) DESCRIPTION
//    table_seqReset — resets tableName's identity sequence to its column's current MAX value
//    (via table_seqGet), so future inserts don't collide with existing rows
//
//    Parameters:
//      tableName       — table whose identity sequence to reset
//      caller          — logging caller identity
//      level, severity — logging level/severity; default 1/'I'
//
//    Returns:
//      a TableResult<boolean> — true on success, or an error message
//==============================================================================================

import { sql } from '../db'
import { write_logging } from './write_logging'
import { table_seqGet } from './table_seq_get'
import { buildSql_Readable } from './buildSql_Readable'
import { TableResult } from '../structures'

interface Props {
  tableName: string
  caller?: string
  level?: number
  severity?: string
}

export async function table_seqReset({
  tableName,
  caller = '',
  level = 1,
  severity = 'I'
}: Props): Promise<TableResult<boolean>> {
  const functionName = 'table_seqReset'
  let sqlQuery = ''
  let values: any[] = []

  try {
    //
    // Initialisation
    //
    const db = await sql()
    //
    // Step 1: Get the sequence/column/maxvalue for the table
    //
    const seqResult = await table_seqGet({ tableName: tableName, caller: functionName, level, severity })
    if (!seqResult.ok) return { ok: false, data: false, error: seqResult.error }
    //
    // Step 2: Update the sequence value based on the MAX value of the column
    //
    const { sequenceName, columnName, maxValue } = seqResult.data

    sqlQuery = `SELECT setval($1, GREATEST($2::bigint, 1), $2::bigint > 0)`
    values = [sequenceName, maxValue]
    await db.query({
      caller: caller,
      query: sqlQuery,
      params: values,
      functionName: functionName,
      table: tableName,
      level,
      isupdate: true,
      severity
    })
    //
    //  Completion message
    //
    const message = `Sequence ${sequenceName} for ${tableName}.${columnName} updated with maxValue ${maxValue} `
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: message,
      lg_severity: severity,
      lg_table: tableName,
      lg_level: level,
      lg_isupdate: true,
      lg_sql_raw: sqlQuery,
      lg_sql_params: values,
      lg_sql_readable: buildSql_Readable(sqlQuery, values)
    })
    return { ok: true, data: true, error: null }
    //
    // Errors
    //
  } catch (error) {
    const errorMessage = `Table(${tableName}) FAILED`
    console.error(`${functionName}: ${errorMessage}`, error)
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E',
      lg_table: tableName,
      lg_level: level,
      lg_sql_raw: sqlQuery,
      lg_sql_params: values,
      lg_sql_readable: buildSql_Readable(sqlQuery, values)
    })
    return { ok: false, data: false, error: errorMessage }
  }
}
