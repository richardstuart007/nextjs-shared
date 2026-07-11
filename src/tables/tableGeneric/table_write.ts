'use server'

import { sql } from '../db'
import { write_logging } from './write_logging'
import { cache_clearTable } from '../cache/userCache_store'
import { WriteColumnValuePair } from '../structures'
//
// Define the props interface for the insert function
//
interface Props {
  caller: string
  table: string
  columnValuePairs: WriteColumnValuePair[]
  conflictColumn?: string
  noLog?: boolean
  skipCache?: boolean
  level?: number
  severity?: string
}

export async function table_write({
  table,
  columnValuePairs,
  conflictColumn,
  caller,
  noLog = false,
  skipCache = false,
  level = 1,
  severity = 'I'
}: Props): Promise<any[]> {
  const functionName = 'table_write'
  //
  // Prepare the columns and parameterized placeholders for the INSERT statement
  //
  const columns = columnValuePairs.map(({ column }) => column).join(', ')
  const values = columnValuePairs.map(({ value }) => value)
  const placeholders = columnValuePairs.map((_, index) => `$${index + 1}`).join(', ')
  //
  // Build the SQL query — append ON CONFLICT DO NOTHING when conflictColumn is provided
  //
  const conflict = conflictColumn ? ` ON CONFLICT (${conflictColumn}) DO NOTHING` : ''
  const sqlQuery = `INSERT INTO ${table} (${columns}) VALUES (${placeholders})${conflict} RETURNING *`
  //
  // Run the query
  //
  try {
    //
    //  Execute the sql
    //
    const db = await sql()
    const data = await db.query({
      query: sqlQuery,
      params: values,
      functionName: functionName,
      caller: caller,
      noLog,
      table,
      level,
      isupdate: true,
      severity
    })
    //
    // Clear cache entries for this table
    //
    if (!skipCache) cache_clearTable(table, functionName)
    //
    // Trace log — always fires, gating lives inside write_logging
    //
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: `Table(${table}) INSERT succeeded, ${data.rows.length} row(s)`,
      lg_severity: severity,
      lg_table: table,
      lg_level: level,
      lg_isupdate: true
    })
    //
    // Return the inserted rows
    //
    return data.rows
    //
    //  Errors
    //
  } catch (error) {
    const errorMessage = `Table(${table}) SQL(${sqlQuery}) FAILED`
    console.error(`${functionName}: ${errorMessage}`, error)
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E',
      lg_table: table,
      lg_level: level
    })
    throw new Error(`${functionName}, ${errorMessage}`)
  }
}
