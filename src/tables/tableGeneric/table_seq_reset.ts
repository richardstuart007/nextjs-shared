'use server'

import { sql } from '../db'
import { write_Logging } from './write_logging'
import { table_seqGet } from './table_seq_get'

interface Props {
  tableName: string
  caller?: string
}
//
// Function to update the sequence for a given table and column
//
export async function table_seqReset({ tableName, caller = '' }: Props): Promise<boolean> {
  const functionName = 'table_seqReset'

  try {
    //
    // Initialisation
    //
    const db = await sql()
    //
    // Step 1: Get the sequence/column/maxvalue for the table
    //
    const returnValues = await table_seqGet({ tableName: tableName, caller: functionName })
    if (!returnValues.ok) return false
    //
    // Step 2: Update the sequence value based on the MAX value of the column
    //
    const sequenceName = returnValues.sequenceName
    const columnName = returnValues.columnName
    const maxValue = returnValues.maxValue

    const sqlQuery = `SELECT setval($1, $2)`
    const values = [sequenceName, maxValue]
    await db.query({ caller: '', query: sqlQuery, params: values, functionName: functionName })
    //
    //  Completion message
    //
    const message = `Sequence ${sequenceName} for ${tableName}.${columnName} updated with maxValue ${maxValue} `
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: message,
      lg_severity: 'I'
    })
    return true
    //
    // Errors
    //
  } catch (error) {
    const errorMessage = `Table(${tableName}) FAILED`
    console.error(`${functionName}: ${errorMessage}`, error)
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
    })
    return false
  }
}
