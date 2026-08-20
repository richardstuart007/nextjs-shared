'use server'

import { sql } from '../db'
import { WriteLoggingProps } from '../structures'

export async function write_logging({
  lg_functionname,
  lg_table = '',
  lg_msg,
  lg_severity = 'E',
  lg_level = 1,
  lg_isupdate = false,
  lg_caller = '',
  lg_sql_raw,
  lg_sql_params,
  lg_sql_readable
}: WriteLoggingProps): Promise<boolean> {
  const functionName = 'write_logging'
  try {
    //
    // Skip 'I' or 'D' severity when globally suppressed
    //
    if (
      (lg_severity === 'I' && process.env.NEXT_PUBLIC_APPENV_LOG_I === 'false') ||
      (lg_severity === 'D' && process.env.NEXT_PUBLIC_APPENV_LOG_D === 'false')
    ) {
      return false
    }
    //
    // No database — fall back to console
    //
    if (!process.env.POSTGRES_URL) {
      console.log(`[${lg_severity}] ${lg_functionname} | ${lg_msg}`)
      return false
    }
    //
    //  Get datetime in UTC
    //
    const currentDate = new Date()
    const lg_datetime = currentDate.toISOString()
    //
    //  Trim message
    //
    const lg_msgTrim = lg_msg.trim()
    //
    //  Params — map undefined to an object marker so it stays distinguishable from a real
    //  null once serialized (an object can never collide with a real param value, since
    //  every table_ function's params are string | number | boolean | null)
    //
    const lg_sql_paramsJson = lg_sql_params
      ? JSON.stringify(lg_sql_params.map(p => (p === undefined ? { __undefined__: true } : p)))
      : null
    //
    //  Query statement
    //
    const sqlQueryStatement = `
    INSERT INTO xlg_logging (
      lg_severity,
      lg_level,
      lg_isupdate,
      lg_caller,
      lg_functionname,
      lg_table,
      lg_msg,
      lg_datetime,
      lg_sql_raw,
      lg_sql_params,
      lg_sql_readable
      )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
  `
    const queryValues = [
      lg_severity,
      lg_level,
      lg_isupdate,
      lg_caller,
      lg_functionname,
      lg_table,
      lg_msgTrim,
      lg_datetime,
      lg_sql_raw ?? null,
      lg_sql_paramsJson,
      lg_sql_readable ?? null
    ]
    //
    // Remove redundant spaces
    //
    const sqlQuery = sqlQueryStatement.replace(/\s+/g, ' ').trim()
    //
    //  Execute the sql
    //
    const db = await sql()
    await db.query({
      caller: lg_caller,
      query: sqlQuery,
      params: queryValues,
      functionName: functionName
    })
    //
    //  Return inserted log
    //
    return true
    //
    //  Errors
    //
  } catch (error) {
    console.error('write_logging failed — does the xlg_logging table exist? Run src/schema.sql.', (error as Error).message)
    console.log(`[${lg_severity}] ${lg_functionname} | ${lg_msg}`)
    return false
  }
}
