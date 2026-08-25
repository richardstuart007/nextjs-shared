//==============================================================================================
//  1) DESCRIPTION
//    buildSql_Placeholders — builds a parameterized SELECT statement from a table name,
//    optional WHERE/ORDER BY/LIMIT, using $1/$2/... placeholders
//
//    Parameters:
//      table                 — table name
//      whereColumnValuePairs — optional WHERE conditions (column/value/operator triples;
//                              operator defaults to '='); IN/NOT IN expects an array value
//      orderBy               — optional ORDER BY clause
//      distinct              — adds SELECT DISTINCT; defaults to false
//      columns               — columns to select; defaults to '*'
//      limit                 — optional LIMIT
//
//    Returns:
//      sqlQuery — the parameterized SQL string
//      values   — the values for each placeholder, in order
//==============================================================================================

import { ColumnValuePair } from '../structures'

export function buildSql_Placeholders({
  table,
  whereColumnValuePairs,
  orderBy,
  distinct = false,
  columns,
  limit
}: {
  table: string
  whereColumnValuePairs?: ColumnValuePair[]
  orderBy?: string
  distinct?: boolean
  columns?: string[]
  limit?: number
}): { sqlQuery: string; values: (string | number)[] } {
  const selectedColumns = columns?.join(', ') || '*'
  let sqlQuery = `SELECT ${distinct ? 'DISTINCT ' : ''}${selectedColumns} FROM ${table}`
  const values: (string | number)[] = []
  let paramIndex = 0

  if (whereColumnValuePairs && whereColumnValuePairs.length > 0) {
    const conditions = whereColumnValuePairs.map(({ column, value, operator = '=' }) => {
      if (operator === 'IN' || operator === 'NOT IN') {
        if (!Array.isArray(value)) throw new Error(`Value for ${operator} must be an array`)
        const placeholders = value.map(() => `$${++paramIndex}`).join(', ')
        values.push(...value)
        return `${column} ${operator} (${placeholders})`
      }
      if (operator === 'IS NULL' || operator === 'IS NOT NULL') {
        return `${column} ${operator}`
      }
      values.push(value as string | number)
      return `${column} ${operator} $${++paramIndex}`
    })
    const whereClause = conditions.join(' AND ')
    sqlQuery += ` WHERE ${whereClause}`
  }

  if (orderBy) sqlQuery += ` ORDER BY ${orderBy}`
  if (limit) {
    values.push(limit)
    sqlQuery += ` LIMIT $${++paramIndex}`
  }

  return { sqlQuery, values }
}
