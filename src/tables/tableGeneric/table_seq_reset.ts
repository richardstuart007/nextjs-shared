'use server'

import { sql } from '../db'
import { write_logging } from './write_logging'
import { table_seqGet } from './table_seq_get'

interface Props {
  tableName: string
  caller?: string
  level?: number
  severity?: string
}
//
// Function to update the sequence for a given table and column
//
export async function table_seqReset({
  tableName,
  caller = '',
  level = 1,
  severity = 'I'
}: Props): Promise<boolean> {
  const functionName = 'table_seqReset'

  try {
    //
    // Initialisation
    //
    const db = await sql()
    //
    // Step 1: Get the sequence/column/maxvalue for the table
    //
    const returnValues = await table_seqGet({ tableName: tableName, caller: functionName, level, severity })
    if (!returnValues.ok) return false
    //
    // Step 2: Update the sequence value based on the MAX value of the column
    //
    const sequenceName = returnValues.sequenceName
    const columnName = returnValues.columnName
    const maxValue = returnValues.maxValue

    const sqlQuery = `SELECT setval($1, GREATEST($2::bigint, 1), $2::bigint > 0)`
    const values = [sequenceName, maxValue]
    await db.query({
      caller: caller,
      query: sqlQuery,
      params: values,
      functionName: functionName,
      table: tableName,
      level,
      isupdate: true,
      severity
    })
    //
    //  Completion message
    //
    const message = `Sequence ${sequenceName} for ${tableName}.${columnName} updated with maxValue ${maxValue} `
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: message,
      lg_severity: severity,
      lg_table: tableName,
      lg_level: level,
      lg_isupdate: true
    })
    return true
    //
    // Errors
    //
  } catch (error) {
    const errorMessage = `Table(${tableName}) FAILED`
    console.error(`${functionName}: ${errorMessage}`, error)
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E',
      lg_table: tableName,
      lg_level: level
    })
    return false
  }
}
