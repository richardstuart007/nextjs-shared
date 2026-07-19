import type { JoinParams, Filter } from '../../structures'

//---------------------------------------------------------------------
// Helper to build SQL query and WHERE clause
//---------------------------------------------------------------------
export function buildSqlQuery({
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

//---------------------------------------------------------------------
// Apply DISTINCT ON / ORDER BY / LIMIT / OFFSET to a base SELECT * query — shared by
// fetchFiltered's cache-key build and table_fetch_pages_filtered's actual query build
//---------------------------------------------------------------------
export function applyFetchSuffix(
  sqlQuery: string,
  {
    distinctColumns = [],
    orderBy,
    limit,
    offset
  }: {
    distinctColumns?: string[]
    orderBy?: string
    limit?: number
    offset?: number
  }
): string {
  let finalQuery = sqlQuery
  if (distinctColumns.length > 0) {
    finalQuery = finalQuery.replace(
      'SELECT *',
      `SELECT DISTINCT ON (${distinctColumns.join(', ')}) *`
    )
  }
  if (orderBy) finalQuery += ` ORDER BY ${orderBy}`
  if (limit !== undefined) finalQuery += ` LIMIT ${limit}`
  if (offset !== undefined) finalQuery += ` OFFSET ${offset}`
  return finalQuery
}

//---------------------------------------------------------------------
// Build a COUNT(*) version of a base SELECT * query, wrapping in a subquery when
// DISTINCT ON is needed for an accurate count — shared by fetchTotalPages's cache-key
// build and table_fetch_pages_total's actual query build
//---------------------------------------------------------------------
export function buildCountQuery(sqlQuery: string, distinctColumns: string[] = []): string {
  if (distinctColumns.length > 0) {
    return `SELECT COUNT(*) FROM (${sqlQuery.replace(
      'SELECT *',
      `SELECT DISTINCT ON (${distinctColumns.join(', ')}) *`
    )}) AS distinct_records`
  }
  return sqlQuery.replace('SELECT *', 'SELECT COUNT(*)')
}
