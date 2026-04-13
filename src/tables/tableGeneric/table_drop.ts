'use server'
import { sql } from '../db'
import { write_Logging } from './write_logging'

export async function table_drop(table: string, caller: string = ''): Promise<boolean> {
  const functionName = 'table_drop'
  try {
    //
    // Base DROP query
    //
    const sqlQuery = `DROP Table ${table}`
    //
    // Run query
    //
    const db = await sql()
    await db.query({ caller: caller, query: sqlQuery, functionName: functionName })
    return true
  } catch (error) {
    //
    // Logging
    //
    const errorMessage = `Table(${table}) DROP FAILED`
    console.error(`${functionName}: ${errorMessage}`, error)
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
    })
    throw new Error(`${functionName}, ${errorMessage}`)
  }
}
