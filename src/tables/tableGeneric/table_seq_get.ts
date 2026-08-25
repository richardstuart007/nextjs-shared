'use server'

//==============================================================================================
//  1) DESCRIPTION
//    table_seqGet — finds tableName's identity column/sequence and that column's current MAX
//    value
//
//    Parameters:
//      tableName       — table to inspect
//      caller          — logging caller identity
//      level, severity — logging level/severity; default 1/'I'
//
//    Returns:
//      a TableResult<{columnName, sequenceName, maxValue}> — empty strings/0 and an error
//      message if no sequence or no max value was found
//==============================================================================================

import { sql } from '../db'
import { write_logging } from './write_logging'
import { buildSql_Readable } from './buildSql_Readable'
import { TableResult } from '../structures'
//
//  Input values
//
interface Props {
  tableName: string
  caller?: string
  level?: number
  severity?: string
}
//
//  Return values
//
interface ReturnValues {
  columnName: string
  sequenceName: string
  maxValue: number
}

export async function table_seqGet(Props: Props): Promise<TableResult<ReturnValues>> {
  const functionName = 'table_seqGet'
  const { tableName, caller = '', level = 1, severity = 'I' } = Props
  //
  // Initialisation
  //
  const emptyValues: ReturnValues = {
    columnName: '',
    sequenceName: '',
    maxValue: 0
  }
  let lastSql = ''
  let lastValues: any[] = []

  try {
    const db = await sql()
    //
    // Build the query
    //
    const sqlQuery = `
      SELECT
          a.attname AS column_name,
          s.relname AS sequence_name
      FROM
          pg_class s,
          pg_depend d,
          pg_class t,
          pg_attribute a
      WHERE
          s.relkind = 'S'
          AND s.oid = d.objid
          AND d.refobjid = t.oid
          AND d.refobjid = a.attrelid
          AND d.refobjsubid = a.attnum
          AND t.relname = $1
    `
    const values = [tableName]
    lastSql = sqlQuery
    lastValues = values
    const sequenceResult = await db.query({
      caller: caller,
      query: sqlQuery,
      params: values,
      functionName: functionName,
      table: tableName,
      level,
      severity
    })
    //
    // Extract the sequence name
    //
    const row = sequenceResult.rows[0]
    const columnName = row?.column_name || ''
    const sequenceName = row?.sequence_name || ''
    //
    //  No sequenceName returned
    //
    if (!sequenceName) {
      const message = `No sequence found for ${tableName}`
      write_logging({
        lg_caller: caller,
        lg_functionname: functionName,
        lg_msg: message,
        lg_severity: 'E',
        lg_table: tableName,
        lg_level: level,
        lg_sql_raw: sqlQuery,
        lg_sql_params: values,
        lg_sql_readable: buildSql_Readable(sqlQuery, values)
      })
      return { ok: false, data: emptyValues, error: message }
    }
    //
    //  Sequence found - message
    //
    const message = `Sequence found: ${sequenceName} for ${tableName}.${columnName}`
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: message,
      lg_severity: severity,
      lg_table: tableName,
      lg_level: level,
      lg_sql_raw: sqlQuery,
      lg_sql_params: values,
      lg_sql_readable: buildSql_Readable(sqlQuery, values)
    })
    //
    //  Get the maxValue
    //
    const sqlQueryMax = `SELECT COALESCE((SELECT MAX(${columnName}) FROM ${tableName}), 0)`
    lastSql = sqlQueryMax
    lastValues = []
    const maxValueResult = await db.query({
      caller: caller,
      query: sqlQueryMax,
      functionName: functionName,
      table: tableName,
      level,
      severity
    })
    const maxValue = maxValueResult.rows[0].coalesce
    //
    //  No maxValue returned
    //
    if (maxValue === null || maxValue === undefined) {
      const message = `No maxValue found for Table ${tableName} column ${columnName}`
      write_logging({
        lg_caller: caller,
        lg_functionname: functionName,
        lg_msg: message,
        lg_severity: 'E',
        lg_table: tableName,
        lg_level: level,
        lg_sql_raw: sqlQueryMax,
        lg_sql_params: [],
        lg_sql_readable: buildSql_Readable(sqlQueryMax, [])
      })
      return { ok: false, data: emptyValues, error: message }
    }
    //
    //  maxValue found - message
    //
    const message1 = `maxValue found: ${sequenceName} for ${tableName}.${columnName} with maxValue(${maxValue})`
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: message1,
      lg_severity: severity,
      lg_table: tableName,
      lg_level: level,
      lg_sql_raw: sqlQueryMax,
      lg_sql_params: [],
      lg_sql_readable: buildSql_Readable(sqlQueryMax, [])
    })
    //
    //  Return the sequence
    //
    return { ok: true, data: { columnName, sequenceName, maxValue }, error: null }
    //
    //  Errors
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
      lg_level: level,
      lg_sql_raw: lastSql,
      lg_sql_params: lastValues,
      lg_sql_readable: buildSql_Readable(lastSql, lastValues)
    })
    return { ok: false, data: emptyValues, error: errorMessage }
  }
}
