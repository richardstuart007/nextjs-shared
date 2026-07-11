'use server'

import { sql } from '../db'
import { write_logging } from './write_logging'
import { cache_clearTable } from '../cache/userCache_store'
import { WriteColumnValuePair } from '../structures'
//
// Define the props interface for the upsert function
//
interface Props {
  caller: string
  table: string
  columnValuePairs: WriteColumnValuePair[]
  conflictColumns: string[]
  updateColumns?: string[]   // when set, only these non-conflict columns are updated on conflict
  noLog?: boolean
  skipCache?: boolean
  level?: number
  severity?: string
}

export async function table_upsert({
  table,
  columnValuePairs,
  conflictColumns,
  updateColumns,
  caller,
  noLog = false,
  skipCache = false,
  level = 1,
  severity = 'I'
}: Props): Promise<any[]> {
  const functionName = 'table_upsert'
  //
  // Prepare columns, placeholders, and values
  //
  const columns = columnValuePairs.map(({ column }) => column).join(', ')
  const values = columnValuePairs.map(({ value }) => value)
  const placeholders = columnValuePairs.map((_, index) => `$${index + 1}`).join(', ')
  //
  // Build the ON CONFLICT ... DO UPDATE SET clause
  // Exclude conflict columns; also exclude any not in updateColumns (when specified)
  //
  const updateClause = columnValuePairs
    .filter(({ column }) => {
      if (conflictColumns.includes(column)) return false
      if (updateColumns && !updateColumns.includes(column)) return false
      return true
    })
    .map(({ column }) => `${column} = EXCLUDED.${column}`)
    .join(', ')
  //
  // Build the SQL query
  //
  const conflictTarget = conflictColumns.join(', ')
  const sqlQuery =
    updateClause.length > 0
      ? `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) ON CONFLICT (${conflictTarget}) DO UPDATE SET ${updateClause} RETURNING *`
      : `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) ON CONFLICT (${conflictTarget}) DO NOTHING RETURNING *`
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
      lg_msg: `Table(${table}) UPSERT succeeded, ${data.rows.length} row(s)`,
      lg_severity: severity,
      lg_table: table,
      lg_level: level,
      lg_isupdate: true
    })
    //
    // Return the upserted rows
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
