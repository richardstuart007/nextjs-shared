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
// Define the props interface for the insert function
//
interface Props {
  caller: string
  table: string
  columnValuePairs: ColumnValuePair[]
}

export async function table_write({ table, columnValuePairs, caller }: Props): Promise<any[]> {
  const functionName = 'table_write'
  //
  // Prepare the columns and parameterized placeholders for the INSERT statement
  //
  const columns = columnValuePairs.map(({ column }) => column).join(', ')
  const values = columnValuePairs.map(({ value }) => value)
  const placeholders = columnValuePairs.map((_, index) => `$${index + 1}`).join(', ')
  //
  // Build the SQL query
  //
  const sqlQuery = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`
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
      caller: caller
    })
    //
    // Clear cache entries for this table
    //
    cache_clearTable(table, functionName)
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
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
    })
    // throw new Error(`${functionName}, ${errorMessage}`)
    return []
  }
}
