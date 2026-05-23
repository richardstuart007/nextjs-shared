'use server'

import { sql } from '../../db'
import { write_Logging } from '../write_logging'
import { ITEMS_PER_PAGE } from './page_constants'
import { buildSql_Readable } from '../buildSql_Readable'
import { buildSqlQuery } from './buildSqlQuery'
import type { JoinParams, Filter } from '../../structures'

export type { JoinParams, Filter }

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
  caller
}: {
  table: string
  joins?: JoinParams[]
  filters?: Filter[]
  orderBy?: string
  limit?: number
  offset?: number
  distinctColumns?: string[]
  caller: string
}): Promise<any[]> {
  const functionName = 'table_fetch_pages_filtered'
  const db = await sql()
  const { sqlQuery, queryValues } = buildSqlQuery({ table, joins, filters })

  let readableSql = ''
  try {
    let finalQuery = sqlQuery

    //
    // Apply DISTINCT ON if distinctColumns are provided
    //
    if (distinctColumns.length > 0) {
      finalQuery = finalQuery.replace(
        'SELECT *',
        `SELECT DISTINCT ON (${distinctColumns.join(', ')}) *`
      )
    }

    //
    // Add ORDER BY
    //
    if (orderBy) finalQuery += ` ORDER BY ${orderBy}`

    // Add LIMIT and OFFSET
    if (limit !== undefined) finalQuery += ` LIMIT ${limit}`
    if (offset !== undefined) finalQuery += ` OFFSET ${offset}`

    readableSql = buildSql_Readable(finalQuery, queryValues)

    //
    // Execute Query
    //
    const data = await db.query({
      caller: caller,
      query: finalQuery,
      params: queryValues,
      functionName: functionName
    })

    return data.rows.length > 0 ? data.rows : []
  } catch (error) {
    const errorMessage = `Table(${table}) SQL(${readableSql}) FAILED`
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
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
  caller = ''
}: {
  table: string
  joins?: JoinParams[]
  filters?: Filter[]
  items_per_page?: number
  distinctColumns?: string[]
  caller: string
}): Promise<number> {
  const functionName = 'table_fetch_pages_total'
  const db = await sql()

  const { sqlQuery, queryValues } = buildSqlQuery({ table, joins, filters })
  let readableSql = ''
  try {
    //
    // Modify query for COUNT
    //
    let countQuery = sqlQuery.replace('SELECT *', 'SELECT COUNT(*)')

    //
    // If distinctColumns are provided, wrap in subquery for accurate count
    //
    if (distinctColumns.length > 0) {
      countQuery = `SELECT COUNT(*) FROM (${sqlQuery.replace('SELECT *', `SELECT DISTINCT ON (${distinctColumns.join(', ')}) *`)}) AS distinct_records`
    }

    readableSql = buildSql_Readable(countQuery, queryValues)

    //
    // Execute Query
    //
    const result = await db.query({
      query: countQuery,
      params: queryValues,
      functionName: functionName,
      caller: caller
    })

    //
    // Calculate Total Pages
    //
    const count = Number(result.rows[0].count)
    const totalPages = Math.ceil(count / items_per_page)
    return totalPages
  } catch (error) {
    const errorMessage = `Table(${table}) SQL(${readableSql}) FAILED`
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
    })
    throw new Error(`${functionName}: Failed`)
  }
}
