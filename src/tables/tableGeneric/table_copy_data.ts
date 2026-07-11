'use server'

import { sql } from '../db'
import { write_logging } from './write_logging'

interface Props {
  table_from: string
  table_to: string
  caller?: string
  level?: number
  severity?: string
}
const functionName = 'table_copy_data'
export async function table_copy_data({
  table_from,
  table_to,
  caller = '',
  level = 1,
  severity = 'I'
}: Props): Promise<boolean> {
  try {
    //
    // Define the connection
    //
    const db = await sql()
    //
    // Get the From Columns and To Columns
    //
    const columns_F = await getColumns(db, table_from, level, severity)
    const columns_T = await getColumns(db, table_to, level, severity)
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
    await db.query({
      caller: caller,
      query: sqlQuery,
      functionName: functionName,
      table: table_to,
      level,
      isupdate: true,
      severity
    })
    //
    //  Reset sequences for any identity columns in the destination table
    //
    const identityCols = await db.query({
      caller: caller,
      query: `SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND is_identity = 'YES'`,
      params: [table_to],
      functionName: functionName,
      table: table_to,
      level,
      severity
    })
    for (const row of identityCols.rows as { column_name: string }[]) {
      const col = row.column_name
      await db.query({
        caller: caller,
        query: `SELECT setval(pg_get_serial_sequence('${table_to}', '${col}'), COALESCE((SELECT MAX(${col}) FROM ${table_to}), 1))`,
        params: [],
        functionName: functionName,
        table: table_to,
        level,
        isupdate: true,
        severity
      })
    }
    //
    // Trace log — always fires, gating lives inside write_logging
    //
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: `Table(${table_to}) copy from ${table_from} succeeded`,
      lg_severity: severity,
      lg_table: table_to,
      lg_level: level,
      lg_isupdate: true
    })
    //
    // All ok
    //
    return true
    //
    //  Errors
    //
  } catch (error) {
    const errorMessage = (error as Error).message
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E',
      lg_table: table_to,
      lg_level: level
    })
    console.error('Error:', errorMessage)
    throw new Error(`${functionName}: Failed`)
  }
}
//----------------------------------------------------------------------------------------------
//  Get columns
//----------------------------------------------------------------------------------------------
async function getColumns(
  db: any,
  table: string,
  level: number = 1,
  severity: string = 'I'
): Promise<string[]> {
  //
  // Construct the SQL
  //
  const sqlQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = $1
    `
  //
  // Execute the query
  //
  const data = await db.query({
    caller: '',
    query: sqlQuery,
    params: [table],
    functionName: functionName,
    table,
    level,
    severity
  })
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
