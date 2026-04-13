import { sql } from '../../db'
import { write_Logging } from '../write_logging'
import { Comparison_operator } from '../table_comparison_values'
import { ITEMS_PER_PAGE } from './page_constants'

// Define types for joins and filters
export type JoinParams = {
  table: string
  on: string
}

export type Filter = {
  column: string
  operator: Comparison_operator
  value: string | number | (string | number)[]
}

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
    const errorMessage = `Table(${table}) SQL(${sqlQuery}) FAILED`
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

  try {
    const { sqlQuery, queryValues } = buildSqlQuery({ table, joins, filters })

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
    const count = result.rows[0].count
    const totalPages = Math.ceil(count / items_per_page)
    return totalPages
  } catch (error) {
    const errorMessage = (error as Error).message
    write_Logging({
      lg_caller: caller,
      lg_functionname: functionName,
      lg_msg: errorMessage,
      lg_severity: 'E'
    })
    throw new Error(`${functionName}: Failed`)
  }
}

//---------------------------------------------------------------------
// Helper to build SQL query and WHERE clause
//---------------------------------------------------------------------
function buildSqlQuery({
  table,
  joins = [],
  filters = []
}: {
  table: string
  joins?: JoinParams[]
  filters?: Filter[]
}) {
  let sqlQuery = `SELECT * FROM ${table}`
  const queryValues: (string | number)[] = []

  if (joins.length) {
    joins.forEach(({ table: joinTable, on }) => {
      sqlQuery += ` LEFT JOIN ${joinTable} ON ${on}`
    })
  }

  if (filters.length) {
    const whereConditions = filters.map(({ column, operator, value }) => {
      if (operator === 'IN' || operator === 'NOT IN') {
        if (!Array.isArray(value)) {
          throw new Error(`Value for operator ${operator} must be an array.`)
        }

        const placeholders = value
          .map(v => {
            if (typeof v !== 'string' && typeof v !== 'number') {
              throw new Error(`Invalid value type for IN/NOT IN: ${typeof v}`)
            }
            queryValues.push(v)
            return `$${queryValues.length}`
          })
          .join(', ')

        return `${column} ${operator} (${placeholders})`
      }

      const adjustedColumn =
        operator === 'LIKE' || operator === 'NOT LIKE' ? `LOWER(${column})` : column
      const adjustedValue =
        (operator === 'LIKE' || operator === 'NOT LIKE') && typeof value === 'string'
          ? `%${value.toLowerCase()}%`
          : value

      if (typeof adjustedValue !== 'string' && typeof adjustedValue !== 'number') {
        throw new Error(`Invalid value type for operator ${operator}: ${typeof adjustedValue}`)
      }

      queryValues.push(adjustedValue)
      return `${adjustedColumn} ${operator} $${queryValues.length}`
    })

    sqlQuery += ` WHERE ${whereConditions.join(' AND ')}`
  }

  return { sqlQuery, queryValues }
}
