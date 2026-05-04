'use server'

import { sql } from '../db'
import { write_Logging } from './write_logging'
import { cache_clearTable } from '../cache/userCache_store'
//
// Define the column-value pair interface
//
interface ColumnValuePair {
  column: string
  value: string | number | boolean | string[] | number[]
}
//
// Define the props interface for the upsert function
//
interface Props {
  caller: string
  table: string
  columnValuePairs: ColumnValuePair[]
  conflictColumns: string[]
  noLog?: boolean
}

export async function table_upsert({
  table,
  columnValuePairs,
  conflictColumns,
  caller,
  noLog = false
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
  // Update all columns that are not part of the conflict key
  //
  const updateClause = columnValuePairs
    .filter(({ column }) => !conflictColumns.includes(column))
    .map(({ column }, index) => `${column} = EXCLUDED.${column}`)
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
      noLog
    })
    //
    // Clear cache entries for this table
    //
    cache_clearTable(table, functionName)
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
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
    })
    return []
  }
}
