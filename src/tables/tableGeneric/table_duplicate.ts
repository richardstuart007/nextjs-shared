'use server'

import { sql } from '../db'
import { write_logging } from './write_logging'

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
}: Props): Promise<boolean> {
  const functionName = 'table_duplicate'

  try {
    //
    // Create the backup table
    //
    const sqlQuery = `
        CREATE TABLE ${table_to}
        (LIKE ${table_from} INCLUDING ALL)`
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
      lg_isupdate: true
    })
    //
    // All ok
    //
    return true
    //
    // Errors
    //
  } catch (error) {
    const errorMessage = (error as Error).message
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E',
      lg_table: table_to,
      lg_level: level
    })
    console.error('Error:', errorMessage)
    throw new Error(`${functionName}: Failed`)
  }
}
