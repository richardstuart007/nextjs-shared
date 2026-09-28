//==============================================================================================
//  1) DESCRIPTION
//    buildSqlQuery — builds a base SELECT * query and its WHERE clause.
//
//    Parameters:
//      table   — table name
//      joins   — optional LEFT JOINs to append
//      filters — optional WHERE filters (IN/NOT IN/ARRAY_OVERLAP expect an array
//               value; LIKE/NOT LIKE lower-cases both sides for a case-insensitive
//               substring match)
//
//    Returns:
//      sqlQuery    — the built 'SELECT * FROM ...' string
//      queryValues — the values for each placeholder, in order
//
//  2) NOTES
//    This file also re-exports `applyFetchSuffix`/`buildCountQuery` for existing
//    consumers — see their own files (applyFetchSuffix.ts, buildCountQuery.ts) for
//    their own headers.
//
//  3) CHANGE HISTORY
//    2026-09-28 — applyFetchSuffix/buildCountQuery moved to their own files;
//                 re-exported here for existing consumers
//==============================================================================================

import type { JoinParams, Filter } from '../../structures'

export { applyFetchSuffix } from './applyFetchSuffix'
export { buildCountQuery } from './buildCountQuery'

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

      if (operator === 'ARRAY_OVERLAP') {
        if (!Array.isArray(value)) {
          throw new Error(`Value for operator ${operator} must be an array.`)
        }

        const placeholders = value
          .map(v => {
            if (typeof v !== 'string' && typeof v !== 'number') {
              throw new Error(`Invalid value type for ARRAY_OVERLAP: ${typeof v}`)
            }
            queryValues.push(v)
            return `$${queryValues.length}`
          })
          .join(', ')

        return `${column} && ARRAY[${placeholders}]::text[]`
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
