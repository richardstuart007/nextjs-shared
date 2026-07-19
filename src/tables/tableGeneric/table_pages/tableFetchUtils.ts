'use server'

import { sql } from '../../db'
import { write_logging } from '../write_logging'
import { ITEMS_PER_PAGE } from './page_constants'
import { buildSql_Readable } from '../buildSql_Readable'
import { buildSqlQuery, applyFetchSuffix, buildCountQuery } from './buildSqlQuery'
import type { JoinParams, Filter } from '../../structures'

//---------------------------------------------------------------------
// Shared private function – builds and executes the query
//---------------------------------------------------------------------
export async function table_fetch_pages_filtered({
  table,
  joins = [],
  filters = [],
  orderBy,
  limit,
  offset,
  distinctColumns = [],
  caller,
  level = 1,
  severity = 'I'
}: {
  table: string
  joins?: JoinParams[]
  filters?: Filter[]
  orderBy?: string
  limit?: number
  offset?: number
  distinctColumns?: string[]
  caller: string
  level?: number
  severity?: string
}): Promise<any[]> {
  const functionName = 'table_fetch_pages_filtered'
  const db = await sql()
  const { sqlQuery, queryValues } = buildSqlQuery({ table, joins, filters })

  let readableSql = ''
  try {
    const finalQuery = applyFetchSuffix(sqlQuery, { distinctColumns, orderBy, limit, offset })

    readableSql = buildSql_Readable(finalQuery, queryValues)

    //
    // Execute Query
    //
    const data = await db.query({
      caller: caller,
      query: finalQuery,
      params: queryValues,
      functionName: functionName,
      table,
      level,
      severity
    })

    return data.rows.length > 0 ? data.rows : []
  } catch (error) {
    const errorMessage = `Table(${table}) SQL(${readableSql}) FAILED`
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E',
      lg_table: table,
      lg_level: level
    })
    throw new Error(`${functionName}, ${errorMessage}`)
  }
}

//---------------------------------------------------------------------
// Shared logic for total pages
//---------------------------------------------------------------------
export async function table_fetch_pages_total({
  table,
  joins = [],
  filters = [],
  items_per_page = ITEMS_PER_PAGE,
  distinctColumns = [],
  caller = '',
  level = 1,
  severity = 'I'
}: {
  table: string
  joins?: JoinParams[]
  filters?: Filter[]
  items_per_page?: number
  distinctColumns?: string[]
  caller: string
  level?: number
  severity?: string
}): Promise<number> {
  const functionName = 'table_fetch_pages_total'
  const db = await sql()

  const { sqlQuery, queryValues } = buildSqlQuery({ table, joins, filters })
  let readableSql = ''
  try {
    const countQuery = buildCountQuery(sqlQuery, distinctColumns)

    readableSql = buildSql_Readable(countQuery, queryValues)

    //
    // Execute Query
    //
    const result = await db.query({
      query: countQuery,
      params: queryValues,
      functionName: functionName,
      caller: caller,
      table,
      level,
      severity
    })

    //
    // Calculate Total Pages
    //
    const count = Number(result.rows[0].count)
    const totalPages = Math.ceil(count / items_per_page)
    return totalPages
  } catch (error) {
    const errorMessage = `Table(${table}) SQL(${readableSql}) FAILED`
    write_logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E',
      lg_table: table,
      lg_level: level
    })
    throw new Error(`${functionName}: Failed`)
  }
}
