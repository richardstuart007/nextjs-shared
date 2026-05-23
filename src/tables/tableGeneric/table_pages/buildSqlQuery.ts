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
