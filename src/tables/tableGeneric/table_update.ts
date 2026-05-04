'use server'

import { sql } from '../db'
import { write_Logging } from './write_logging'
import { cache_clearTable } from '../cache/userCache_store'
//
// Column-value pairs
//
interface ColumnValuePair {
  column: string
  value: string | number | boolean | string[] | number[]
}
//
// Props
//
interface Props {
  caller: string
  table: string
  columnValuePairs: ColumnValuePair[]
  whereColumnValuePairs: ColumnValuePair[]
  noLog?: boolean
}

export async function table_update({
  caller,
  table,
  columnValuePairs,
  whereColumnValuePairs,
  noLog = false
}: Props): Promise<any[]> {
  const functionName = 'table_update'
  //
  // Create the SET clause for the update statement
  //
  const setClause = columnValuePairs
    .map(({ column }, index) => `${column} = $${index + 1}`)
    .join(', ')
  //
  // Create the WHERE clause from the key-value pairs
  //
  const whereClause = whereColumnValuePairs
    .map(({ column }, index) => `${column} = $${index + 1 + columnValuePairs.length}`)
    .join(' AND ')
  //
  // Combine values for SET and WHERE clauses
  //
  const values = [
    ...columnValuePairs.map(({ value }) => value),
    ...whereColumnValuePairs.map(({ value }) => value)
  ]
  //
  // Construct the SQL UPDATE query
  //
  try {
    //
    // Build the SQL query
    //
    const sqlQuery = `UPDATE ${table} SET ${setClause} WHERE ${whereClause} RETURNING *`
    //
    //  Execute the sql
    //
    const db = await sql()
    const data = await db.query({
      caller: caller,
      query: sqlQuery,
      params: values,
      functionName: functionName,
      noLog
    })
    //
    // Clear cache entries for this table
    //
    cache_clearTable(table, functionName)
    //
    // Return rows updated
    //
    return data.rows
    //
    //  Errors
    //
  } catch (error) {
    const errorMessage = `Table(${table}) WHERE(${whereClause}) FAILED`
    console.error(`${functionName}: ${errorMessage}`, error)
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
    })
    throw new Error(`${functionName}: ${errorMessage}`)
  }
}
