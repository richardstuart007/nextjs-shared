'use server'

import { sql } from '../db'
import { write_Logging } from './write_logging'

interface Props {
  table_from: string
  table_to: string
  caller?: string
}

export async function table_duplicate({
  table_from,
  table_to,
  caller = ''
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
    await db.query({ caller: caller, query: sqlQuery, functionName: functionName })
    //
    // All ok
    //
    return true
    //
    // Errors
    //
  } catch (error) {
    const errorMessage = (error as Error).message
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
    })
    console.error('Error:', errorMessage)
    return false
  }
}
