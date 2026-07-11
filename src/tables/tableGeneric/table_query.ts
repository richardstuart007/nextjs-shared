'use server'

import { sql } from '../db'
import { write_logging } from './write_logging'

//----------------------------------------------------------------------------------
//  Execute a raw SQL query through the shared db connection with logging.
//  Use this when the query is too complex for table_fetch (e.g. multi-table JOINs
//  with CASE WHEN expressions, subqueries, etc.).
//----------------------------------------------------------------------------------

export type table_query_Props = {
  caller: string
  query: string
  params?: (string | number | null | boolean)[]
  noLog?: boolean
  table?: string
  level?: number
  isupdate?: boolean
  severity?: string
}

const functionName = 'table_query'

export async function table_query({
  caller,
  query,
  params = [],
  noLog = false,
  table = '',
  level = 1,
  isupdate = false,
  severity = 'I'
}: table_query_Props): Promise<any[]> {
  try {
    //
    // Execute the query
    //
    const db = await sql()
    const data = await db.query({
      query,
      params,
      functionName: functionName,
      caller: caller,
      noLog,
      table,
      level,
      isupdate,
      severity
    })
    //
    // Return rows
    //
    return data.rows.length > 0 ? data.rows : []
    //
    // Errors
    //
  } catch (error) {
    const errorMessage = `SQL FAILED: ${(error as Error).message}`
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E',
      lg_table: table,
      lg_level: level,
      lg_isupdate: isupdate
    })
    return []
  }
}
