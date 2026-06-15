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
  noLog?: boolean
}

export async function table_write({ table, columnValuePairs, caller, noLog = false }: Props): Promise<any[]> {
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
      caller: caller,
      noLog
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
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
    })
    throw new Error(`${functionName}, ${errorMessage}`)
  }
}
