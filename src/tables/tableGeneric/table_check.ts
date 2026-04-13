'use server'

import { sql } from '../db'
import { write_Logging } from './write_logging'
import { TableColumnValuePairs } from '../structures'

export async function table_check(
  tableColumnValuePairs: TableColumnValuePairs[],
  caller: string = ''
): Promise<{ found: boolean; message: string }> {
  const functionName = 'table_check'

  try {
    //
    // Loop through each table-column-value pair
    //
    for (const { table, whereColumnValuePairs } of tableColumnValuePairs) {
      //
      // Create WHERE clause with parameterized queries
      //
      const whereClause = whereColumnValuePairs
        .map(({ column }, index) => `${column} = $${index + 1}`)
        .join(' AND ')
      //
      // Gather values for the WHERE clause
      //
      const values = whereColumnValuePairs.map(({ value }) => value)
      //
      // Construct the SQL SELECT query
      //
      const sqlQuery = `
      SELECT 1
      FROM ${table}
      WHERE ${whereClause}
      LIMIT 1`
      //
      // Execute the query
      //
      const db = await sql()
      const data = await db.query({
        caller: caller,
        query: sqlQuery,
        params: values,
        functionName: functionName
      })
      //
      // Check if rows exist
      //
      if (data.rows.length > 0) {
        const errorMessage = `Keys exist in ${table} with conditions: ${JSON.stringify(whereColumnValuePairs)}`
        write_Logging({
          lg_caller: caller,
          lg_functionname: functionName,
          lg_msg: errorMessage,
          lg_severity: 'I'
        })
        return { found: true, message: errorMessage }
      }
    }
    //
    // If no matches were found
    //
    return { found: false, message: '' }
    //
    //  Errors
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
    throw new Error(`${functionName}: Failed`)
  }
}
