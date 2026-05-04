'use server'

import { sql } from '../db'
//---------------------------------------------------------------------
//  Write Logging
//---------------------------------------------------------------------
type Props = {
  lg_functionname: string
  lg_msg: string
  lg_severity?: string
  lg_caller: string
}

export async function write_Logging({
  lg_functionname,
  lg_msg,
  lg_severity = 'E',
  lg_caller = ''
}: Props): Promise<boolean> {
  const functionName = 'write_Logging'
  try {
    //
    // Skip 'I' severity when globally suppressed
    //
    if (lg_severity === 'I' && process.env.NEXT_PUBLIC_APPENV_LOG_I === 'false') {
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
    INSERT INTO tlg_logging (
      lg_datetime,
      lg_msg,
      lg_functionname,
      lg_caller,
      lg_severity
      )
    VALUES ($1,$2,$3,$4,$5)
  `
    const queryValues = [lg_datetime, lg_msgTrim, lg_functionname, lg_caller, lg_severity]
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
    console.error('ErrorLogging Error')
    return false
  }
}
