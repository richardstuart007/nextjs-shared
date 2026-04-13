'use server'

import { sql } from '../db'
import { write_Logging } from './write_logging'

interface Props {
  table_from: string
  table_to: string
  caller?: string
}
const functionName = 'table_copy_data'
export async function table_copy_data({
  table_from,
  table_to,
  caller = ''
}: Props): Promise<boolean> {
  try {
    //
    // Define the connection
    //
    const db = await sql()
    //
    // Get the From Columns and To Columns
    //
    const columns_F = await getColumns(db, table_from)
    const columns_T = await getColumns(db, table_to)
    //
    // Find the common column names between both arrays
    //
    const commonColumns = columns_F.filter(columnName => columns_T.includes(columnName))
    //
    // Construct the INSERT INTO statement dynamically using the common columns
    //
    const columnsList = commonColumns.join(', ')
    const valuesList = commonColumns.join(', ')
    //
    // Construct the SQL
    //
    const sqlQuery = `
        INSERT INTO ${table_to}
          (${columnsList})
        SELECT ${valuesList}
          FROM ${table_from}
      `
    //
    // Execute the query
    //
    await db.query({ caller: '', query: sqlQuery, functionName: functionName })
    //
    // All ok
    //
    return true
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
//----------------------------------------------------------------------------------------------
//  Get columns
//----------------------------------------------------------------------------------------------
async function getColumns(db: any, table: string): Promise<string[]> {
  //
  // Construct the SQL
  //
  const sqlQuery = `
        SELECT column_name
        FROM information_schema.columns
        where table_name = '${table}'
    `
  //
  // Execute the query
  //
  const data = await db.query({ caller: '', query: sqlQuery, functionName: functionName })
  //
  //  Extract and return the columns
  //
  interface ColumnRow {
    column_name: string
  }
  const rows: ColumnRow[] = data.rows
  const columnNames: string[] = rows.map(row => row.column_name)
  return columnNames
}
