'use server'

import { sql } from '../db'
import { WriteLoggingProps } from '../structures'

export async function write_logging({
  lg_functionname,
  lg_msg,
  lg_severity = 'E',
  lg_level = 1,
  lg_caller = ''
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
    //  Query statement
    //
    const sqlQueryStatement = `
    INSERT INTO xlg_logging (
      lg_datetime,
      lg_msg,
      lg_functionname,
      lg_caller,
      lg_severity,
      lg_level
      )
    VALUES ($1,$2,$3,$4,$5,$6)
  `
    const queryValues = [lg_datetime, lg_msgTrim, lg_functionname, lg_caller, lg_severity, lg_level]
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
