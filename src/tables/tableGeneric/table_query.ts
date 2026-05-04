'use server'

import { sql } from '../db'
import { write_Logging } from './write_logging'
import { buildSql_Readable } from './buildSql_Readable'

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
}

const functionName = 'table_query'

export async function table_query({
  caller,
  query,
  params = [],
  noLog = false
}: table_query_Props): Promise<any[]> {
  try {
    //
    // Log the SQL
    //
    if (!noLog) {
      const readableSql = buildSql_Readable(query, params as (string | number)[])
      write_Logging({
        lg_caller: caller,
        lg_functionname: functionName,
        lg_msg: `STRING_SQL | ${readableSql}`,
        lg_severity: 'I'
      })
    }
    //
    // Execute the query
    //
    const db = await sql()
    const data = await db.query({
      query,
      params,
      functionName: functionName,
      caller: caller,
      noLog
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
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
    })
    return []
  }
}
