'use server'

//==============================================================================================
//  1) DESCRIPTION
//    table_delete — DELETEs rows matching whereColumnValuePairs, clears the table's cache
//    entries, and logs the outcome
//
//    Parameters:
//      table                 — table name
//      whereColumnValuePairs — WHERE conditions (column/value/operator triples; operator
//                              defaults to '='); IN/NOT IN expects an array value;
//                              omitted/empty deletes every row
//      returning             — adds RETURNING * and returns the deleted rows; defaults to
//                              false
//      caller                — logging caller identity
//      noLog                 — suppresses the query-level trace log; defaults to false
//      skipCache             — skips clearing this table's cache entries; defaults to false
//      level, severity       — logging level/severity; default 1/'I'
//
//    Returns:
//      a TableResult<any[]> — the deleted rows if returning, else [], or an error message
//==============================================================================================

import { sql } from '../db'
import { write_logging } from './write_logging'
import { ColumnValuePair, TableResult } from '../structures'
import { cache_clearTable } from '../cache/userCache_store'
import { buildSql_Readable } from './buildSql_Readable'
//
// Props
//
interface Props {
  table: string
  whereColumnValuePairs?: ColumnValuePair[]
  returning?: boolean
  caller?: string
  noLog?: boolean
  skipCache?: boolean
  level?: number
  severity?: string
}

export async function table_delete({
  table,
  whereColumnValuePairs = [],
  returning = false,
  caller = '',
  noLog = false,
  skipCache = false,
  level = 1,
  severity = 'I'
}: Props): Promise<TableResult<any[]>> {
  const functionName = 'table_delete'
  //
  // Construct the SQL DELETE query
  //
  let sqlQueryStatement = `DELETE FROM ${table}`
  let values: (string | number)[] = []
  try {
    //
    // WHERE clause
    //
    let paramIndex = 0 // Added to track parameter positions
    if (whereColumnValuePairs.length > 0) {
      const conditions = whereColumnValuePairs.map(({ column, value, operator = '=' }) => {
        // Changed destructuring
        if (operator === 'IN' || operator === 'NOT IN') {
          // Added multi-value handling
          if (!Array.isArray(value)) {
            throw new Error(`Value for ${operator} must be an array`)
          }
          const placeholders = value.map(() => `$${++paramIndex}`).join(', ')
          values.push(...value)
          return `${column} ${operator} (${placeholders})`
        }
        values.push(value as string | number) // Changed from separate mapping
        return `${column} ${operator} $${++paramIndex}` // Changed to use operator and paramIndex
      })
      const whereClause = conditions.join(' AND ')
      sqlQueryStatement += ` WHERE ${whereClause}`
    }
    //
    // RETURNING clause
    //
    if (returning) sqlQueryStatement += ` RETURNING *`
    //
    // Execute the query
    //
    const db = await sql()
    const data = await db.query({
      caller: caller,
      query: sqlQueryStatement,
      params: values,
      functionName: functionName,
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
      lg_msg: returning
        ? `Table(${table}) DELETE succeeded, ${data.rows.length} row(s)`
        : `Table(${table}) DELETE succeeded`,
      lg_severity: severity,
      lg_table: table,
      lg_level: level,
      lg_isupdate: true,
      lg_sql_raw: sqlQueryStatement,
      lg_sql_params: values,
      lg_sql_readable: buildSql_Readable(sqlQueryStatement, values)
    })
    //
    // If RETURNING * is specified, return the deleted rows
    //
    return { ok: true, data: returning ? data.rows : [], error: null }
  } catch (error) {
    // Logging
    const errorMessage = `Table(${table}) DELETE FAILED`
    console.error(`${functionName}: ${errorMessage}`, error)
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E',
      lg_table: table,
      lg_level: level,
      lg_sql_raw: sqlQueryStatement,
      lg_sql_params: values,
      lg_sql_readable: buildSql_Readable(sqlQueryStatement, values)
    })
    return { ok: false, data: [], error: errorMessage }
  }
}
