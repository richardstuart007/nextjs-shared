'use server'
import { sql } from '../db'
import { write_logging } from './write_logging'
import { buildSql_Readable } from './buildSql_Readable'
import { TableResult } from '../structures'

export async function table_truncate(
  table: string,
  caller = '',
  restartIdentity = true,
  level: number = 1,
  severity: string = 'I'
): Promise<TableResult<boolean>> {
  const functionName = 'table_truncate'
  const sqlQuery = `TRUNCATE Table ${table}${restartIdentity ? ' RESTART IDENTITY' : ''}`
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
      lg_msg: `Table(${table}) TRUNCATE succeeded`,
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
    const errorMessage = `Table(${table}) TRUNCATE FAILED`
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
